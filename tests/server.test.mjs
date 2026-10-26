import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createGameServer, runtimeConfig } from '../server.mjs';

const dataDir=await mkdtemp(path.join(os.tmpdir(),'clicker-auth-test-'));
const accessFile=path.join(dataDir,'access.json');
await writeFile(accessFile,JSON.stringify({Alice:['emmanuel']}));
let shopNow=Date.UTC(2026,9,26);
let server,base;
async function start(){
  server=await createGameServer({dataDir,secure:false,accessFile,clock:()=>shopNow});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+server.address().port;
}
async function close(){await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
async function request(route,{method='GET',body,cookie,csrf,origin=base}={}){
  const response=await fetch(base+route,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{}),Origin:origin},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const type=response.headers.get('content-type')||'';
  return {status:response.status,data:type.includes('json')?await response.json():await response.text(),cookie:response.headers.get('set-cookie')?.split(';')[0],headers:response.headers};
}
const password='Aa1!bcde';
assert.equal(runtimeConfig({PORT:'10000',NODE_ENV:'production',RENDER_EXTERNAL_URL:'https://clicker.example/'}).host,'0.0.0.0');
assert.equal(runtimeConfig({NODE_ENV:'production',APP_ORIGIN:'https://clicker.example/'}).origin,'https://clicker.example');
assert.throws(()=>runtimeConfig({NODE_ENV:'production'}));
assert.throws(()=>runtimeConfig({NODE_ENV:'production',APP_ORIGIN:'http://clicker.example'}));
try{
  await start();
  assert.equal((await request('/')).status,200);
  assert.equal((await request('/controls.js')).status,200);
  const bite=await request('/assets/apple-bite.wav');assert.equal(bite.status,200);assert.equal(bite.headers.get('content-type'),'audio/wav');
  assert.equal((await request('/api/session')).status,401);
  const health=await request('/api/health');assert.equal(health.status,200);assert.equal(health.data.service,'clicker-co');assert.equal(health.data.accounts,true);
  assert.equal((await request('/api/register',{method:'POST',body:{username:'Alice',password},origin:'https://other.example'})).status,403);
  for(const invalid of ['abcdefgh','ABCDEFG!','Abcdefgh','Ab1! cdE','Aa1!bcd','Aa!'+ 'x'.repeat(126)]){
    assert.equal((await request('/api/register',{method:'POST',body:{username:'Invalid_'+invalid.length,password:invalid}})).status,400);
  }
  for(const longPassword of ['Aa1!bcdef','AppleBite!2026','Aa!'+ 'x'.repeat(125)]){
    const username='Long_'+longPassword.length;
    assert.equal((await request('/api/register',{method:'POST',body:{username,password:longPassword}})).status,200);
    assert.equal((await request('/api/login',{method:'POST',body:{username,password:longPassword}})).status,200,'Long passwords can sign in without truncation');
  }
  const simultaneous=await Promise.all(['Alice','aLiCe'].map(username=>request('/api/register',{method:'POST',body:{username,password}})));
  assert.deepEqual(simultaneous.map(r=>r.status).sort(),[200,409],'Concurrent registrations cannot duplicate a username');
  const alice=simultaneous.find(r=>r.status===200);
  assert.ok(alice.headers.get('set-cookie').includes('HttpOnly'));
  assert.ok(alice.headers.get('set-cookie').includes('SameSite=Strict'));
  assert.equal((await request('/api/session',{cookie:alice.cookie})).data.username.toLowerCase(),'alice');
  assert.equal((await request('/api/login',{method:'POST',body:{username:'ALICE',password:'Wrong!xx'}})).status,401);
  const raw=globalThis.ClickerModel.initial();raw.balance=42;raw.lifetime=42;raw.clicks=10;raw.figure='emmanuel';raw.claimed=['first'];raw.owned['click-spark']=2;
  assert.equal((await request('/api/save',{method:'POST',cookie:alice.cookie,body:{save:raw,revision:0}})).status,403);
  const saved=await request('/api/save',{method:'POST',cookie:alice.cookie,csrf:alice.data.csrf,body:{save:raw,revision:0}});
  assert.equal(saved.status,200);assert.equal(saved.data.revision,1);
  assert.equal((await request('/api/save',{method:'POST',cookie:alice.cookie,csrf:alice.data.csrf,body:{save:{...raw,balance:-1},revision:1}})).status,400);
  assert.equal((await request('/api/save',{method:'POST',cookie:alice.cookie,csrf:alice.data.csrf,body:{save:raw,revision:0}})).status,409);
  const bob=await request('/api/register',{method:'POST',body:{username:'Bob',password}});
  assert.equal(bob.status,200);assert.equal(bob.data.save,null);
  assert.equal((await request('/api/session',{cookie:bob.cookie})).data.save,null,'Accounts do not share progress');
  assert.equal((await request('/api/save',{method:'POST',cookie:bob.cookie,csrf:alice.data.csrf,body:{save:raw,revision:0}})).status,403);
  assert.deepEqual(Array.from(alice.data.allowedFigures),[]);
  assert.equal(bob.data.allowedFigures.length,0);
  const bobRaw={...raw,balance:50000,lifetime:50000};
  const bobSave=await request('/api/save',{method:'POST',cookie:bob.cookie,csrf:bob.data.csrf,body:{save:bobRaw,revision:0,allowedFigures:['emmanuel']}});
  assert.equal(bobSave.data.figure,'luna','Forged grants and imported portraits cannot unlock restricted skins');
  const shop=await request('/api/shop');assert.equal(shop.data.offers.length,4);
  const offer=shop.data.offers[0];
  const buy=await request('/api/shop/buy',{method:'POST',cookie:bob.cookie,csrf:bob.data.csrf,body:{id:offer.id,revision:1}});
  assert.equal(buy.status,200);assert.equal(buy.data.save.balance,50000-offer.cost);assert.equal(buy.data.save.figure,offer.id);assert.ok(buy.data.ownedSkins.includes(offer.id));
  assert.equal((await request('/api/shop/buy',{method:'POST',cookie:bob.cookie,csrf:bob.data.csrf,body:{id:offer.id,revision:2}})).status,409);
  const lockedSkin=globalThis.ClickerModel.skins.find(s=>!shop.data.offers.some(o=>o.id===s.id));
  assert.equal((await request('/api/shop/buy',{method:'POST',cookie:bob.cookie,csrf:bob.data.csrf,body:{id:lockedSkin.id,revision:2}})).status,400);
  const forged=await request('/api/save',{method:'POST',cookie:bob.cookie,csrf:bob.data.csrf,body:{save:{...bobRaw,figure:lockedSkin.id,skins:[lockedSkin.id]},revision:2}});
  assert.equal(forged.data.figure,'luna');
  shopNow+=7*86400000;
  assert.equal((await request('/api/shop')).data.offers.length,3);
  assert.equal((await request('/api/shop/buy',{method:'POST',cookie:bob.cookie,csrf:bob.data.csrf,body:{id:offer.id,revision:3}})).status,400,'Expired offers cannot be purchased');
  assert.ok((await request('/api/session',{cookie:bob.cookie})).data.ownedSkins.includes(offer.id),'Purchased skins remain owned after rotation');
  assert.equal((await request('/skin-access.json')).status,404);
  const oldOffer=globalThis.ClickerModel.allShopSkins.find(s=>s.id==='cat-starlight');
  assert.ok(oldOffer);
  assert.ok(!(await request('/api/shop')).data.offers.some(s=>s.id===oldOffer.id),'Retired recolors stay out of weekly offers');
  const races=await Promise.all([1,2].map(()=>request('/api/save',{method:'POST',cookie:alice.cookie,csrf:alice.data.csrf,body:{save:raw,revision:1}})));
  assert.deepEqual(races.map(r=>r.status).sort(),[200,409],'Stale device writes cannot overwrite newer progress');
  for(const resource of ['/data/alice.json','/server.mjs','/.env','/package.json','/assets/../data/alice.json'])assert.equal((await request(resource)).status,404);
  const stored=JSON.parse(await readFile(path.join(dataDir,'account-alice.json'),'utf8'));
  assert.equal(stored.hash.length,128);assert.equal(stored.salt.length,32);
  assert.ok(!JSON.stringify(stored).includes(password),'Password is never stored in plaintext');
  assert.equal(stored.save.figure,'luna');
  await close();await start();
  assert.equal((await request('/api/session',{cookie:alice.cookie})).status,401,'Server restart invalidates sessions');
  const returning=await request('/api/login',{method:'POST',body:{username:'ALICE',password}});
  assert.equal(returning.status,200);assert.equal(returning.data.save.balance,42);assert.equal(returning.data.revision,2);
  assert.equal(returning.data.save.owned['click-spark'],2,'Click upgrades survive account saves and server restarts');
  assert.deepEqual(Array.from(returning.data.save.claimed),['first']);
  assert.equal((await request('/api/logout',{method:'POST',cookie:returning.cookie,csrf:returning.data.csrf,body:{}})).status,200);
  assert.equal((await request('/api/session',{cookie:returning.cookie})).status,401);
  for(let n=0;n<15;n++)await request('/api/login',{method:'POST',body:{username:'NoSuchUser',password:'Wrong!xx'}});
  assert.equal((await request('/api/login',{method:'POST',body:{username:'NoSuchUser',password:'Wrong!xx'}})).status,429);
  console.log('Accounts: password policy, case-insensitive uniqueness, concurrent registration, hashed credentials, sessions, CSRF, isolated durable saves, stale-write conflicts, private files, logout and throttling passed.');
}finally{
  if(server?.listening)await close();
  await rm(dataDir,{recursive:true,force:true});
}
