'use strict';
const $ = id => document.getElementById(id);
// Rolling one-second window; timestamps are session-only and never saved.
let clickTimes = [];
function clicksPerSecond(now = performance.now()) {
  clickTimes = clickTimes.filter(time => time > now - 1000 && time <= now);
  return clickTimes.length;
}
function multiplierFor(cps) {
  if (cps >= 25) return 2;
  if (cps >= 20) return 1.8;
  if (cps >= 15) return 1.6;
  if (cps >= 10) return 1.4;
  if (cps >= 5) return 1.2;
  return 1;
}
function clickMultiplier(now = performance.now()) { return multiplierFor(clicksPerSecond(now)); }
function clearClickSpeed() { clickTimes = []; }
const {figures,restrictedFigures,skins,weeklyShop,OFFLINE_CAP_SECONDS,retiredFigures,upgrades,clickUpgrades,crew,milestones,initial,validate}=globalThis.ClickerModel;
let state=initial(),tab='upgrades',offlineGift=0;
let gameReady=false,saveHandler=null;
let skinAccess={allowedFigures:[],ownedSkins:[],onSkinBuy:null},shopClockOffset=0;
function canUseFigure(id){
  const figure=figures.find(f=>f.id===id);
  return Boolean(figure&&(!figure.restricted||skinAccess.allowedFigures.includes(id))&&(!figure.shop||skinAccess.ownedSkins.includes(id)));
}
function updateShopClock(shop){if(Number.isFinite(shop?.serverTime))shopClockOffset=shop.serverTime-Date.now();}
function renderSkinShop(){
  const shop=weeklyShop(Date.now()+shopClockOffset),key='shop-'+shop.week;
  $('milestoneNav').hidden=true;
  $('shopIntro').textContent='Three rotating skins + four permanent portraits · rotation refreshes '+new Date(shop.refreshAt).toISOString().slice(0,10)+' at 00:00 UTC · cosmetic only';
  if(renderedTab!==key){
    $('shopItems').innerHTML=shop.offers.map(s=>'<article class="shop-item skin-item"><img class="skin-preview" src="'+s.src+'" alt="'+s.alt+'"><div class="item-body"><h3>'+s.name+'</h3><p>Permanent cosmetic skin</p><small id="skin-state-'+s.id+'"></small></div><button class="buy-button" id="skin-buy-'+s.id+'" data-skin="'+s.id+'"></button></article>').join('');
    renderedTab=key;
  }
  for(const skin of shop.offers){
    const owned=skinAccess.ownedSkins.includes(skin.id),button=$('skin-buy-'+skin.id);
    $('skin-state-'+skin.id).textContent=owned?'Owned · keep forever':fmt(skin.cost)+' TOCKENS';
    button.textContent=owned?(state.figure===skin.id?'Equipped':'Equip'):skinAccess.onSkinBuy?'Buy '+fmt(skin.cost):'Enter name to buy';
    button.disabled=owned?state.figure===skin.id:!skinAccess.onSkinBuy||state.balance<skin.cost;
  }
}
async function buySkin(id){
  if(!gameReady)return;
  if(skinAccess.ownedSkins.includes(id)){state.figure=id;applyFigure();save();render();return;}
  const offer=weeklyShop(Date.now()+shopClockOffset).offers.find(s=>s.id===id);
  if(!offer||!skinAccess.onSkinBuy||state.balance<offer.cost)return;
  await skinAccess.onSkinBuy(id);
}

