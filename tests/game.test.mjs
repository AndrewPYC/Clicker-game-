import fs from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=(await fs.readFile(new URL('../model.js',import.meta.url),'utf8'))+'\n'+(await fs.readFile(new URL('../game.js',import.meta.url),'utf8'));
const boot="const KEY='clicker-co-save-v2';window.ClickerGame.start(null,s=>localStorage.setItem(KEY,JSON.stringify(s)),{allowedFigures:restrictedFigures,ownedSkins:globalThis.ClickerModel.allShopSkins.map(s=>s.id)});";
let now=0,wallTime=1000000000;
class Clock extends Date {static now(){return wallTime;}}
const store=new Map(),elements=new Map(),masks=[],timers=new Map();
const scheduled=[];
const element=()=>({children:[],getBoundingClientRect(){return {left:0,top:0,width:400,height:400};},textContent:'',innerHTML:'',style:{},classList:{toggle(){}},handlers:{},addEventListener(n,h){this.handlers[n]=h;},setAttribute(){},removeAttribute(){},append(child){this.children.push(child);},remove(){this.removed=true;},checked:false,showModal(){this.open=true;},close(){this.open=false;},focus(){}});
const getElement=id=>{if(!elements.has(id))elements.set(id,element());if(id==='catButton')elements.get(id).getBoundingClientRect=()=>({left:80,top:80,width:240,height:240});return elements.get(id);};
const adapter={Date:Clock,Math:Object.create(Math),Intl,Number,JSON,Error,Set,performance:{now:()=>now},matchMedia:()=>({matches:true}),localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},document:{getElementById:getElement,querySelectorAll:()=>[],documentElement:{style:{setProperty:(_,v)=>masks.push(v)}},body:{classList:{toggle(){}}},addEventListener(){},createElement:element},window:{addEventListener(){}},setTimeout:(fn,delay)=>{scheduled.push({fn,delay});return scheduled.length;},setInterval:(f,d)=>timers.set(d,f),confirm:()=>true};
const context=vm.createContext({...adapter});vm.runInContext(source,context);vm.runInContext(boot,context);
const tick=timers.get(100);
const run=code=>vm.runInContext(code,context);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' != '+b);
for(const [cps,m] of [[0,1],[4,1],[4.99,1],[5,1.2],[9,1.2],[9.99,1.2],[10,1.4],[14,1.4],[15,1.6],[19,1.6],[20,1.8],[24,1.8],[25,2],[26,2],[1000,2]])assert.equal(run('multiplierFor('+cps+')'),m);
let expectedBalance=0;
for(let count=1;count<=30;count++){const before=run('state.balance');run('pet({})');const expected=run('multiplierFor('+count+')');close(run('state.balance')-before,expected);expectedBalance+=expected;}
close(run('state.balance'),expectedBalance);assert.equal(run('clickMultiplier()'),2);assert.equal(run('clicksPerSecond()'),30);
now=999;assert.equal(run('clickMultiplier()'),2);now=1000;assert.equal(run('clicksPerSecond()'),0);assert.equal(run('clickMultiplier()'),1);run('pet({})');assert.equal(run('clickMultiplier()'),1);
run('clearClickSpeed()');for(let i=0;i<25;i++){now=2000+i*20;run('pet({})');}
assert.equal(run('clickMultiplier()'),2);
for(const [time,cps,m] of [[3000,24,1.8],[3100,19,1.6],[3200,14,1.4],[3300,9,1.2],[3400,4,1],[3480,0,1]]){now=time;assert.equal(run('clicksPerSecond()'),cps);assert.equal(run('clickMultiplier()'),m);}
run('state=initial();earn(1000)');run("buy('paws');buy('friend')");assert.equal(run('baseClick()'),1);close(run('baseRate()'),1.01);assert.equal(run('price(upgrades[0])'),29);
run('state.clicks=49;clearClickSpeed()');const beforeLevel=run('state.balance');run('pet({})');assert.equal(run('level()'),2);close(run('state.balance')-beforeLevel,101);assert.equal(run('baseClick()'),1);close(run('baseRate()'),1.0605);
run('clearClickSpeed();state.clicks=200;for(let i=0;i<30;i++)pet({})');assert.equal(run('clickMultiplier()'),2);assert.equal(run('baseClick()'),1);
const rate=run('baseRate()'),beforeIdle=run('state.balance');wallTime+=1000;tick();close(run('state.balance')-beforeIdle,rate);
run("claim('first')");const rewardBalance=run('state.balance');run("claim('first');claim('empire')");assert.equal(run('state.balance'),rewardBalance);
run('state.balance=0');run("buy('paws')");assert.equal(run('state.owned.paws'),1);
run('state.figure="monkey";applyFigure();save()');assert.equal(getElement('heroCat').src,'assets/monkey.svg');assert.equal(run('validate(JSON.parse(localStorage.getItem(KEY))).figure'),'monkey');
assert.throws(()=>run('validate({version:2})'));assert.throws(()=>run('validate({...state,balance:-1})'));assert.throws(()=>run('validate({...state,owned:{paws:1.5}})'));
const migrated=run('validate({...state,version:1,pats:20,stormEnd:9999999999})');assert.equal(migrated.version,2);assert.equal(migrated.stormEnd,undefined);
const saved=JSON.parse(store.get('clicker-co-save-v2'));saved.lastSaved=wallTime-48*3600*1000;store.set('clicker-co-save-v2',JSON.stringify(saved));const reloadElements=new Map();const reloaded=vm.createContext({...adapter,window:{...adapter.window},document:{...adapter.document,getElementById:id=>{if(!reloadElements.has(id))reloadElements.set(id,element());return reloadElements.get(id);}}});vm.runInContext(source,reloaded);vm.runInContext('window.ClickerGame.start(JSON.parse(localStorage.getItem("clicker-co-save-v2")),()=>{})',reloaded);close(vm.runInContext('offlineGift',reloaded),18000*rate);assert.equal(vm.runInContext('clickMultiplier()',reloaded),1);
getElement('settingsButton').handlers.click();assert.equal(getElement('settingsDialog').open,true);getElement('guideMenuButton').handlers.click();assert.equal(getElement('guideView').hidden,false);assert.equal(getElement('gameView').hidden,true);getElement('backToGame').handlers.click();assert.equal(getElement('guideView').hidden,true);assert.equal(getElement('gameView').hidden,false);
console.log('CLICKER CO: exact speed tiers, rising/falling rates, cap, payouts, crew income, levels, rewards, saves/migration, offline cap, companions and menu actions passed.');

