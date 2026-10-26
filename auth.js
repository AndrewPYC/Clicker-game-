'use strict';
(function(){
  const el=id=>document.getElementById(id),game=window.ClickerGame,model=globalThis.ClickerModel;
  const prefix='clicker-co-profile-v1:',lastKey='clicker-co-last-profile-v1';
  let profile=null,stored=null,key=null,blocked=false,mode='create';
  const status=text=>{el('saveStatus').textContent=text;};
  function issue(text){el('sessionIssue').hidden=false;el('sessionIssueText').textContent=text;}
  function read(name){
    const text=localStorage.getItem(prefix+name.toLowerCase());
    if(!text)return null;
    const data=JSON.parse(text);
    if(data.version!==1||typeof data.name!=='string'||!Array.isArray(data.ownedSkins))throw Error('This profile could not be read. Import a backup after choosing a different name.');
    data.save=game.validate(data.save);
    data.ownedSkins=data.ownedSkins.filter(id=>model.allShopSkins.some(s=>s.id===id));
    return {data,text};
  }
  function write(next){
    if(blocked)return false;
    try{
      if(localStorage.getItem(key)!==stored){blocked=true;game.pause();throw Error('This profile changed in another tab. Reload this page to continue with its latest save.');}
      const text=JSON.stringify(next);localStorage.setItem(key,text);stored=text;profile=next;
      status('Saved on this device');el('sessionIssue').hidden=true;return true;
    }catch(error){status('Progress not saved');issue(error.message+' Export a backup in Settings to keep your progress.');return false;}
  }
  function persist(save){return profile?write({...profile,save}):false;}
  const options=()=>({allowedFigures:[],ownedSkins:profile?.ownedSkins||[],onSkinBuy:profile?purchaseSkin:null});
  function openGame(data){
    profile=data;blocked=false;
    game.start(data?.save||null,data?persist:null,options());
    el('authView').hidden=true;el('appShell').hidden=false;
    el('accountLabel').textContent=data?'Playing as '+data.name:'Guest game';
    el('accountButton').textContent=data?'Switch player':'Leave guest';
    status(data?'Saved on this device':'Guest · progress will not be saved');
    for(const id of ['exportButton','importButton','saveNowButton','legacyImportButton'])el(id).disabled=!data;
    el('saveExplanation').textContent=data?'Progress and purchased skins are saved in this browser on this device. Clearing site data removes them. Export backups to keep your progress or move it to another device. Names are local profiles, with no password.':'Guest progress disappears when you leave or reload. Enter your name on the welcome screen to save future games.';
    el('sessionIssue').hidden=true;el('catButton').focus();
    if(data)persist(game.snapshot());
  }
  function enter(name,action='resume'){
    name=name.trim();
    if(!/^[\p{L}\p{N} _-]{1,24}$/u.test(name))throw Error('Use 1–24 letters, numbers, spaces, underscores or hyphens for your name.');
    key=prefix+name.toLowerCase();
    const found=read(name);
    if(action==='create'&&found)throw Error('That player already exists on this device. Choose Returning player to continue.');
    if(action==='resume'&&!found)throw Error('No saved player with that name on this browser. Choose Create player to start a new game.');
    stored=found?.text||null;
    const data=found?.data||{version:1,name,ownedSkins:[],save:model.initial()};
    blocked=false;
    if(!write(data))throw Error('Cannot save in this browser. Enable site storage or play as a guest.');
    try{localStorage.setItem(lastKey,data.name);}catch{}
    openGame(data);
  }
  function purchaseSkin(id){
    if(!profile||blocked)return;
    const offer=model.weeklyShop(Date.now()).offers.find(s=>s.id===id),save=game.snapshot();
    if(!offer||profile.ownedSkins.includes(id)||save.balance<offer.cost)return;
    const next={...profile,ownedSkins:[...profile.ownedSkins,id],save:{...save,balance:save.balance-offer.cost,figure:id}};
    if(write(next)){game.start(next.save,persist,options());game.openShop();}
  }
  function choices(){
    el('authChoices').hidden=false;el('authForm').hidden=true;el('authError').textContent='';
    el('authTitle').textContent='Your little empire starts here';
    try{const name=localStorage.getItem(lastKey);el('continueAccountButton').hidden=!name;if(name)el('continueAccountButton').textContent='Continue as '+name;}catch{el('continueAccountButton').hidden=true;}
  }
  el('guestButton').addEventListener('click',()=>openGame(null));
  function showForm(next){
    mode=next;el('authChoices').hidden=true;el('authForm').hidden=false;el('authError').textContent='';
    el('authTitle').textContent=mode==='create'?'Create your player':'Welcome back';
    el('authSubmit').textContent=mode==='create'?'Create player & play':'Resume game';
    el('usernameHelp').textContent=mode==='create'?'Choose a new name (1-24 letters, numbers, spaces, underscores or hyphens). Saves stay on this browser. No password needed.':'Enter your existing player name to resume the save on this browser. No password needed.';
    el('username').value='';el('username').focus();
  }
  el('createUserButton').addEventListener('click',()=>showForm('create'));
  el('signInButton').addEventListener('click',()=>showForm('resume'));
  el('authBack').addEventListener('click',choices);
  el('authForm').addEventListener('submit',event=>{
    event.preventDefault();el('authError').textContent='';try{enter(el('username').value,mode);}catch(error){el('authError').textContent=error.message;}
  });
  el('continueAccountButton').addEventListener('click',()=>{try{enter(localStorage.getItem(lastKey)||'');}catch(error){el('authError').textContent=error.message;}});
  el('accountButton').addEventListener('click',()=>{
    if(!profile&&!confirm('Leave this guest game? Guest progress will be lost.'))return;
    if(profile&&!persist(game.snapshot())&&!confirm('Your latest progress could not be saved. Leave anyway?'))return;
    game.pause();profile=null;el('appShell').hidden=true;el('authView').hidden=false;choices();
  });
  el('retrySaveButton').addEventListener('click',()=>{if(profile&&!blocked)persist(game.snapshot());});
  el('legacyImportButton').addEventListener('click',()=>{
    if(!profile||blocked)return;
    try{
      const text=localStorage.getItem('clicker-co-save-v2')||localStorage.getItem('mooncat-save-v1');
      if(!text)throw Error('No older browser save was found.');
      const save=game.validate(JSON.parse(text));
      if(confirm('Replace this player’s progress with the older browser save?')&&persist(save))game.start(save,persist,options());
    }catch(error){issue(error.message);}
  });
  choices();
})();
