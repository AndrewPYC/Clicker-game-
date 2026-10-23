'use strict';
(function(){
  const el=id=>document.getElementById(id), game=window.ClickerGame;
  let mode='login',account=null,pending=null,saving=null,blocked=false,leaving=false;
  const status=text=>{el('saveStatus').textContent=text;};
  const sessionOptions=()=>({allowedFigures:account?.allowedFigures||[],ownedSkins:account?.ownedSkins||[],shop:account?.shop,onSkinBuy:account?purchaseSkin:null});
  async function api(route,body,csrf){
    if(location.protocol==='file:')throw Error('Accounts need the game server. Start it with npm start, then open http://localhost:8000. You can play as a guest here.');
    const response=await fetch('/api/'+route,{
      method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',keepalive:body!==undefined,
      headers:body===undefined?{}:{'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{})},
      ...(body===undefined?{}:{body:JSON.stringify(body)})
    });
    const data=await response.json().catch(()=>({error:'The account server is unavailable. Try again.'}));
    if(!response.ok)throw Object.assign(new Error(data.error||'Request failed.'),{status:response.status});
    return data;
  }
  function issue(message){el('sessionIssue').hidden=false;el('sessionIssueText').textContent=message;el('retrySaveButton').textContent=blocked?'Return to sign in':'Retry save';}
  async function persist(snapshot){
    if(!account||blocked)return false;
    pending=snapshot;
    if(saving)return saving;
    status('Saving…');
    saving=(async()=>{
      while(pending){
        const next=pending;pending=null;
        try{
          const result=await api('save',{save:next,revision:account.revision},account.csrf);
          account.revision=result.revision;
          if(result.figure&&result.figure!==next.figure)game.setFigure?.(result.figure);
        }catch(error){
          pending=pending||next;
          blocked=[401,403,409].includes(error.status);
          status('Progress not saved');
          issue(error.message+(blocked?' Export a backup before signing in again.':' Your game is still here. Autosave will retry when connected.'));
          if(blocked)game.pause();
          return false;
        }
      }
      status('Progress saved to your account');
      el('sessionIssue').hidden=true;
      return true;
    })();
    try{return await saving;}finally{saving=null;}
  }
  function showChoices(){
    el('authChoices').hidden=false;el('authForm').hidden=true;el('authError').textContent='';
    el('authTitle').textContent='Your little empire starts here';
  }
  function showForm(next){
    mode=next;el('authChoices').hidden=true;el('authForm').hidden=false;el('authError').textContent='';
    el('authTitle').textContent=mode==='register'?'Create your account':'Welcome back';
    el('authSubmit').textContent=mode==='register'?'Create account & play':'Sign in & play';
    el('confirmPasswordRow').hidden=mode!=='register';
    el('confirmPassword').required=mode==='register';
    el('password').autocomplete=mode==='register'?'new-password':'current-password';
    el('password').value='';el('confirmPassword').value='';el('username').focus();
  }
  function openGame(data){
    // Validate before revealing the game or adopting the server session.
    const raw=data?.save?game.validate(data.save):null;
    account=data;pending=null;blocked=false;leaving=false;
    game.start(raw,account?persist:null,sessionOptions());
    el('authView').hidden=true;el('appShell').hidden=false;
    el('accountLabel').textContent=account?'Playing as '+account.username:'Guest game';
    status(account?'Progress saved to your account':'Guest · progress will not be saved');
    el('accountButton').textContent=account?'Sign out':'Leave guest';
    for(const id of ['exportButton','importButton','saveNowButton','legacyImportButton'])el(id).disabled=!account;
    el('saveExplanation').textContent=account?'Your progress autosaves to this account. Sign in on another device at this same website to continue.':'Guest progress disappears when you leave or reload. Choose an account on the welcome screen to keep future games.';
    el('sessionIssue').hidden=true;
    el('password').value='';el('confirmPassword').value='';
    el('catButton').focus();
    if(account&&!raw)persist(game.snapshot());
  }
  let buyingSkin=false;
  async function purchaseSkin(id){
    if(!account||buyingSkin||blocked)return;
    buyingSkin=true;
    el('appShell').inert=true;el('accountButton').disabled=true;
    const snapshot=game.snapshot();game.pause();
    try{
      if(!await persist(snapshot)){
        if(!blocked)game.start(snapshot,persist,sessionOptions());
        return;
      }
      status('Buying skin…');
      const data=await api('shop/buy',{id,revision:account.revision},account.csrf);
      openGame(data);game.openShop();
    }catch(error){
      blocked=[401,403,409].includes(error.status);
      if(!blocked)game.start(snapshot,persist,sessionOptions());
      issue(error.message);
    }finally{buyingSkin=false;el('appShell').inert=false;el('accountButton').disabled=false;}
  }
  function busy(value){
    el('authView').setAttribute('aria-busy',String(value));
    document.querySelectorAll('#authView button, #authView input').forEach(control=>{control.disabled=value;});
  }
  el('guestButton').addEventListener('click',()=>openGame(null));
  el('createUserButton').addEventListener('click',()=>showForm('register'));
  el('signInButton').addEventListener('click',()=>showForm('login'));
  el('authBack').addEventListener('click',showChoices);
  el('continueAccountButton').addEventListener('click',async()=>{
    busy(true);el('authError').textContent='';
    try{openGame(await api('session'));}catch(error){el('authError').textContent=error.message;el('continueAccountButton').hidden=true;}
    finally{busy(false);}
  });
  el('authForm').addEventListener('submit',async event=>{
    event.preventDefault();el('authError').textContent='';
    const username=el('username').value.trim(),password=el('password').value;
    if(!/^[A-Za-z0-9_-]{3,24}$/.test(username)){el('authError').textContent='Use 3–24 letters, numbers, underscores or hyphens for your username.';return;}
    if(mode==='register'&&(!password||[...password].length!==8||/\s/u.test(password)||!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!(/[^A-Za-z0-9\s]/u.test(password)))){
      el('authError').textContent='Use exactly 8 characters, no spaces, with an uppercase letter, a lowercase letter and a special character.';return;
    }
    if(mode==='register'&&password!==el('confirmPassword').value){el('authError').textContent='Your passwords do not match.';return;}
    busy(true);
    try{openGame(await api(mode==='register'?'register':'login',{username,password}));}
    catch(error){el('authError').textContent=error.message;}
    finally{busy(false);}
  });
  async function leave(){
    if(leaving||buyingSkin)return;
    if(!account&&!confirm('Leave this guest game? Guest progress will be lost.'))return;
    leaving=true;el('accountButton').disabled=true;
    const snapshot=game.snapshot();game.pause();
    try{
      if(account){
        const saved=await persist(snapshot);
        if(!saved&&!confirm('Your latest progress could not be saved. Leave anyway? Cancel to keep this game and export a backup.')){
          if(!blocked)game.start(snapshot,persist,sessionOptions());return;
        }
        try{await api('logout',{},account.csrf);}catch(error){if(![401,403].includes(error.status))throw error;}
      }
      account=null;pending=null;
      el('appShell').hidden=true;el('authView').hidden=false;el('continueAccountButton').hidden=true;
      showChoices();el('signInButton').focus();
    }catch(error){issue(error.message);if(!blocked)game.start(snapshot,account?persist:null,sessionOptions());}
    finally{leaving=false;el('accountButton').disabled=false;}
  }
  el('accountButton').addEventListener('click',leave);
  el('retrySaveButton').addEventListener('click',()=>{if(blocked){leave();}else if(account)persist(game.snapshot());});
  el('legacyImportButton').addEventListener('click',async()=>{
    if(!account)return;
    try{
      const text=localStorage.getItem('clicker-co-save-v2')||localStorage.getItem('mooncat-save-v1');
      if(!text){issue('There is no older browser save here. You can import an exported backup in Settings.');return;}
      const raw=game.validate(JSON.parse(text));
      if(!confirm('Replace this account’s current progress with the older save from this browser?'))return;
      game.start(raw,persist,sessionOptions());await persist(game.snapshot());
    }catch(error){issue('Could not bring over the old save: '+error.message);}
  });
  // Welcome choices always appear first, even when a valid session exists.
  showChoices();
  if(location.protocol!=='file:')api('session').then(data=>{
    if(!el('authView').hidden){el('continueAccountButton').textContent='Continue as '+data.username;el('continueAccountButton').hidden=false;}
  }).catch(()=>{});
  if(typeof setInterval==='function')setInterval(()=>{
    if(location.protocol!=='file:')api('shop').then(shop=>{if(account)account.shop=shop;game.updateShop?.(shop);}).catch(()=>{});
  },60000);
})();
