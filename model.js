'use strict';
(function(){
const figures = [
  {id:'luna',name:'Luna',title:'Luna, the mooncat',src:'assets/cat.svg',alt:'Luna, a flat blue-gray vector cat'},
  {id:'dog',name:'Biscuit',title:'Biscuit, the stargazing pup',src:'assets/dog.svg',alt:'Biscuit, a flat golden vector dog'},
  {id:'panda',name:'Bamboo',title:'Bamboo, the sleepy panda',src:'assets/panda.svg',alt:'Bamboo, a flat black-and-white vector panda'},
  {id:'monkey',name:'Mango',title:'Mango, the playful monkey',src:'assets/monkey.svg',alt:'Mango, a flat brown vector monkey'},
  {id:'mark',name:'Mark',title:'Mark',src:'assets/mark.png',alt:'Mark, a curly-haired cartoon character in a blue hoodie'},
  {id:'pavly',name:'Pavly',title:'Pavly',src:'assets/pavly.png',alt:'Pavly, a curly-haired cartoon character in a Nike hoodie'},
  {id:'john',name:'John',title:'John',src:'assets/john.png',alt:'John, a curly-haired cartoon character in a light-colored top'},
  {id:'emmanuel',name:'Emmanuel',title:'Emmanuel',src:'assets/emmanuel.png',alt:'Emmanuel, a smiling curly-haired cartoon boy in a green zip hoodie'}
];
const restrictedFigures=[];
const portraitSkins=figures.filter(f=>['mark','pavly','john','emmanuel'].includes(f.id));
for(const skin of portraitSkins){skin.shop=true;skin.cost=2500;}
for(const figure of figures)figure.restricted=restrictedFigures.includes(figure.id);
const legacySkins=[{"id":"cat-starlight","name":"Starlight Luna","title":"Starlight Luna","src":"assets/cat-starlight.svg","alt":"Starlight Luna, a flat vector companion skin","cost":1500,"shop":true},{"id":"dog-sunset","name":"Sunset Biscuit","title":"Sunset Biscuit","src":"assets/dog-sunset.svg","alt":"Sunset Biscuit, a flat vector companion skin","cost":2000,"shop":true},{"id":"panda-moon","name":"Moonlit Bamboo","title":"Moonlit Bamboo","src":"assets/panda-moon.svg","alt":"Moonlit Bamboo, a flat vector companion skin","cost":2500,"shop":true},{"id":"monkey-cocoa","name":"Cocoa Mango","title":"Cocoa Mango","src":"assets/monkey-cocoa.svg","alt":"Cocoa Mango, a flat vector companion skin","cost":1500,"shop":true},{"id":"cat-rose","name":"Rose Luna","title":"Rose Luna","src":"assets/cat-rose.svg","alt":"Rose Luna, a flat vector companion skin","cost":2000,"shop":true},{"id":"dog-frost","name":"Frost Biscuit","title":"Frost Biscuit","src":"assets/dog-frost.svg","alt":"Frost Biscuit, a flat vector companion skin","cost":2500,"shop":true},{"id":"panda-plum","name":"Plum Bamboo","title":"Plum Bamboo","src":"assets/panda-plum.svg","alt":"Plum Bamboo, a flat vector companion skin","cost":1500,"shop":true},{"id":"monkey-gold","name":"Golden Mango","title":"Golden Mango","src":"assets/monkey-gold.svg","alt":"Golden Mango, a flat vector companion skin","cost":2000,"shop":true},{"id":"cat-midnight","name":"Midnight Luna","title":"Midnight Luna","src":"assets/cat-midnight.svg","alt":"Midnight Luna, a flat vector companion skin","cost":2500,"shop":true}];
const skins=[{"id":"shop-fox","name":"Ember the fox","title":"Ember the fox","src":"assets/shop-fox.svg","alt":"Ember the fox, a flat 2D cartoon skin","species":"fox","cost":1500,"shop":true},{"id":"shop-rabbit","name":"Clover the rabbit","title":"Clover the rabbit","src":"assets/shop-rabbit.svg","alt":"Clover the rabbit, a flat 2D cartoon skin","species":"rabbit","cost":2000,"shop":true},{"id":"shop-frog","name":"Puddle the frog","title":"Puddle the frog","src":"assets/shop-frog.svg","alt":"Puddle the frog, a flat 2D cartoon skin","species":"frog","cost":2500,"shop":true},{"id":"shop-penguin","name":"Pip the penguin","title":"Pip the penguin","src":"assets/shop-penguin.svg","alt":"Pip the penguin, a flat 2D cartoon skin","species":"penguin","cost":1500,"shop":true},{"id":"shop-koala","name":"Kiki the koala","title":"Kiki the koala","src":"assets/shop-koala.svg","alt":"Kiki the koala, a flat 2D cartoon skin","species":"koala","cost":2000,"shop":true},{"id":"shop-red-panda","name":"Maple the red panda","title":"Maple the red panda","src":"assets/shop-red-panda.svg","alt":"Maple the red panda, a flat 2D cartoon skin","species":"red panda","cost":2500,"shop":true},{"id":"shop-otter","name":"Ripple the otter","title":"Ripple the otter","src":"assets/shop-otter.svg","alt":"Ripple the otter, a flat 2D cartoon skin","species":"otter","cost":1500,"shop":true},{"id":"shop-mario","name":"Mario","title":"Mario","src":"assets/shop-mario.svg","alt":"Mario, a flat 2D cartoon skin","species":"character","cost":2000,"shop":true},{"id":"shop-spiderman","name":"Spider-Man","title":"Spider-Man","src":"assets/shop-spiderman.svg","alt":"Spider-Man, a flat 2D cartoon skin","species":"character","cost":2500,"shop":true}];
const allShopSkins=[...legacySkins,...skins,...portraitSkins];
figures.push(...legacySkins,...skins);
const WEEK_MS=7*24*60*60*1000,SHOP_EPOCH=Date.UTC(2026,0,5);
function weeklyShop(now=Date.now()){
  const week=Math.floor((now-SHOP_EPOCH)/WEEK_MS),group=((week%3)+3)%3;
  return {week,serverTime:now,refreshAt:SHOP_EPOCH+(week+1)*WEEK_MS,offers:[...skins.slice(group*3,group*3+3),...portraitSkins]};
}
const OFFLINE_CAP_SECONDS=5*60*60;
const retiredFigures = ['fox','bunny','frog','penguin'];
const upgrades = [
  {id:'paws',name:'Velvet paws',description:'A softer workspace for your night crew.',effect:'+1% click and crew output per purchase',icon:'✋',cost:25,crewBoost:.01},
  {id:'collar',name:'Moonbeam collar',description:'Keep your crew glowing through the night.',effect:'+5% click and crew output per purchase',icon:'☾',cost:50,crewBoost:.05},
  {id:'treats',name:'Midnight treats',description:'The secret ingredient is a happy cat.',effect:'+7.5% click and crew output per purchase',icon:'♧',cost:100,crewBoost:.075},
  {id:'crown',name:'Crown of the cosmos',description:'For the ruler of your tiny universe.',effect:'+10% click and crew output per purchase',icon:'♛',cost:200,crewBoost:.1}
];
const clickUpgrades = [
  {id:'click-spark',name:'Click spark',description:'A little extra power in every manual click.',effect:'+1 TOCKEN per click per purchase',icon:'✦',cost:100,clickAdd:1},
  {id:'click-surge',name:'Click surge',description:'Turn your rhythm into bigger apple payouts.',effect:'+5 TOCKENS per click per purchase',icon:'↟',cost:500,clickAdd:5},
  {id:'click-nova',name:'Click nova',description:'A powerful boost for a long-term clicker.',effect:'+25 TOCKENS per click per purchase',icon:'✧',cost:2500,clickAdd:25}
];
const crew = [
  {id:'friend',name:'Sleepy sidekick',description:'A friend to keep the TOCKENS coming.',effect:'+1 TOCKEN per second',icon:'☕',cost:60,rate:1},
  {id:'baker',name:'Moonlight baker',description:'Kneading dough while the city sleeps.',effect:'+10 TOCKENS per second',icon:'♨',cost:350,rate:10},
  {id:'courier',name:'Starlight courier',description:'Special deliveries from the Milky Way.',effect:'+50 automatic clicks per second',icon:'✧',cost:1800,rate:0,autoClicks:50},
  {id:'orchestra',name:'Purr orchestra',description:'The whole neighborhood joins the chorus.',effect:'+100 automatic clicks per second',icon:'♫',cost:9000,rate:0,autoClicks:100}
];
const milestones = [
  {id:'first',name:'A friendship begins',description:'Give 100 head pats.',target:100,kind:'clicks',reward:100,icon:'♡'},
  {id:'hundred',name:'Certified cat person',description:'Give 1,000 head pats.',target:1000,kind:'clicks',reward:500,icon:'✋'},
  {id:'thousand',name:'A pocket full of moonlight',description:'Earn 10,000 lifetime TOCKENS.',target:10000,kind:'lifetime',reward:300,icon:'☾'},
  {id:'crew',name:'Better together',description:'Hire 25 night crew members.',target:25,kind:'crew',reward:500,icon:'☕'},
  {id:'level',name:'Written in the stars',description:'Reach level 15.',target:15,kind:'level',reward:1500,icon:'✦'},
  {id:'empire',name:'The coziest empire',description:'Earn 1,000,000 lifetime TOCKENS.',target:1000000,kind:'lifetime',reward:10000,icon:'♛'},
  {"id":"clicks-5000","name":"A familiar rhythm","description":"Give 5,000 head pats.","target":5000,"kind":"clicks","reward":1500,"icon":"♡"},
  {"id":"clicks-10000","name":"Ten thousand hellos","description":"Give 10,000 head pats.","target":10000,"kind":"clicks","reward":3000,"icon":"♡"},
  {"id":"clicks-25000","name":"Unbreakable friendship","description":"Give 25,000 head pats.","target":25000,"kind":"clicks","reward":7500,"icon":"♡"},
  {"id":"clicks-50000","name":"After-hours legend","description":"Give 50,000 head pats.","target":50000,"kind":"clicks","reward":15000,"icon":"♡"},
  {"id":"clicks-100000","name":"An old friend","description":"Give 100,000 head pats.","target":100000,"kind":"clicks","reward":35000,"icon":"♡"},
  {"id":"clicks-250000","name":"The long night","description":"Give 250,000 head pats.","target":250000,"kind":"clicks","reward":100000,"icon":"♡"},
  {"id":"clicks-1000000","name":"A lasting friendship","description":"Give 1,000,000 head pats.","target":1000000,"kind":"clicks","reward":500000,"icon":"♡"},
  {"id":"earned-100000","name":"Orchard keeper","description":"Earn 100,000 lifetime TOCKENS.","target":100000,"kind":"lifetime","reward":5000,"icon":"♛"},
  {"id":"earned-10000000","name":"The midnight treasury","description":"Earn 10,000,000 lifetime TOCKENS.","target":10000000,"kind":"lifetime","reward":100000,"icon":"♛"},
  {"id":"earned-100000000","name":"Apple magnate","description":"Earn 100,000,000 lifetime TOCKENS.","target":100000000,"kind":"lifetime","reward":1000000,"icon":"♛"},
  {"id":"earned-1000000000","name":"A world of little dreams","description":"Earn 1,000,000,000 lifetime TOCKENS.","target":1000000000,"kind":"lifetime","reward":10000000,"icon":"♛"},
  {"id":"crew-50","name":"Full house","description":"Hire 50 total crew members.","target":50,"kind":"crew","reward":5000,"icon":"☕"},
  {"id":"crew-100","name":"Neighborhood night shift","description":"Hire 100 total crew members.","target":100,"kind":"crew","reward":20000,"icon":"☕"},
  {"id":"crew-250","name":"A city of companions","description":"Hire 250 total crew members.","target":250,"kind":"crew","reward":100000,"icon":"☕"},
  {"id":"crew-500","name":"The never-sleeping crew","description":"Hire 500 total crew members.","target":500,"kind":"crew","reward":500000,"icon":"☕"},
  {"id":"upgrades-25","name":"Tools of the trade","description":"Buy 25 total crew boosts.","target":25,"kind":"upgrades","reward":1500,"icon":"✦"},
  {"id":"upgrades-100","name":"Perfectly equipped","description":"Buy 100 total crew boosts.","target":100,"kind":"upgrades","reward":15000,"icon":"✦"},
  {"id":"upgrades-250","name":"Midnight workshop","description":"Buy 250 total crew boosts.","target":250,"kind":"upgrades","reward":75000,"icon":"✦"},
  {"id":"upgrades-500","name":"Cosmic craftsmanship","description":"Buy 500 total crew boosts.","target":500,"kind":"upgrades","reward":300000,"icon":"✦"},
  {"id":"level-25","name":"Beyond the rooftops","description":"Reach level 25.","target":25,"kind":"level","reward":10000,"icon":"☾"},
  {"id":"level-50","name":"Among the constellations","description":"Reach level 50.","target":50,"kind":"level","reward":50000,"icon":"☾"},
  {"id":"level-100","name":"Keeper of the cosmos","description":"Reach level 100.","target":100,"kind":"level","reward":250000,"icon":"☾"},
  {"id":"rate-1000","name":"The night engine","description":"Produce 1,000 TOCKENS per second.","target":1000,"kind":"rate","reward":10000,"icon":"⌁"},
  {"id":"rate-10000","name":"An orchard a second","description":"Produce 10,000 TOCKENS per second.","target":10000,"kind":"rate","reward":100000,"icon":"⌁"},
  {"id":"rate-100000","name":"Limitless night shift","description":"Produce 100,000 TOCKENS per second.","target":100000,"kind":"rate","reward":1000000,"icon":"⌁"}
];
// Original thresholds and all claimed IDs remain intact.
function milestoneDescription(kind,target){
  const n=target.toLocaleString('en-US');
  return {clicks:'Give '+n+' head pats.',lifetime:'Earn '+n+' lifetime TOCKENS.',crew:'Hire '+n+' total crew members.',upgrades:'Buy '+n+' total crew boosts.',level:'Reach level '+n+'.',rate:'Produce '+n+' TOCKENS per second.'}[kind];
}
// Spread chapters over a long campaign, with unique increasing targets per track.
const tracks=[
  {kind:'clicks',name:'Friendly rhythm',start:250,end:10000000},
  {kind:'lifetime',name:'Apple collector',start:25000,end:1e15},
  {kind:'crew',name:'Growing together',start:10,end:600},
  {kind:'upgrades',name:'A little improvement',start:10,end:600},
  {kind:'level',name:'Friendship journey',start:5,end:500},
  {kind:'rate',name:'Night shift rhythm',start:100,end:10000000}
];
const chapterCount=1000-milestones.length;
const previousTargets=new Map();
for(let n=0;n<chapterCount;n++){
  const trackIndex=n%tracks.length,track=tracks[trackIndex],chapter=Math.floor(n/tracks.length)+1;
  const count=Math.ceil((chapterCount-trackIndex)/tracks.length),progress=(chapter-1)/(count-1);
  const geometric=Math.round(track.start*(track.end/track.start)**progress);
  // Integer goals never repeat or run past the final target.
  const target=Math.min(track.end-(count-chapter),Math.max(geometric,(previousTargets.get(track.kind)||0)+1));
  previousTargets.set(track.kind,target);
  const reward=Math.ceil(track.kind==='lifetime'?target*.005:track.kind==='clicks'?target*.25:
    track.kind==='rate'?target*30:track.kind==='level'?500*chapter**1.5:500*chapter**2);
  milestones.push({id:'chapter-'+track.kind+'-'+chapter,name:track.name+' '+chapter,
    description:milestoneDescription(track.kind,target),kind:track.kind,target,reward,icon:'✦'});
}

const initial = () => ({version:2,balance:0,lifetime:0,clicks:0,owned:{},figure:'luna',claimed:[],quest:0,sound:false,motion:typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches,lastSaved:Date.now()});
function validate(raw){
  if(!raw || ![1,2].includes(raw.version)) throw Error('This is not a CLICKER CO save.');
  const s=initial();
  for(const key of ['balance','lifetime','clicks','quest','lastSaved']){
    if(typeof raw[key]!=='number'||!Number.isFinite(raw[key])||raw[key]<0||raw[key]>1e100)throw Error('Invalid save values.');
    s[key]=raw[key];
  }
  if(!Number.isSafeInteger(s.clicks)||!Number.isSafeInteger(s.quest)||s.quest>1000000||s.balance>s.lifetime)throw Error('Invalid progress.');
  if(!figures.some(f=>f.id===raw.figure)&&!retiredFigures.includes(raw.figure))throw Error('Unknown companion.');
  s.figure=retiredFigures.includes(raw.figure)?'luna':raw.figure;s.sound=raw.sound===true;s.motion=raw.motion===true;
  if(!Array.isArray(raw.claimed)||!raw.claimed.every(id=>milestones.some(m=>m.id===id)))throw Error('Invalid milestones.');
  s.claimed=[...new Set(raw.claimed)];
  for(const item of [...upgrades,...clickUpgrades,...crew]){const n=raw.owned?.[item.id]??0;if(!Number.isInteger(n)||n<0||n>1000)throw Error('Invalid upgrade.');s.owned[item.id]=n;}
  return s;
}

globalThis.ClickerModel={figures,restrictedFigures,skins,allShopSkins,weeklyShop,OFFLINE_CAP_SECONDS,retiredFigures,upgrades,clickUpgrades,crew,milestones,initial,validate};
})();
