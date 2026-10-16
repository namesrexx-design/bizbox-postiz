#!/usr/bin/env python3
"""Plan by default. Execute only after the coordinator grants the three slots."""
import argparse
import fcntl
import hashlib
import json
import math
import os
from pathlib import Path
import signal
import subprocess
import tarfile
import time

REV = '1bac9b61be8a30dea31b7cdac4a76bf1f51f5229'
ARCHIVE_SHA = '3b5a9c8566327db43d400976026794b095166637170904c4c97c6e25b8994286'
BASE = 'ghcr.io/gitroomhq/postiz-app@sha256:7eb4a553507ce3f200deff2ec0211ab3cf834ba19eb44dd68e83ccc236509feb'
CONTEXT = Path('/mnt/work/2452-release/w2/bear-bull-ico-context-9198')
OUTPUT = Path('/mnt/storagebox/social-media/9476-pr6-canonical-repin/build-output')
SLOT_GRANT = '2452-pr6-1bac9b61-three-slots'
GIB = 1024 ** 3


def capacity(used, available, memory):
    percent = math.ceil(100 * used / (used + available))
    failures = []
    if percent >= 90:
        failures.append(f'Docker-layer filesystem is {percent}%; require below 90%')
    if available < 40 * GIB:
        failures.append(f'Docker-layer available bytes {available}; require 40 GiB')
    if memory < 5 * GIB:
        failures.append(f'MemAvailable bytes {memory}; require 5 GiB')
    return failures


def verify_context():
    archive = CONTEXT / 'source-archive.tar.gz'
    if hashlib.sha256(archive.read_bytes()).hexdigest() != ARCHIVE_SHA:
        raise ValueError('Final source archive changed')
    expected = set()
    with tarfile.open(archive) as stream:
        for member in stream:
            if member.isdir():
                continue
            if not member.isfile() or Path(member.name).is_absolute() or '..' in Path(member.name).parts:
                raise ValueError('Unexpected archive member')
            expected.add(member.name)
            actual = CONTEXT / 'source' / member.name
            if actual.is_symlink() or actual.read_bytes() != stream.extractfile(member).read():
                raise ValueError(f'Source differs from signed-in archive: {member.name}')
    actual = {str(p.relative_to(CONTEXT / 'source')) for p in (CONTEXT / 'source').rglob('*') if p.is_file() or p.is_symlink()}
    if actual != expected:
        raise ValueError('Source context contains missing or extra files')
    if (CONTEXT / 'Dockerfile').read_bytes() != (CONTEXT / 'source/deploy/lyfe-social/Dockerfile.review').read_bytes():
        raise ValueError('Dockerfile differs from reviewed source')
    expected_args = {'RELEASE_REV': REV, 'RELEASE_SOURCE_SHA256': ARCHIVE_SHA,
                     'NEXT_PUBLIC_SOURCE_CODE_URL': f'https://social.biz-box.io/api/source/{REV}.tar.gz'}
    if dict(line.split('=', 1) for line in (CONTEXT / 'build.args').read_text().splitlines()) != expected_args:
        raise ValueError('Build arguments changed')
    return expected_args


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--execute', action='store_true')
    args = parser.parse_args()
    build_args = verify_context()
    root = subprocess.check_output(['docker', 'info', '--format', '{{.DockerRootDir}}'], text=True).strip()
    stats = os.statvfs(root)
    used = (stats.f_blocks - stats.f_bfree) * stats.f_frsize
    available = stats.f_bavail * stats.f_frsize
    memory = int(next(line.split()[1] for line in Path('/proc/meminfo').read_text().splitlines() if line.startswith('MemAvailable:'))) * 1024
    failures = capacity(used, available, memory)
    if os.environ.get('LYFE_RELEASE_SLOT_GRANTED') != SLOT_GRANT:
        failures.append('Coordinator must grant this exact build the three shared slots')
    command = ['docker', 'build', '--memory=4608m', '--memory-swap=4608m',
               '--cpu-period=100000', '--cpu-quota=200000', '--network=default',
               '--iidfile', str(OUTPUT / 'release-image.id'),
               '-t', 'bizbox-postiz:lyfe-pr6-1bac9b61-2452']
    for key, value in build_args.items():
        command += ['--build-arg', f'{key}={value}']
    command.append(str(CONTEXT))
    print(json.dumps({'mode': 'execute' if args.execute else 'plan', 'revision': REV,
                      'docker_root': root, 'used_bytes': used, 'available_bytes': available,
                      'memory_available_bytes': memory, 'blockers': failures,
                      'environment': {'DOCKER_BUILDKIT': '0'}, 'command': command}, indent=2), flush=True)
    if not args.execute:
        return 0
    if failures:
        return 3
    # Nonblocking locks: do not queue an unscheduled compiler behind another job.
    locks = []
    try:
        for number in (1, 2, 3):
            handle = open(f'/run/lyfe-heavy.slot{number}', 'a')
            locks.append(handle)
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        raise SystemExit('A shared slot is occupied; no compiler started')
    # Re-read resource gates after acquiring every real slot.
    stats = os.statvfs(root)
    memory = int(next(line.split()[1] for line in Path('/proc/meminfo').read_text().splitlines() if line.startswith('MemAvailable:'))) * 1024
    if capacity((stats.f_blocks-stats.f_bfree)*stats.f_frsize, stats.f_bavail*stats.f_frsize, memory):
        raise SystemExit('Capacity changed after lock acquisition; no compiler started')
    subprocess.run(['docker', 'image', 'inspect', BASE], check=True, stdout=subprocess.DEVNULL)
    if (OUTPUT / 'release-image.id').exists():
        raise SystemExit('Existing image result retained; select a new reviewed run explicitly')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, DOCKER_BUILDKIT='0')
    # Legacy builder is available on this host and enforces these RUN cgroup limits.
    # BuildKit must not silently ignore the memory flags.
    with (OUTPUT / 'full-image-build.log').open('x') as log:
        process = subprocess.Popen(['nice', '-n', '10'] + command, env=env, stdout=log, stderr=subprocess.STDOUT)
        cancelled = False
        while process.poll() is None:
            stats = os.statvfs(root)
            used_now = (stats.f_blocks-stats.f_bfree)*stats.f_frsize
            free_now = stats.f_bavail*stats.f_frsize
            # Stop before the 90% gate, retaining a one-percentage-point margin.
            if math.ceil(100*used_now/(used_now+free_now)) >= 89:
                process.send_signal(signal.SIGINT)
                cancelled = True
                break
            time.sleep(2)
        try:
            code = process.wait(timeout=30)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
            raise SystemExit('Build cancellation needs operator Docker readback; do not retry')
    for handle in locks:
        handle.close()
    return 3 if cancelled else code


if __name__ == '__main__':
    raise SystemExit(main())
