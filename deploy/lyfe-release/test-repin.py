#!/usr/bin/env python3
"""Repin identity, drift and old-grant refusal; never invoke a compiler."""
import contextlib
import importlib.util
import io
import os
from pathlib import Path
import shutil
import sys
import tempfile
import unittest
from unittest.mock import patch

HERE = Path(__file__).resolve().parent

def load(path):
    spec = importlib.util.spec_from_file_location('repin_check', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

class Repin(unittest.TestCase):
    def test_exact_immutable_context(self):
        inputs, args = load(HERE / 'release-handoff.py').verify_inputs()
        self.assertEqual(inputs['source_offer_url'], args['NEXT_PUBLIC_SOURCE_CODE_URL'])
        self.assertEqual(inputs['application_revision'], '1bac9b61be8a30dea31b7cdac4a76bf1f51f5229')

    def test_helper_and_build_argument_drift_refused(self):
        for name in ('create-app-only.py', 'guarded-build.py', 'build.args'):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as tmp:
                copied = Path(tmp) / 'release'
                shutil.copytree(HERE, copied)
                with (copied / name).open('a') as file:
                    file.write('\n# drift\n')
                with self.assertRaisesRegex(ValueError, 'Accepted preparation changed'):
                    load(copied / 'release-handoff.py').verify_inputs()

    def test_old_slot_grant_cannot_execute_new_build(self):
        guard = load(HERE / 'guarded-build.py')
        with patch.dict(os.environ, {'LYFE_RELEASE_SLOT_GRANTED': '2452-pr6-1bac9b61-three-slots'}), \
             patch.object(sys, 'argv', ['guarded-build.py', '--execute']), \
             patch.object(guard.subprocess, 'check_output', return_value='/\n'), \
             patch.object(guard.subprocess, 'Popen') as compiler, \
             contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(guard.main(), 3)
            compiler.assert_not_called()

if __name__ == '__main__':
    sys.dont_write_bytecode = True
    unittest.main()
