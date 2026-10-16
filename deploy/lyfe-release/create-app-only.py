import copy, http.client, json, os, socket, subprocess
old=json.loads(subprocess.check_output(['docker','inspect',os.environ['CLONE_SOURCE']]))[0]
image=os.environ['RELEASE_IMAGE']
if not image.startswith('sha256:') or len(image)!=71:
    raise SystemExit('Require immutable full-app image ID')
class Engine(http.client.HTTPConnection):
    def connect(self):
        self.sock=socket.socket(socket.AF_UNIX,socket.SOCK_STREAM)
        self.sock.connect('/var/run/docker.sock')
cfg=old['Config']
# Docker Engine replaces image Env when explicitly supplied. Retain effective
# runtime values while preserving the selected image's source-download defaults.
image_cfg=json.loads(subprocess.check_output(['docker','image','inspect',image]))[0]['Config']
def merge_app_environment(image_env, runtime_env):
    defaults=dict(item.split('=',1) for item in (image_env or []))
    effective=dict(defaults)
    effective.update(dict(item.split('=',1) for item in (runtime_env or [])))
    for key in ('RELEASE_SOURCE_REVISION','RELEASE_SOURCE_ARCHIVE','NEXT_PUBLIC_SOURCE_CODE_URL'):
        effective.pop(key,None)
        if key in defaults:
            effective[key]=defaults[key]
    return [f'{key}={value}' for key,value in effective.items()]
payload={k:copy.deepcopy(cfg[k]) for k in ('WorkingDir','User','ExposedPorts','Entrypoint') if k in cfg}
payload['Env']=merge_app_environment(image_cfg.get('Env'),cfg.get('Env'))
payload.update(Image=image, HostConfig=copy.deepcopy(old['HostConfig']),
    Cmd=['sh','-c','nginx && pnpm --filter postiz-frontend --filter postiz-backend --filter postiz-orchestrator --parallel run pm2 && pm2 logs'],
    Labels={'io.lyfe.release.previous-container':os.environ['ROLLBACK_NAME']})
payload['NetworkingConfig']={'EndpointsConfig':{name:{'Aliases':[a for a in (net.get('Aliases') or []) if a not in (old['Id'],old['Id'][:12])]}
    for name,net in old['NetworkSettings']['Networks'].items()}}
conn=Engine('localhost');conn.request('POST','/containers/create?name=postiz',json.dumps(payload),{'Content-Type':'application/json'})
response=conn.getresponse();body=response.read()
if response.status!=201:
    # Do not log request payload or potentially sensitive engine response.
    raise SystemExit('App create failed: HTTP '+str(response.status)+'; execute app-only rollback')
print('Created replacement app; previous container retained stopped')
