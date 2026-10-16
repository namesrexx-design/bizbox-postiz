const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium, webkit} = require('playwright');
const root=path.resolve(__dirname,'../..');
const out=path.join(root,'docs/social-lyfe/compatibility-phone');
fs.mkdirSync(out,{recursive:true});
const markup=fs.readFileSync(process.env.COMPAT_MENU_HTML,'utf8');
const styleDir=process.env.COMPAT_REVIEW_CSS_DIR;
const css=fs.readdirSync(styleDir).filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync(path.join(styleDir,f),'utf8')).join('\n');
(async()=>{
 for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await page.route('**/*',route=>route.abort());
   await page.setContent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><style>body{margin:0;padding:24px;background:#101112!important;color:#eee!important;font-family:Arial,sans-serif}h1{font-size:20px;color:#eee!important}p{font-size:13px;color:#bbb}.bg-newBgColorInner{background:#1c1e21}svg{flex-shrink:0}</style></head><body><h1>Channel menu</h1><p>Isolated component • synthetic channel</p>${markup}</body></html>`,{waitUntil:'domcontentloaded'});
   assert.equal(await page.getByText('Rename channel',{exact:true}).count(),0);
   assert.equal(await page.getByText('Reset to original name',{exact:true}).count(),0);
   assert.equal(await page.getByText('Edit Time Slots',{exact:true}).isVisible(),true);
   const fit=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
   assert.ok(fit,'horizontal overflow');
   await page.screenshot({path:path.join(out,`menu-${name}-390.png`),fullPage:true});
   console.log(`${name} 390x844: hidden rename/reset, retained menu, no horizontal overflow`);
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