// Four SVG animals and four supplied PNG portraits share the apple currency.
assert.equal(run('figures.length'),26);
for(const figure of run('figures')){
  const bytes=await fs.readFile(new URL('../'+figure.src,import.meta.url));
  if(figure.src.endsWith('.svg')){
    const svg=bytes.toString('utf8');
    assert.ok(svg.includes('viewBox="0 0 400 400"'));
    assert.ok(!/<image|<filter|Gradient/i.test(svg),'Animal art uses flat vectors');
  }else{
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
    assert.equal(bytes.readUInt32BE(16),1024);assert.equal(bytes.readUInt32BE(20),1024);
    assert.equal(bytes[25],6,'Portraits have genuine RGBA transparency');
  }
  run('state.figure='+JSON.stringify(figure.id)+';applyFigure();save()');
  assert.equal(getElement('heroCat').src,figure.src);
  
  assert.equal(run('validate(JSON.parse(localStorage.getItem(KEY))).figure'),figure.id);
}
for(const id of ['fox','bunny','frog','penguin']){
  assert.equal(run('validate({...state,figure:'+JSON.stringify(id)+'}).figure'),'luna');
}
assert.throws(()=>run('validate({...state,figure:"unknown"})'));
assert.ok((await fs.readFile(new URL('../assets/apple-token.svg',import.meta.url),'utf8')).includes('<svg'));
console.log('Four SVG animals, four transparent portraits, fixed apple TOCKENS and save migration passed.');

