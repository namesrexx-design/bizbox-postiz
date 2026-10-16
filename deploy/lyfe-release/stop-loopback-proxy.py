#!/usr/bin/env python3
"""Stop only the recorded relay for an isolated rehearsal app."""
import argparse
import json
import os
from pathlib import Path
import signal
import time

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('container',choices=['lyfe2452-baseline','lyfe2452-candidate','lyfe2452-restored'])
parser.add_argument('output',type=Path)
args=parser.parse_args()
state=json.loads((args.output/(args.container+'-proxy.json')).read_text())
assert state['container']==args.container and state['listen']['address']=='127.0.0.1' and state['listen']['port']==4052
pid=state['pid']
assert isinstance(pid,int) and pid>1
proc=Path('/proc')/str(pid)
if not proc.exists():
    print('Recorded rehearsal relay already exited')
    raise SystemExit(0)
argv=[v.decode() for v in (proc/'cmdline').read_bytes().split(b'\0') if v]
assert args.container in argv and any(Path(v).name in ['loopback-proxy.cjs','loopback-rehearsal-proxy.cjs'] for v in argv),'Recorded PID is not the matching rehearsal relay'
os.kill(pid,signal.SIGTERM)
for _ in range(50):
    if not proc.exists():
        print(json.dumps({'container':args.container,'relay_pid':pid,'stopped':True}))
        break
    time.sleep(.1)
else:
    raise SystemExit('Relay did not exit; inspect before any replacement')
