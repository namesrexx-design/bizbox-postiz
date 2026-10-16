#!/usr/bin/env python3
"""Canonical release entry: verify/plan by default; --build uses reviewed guards."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent


def verify_inputs():
    inputs = json.loads((HERE / 'release-inputs.json').read_text())
    for name, expected in inputs['files_sha256'].items():
        path = HERE / name
        if path.is_symlink() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise ValueError(f'Accepted preparation changed: {name}')
    spec = importlib.util.spec_from_file_location('guarded_build', HERE / 'guarded-build.py')
    guard = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(guard)
    build_args = guard.verify_context()
    if (build_args['RELEASE_REV'] != inputs['application_revision'] or
            build_args['RELEASE_SOURCE_SHA256'] != inputs['source_archive_sha256']):
        raise ValueError('Integrated source identity differs from accepted preparation')
    if (inputs['source_offer_url'] != build_args['NEXT_PUBLIC_SOURCE_CODE_URL'] or
            Path(inputs['source_context']) != guard.CONTEXT or
            Path(inputs['build_output']) != guard.OUTPUT or
            inputs['slot_grant'] != guard.SLOT_GRANT):
        raise ValueError('Proposed context, output or source URL differs from builder')
    if dict(line.split('=', 1) for line in (HERE / 'build.args').read_text().splitlines()) != build_args:
        raise ValueError('Proposed build arguments differ from immutable context')
    return inputs, build_args


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', action='store_true', help='Run the unchanged guarded builder after verification')
    args = parser.parse_args()
    inputs, build_args = verify_inputs()
    print(json.dumps({
        'application_revision': inputs['application_revision'],
        'source_archive_sha256': inputs['source_archive_sha256'],
        'accepted_preparation_revision': inputs['preparation_revision'],
        'accepted_integration_revision': inputs['accepted_integration_revision'],
        'proposal_status': inputs['status'],
        'required_slot_grant': inputs['slot_grant'],
        'corrected_operator_revision': inputs['operator_revision'],
        'build_arguments': build_args,
        'approval': {'id': inputs['approval'], 'last_accepted_state': 'APPROVED',
                     'requirement': 'Re-read and reconcile final source/image/scope before Live write'},
        'canonical_runbook': str(HERE / 'HANDOFF.md'),
        'rehearsal_runbook': str(HERE / 'README.md'),
        'production_helper': str(HERE / 'create-app-only.py'),
        'remaining_gates': ['capacity and explicit three-slot reservation',
                            'immutable full-app image and isolated startup/email/rollback PASS',
                            'BizBox #480 publication and authenticated destination readback'],
        'executor': 'social-media-w1; retain current sole release ownership',
    }, indent=2), flush=True)
    # All application starts/cutover remain explicit runbook steps. This entry
    # cannot acquire a release role, bypass the guard, or invoke Live mutations.
    return subprocess.run([sys.executable, str(HERE / 'guarded-build.py')] +
                          (['--execute'] if args.build else []),
                          env=dict(os.environ, PYTHONDONTWRITEBYTECODE='1')).returncode


if __name__ == '__main__':
    sys.dont_write_bytecode = True
    try:
        raise SystemExit(main())
    except (ValueError, OSError, KeyError) as error:
        raise SystemExit(f'Release integration refused: {error}')