// New economy rules, automatic clicks and stable single-click milestone claims.
assert.deepEqual(Array.from(run('upgrades.map(item=>item.cost)')),[25,50,100,200]);
assert.deepEqual(Array.from(run('upgrades.map(item=>item.crewBoost)')),[.01,.05,.075,.1]);
for(let i=0;i<4;i++){
  run('state.owned[upgrades['+i+'].id]=2');
  assert.equal(run('price(upgrades['+i+'])'),Math.ceil(Math.ceil([25,50,100,200][i]*115/100)*115/100));
}
run('state=initial();state.owned={baker:1,courier:1,orchestra:1};clearClickSpeed()');
assert.equal(run('baseRate()'),160);
const manualBefore=run('state.clicks');wallTime+=1000;tick();
assert.equal(run('state.balance'),160);assert.equal(run('state.clicks'),manualBefore);assert.equal(run('clicksPerSecond()'),0);assert.equal(run('baseClick()'),1);
assert.equal(run('milestones.length'),1000);
assert.equal(run('new Set(milestones.map(m=>m.id)).size'),1000);
const finalTargets={clicks:10000000,lifetime:1e15,crew:600,upgrades:600,level:500,rate:10000000};
for(const [kind,target] of Object.entries(finalTargets)){
  const chapters=Array.from(run('milestones.filter(m=>m.id.startsWith("chapter-")&&m.kind==='+JSON.stringify(kind)+')'));
  assert.equal(chapters.at(-1).target,target);
  assert.ok(chapters.every((item,index)=>index===0||item.target>chapters[index-1].target),'Each track must get strictly harder');
}
assert.equal(run('milestones.find(m=>m.id==="clicks-1000000").target'),1000000);
assert.equal(run('milestones.find(m=>m.id==="earned-1000000000").target'),1000000000);
assert.ok(run('milestones.filter(m=>m.kind==="lifetime").reduce((sum,m)=>sum+m.reward,0)')<1e14,'Rewards cannot pay for the entire lifetime track');
run('state=initial();state.claimed=["first","chapter-level-1"]');
assert.equal(run('validate(state).claimed.length'),2,'Previously claimed gifts survive harder requirements');
let writes=0,markup='';
Object.defineProperty(getElement('shopItems'),'innerHTML',{configurable:true,get:()=>markup,set:value=>{writes++;markup=value;}});
run('state=initial();state.clicks=1000;state.owned.friend=1;tab="milestones";$("empireDialog").showModal();render()');
const initialWrites=writes;
for(let i=0;i<20;i++){wallTime+=100;tick();}
assert.equal(writes,initialWrites,'Idle updates must not replace milestone buttons');
const button=getElement('action-first');assert.equal(button.disabled,false);
const beforeClaim=run('state.balance');
getElement('shopItems').handlers.click({target:{closest:()=>({dataset:{claim:'first'}})}});
close(run('state.balance')-beforeClaim,100);assert.equal(button.disabled,true);assert.equal(button.textContent,'Claimed');
assert.equal(writes,initialWrites,'Claim updates the existing row');
getElement('shopItems').handlers.click({target:{closest:()=>({dataset:{claim:'first'}})}});
close(run('state.balance')-beforeClaim,100);
run('save()');assert.equal(run('validate(JSON.parse(localStorage.getItem(KEY))).claimed.includes("first")'),true);
console.log('New boost prices/rates, automatic crew clicks, 1000 milestones, stable reward buttons, single-click claims and guide/back navigation passed.');

getElement('openEmpireButton').handlers.click();assert.equal(getElement('empireDialog').open,true);
getElement('closeEmpireButton').handlers.click();assert.equal(getElement('empireDialog').open,false);
getElement('crewMenuButton').handlers.click();assert.equal(getElement('empireDialog').open,true);assert.equal(run('tab'),'crew');
getElement('guideMenuButton').handlers.click();assert.equal(getElement('empireDialog').open,false);assert.equal(getElement('guideView').hidden,false);
getElement('backToGame').handlers.click();getElement('milestonesMenuButton').handlers.click();assert.equal(getElement('empireDialog').open,true);assert.equal(run('tab'),'milestones');
console.log('Empire side launcher, close action, menu shortcuts and guide navigation passed.');

run('window.ClickerGame.start(null,s=>localStorage.setItem(KEY,JSON.stringify(s)),{allowedFigures:restrictedFigures,ownedSkins:globalThis.ClickerModel.allShopSkins.map(s=>s.id)})');
for(const [id,name] of [['mark','Mark'],['pavly','Pavly'],['john','John'],['emmanuel','Emmanuel']]){
  run('state=initial();clearClickSpeed()');
  getElement('figureChoices').handlers.click({target:{closest:()=>({dataset:{figure:id}})}});
  assert.equal(run('state.figure'),id);assert.equal(getElement('figureName').textContent,name);
  assert.equal(getElement('heroCat').src,'assets/'+id+'.png');
  assert.equal(getElement('catButton').ariaLabel,'Click '+name+' to earn TOCKENS');
  assert.equal(run('validate(JSON.parse(localStorage.getItem(KEY))).figure'),id);
  run('pet({})');assert.equal(run('state.balance'),1);
}
console.log('Mark, Pavly, John and Emmanuel selection, accessible labels, saves and click earnings passed.');

