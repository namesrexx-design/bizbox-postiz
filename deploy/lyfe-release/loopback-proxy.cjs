const net=require('node:net');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const name=process.argv[2];
const outputDirectory=path.resolve(process.argv[3] || process.cwd());
assert(['lyfe2452-baseline','lyfe2452-candidate','lyfe2452-restored'].includes(name));
const container=JSON.parse(execFileSync('docker',['inspect',name],{encoding:'utf8'}))[0];
assert(container.State.Running);
assert.deepEqual(Object.keys(container.NetworkSettings.Networks),['lyfe2452-isolated']);
assert(JSON.parse(execFileSync('docker',['network','inspect','lyfe2452-isolated'],{encoding:'utf8'}))[0].Internal);
const address=container.NetworkSettings.Networks['lyfe2452-isolated'].IPAddress;
assert(net.isIPv4(address));
assert.deepEqual(container.HostConfig.PortBindings['5000/tcp'],[{HostIp:'127.0.0.1',HostPort:'4052'}]);
const sockets=new Set();
const server=net.createServer(client=>{
  const upstream=net.createConnection({host:address,port:5000});
  sockets.add(client);sockets.add(upstream);
  client.pipe(upstream).pipe(client);
  client.on('error',()=>upstream.destroy());
  upstream.on('error',()=>client.destroy());
  client.on('close',()=>{sockets.delete(client);upstream.destroy()});
  upstream.on('close',()=>{sockets.delete(upstream);client.destroy()});
});
server.on('error',error=>{console.error(error);process.exit(1)});
server.listen(4052,'127.0.0.1',()=>{
  const info={pid:process.pid,container:name,container_id:container.Id,target:`${address}:5000`,listen:server.address(),internal_only:true};
  assert.equal(info.listen.address,'127.0.0.1');
  fs.writeFileSync(path.join(outputDirectory,name+'-proxy.json'),JSON.stringify(info,null,2)+'\n');
  console.log(JSON.stringify(info));
});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{
  for(const socket of sockets)socket.destroy();
  server.close(()=>process.exit(0));
});
