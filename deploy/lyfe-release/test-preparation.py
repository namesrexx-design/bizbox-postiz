#!/usr/bin/env python3
"""Focused guard regressions. No Docker state, app, DB or compiler is started."""
import copy
import contextlib
import http.client
import io
import json
import os
import runpy
import importlib.util
from pathlib import Path
import unittest
from types import SimpleNamespace
from unittest.mock import patch


def load(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


build = load('guarded-build')
clone = load('rehearsal-clone')


class Preparation(unittest.TestCase):
    def test_capacity_boundary(self):
        g = build.GIB
        self.assertEqual(build.capacity(300*g, 40*g, 7.5*g), [])
        self.assertTrue(build.capacity(360*g, 40*g, 7.5*g))  # exactly 90%
        self.assertTrue(build.capacity(200*g, 39*g, 7.5*g))
        self.assertTrue(build.capacity(200*g, 40*g, 7.5*g-1))

    def test_forward_preserves_new_source_defaults_and_old_runtime(self):
        old = {'Config': {'Env': ['DATABASE_URL=retained-private', 'RELEASE_SOURCE_REVISION=stale']},
               'HostConfig': {'Binds': ['lyfe2452-config:/config:rw']},
               'NetworkSettings': {'Networks': {'lyfe2452-isolated': {}}}}
        original = copy.deepcopy(old)
        image = {'Id': 'sha256:' + 'a'*64, 'Config': {'Env': [
            'DATABASE_URL=image-default', f'RELEASE_SOURCE_REVISION={clone.REV}',
            f'NEXT_PUBLIC_SOURCE_CODE_URL=https://social.biz-box.io/api/source/{clone.REV}.tar.gz']}}
        result = clone.payload(old, image)
        env = clone.env_map(result['Env'])
        self.assertEqual(env['DATABASE_URL'], 'retained-private')
        self.assertEqual(env['RELEASE_SOURCE_REVISION'], clone.REV)
        self.assertIn(clone.REV, env['NEXT_PUBLIC_SOURCE_CODE_URL'])
        self.assertEqual(result['Cmd'], ['sh', '-c', clone.START])
        self.assertNotIn('prisma', result['Cmd'][2])
        self.assertEqual(old, original)

    def test_rollback_does_not_inherit_candidate_source_revision(self):
        old = {'Config': {'Env': [f'RELEASE_SOURCE_REVISION={clone.REV}', 'JWT_SECRET=synthetic']},
               'HostConfig': {}, 'NetworkSettings': {'Networks': {}}}
        image = {'Id': 'sha256:' + 'b'*64, 'Config': {'Env': ['JWT_SECRET=synthetic']}}
        self.assertNotIn('RELEASE_SOURCE_REVISION', clone.env_map(clone.payload(old, image)['Env']))

    def test_live_name_is_rejected_before_docker_access(self):
        with self.assertRaises(ValueError):
            clone.guard({'Name': '/postiz'}, 'postiz')

    def test_isolation_guard(self):
        old = {'Name': '/lyfe2452-baseline', 'Config': {'Env': [
            'DATABASE_URL=postgresql://rehearsal:synthetic-only@postgres:5432/rehearsal',
            'REDIS_URL=redis://redis:6379', 'TEMPORAL_ADDRESS=temporal:7233',
            'JWT_SECRET=synthetic-rehearsal-no-live-sessions', 'EMAIL_HOST=smtp',
            'EMAIL_PROVIDER=nodemailer']},
            'HostConfig': {'Binds': ['lyfe2452-config:/config:rw'],
                           'PortBindings': {'5000/tcp': [{'HostIp': '127.0.0.1', 'HostPort': '4052'}]}},
            'Mounts': [{'Type': 'volume', 'Name': 'lyfe2452-config'}],
            'NetworkSettings': {'Networks': {'lyfe2452-isolated': {}}}}
        with patch.object(clone.subprocess, 'check_output', return_value=b'[{"Internal":true}]'):
            self.assertTrue(clone.guard(old, 'lyfe2452-candidate'))
            for field, value in [('Binds', ['/srv/lyfe/postiz:/config:rw']), ('NetworkMode', 'host'), ('Privileged', True)]:
                changed = copy.deepcopy(old)
                changed['HostConfig'][field] = value
                with self.assertRaises(ValueError):
                    clone.guard(changed, 'lyfe2452-candidate')
            changed = copy.deepcopy(old)
            changed['Config']['Env'][0] = 'DATABASE_URL=postgresql://LIVE'
            with self.assertRaises(ValueError):
                clone.guard(changed, 'lyfe2452-candidate')
        with patch.object(clone.subprocess, 'check_output', return_value=b'[{"Internal":false}]'):
            with self.assertRaises(ValueError):
                clone.guard(old, 'lyfe2452-candidate')


class ProductionPayload(unittest.TestCase):
    def original(self):
        return {
            'Id': 'f' * 64,
            'Config': {
                'WorkingDir': '/app', 'User': '',
                'Entrypoint': None, 'ExposedPorts': {'5000/tcp': {}},
                'Env': ['JWT_SECRET=synthetic-runtime',
                        'DATABASE_URL=postgresql://fixture:fixture@fixture-postgres/fixture',
                        'RELEASE_SOURCE_REVISION=stale',
                        'NEXT_PUBLIC_SOURCE_CODE_URL=https://fixture.invalid/old-source'],
                'Healthcheck': {
                    'Test': ['CMD', 'node', '-e', 'process.exit(0)'],
                    'Interval': 30_000_000_000, 'Timeout': 10_000_000_000,
                    'StartPeriod': 180_000_000_000, 'Retries': 5,
                    'StartInterval': 5_000_000_000,
                },
            },
            'HostConfig': {
                'Binds': ['fixture-config:/config:rw', 'fixture-uploads:/uploads:rw'],
                'PortBindings': {'5000/tcp': [{'HostIp': '127.0.0.1', 'HostPort': '4007'}]},
                'RestartPolicy': {'Name': 'unless-stopped'},
            },
            'NetworkSettings': {'Networks': {'fixture-network': {
                'Aliases': ['postiz', 'f' * 64, 'f' * 12]}}},
        }

    def execute(self, original, image_env=None):
        image_id = 'sha256:' + 'a' * 64
        if image_env is None:
            image_env = ['JWT_SECRET=synthetic-image',
                         f'RELEASE_SOURCE_REVISION={clone.REV}',
                         f'NEXT_PUBLIC_SOURCE_CODE_URL=https://social.biz-box.io/api/source/{clone.REV}.tar.gz']
        image = {'Config': {'Env': image_env}}
        observed = []
        inspections = []

        def inspect(command):
            inspections.append(command)
            if command == ['docker', 'inspect', 'fixture-original']:
                return json.dumps([original]).encode()
            if command == ['docker', 'image', 'inspect', image_id]:
                return json.dumps([image]).encode()
            raise AssertionError('Unexpected Docker operation')

        def request(connection, method, url, body=None, headers=None):
            observed.append((method, url, json.loads(body), headers))

        output = io.StringIO()
        with patch.dict(os.environ, {'CLONE_SOURCE': 'fixture-original',
                                     'RELEASE_IMAGE': image_id,
                                     'ROLLBACK_NAME': 'fixture-retained-original'}, clear=True), \
             patch('subprocess.check_output', side_effect=inspect), \
             patch.object(http.client.HTTPConnection, 'request', autospec=True, side_effect=request), \
             patch.object(http.client.HTTPConnection, 'getresponse',
                          return_value=SimpleNamespace(status=201, read=lambda: b'{}')), \
             patch('socket.socket', side_effect=AssertionError('Real Docker socket forbidden')) as socket, \
             contextlib.redirect_stdout(output):
            namespace = runpy.run_path(str(Path(__file__).with_name('create-app-only.py')))
        socket.assert_not_called()
        self.assertEqual(inspections, [['docker', 'inspect', 'fixture-original'],
                                       ['docker', 'image', 'inspect', image_id]])
        self.assertEqual(len(observed), 1)
        method, url, sent, headers = observed[0]
        self.assertEqual((method, url), ('POST', '/containers/create?name=postiz'))
        self.assertEqual(headers, {'Content-Type': 'application/json'})
        self.assertEqual(sent, namespace['payload'])
        self.assertNotIn('synthetic-runtime', output.getvalue())
        self.assertNotIn('Healthcheck', output.getvalue())
        return namespace, sent

    def test_actual_production_payload_preserves_complete_probe_and_deep_copy(self):
        original = self.original()
        before = copy.deepcopy(original)
        namespace, sent = self.execute(original)
        self.assertEqual(sent['Healthcheck'], original['Config']['Healthcheck'])
        self.assertEqual(sent['HostConfig'], original['HostConfig'])
        self.assertEqual(sent['NetworkingConfig'], {'EndpointsConfig': {
            'fixture-network': {'Aliases': ['postiz']}}})
        env = clone.env_map(sent['Env'])
        self.assertEqual(env['JWT_SECRET'], 'synthetic-runtime')
        self.assertEqual(env['RELEASE_SOURCE_REVISION'], clone.REV)
        self.assertEqual(sent['Cmd'], ['sh', '-c', clone.START])
        self.assertNotIn('prisma', sent['Cmd'][2])
        self.assertEqual(original, before)
        retained = copy.deepcopy(namespace['old'])
        self.assertIsNot(namespace['payload']['Healthcheck'], namespace['old']['Config']['Healthcheck'])
        namespace['payload']['Healthcheck']['Test'].append('payload-only mutation')
        self.assertEqual(namespace['old'], retained)

    def test_actual_production_payload_keeps_disabled_null_and_absent_probe(self):
        for value in ({'Test': ['NONE']}, None, 'absent'):
            with self.subTest(probe=value):
                original = self.original()
                if value == 'absent':
                    original['Config'].pop('Healthcheck')
                else:
                    original['Config']['Healthcheck'] = value
                _, sent = self.execute(original)
                if value == 'absent':
                    self.assertNotIn('Healthcheck', sent)
                else:
                    self.assertIn('Healthcheck', sent)
                    self.assertEqual(sent['Healthcheck'], value)

    def test_actual_rollback_payload_preserves_probe_and_removes_candidate_source(self):
        original = self.original()
        _, sent = self.execute(original, ['JWT_SECRET=synthetic-snapshot'])
        self.assertEqual(sent['Healthcheck'], original['Config']['Healthcheck'])
        env = clone.env_map(sent['Env'])
        self.assertEqual(env['JWT_SECRET'], 'synthetic-runtime')
        self.assertNotIn('RELEASE_SOURCE_REVISION', env)
        self.assertNotIn('NEXT_PUBLIC_SOURCE_CODE_URL', env)


if __name__ == '__main__':
    unittest.main()