// Price growth rounds each successive purchase, for boosts and every crew type.
for(const item of run('[...upgrades,...crew]')){
  let expected=item.cost;
  for(let count=0;count<12;count++){
    run('state.owned['+JSON.stringify(item.id)+']='+count);
    assert.equal(run('price([...upgrades,...crew].find(i=>i.id==='+JSON.stringify(item.id)+'))'),expected);
    expected=Math.ceil(expected*115/100);
  }
}
run('state=initial();tab="milestones";$("empireDialog").showModal();changeMilestones("all")');
assert.equal((getElement('shopItems').innerHTML.match(/class="shop-item"/g)||[]).length,25);
getElement('nextMilestones').handlers.click();assert.equal(run('milestonePage'),1);
getElement('previousMilestones').handlers.click();assert.equal(run('milestonePage'),0);
assert.equal(run('milestones.find(m=>m.id==="first").target'),100);
run('state.clicks=100;changeMilestones("ready")');
assert.ok(run('readySelection.some(m=>m.id==="first")'));
const stableReadyWrites=writes;run('renderShop()');assert.equal(writes,stableReadyWrites);
run('window.ClickerGame.pause()');const pausedClicks=run('state.clicks');run('pet({})');assert.equal(run('state.clicks'),pausedClicks);
const storedBeforeGuest=store.get('clicker-co-save-v2');
run('window.ClickerGame.start(null,null);pet({});save()');
assert.equal(store.get('clicker-co-save-v2'),storedBeforeGuest,'Guests never save progress');
run('window.ClickerGame.start(null,null)');assert.equal(run('state.clicks'),0,'New guest games start fresh');
assert.equal(run('state.balance'),0);
run('showGuide();window.ClickerGame.pause();window.ClickerGame.start(null,null)');
assert.equal(getElement('gameView').hidden,false);assert.equal(getElement('guideView').hidden,true,'Every new session starts in the play view');
console.log('15% successive prices, 1000 long-term gifts, 25-row pages, ready filter, paused sessions and unsaved guests passed.');
run('window.ClickerGame.start(null,s=>localStorage.setItem(KEY,JSON.stringify(s)));earn(10000);buy("friend");buy("click-spark");clearClickSpeed()');
close(run('manualClickPower()'),1.1);assert.equal(run('baseRate()'),1);
const beforePower=run('state.balance');run('pet({})');close(run('state.balance')-beforePower,1.1);
run('buy("click-surge");buy("click-nova");clearClickSpeed()');close(run('manualClickPower()'),1.85);
run('for(let i=0;i<25;i++)pet({})');assert.equal(run('clickMultiplier()'),2);close(run('manualClickPower()*clickMultiplier()'),3.7);assert.equal(run('baseRate()'),1);
run('save()');assert.equal(run('validate(JSON.parse(localStorage.getItem(KEY))).owned["click-nova"]'),1);
assert.equal(run('validate({...initial(),owned:{}}).owned["click-spark"]'),0);
assert.throws(()=>run('validate({...state,owned:{"click-spark":-1}})'));
run('tab="clicks";$("empireDialog").showModal();renderShop()');assert.ok(getElement('shopItems').innerHTML.includes('click-nova'));
run('document.documentElement.requestFullscreen=async()=>{document.fullscreenElement=document.documentElement};document.exitFullscreen=async()=>{document.fullscreenElement=null}');
await getElement('fullScreenButton').handlers.click();assert.equal(run('Boolean(document.fullscreenElement)'),true);assert.equal(getElement('fullScreenButton').textContent,'Exit Full Screen');
await getElement('fullScreenButton').handlers.click();assert.equal(run('Boolean(document.fullscreenElement)'),false);assert.equal(getElement('fullScreenButton').textContent,'Full Screen');
run('document.documentElement.requestFullscreen=async()=>{throw Error("Denied")};syncFullScreen()');await getElement('fullScreenButton').handlers.click();assert.equal(run('Boolean(document.fullscreenElement)'),false);
console.log('Click power purchases, stacking, manual-only payouts, old/new saves, fullscreen enter/exit/failure passed.');

