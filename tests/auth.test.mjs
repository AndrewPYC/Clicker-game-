import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source=await fs.readFile(new URL('../auth.js',import.meta.url),'utf8');
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));
function harness({protocol='http:',returning=false}={}){
  const nodes=new Map(),calls=[],starts=[],saved=[];
  let revision=0,networkDown=false,conflict=false,pauses=0,confirmAnswer=true,storageReads=0,shopOpens=0;
  const get=id=>{
    if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',hidden:['authForm','appShell','continueAccountButton','sessionIssue'].includes(id),disabled:false,handlers:{},setAttribute(){},focus(){},addEventListener(type,handler){this.handlers[type]=handler;}});
    return nodes.get(id);
  };
  const snapshot=()=>({version:2,balance:5000,lifetime:5000,clicks:0,owned:{},figure:'luna',claimed:[],quest:0,sound:false,motion:true,lastSaved:Date.now()});
  const game={start:(raw,onSave,options)=>starts.push({raw,onSave,options}),snapshot,pause:()=>{pauses++;},validate:raw=>raw,openShop(){shopOpens++;}};
  const data={username:'Alice',csrf:'session-csrf',revision:0,save:snapshot(),allowedFigures:['emmanuel'],ownedSkins:[]};
  const context=vm.createContext({
    window:{ClickerGame:game},location:{protocol},document:{getElementById:get,querySelectorAll:()=>Array.from(nodes.values())},
    localStorage:{getItem(){storageReads++;return null;}},confirm:()=>confirmAnswer,
    fetch:async(url,options)=>{
      calls.push({url,options});
      const response=(status,body)=>({ok:status<400,status,json:async()=>body});
      if(url==='/api/session')return returning?response(200,data):response(401,{error:'Please sign in again.'});
      if(url==='/api/register'||url==='/api/login')return response(200,{...data,save:url==='/api/register'?null:data.save});
      if(url==='/api/shop/buy'){
        const body=JSON.parse(options.body);assert.equal(body.revision,revision);
        return response(200,{...data,revision:++revision,ownedSkins:[body.id],save:{...snapshot(),figure:body.id,balance:3500}});
      }
      if(url==='/api/save'){
        if(networkDown)throw Error('Connection lost.');
        if(conflict)return response(409,{error:'Progress changed on another device.'});
        const body=JSON.parse(options.body);
        assert.equal(body.revision,revision);
        assert.equal(options.headers['X-CSRF-Token'],'session-csrf');
        saved.push(body.save);return response(200,{revision:++revision});
      }
      if(url==='/api/logout')return response(200,{ok:true});
      throw Error('Unexpected route '+url);
    }
  });
  vm.runInContext(source,context);
  const click=id=>get(id).handlers.click();
  const submit=()=>get('authForm').handlers.submit({preventDefault(){}});
  const credentials=(password='Aa1!bcde')=>{get('username').value='Alice';get('password').value=password;get('confirmPassword').value=password;};
  return {get,click,submit,credentials,calls,starts,saved,setNetwork:value=>{networkDown=value;},setConflict:value=>{conflict=value;},setConfirm:value=>{confirmAnswer=value;},get pauses(){return pauses;},get storageReads(){return storageReads;},get shopOpens(){return shopOpens;}};
}

const local=harness({protocol:'file:'});
assert.equal(local.get('appShell').hidden,true);assert.equal(local.get('authView').hidden,false);
local.click('guestButton');assert.equal(local.starts[0].raw,null);assert.equal(local.starts[0].onSave,null);
assert.equal(local.storageReads,0);assert.equal(local.calls.length,0);
assert.match(local.get('saveStatus').textContent,/will not be saved/);
assert.equal(local.get('exportButton').disabled,true);
await local.click('accountButton');assert.equal(local.get('authView').hidden,false);
local.click('createUserButton');local.credentials();await local.submit();
assert.match(local.get('authError').textContent,/game server/);assert.equal(local.get('appShell').hidden,true);

const signed=harness();await settle();
signed.click('createUserButton');
for(const invalid of ['abcdefgh','ABCDEFG!','Abcdefgh','Ab1! cdE','Aa1!bcd','Aa1!bcdef']){
  signed.credentials(invalid);const requests=signed.calls.length;await signed.submit();
  assert.match(signed.get('authError').textContent,/8 characters/);assert.equal(signed.calls.length,requests);
}
signed.credentials();signed.get('confirmPassword').value='Different!';await signed.submit();
assert.match(signed.get('authError').textContent,/do not match/);
signed.credentials();await signed.submit();await settle();
assert.equal(signed.get('authView').hidden,true);assert.equal(signed.get('appShell').hidden,false);
assert.equal(signed.get('accountLabel').textContent,'Playing as Alice');
assert.equal(signed.get('password').value,'');assert.equal(signed.get('confirmPassword').value,'');
assert.equal(signed.saved.length,1,'A new account saves its fresh game');
assert.equal(signed.starts.at(-1).options.allowedFigures[0],'emmanuel');
await signed.starts.at(-1).options.onSkinBuy('shop-fox');
assert.equal(signed.starts.at(-1).options.ownedSkins[0],'shop-fox');assert.equal(signed.shopOpens,1);
assert.equal(signed.get('appShell').inert,false,'The game unlocks after purchasing a skin');
assert.equal(signed.storageReads,0,'Credentials and saves are not stored in localStorage');
const callback=signed.starts.at(-1).onSave;
signed.setNetwork(true);assert.equal(await callback({...signed.saved[0],clicks:5}),false);
assert.equal(signed.get('sessionIssue').hidden,false);assert.match(signed.get('saveStatus').textContent,/not saved/);
signed.setNetwork(false);assert.equal(await callback({...signed.saved[0],clicks:6}),true);
assert.equal(signed.saved.at(-1).clicks,6);assert.equal(signed.get('sessionIssue').hidden,true);
await Promise.all([callback({...signed.saved[0],clicks:7}),callback({...signed.saved[0],clicks:8})]);
assert.equal(signed.saved.at(-1).clicks,8,'Overlapping saves keep the latest queued progress');
signed.setConflict(true);assert.equal(await callback({...signed.saved[0],clicks:7}),false);
assert.ok(signed.pauses>0);assert.match(signed.get('sessionIssueText').textContent,/Export a backup/);
assert.equal(await callback({...signed.saved[0],clicks:8}),false,'Conflicted sessions stop writing');
await signed.click('accountButton');assert.equal(signed.get('appShell').hidden,true);assert.equal(signed.get('authView').hidden,false);

const returning=harness({returning:true});await settle();
assert.equal(returning.starts.length,0,'Remembered accounts still see the welcome choices first');
assert.equal(returning.get('continueAccountButton').hidden,false);
await returning.click('continueAccountButton');
assert.equal(returning.starts.at(-1).raw.figure,'luna');assert.equal(returning.get('appShell').hidden,false);
assert.ok(returning.calls.every(call=>call.options.credentials==='same-origin'));
console.log('Welcome-first flow, guest without storage, exact password validation, file-mode guidance, account save queue, network recovery, conflict pause, sign-out and remembered-account continuation passed.');