function level(){return Math.floor((Math.sqrt(1+8*state.clicks/50)-1)/2)+1;}
function threshold(l){return 25*(l-1)*l;}
function boost(){return 1+(level()-1)*.05;}
function baseClick(){return 1;}
function manualClickPower(){return baseClick()+clickUpgrades.reduce((sum,item)=>sum+(state.owned[item.id]||0)*item.clickAdd,0);}
function productionMultiplier(){return boost()*(1+upgrades.reduce((sum,item)=>sum+(state.owned[item.id]||0)*item.crewBoost,0));}
function manualPayout(rhythm=clickMultiplier()){return manualClickPower()*productionMultiplier()*rhythm;}
function baseRate(){return crew.reduce((sum,item)=>sum+(state.owned[item.id]||0)*(item.rate+(item.autoClicks||0)*baseClick()),0)*productionMultiplier();}
function earn(amount){if(Number.isFinite(amount)&&amount>0){state.balance+=amount;state.lifetime+=amount;}}
function fmt(n){if(n<1000)return Number.isInteger(n)?String(n):n.toFixed(1);return Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(n);}
const priceCache=new Map();
function price(item){
  if(!priceCache.has(item.id))priceCache.set(item.id,[item.cost]);
  const prices=priceCache.get(item.id),count=state.owned[item.id]||0;
  while(prices.length<=count)prices.push(Math.ceil(prices[prices.length-1]*115/100));
  return prices[count];
}
function token(){return '<span class="token-icon" aria-hidden="true"></span>';}
function syncFullScreen(){
  const active=Boolean(document.fullscreenElement||document.webkitFullscreenElement);
  const supported=Boolean(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen);
  $('fullScreenButton').disabled=!supported;
  $('fullScreenButton').textContent=supported?(active?'Exit Full Screen':'Full Screen'):'Full Screen unavailable';
  $('fullScreenButton').setAttribute('aria-pressed',String(active));
}
async function toggleFullScreen(){
  closeMenus();
  try{
    if(document.fullscreenElement||document.webkitFullscreenElement){
      const exit=document.exitFullscreen||document.webkitExitFullscreen;
      if(!exit)throw Error('unsupported');
      await exit.call(document);
    }else{
      const enter=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen;
      if(!enter)throw Error('unsupported');
      await enter.call(document.documentElement);
    }
  }catch{toast('Full Screen could not open in this browser.');}
  syncFullScreen();
}
$('fullScreenButton').addEventListener('click',toggleFullScreen);
document.addEventListener('fullscreenchange',syncFullScreen);
document.addEventListener('webkitfullscreenchange',syncFullScreen);
syncFullScreen();
function toast(message){const el=document.createElement('div');el.className='toast';el.textContent=message;$('toasts').append(el);setTimeout(()=>el.remove(),4500);}
function save(){
  if(!gameReady)return;
  state.lastSaved=Date.now();
  return saveHandler?.(JSON.parse(JSON.stringify(state)));
}

