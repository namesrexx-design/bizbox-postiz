#!/usr/bin/env python3
"""Focused guard regressions. No Docker state, app, DB or compiler is started."""
import copy
import importlib.util
from pathlib import Path
import unittest
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


if __name__ == '__main__':
    unittest.main()
