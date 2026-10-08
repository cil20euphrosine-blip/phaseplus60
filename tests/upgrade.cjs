const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const BASE='69937d20d133a2ef7fc656d0bc08bc33cf1f0ad6';
const shell=['index.html','service-worker.js','manifest.webmanifest','icon-192.png','icon-512.png'];
(async()=>{
 const root=path.resolve(__dirname,'..');
 const oldFiles=Object.fromEntries(shell.map(file=>[file,execFileSync('git',['show',`${BASE}:${file}`],{cwd:root})]));
 let upgraded=false;
 const server=http.createServer(async(req,res)=>{
  const file=new URL(req.url,'http://localhost').pathname.split('/').pop()||'index.html';
  if(![...shell,'data-v59.js','modules-v59.js'].includes(file)){res.writeHead(404);return res.end();}
  try{const body=upgraded?await fs.readFile(path.join(root,file)):oldFiles[file];if(!body){res.writeHead(404);return res.end();}
   res.writeHead(200,{'Cache-Control':'no-store','Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':file.endsWith('.webmanifest')?'application/manifest+json':'text/html'});res.end(body);
  }catch(e){res.writeHead(500);res.end(e.message);}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/upgrade/index.html`;
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  let page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);assert.match(await page.title(),/V5.8/);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
  const fixture={logs:[{id:'android-fixture',date:'2026-10-08',weight:82.3,waist:93,dc:'37.5',sun:0,custom:'unknown preserved'}],profile:{age:60,height:180,weight:82.3,customPreference:'preserved'},cyclePerformance:{'balanced::standard_week1_lundi_DC':{date:'2026-10-08',rir:3,load:37.5}},checklist:{customDone:true},mealsEaten:{'2026-10-08':{breakfast:true}},futureField:{preserved:true}};
  const charges=JSON.stringify(Array.from({length:12},(_,i)=>({week:i+1,charge_dc:37.5+i,unknown:'kept'})));
  await page.evaluate(async({fixture,charges})=>{Object.assign(state,fixture);saveState();localStorage.setItem(CYCLE_STORAGE_KEY,charges);localStorage.setItem('phase60_theme','light');await caches.open('unrelated-cache');},{fixture,charges});
  await context.setOffline(true);await page.reload();assert.match(await page.title(),/V5.8/);assert.deepEqual(await page.evaluate(()=>state.logs),fixture.logs);
  await context.setOffline(false);upgraded=true;
  await page.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update();});
  await page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration()).waiting);
  // Like closing all old app windows on Android: the waiting worker can activate.
  await page.close();page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.waitForFunction(()=>typeof renderV59==='function');
  await page.waitForFunction(async()=>!(await navigator.serviceWorker.getRegistration()).waiting);
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>typeof renderV59==='function');assert.match(await page.title(),/V5.9/);
  for(const field of Object.keys(fixture))assert.deepEqual(await page.evaluate(k=>state[k],field),fixture[field],field+' must survive the PWA update');
  assert.equal(await page.evaluate(()=>localStorage.getItem(CYCLE_STORAGE_KEY)),charges);
  assert.equal(await page.evaluate(()=>localStorage.getItem('phase60_theme')),'light');
  const cachesAfter=await page.evaluate(()=>caches.keys());assert.ok(cachesAfter.includes('unrelated-cache'));assert.ok(cachesAfter.includes('phase60plus-pwa-v5.9-1'));assert.ok(!cachesAfter.includes('phase60plus-pwa-v5.8-1'));
  assert.deepEqual(errors,[]);
  console.log('PASS: installed V5.8 -> waiting V5.9 -> closing old window -> offline V5.9; history, profile, 12-week charges, theme, unknown fields and unrelated caches preserved');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exit(1);});