run('window.ClickerGame.start(null,null);state.motion=true');
const stage=getElement('catStage'),stageChildren=stage.children.length;
getElement('catButton').handlers.click({clientX:50,clientY:60});
getElement('catButton').handlers.click({});
assert.equal(stage.children.length,stageChildren,'Character clicks do not create apple effects with reduced motion');
run('state.motion=false');
getElement('catButton').handlers.click({});
assert.equal(stage.children.length,stageChildren,'Character clicks do not create apple effects with motion enabled');
assert.equal(run('state.clicks'),3);
assert.equal(run('state.balance'),3,'Clicks still award TOCKENS');
run('state.sound=false;playSound()');assert.equal(run('bitePlayers.length'),0);
run(`
  const audioTest={players:[]};
  window.Audio=class{
    paused=true;ended=false;currentTime=0;
    constructor(src){this.src=src;audioTest.players.push(this);}
    play(){this.paused=false;return Promise.resolve();}
    pause(){this.paused=true;}
  };
  state.sound=true;playSound();
`);
assert.equal(run('audioTest.players[0].src'),'assets/apple-bite.wav');
assert.equal(run('audioTest.players[0].paused'),false);
run('for(let i=0;i<20;i++)playSound()');assert.equal(run('bitePlayers.length'),6);
run('state.sound=false;playSound()');assert.equal(run('audioTest.players.every(s=>s.paused&&s.currentTime===0)'),true);
run('state.sound=true;playSound()');assert.equal(run('bitePlayers.length'),6,'Finished or stopped audio players are reused');
const biteWav=await fs.readFile(new URL('../assets/apple-bite.wav',import.meta.url));
assert.equal(biteWav.toString('ascii',0,4),'RIFF');assert.equal(biteWav.toString('ascii',8,12),'WAVE');
assert.ok(biteWav.length>10000);assert.equal(biteWav.readUInt16LE(22),1);
console.log('Character clicks without apple effects, recorded bite playback, opt-in sound and bounded audio overlap passed.');

run('window.ClickerGame.start(null,null)');
for(const id of ['mark','emmanuel','pavly','john'])assert.ok(!getElement('figureChoices').innerHTML.includes(`data-figure="${id}"`),'Unowned portraits stay out of the companion picker');
getElement('figureChoices').handlers.click({target:{closest:()=>({dataset:{figure:'mark'}})}});
assert.equal(run('state.figure'),'luna','Guests cannot select unpurchased portraits');
run('state.figure="emmanuel";applyFigure()');assert.equal(run('state.figure'),'luna');
run('window.ClickerGame.start(null,null,{ownedSkins:["emmanuel"]})');
assert.ok(getElement('figureChoices').innerHTML.includes('data-figure="emmanuel"'));
for(const id of ['mark','pavly','john'])assert.ok(!getElement('figureChoices').innerHTML.includes(`data-figure="${id}"`),'Only purchased portraits are visible');
getElement('figureChoices').handlers.click({target:{closest:()=>({dataset:{figure:'emmanuel'}})}});
assert.equal(run('state.figure'),'emmanuel');
const monday=Date.UTC(2026,9,26);
for(const time of [monday-1,monday,monday+7*86400000])assert.equal(run('weeklyShop('+time+').offers.length'),7);
assert.notEqual(run('weeklyShop('+(monday-1)+').offers[0].id'),run('weeklyShop('+monday+').offers[0].id'));
assert.equal(run('weeklyShop('+monday+').refreshAt'),monday+7*86400000);
run('window.ClickerGame.start(null,null);tab="shop";$("empireDialog").showModal();renderShop()');
assert.equal((getElement('shopItems').innerHTML.match(/class="shop-item skin-item"/g)||[]).length,7);
const shopWrites=writes;run('renderShop()');assert.equal(writes,shopWrites,'Shop buttons remain stable on live updates');
assert.equal(run('OFFLINE_CAP_SECONDS'),18000);
run('window.ClickerGame.start({...initial(),lastSaved:Date.now()-48*3600000,owned:{friend:1}},null)');
assert.equal(run('offlineGift'),18000,'Offline crew earnings stop at five hours');
console.log('Weekly three-skin rotation, stable offers, purchased portraits and five-hour offline cap passed.');

assert.equal(run('skins.length'),9);
assert.equal(run('new Set(skins.filter(s=>s.species!=="character").map(s=>s.species)).size'),7);
assert.equal(run('skins.filter(s=>s.name==="Mario"||s.name==="Spider-Man").length'),2);
assert.equal(run('weeklyShop(Date.UTC(2026,9,23)).offers.map(s=>s.id).includes("shop-mario")'),true);
run('window.ClickerGame.start({...initial(),figure:"cat-starlight"},null,{ownedSkins:["cat-starlight"]})');
assert.equal(run('state.figure'),'cat-starlight','Previously purchased recolors remain usable');
