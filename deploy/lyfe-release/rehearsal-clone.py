#!/usr/bin/env python3
"""Create a STOPPED isolated app clone; never accepts a Live container."""
import argparse
import copy
import http.client
import json
import re
import socket
import subprocess

REV = 'd78e598b6117607d24cd0465f98639241c107571'
START = 'nginx && pm2 ping && pnpm --filter postiz-frontend run pm2 && pnpm --filter postiz-backend run pm2 && pnpm --filter postiz-orchestrator run pm2 && pm2 logs'


def env_map(items):
    return dict(item.split('=', 1) for item in items or [])


def payload(previous, image):
    old_env = env_map(previous['Config']['Env'])
    defaults = env_map(image['Config'].get('Env'))
    # Docker Engine replaces image Env when supplied. Merge defaults first so
    # the source-download configuration from the new image survives the clone.
    merged = dict(defaults, **old_env)
    for key in ('RELEASE_SOURCE_REVISION', 'RELEASE_SOURCE_ARCHIVE', 'NEXT_PUBLIC_SOURCE_CODE_URL'):
        merged.pop(key, None)
        if key in defaults:
            merged[key] = defaults[key]
    host = copy.deepcopy(previous['HostConfig'])
    return {'Image': image['Id'], 'WorkingDir': '/app', 'User': previous['Config'].get('User', ''),
            'Env': [f'{key}={value}' for key, value in merged.items()],
            'Entrypoint': [], 'Cmd': ['sh', '-c', START], 'HostConfig': host,
            'NetworkingConfig': {'EndpointsConfig': {
                name: {'Aliases': []} for name in previous['NetworkSettings']['Networks']}}}


def guard(previous, target):
    if not re.fullmatch(r'lyfe2452-[a-z0-9-]+', target) or not previous['Name'].startswith('/lyfe2452-'):
        raise ValueError('Only lyfe2452-* isolated containers are accepted')
    host = previous['HostConfig']
    if host.get('Privileged') or host.get('Devices') or host.get('CapAdd') or host.get('NetworkMode') in ('host', 'none'):
        raise ValueError('Unsafe isolated host configuration')
    for bind in host.get('Binds') or []:
        parts = bind.split(':')
        if len(parts) not in (2, 3) or not parts[0].startswith('lyfe2452-') or parts[1] not in ('/config', '/uploads'):
            raise ValueError('Host bind rejected')
    if any(not name.startswith('lyfe2452-') for name in previous['NetworkSettings']['Networks']):
        raise ValueError('External network rejected')
    for name in previous['NetworkSettings']['Networks']:
        network = json.loads(subprocess.check_output(['docker', 'network', 'inspect', name]))[0]
        if not network['Internal']:
            raise ValueError('Network must block external egress')
    for mount in previous['Mounts']:
        if mount['Type'] != 'volume' or not mount['Name'].startswith('lyfe2452-'):
            raise ValueError('Only isolated named volumes are accepted')
    for mappings in (host.get('PortBindings') or {}).values():
        if any(p['HostIp'] != '127.0.0.1' or p['HostPort'] != '4052' for p in mappings or []):
            raise ValueError('Only loopback port 4052 is accepted')
    env = env_map(previous['Config']['Env'])
    required = {'DATABASE_URL': 'postgresql://rehearsal:synthetic-only@postgres:5432/rehearsal',
                'REDIS_URL': 'redis://redis:6379', 'TEMPORAL_ADDRESS': 'temporal:7233',
                'JWT_SECRET': 'synthetic-rehearsal-no-live-sessions', 'EMAIL_HOST': 'smtp',
                'EMAIL_PROVIDER': 'nodemailer'}
    if any(env.get(key) != value for key, value in required.items()):
        raise ValueError('Synthetic-only rehearsal environment is required')
    return True


class Engine(http.client.HTTPConnection):
    def connect(self):
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.connect('/var/run/docker.sock')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True)
    parser.add_argument('--image', required=True)
    parser.add_argument('--name', required=True)
    parser.add_argument('--rollback', action='store_true')
    parser.add_argument('--execute', action='store_true')
    args = parser.parse_args()
    if not re.fullmatch(r'sha256:[a-f0-9]{64}', args.image):
        raise SystemExit('Immutable image ID required')
    previous = json.loads(subprocess.check_output(['docker', 'inspect', args.source]))[0]
    image = json.loads(subprocess.check_output(['docker', 'image', 'inspect', args.image]))[0]
    guard(previous, args.name)
    if previous['State']['Running']:
        raise SystemExit('Preserved source container must be stopped')
    if not args.rollback and (image['Config'].get('Labels') or {}).get('org.opencontainers.image.revision') != REV:
        raise SystemExit('Final full-app revision required')
    data = payload(previous, image)
    if not args.rollback and env_map(data['Env']).get('RELEASE_SOURCE_REVISION') != REV:
        raise SystemExit('Matching runtime source revision required')
    print(json.dumps({'mode': 'execute' if args.execute else 'plan', 'name': args.name,
                      'image': args.image, 'command': data['Cmd'], 'environment_values': 'redacted'}))
    if args.execute:
        engine = Engine('localhost')
        engine.request('POST', '/containers/create?name=' + args.name, json.dumps(data), {'Content-Type': 'application/json'})
        response = engine.getresponse()
        response.read()
        if response.status != 201:
            raise SystemExit(f'Isolated create failed: HTTP {response.status}')
        print('Created stopped isolated app; preserved source container retained')


if __name__ == '__main__':
    main()
