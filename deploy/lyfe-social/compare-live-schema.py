#!/usr/bin/env python3
"""Compare offline candidate DMMF/schema with read-only PostgreSQL metadata.

Inputs contain schema metadata only, never rows or database credentials.
Reports differences; it does not generate or execute schema changes.
"""
import collections
import json
import re
import sys
from pathlib import Path

model, live = (json.loads(Path(p).read_text()) for p in sys.argv[1:3])
schema = Path(sys.argv[3]).read_text()
columns = {(c['table_name'], c['column_name']): c for c in live['columns']}
differences = collections.defaultdict(list)
checked = collections.Counter()
types = {'String': 'text', 'Boolean': 'bool', 'Int': 'int4', 'BigInt': 'int8',
         'Float': 'float8', 'Decimal': 'numeric', 'DateTime': 'timestamp',
         'Json': 'jsonb', 'Bytes': 'bytea'}
native = {'Timestamp': 'timestamp', 'Timestamptz': 'timestamptz', 'Date': 'date'}

def normalized_default(value):
    if value is None:
        return None
    value = re.sub(r'::[\w\s".\[\]]+$', '', value.strip())
    if value.upper() in ('CURRENT_TIMESTAMP', 'NOW()'):
        return 'now()'
    if value.startswith("'") and value.endswith("'"):
        value = value[1:-1].replace("''", "'")
    return value.lower() if value in ('TRUE', 'FALSE') else value

for m in model['models']:
    table = m.get('dbName') or m['name']
    checked['models'] += 1
    scalar = {f['name']: f for f in m['fields'] if f['kind'] != 'object'}
    for name, f in scalar.items():
        label = f'{table}.{f.get("dbName") or name}'
        actual = columns.get((table, f.get('dbName') or name))
        checked['columns'] += 1
        if not actual:
            differences['missingColumns'].append(label)
            continue
        nt = f.get('nativeType')
        expected_type = (native.get(nt[0], nt[0].lower()) if nt else types.get(f['type'], f['type']))
        if f['isList']:
            expected_type = '_' + expected_type
        if actual['udt_name'] != expected_type:
            differences['types'].append({'field': label, 'expected': expected_type, 'actual': actual['udt_name']})
        if actual['is_nullable'] != ('NO' if f['isRequired'] else 'YES'):
            differences['nullability'].append(label)
        if expected_type in ('timestamp', 'timestamptz'):
            precision = int(nt[1][0]) if nt and nt[1] else 3
            if actual['datetime_precision'] != precision:
                differences['precision'].append({'field': label, 'expected': precision, 'actual': actual['datetime_precision']})
        default = f.get('default')
        # Prisma supplies uuid/cuid in the client; updatedAt is also client-side.
        if isinstance(default, dict):
            if default['name'] == 'now':
                expected_default = 'now()'
            elif default['name'] in ('uuid', 'cuid'):
                expected_default = None
            else:
                differences['unreviewedDefaults'].append({'field': label, 'default': default})
                continue
        elif default is None:
            expected_default = None
        elif isinstance(default, bool):
            expected_default = str(default).lower()
        else:
            expected_default = str(default)
        if normalized_default(actual['column_default']) != expected_default:
            differences['defaults'].append({'field': label, 'expected': expected_default, 'actual': actual['column_default']})

    # Compare column order and uniqueness, independent of index naming.
    block = re.search(r'\bmodel\s+' + re.escape(m['name']) + r'\s*\{([\s\S]*?)^\}', schema, re.M).group(1)
    expected_indexes = []
    for f in scalar.values():
        if f['isId'] or f['isUnique']:
            expected_indexes.append(([f.get('dbName') or f['name']], True))
    if m.get('primaryKey'):
        expected_indexes.append((m['primaryKey']['fields'], True))
    expected_indexes.extend((x, True) for x in m['uniqueFields'])
    for match in re.finditer(r'@@index\(\[([^\]]+)\]', block):
        expected_indexes.append(([re.split(r'[ (]', s.strip())[0] for s in match[1].split(',')], False))
    for names, unique in expected_indexes:
        checked['indexes'] += 1
        found = False
        for ix in live['indexes']:
            if ix['tablename'] != table:
                continue
            definition = ix['indexdef']
            parsed = re.search(r'USING \w+ \(([^)]+)\)', definition)
            if not parsed:
                continue
            actual_names = [v.strip().split(' ')[0].strip('"') for v in parsed[1].split(',')]
            if actual_names == names and ('CREATE UNIQUE INDEX' in definition) == unique:
                found = True
                break
        if not found:
            differences['missingIndexes'].append({'table': table, 'columns': names, 'unique': unique})

for enum in model['enums']:
    checked['enums'] += 1
    names = [v.get('dbName') or v['name'] for v in enum['values']]
    actual = live['enums'].get(enum.get('dbName') or enum['name'])
    if actual != names:
        differences['enums'].append({'enum': enum['name'], 'expected': names, 'actual': actual})

result = {'checked': dict(checked), 'matchesComparedMetadata': not differences,
          'differences': dict(differences),
          'limits': 'Metadata only; compares declared index column order/uniqueness, not index predicates/operator classes or foreign-key actions. No row reads, application startup or database mutation.'}
print(json.dumps(result, indent=2))
sys.exit(1 if differences else 0)