const bitePlayers=[];
let biteLoadFailed=false;
function playSound(){
  if(!state.sound){
    for(const player of bitePlayers){try{player.pause();player.currentTime=0;}catch{}}
    return;
  }
  try{
    let player=bitePlayers.find(sound=>sound.paused||sound.ended);
    if(!player){
      if(bitePlayers.length>=6)return;
      player=new window.Audio('assets/apple-bite.wav');
      player.preload='auto';player.volume=.45;bitePlayers.push(player);
    }
    player.currentTime=0;
    const playback=player.play();
    playback?.then(()=>{biteLoadFailed=false;}).catch(()=>{
      if(!biteLoadFailed){biteLoadFailed=true;toast('The bite sound could not play. Refresh the game and try again.');}
    });
  }catch{
    if(!biteLoadFailed){biteLoadFailed=true;toast('Sound is unavailable in this browser.');}
  }
}
function pet(){
  if(!gameReady)return;
  const previous=level();
  const now=performance.now();clicksPerSecond(now);clickTimes.push(now);
  const amount=manualPayout(clickMultiplier(now));earn(amount);state.clicks++;
  if(level()>previous){const reward=level()*50;earn(reward);toast(`Level ${level()}! +${fmt(reward)} TOCKENS and +5% click and crew production.`);}
  playSound();render();
}
function buy(id){if(!gameReady)return;const item=[...upgrades,...clickUpgrades,...crew].find(x=>x.id===id);if(!item||(state.owned[id]||0)>=1000)return;const cost=price(item);if(state.balance<cost)return;state.balance-=cost;state.owned[id]=(state.owned[id]||0)+1;save();render();}
function metric(m){if(m.kind==='rate')return baseRate();if(m.kind==='upgrades')return upgrades.reduce((sum,item)=>sum+(state.owned[item.id]||0),0);if(m.kind==='crew')return crew.reduce((s,u)=>s+(state.owned[u.id]||0),0);if(m.kind==='level')return level();return state[m.kind];}
function claim(id){if(!gameReady)return;const m=milestones.find(x=>x.id===id);if(!m||state.claimed.includes(id)||metric(m)<m.target)return;state.claimed.push(id);earn(m.reward);toast(`${m.name}! +${fmt(m.reward)} TOCKENS.`);save();render();}
let renderedTab=null;
let milestonePage=0,milestoneFilter='all',readySelection=[];
const PAGE_SIZE=25;
function milestoneItems(){return milestoneFilter==='ready'?readySelection:milestones;}
function renderShop(){
  if(tab==='shop'){renderSkinShop();return;}
  const selected=milestoneItems(),pages=Math.max(1,Math.ceil(selected.length/PAGE_SIZE));
  milestonePage=Math.min(milestonePage,pages-1);
  const items=tab==='milestones'?selected.slice(milestonePage*PAGE_SIZE,(milestonePage+1)*PAGE_SIZE):tab==='crew'?crew:tab==='clicks'?clickUpgrades:upgrades;
  const claimed=new Set(state.claimed);
  $('milestoneNav').hidden=tab!=='milestones';
  $('shopIntro').textContent=tab==='crew'?'Build your automatic Night Shift.':tab==='clicks'?'Add TOCKENS per click. Crew boosts, levels and rhythm multiply your output.':tab==='milestones'?(items.length?'Long-term challenges. Build an empire that lasts.':'No gifts ready yet. Keep playing, then refresh Ready gifts.'):'Permanent boosts to click and Night Shift output.';
  if(tab==='milestones'){
    $('milestonePage').textContent='Page '+(milestonePage+1)+' / '+pages;
    $('previousMilestones').disabled=milestonePage===0;
    $('nextMilestones').disabled=milestonePage+1===pages;
    $('readyGiftCount').textContent=milestones.filter(m=>!claimed.has(m.id)&&metric(m)>=m.target).length+' ready';
    $('allMilestonesButton').setAttribute('aria-pressed',String(milestoneFilter==='all'));
    $('readyMilestonesButton').setAttribute('aria-pressed',String(milestoneFilter==='ready'));
  }
  // Keep button nodes stable while a pointer is held or keyboard focus is on them.
  if(renderedTab!==tab){
    $('shopItems').innerHTML=items.map(item=>'<article class="shop-item"><div class="item-icon">'+item.icon+'</div><div class="item-body"><div class="item-title"><h3>'+item.name+'</h3><span id="owned-'+item.id+'"></span></div><p>'+item.description+'</p><small id="detail-'+item.id+'"></small></div><button class="buy-button" id="action-'+item.id+'" '+(tab==='milestones'?'data-claim':'data-buy')+'="'+item.id+'"></button></article>').join('');
    renderedTab=tab;
  }
  for(const item of items){
    const button=$('action-'+item.id);
    if(tab==='milestones'){
      const done=claimed.has(item.id),value=metric(item),ready=value>=item.target;
      $('owned-'+item.id).textContent=done?'COMPLETE':'';
      $('detail-'+item.id).textContent=fmt(Math.min(value,item.target))+' / '+fmt(item.target)+' · Gift '+fmt(item.reward)+' TOCKENS';
      button.disabled=done||!ready;
      const label=done?'Claimed':ready?'Claim gift':'Locked';
      if(button.textContent!==label)button.textContent=label;
      button.setAttribute('aria-label',done?item.name+' claimed':'Claim '+fmt(item.reward)+' TOCKENS for '+item.name);
    }else{
      const cost=price(item);
      $('owned-'+item.id).textContent='LVL '+(state.owned[item.id]||0);
      $('detail-'+item.id).textContent=item.effect;
      button.disabled=state.balance<cost||(state.owned[item.id]||0)>=1000;
      const content=token()+fmt(cost);
      if(button.innerHTML!==content)button.innerHTML=content;
      button.setAttribute('aria-label','Buy '+item.name+' for '+cost+' TOCKENS');
    }
  }
}
function render(force=false){
  const cps=clicksPerSecond(),multiplier=multiplierFor(cps),l=level(),xp=state.clicks-threshold(l),needed=threshold(l+1)-threshold(l);
  $('balance').textContent=fmt(state.balance);$('perClick').textContent='+'+fmt(manualPayout(multiplier));$('perSecond').textContent=fmt(baseRate());$('lifetime').textContent=fmt(state.lifetime);
  $('clickPowerDetail').textContent=fmt(manualClickPower())+' TOCKENS base · '+productionMultiplier().toFixed(2)+'× crew/level · '+multiplier.toFixed(1)+'× rhythm';
  $('levelPill').textContent=`LVL ${l}`;$('levelTitle').textContent=`Level ${l} · ${l<5?'Tiny dreamer':l<10?'Moonlight maker':l<20?'Midnight monarch':'Cosmic companion'}`;$('xpText').textContent=`${fmt(xp)} / ${fmt(needed)} XP`;$('xpProgress').style.width=`${xp/needed*100}%`;
  $('speedLabel').textContent=`${cps} clicks/s · ${multiplier.toFixed(1)}×`;
  $('speedProgress').style.width=`${Math.min(100,cps/25*100)}%`;
  $('speedHelp').textContent=cps>=25?'Maximum rhythm! 2× your upgraded click power.':`Next tier: ${[5,10,15,20,25].find(n=>n>cps)} clicks/s. Speed is measured over the last 1 second.`;
  document.querySelectorAll('[data-speed]').forEach(el=>{el.classList.toggle('current',Number(el.dataset.speed)===multiplier);});
  $('achievementCount').textContent=`${state.claimed.length}/${milestones.length}`;
  if($('empireDialog').open)renderShop();
}
function applyFigure(){
  if(!canUseFigure(state.figure))state.figure='luna';
  const f=figures.find(f=>f.id===state.figure);$('heroCat').src=f.src;$('heroCat').alt=f.alt;$('figureName').textContent=f.title;$('catButton').ariaLabel=`Click ${f.name} to earn TOCKENS`;
  document.body.classList.toggle('reduce-motion',state.motion);$('soundToggle').checked=state.sound;$('motionToggle').checked=state.motion;
  $('figureChoices').innerHTML=figures.filter(f=>canUseFigure(f.id)).map(f=>`<button class="figure-choice ${state.figure===f.id?'selected':''}" data-figure="${f.id}" aria-pressed="${state.figure===f.id}"><img src="${f.src}" alt="">${f.name}</button>`).join('');
}
$('catButton').addEventListener('click',pet);
function changeMilestones(action){
  if(action==='all'||action==='ready'){
    milestoneFilter=action;milestonePage=0;
    if(action==='ready')readySelection=milestones.filter(m=>!state.claimed.includes(m.id)&&metric(m)>=m.target);
  }else milestonePage=Math.max(0,milestonePage+(action==='next'?1:-1));
  renderedTab=null;renderShop();$('shopItems').scrollTop=0;
}
$('allMilestonesButton').addEventListener('click',()=>changeMilestones('all'));
$('readyMilestonesButton').addEventListener('click',()=>changeMilestones('ready'));
$('previousMilestones').addEventListener('click',()=>changeMilestones('previous'));
$('nextMilestones').addEventListener('click',()=>changeMilestones('next'));
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{tab=button.dataset.tab;document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-selected',String(b===button));});render(true);}));
$('shopItems').addEventListener('click',event=>{const b=event.target.closest('button');if(b?.dataset.buy)buy(b.dataset.buy);if(b?.dataset.claim)claim(b.dataset.claim);if(b?.dataset.skin)buySkin(b.dataset.skin);});
function closeMenus(){document.querySelectorAll('.header-dropdown').forEach(menu=>{menu.open=false;});}
function openPreferences(){closeMenus();$('settingsDialog').showModal();}
$('settingsButton').addEventListener('click',openPreferences);
$('backupMenuButton').addEventListener('click',()=>{openPreferences();$('exportButton').focus();});
function showGuide(){closeEmpire();closeMenus();clearClickSpeed();$('gameView').hidden=true;$('guideView').hidden=false;$('howToButton').classList.toggle('active',true);$('howToButton').setAttribute('aria-current','page');$('guideTitle').focus();}
function showGame(){closeEmpire();closeMenus();$('guideView').hidden=true;$('gameView').hidden=false;$('howToButton').classList.toggle('active',false);$('howToButton').removeAttribute('aria-current');$('catButton').focus();}
$('guideMenuButton').addEventListener('click',showGuide);
$('backToGame').addEventListener('click',showGame);
$('guideStartButton').addEventListener('click',showGame);

function openEmpire(){closeMenus();if(!$('empireDialog').open)$('empireDialog').showModal();$('openEmpireButton').setAttribute('aria-expanded','true');renderShop();}
function closeEmpire(){if($('empireDialog').open)$('empireDialog').close();$('openEmpireButton').setAttribute('aria-expanded','false');}
$('openEmpireButton').addEventListener('click',openEmpire);
$('closeEmpireButton').addEventListener('click',closeEmpire);
$('empireDialog').addEventListener('close',()=>{$('openEmpireButton').setAttribute('aria-expanded','false');});
function selectMarketTab(name){showGame();tab=name;document.querySelectorAll('[data-tab]').forEach(button=>{button.classList.toggle('active',button.dataset.tab===name);button.setAttribute('aria-selected',String(button.dataset.tab===name));});openEmpire();}
$('milestonesMenuButton').addEventListener('click',()=>selectMarketTab('milestones'));
$('crewMenuButton').addEventListener('click',()=>selectMarketTab('crew'));
$('itemShopButton').addEventListener('click',()=>selectMarketTab('shop'));
$('saveNowButton').addEventListener('click',()=>{closeMenus();save();});
const menuSummaries=document.querySelectorAll('.header-dropdown summary');
menuSummaries.forEach(summary=>summary.addEventListener('click',()=>{document.querySelectorAll('.header-dropdown').forEach(menu=>{if(menu!==summary.parentElement)menu.open=false;});}));
document.addEventListener('click',event=>{if(!event.target.closest('.header-dropdown'))closeMenus();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const openMenu=document.querySelector('.header-dropdown[open]');if(openMenu){closeMenus();openMenu.querySelector('summary').focus();}}});$('howToButton').addEventListener('click',showGuide);
$('figureChoices').addEventListener('click',e=>{const b=e.target.closest('[data-figure]');if(!b||!canUseFigure(b.dataset.figure))return;state.figure=b.dataset.figure;applyFigure();save();});
$('soundToggle').addEventListener('change',e=>{state.sound=e.target.checked;playSound();save();});$('motionToggle').addEventListener('change',e=>{state.motion=e.target.checked;applyFigure();save();});
$('exportButton').addEventListener('click',()=>{if(!saveHandler){toast('Guest progress cannot be saved. Enter your name to keep a game.');return;}save();const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='clicker-co-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Save exported. Keep it somewhere cozy.');});
$('importButton').addEventListener('click',()=>$('importFile').click());$('importFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>100000)throw Error('This file is too large.');const next=validate(JSON.parse(await file.text()));if(!confirm('Replace your current progress with this save?'))return;state=next;clearClickSpeed();previous=Date.now();applyFigure();save();render(true);toast('Your cozy empire is back.');}catch(error){toast('Could not import: '+error.message);}finally{e.target.value='';}});
$('resetButton').addEventListener('click',()=>{if(!confirm('Reset ALL progress? Export a backup first if you want to keep this game.'))return;state=initial();clearClickSpeed();previous=Date.now();applyFigure();save();render(true);toast('A fresh little start.');});
let previous=Date.now();setInterval(()=>{const now=Date.now();if(!gameReady){previous=now;return;}const elapsed=Math.min(OFFLINE_CAP_SECONDS,Math.max(0,(now-previous)/1000));earn(baseRate()*elapsed);previous=now;render();},100);setInterval(save,5000);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden){clearClickSpeed();save();}});
window.ClickerGame={
  start(raw,onSave,options={}){
    skinAccess={allowedFigures:options.allowedFigures||[],ownedSkins:options.ownedSkins||[],onSkinBuy:options.onSkinBuy||null};updateShopClock(options.shop);
    state=raw?validate(raw):initial();saveHandler=onSave;gameReady=true;
    clearClickSpeed();previous=Date.now();milestonePage=0;milestoneFilter='all';readySelection=[];renderedTab=null;
    offlineGift=raw?baseRate()*Math.min(OFFLINE_CAP_SECONDS,Math.max(0,(Date.now()-state.lastSaved)/1000)):0;
    earn(offlineGift);applyFigure();render(true);
    showGame();
    if(offlineGift>=1)toast('Welcome back! Your crew earned '+fmt(Math.floor(offlineGift))+' TOCKENS.');
  },
  snapshot(){state.lastSaved=Date.now();return JSON.parse(JSON.stringify(state));},
  pause(){gameReady=false;clearClickSpeed();closeEmpire();if($('settingsDialog').open)$('settingsDialog').close();},
  validate,
  openShop(){selectMarketTab('shop');},
  updateShop(shop){updateShopClock(shop);if(gameReady&&tab==='shop'&&$('empireDialog').open)renderShop();},
  setFigure(id){state.figure=canUseFigure(id)?id:'luna';applyFigure();}
};
