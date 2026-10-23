'use strict';
(function(){
  // Basic modal support for TV browsers without HTMLDialogElement.showModal.
  document.querySelectorAll('dialog').forEach(dialog=>{
    if(typeof dialog.showModal==='function')return;
    dialog.classList.add('fallback-dialog');
    dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
    let previousFocus;
    dialog.showModal=()=>{previousFocus=document.activeElement;dialog.setAttribute('open','');dialog.open=true;dialog.querySelector('button,input')?.focus();};
    dialog.close=()=>{dialog.removeAttribute('open');dialog.open=false;dialog.dispatchEvent(new Event('close'));previousFocus?.focus();};
    dialog.querySelectorAll('form[method="dialog"]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();dialog.close();}));
  });
  function focusable(scope){
    return Array.from(scope.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),summary,[tabindex="0"]'))
      .filter(node=>node.getClientRects().length>0&&!node.closest('[hidden]'));
  }
  document.addEventListener('keydown',event=>{
    const key=event.key&&event.key!=='Unidentified'?event.key:({37:'ArrowLeft',38:'ArrowUp',39:'ArrowRight',40:'ArrowDown',13:'Select',27:'Escape'})[event.keyCode];
    const active=document.activeElement;
    if(active?.matches('input,textarea,select,[contenteditable="true"]'))return;
    const modal=document.querySelector('dialog[open]');
    if(['Escape','GoBack','BrowserBack','Back'].includes(key)&&modal){event.preventDefault();modal.close();return;}
    const scope=modal||document.querySelector('#authView:not([hidden])')||document.querySelector('#appShell');
    if(!scope)return;
    const nodes=focusable(scope);
    if(key==='Tab'&&modal?.classList.contains('fallback-dialog')){
      if(event.shiftKey&&active===nodes[0]){event.preventDefault();nodes[nodes.length-1]?.focus();}
      else if(!event.shiftKey&&active===nodes[nodes.length-1]){event.preventDefault();nodes[0]?.focus();}
      return;
    }
    if(key==='Select'||key==='OK'){event.preventDefault();active?.click();return;}
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key))return;
    event.preventDefault();
    if(!nodes.includes(active)){nodes[0]?.focus();return;}
    const rect=active.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    const horizontal=key==='ArrowLeft'||key==='ArrowRight',positive=key==='ArrowRight'||key==='ArrowDown';
    let best=null,score=Infinity;
    for(const node of nodes){
      if(node===active)continue;
      const next=node.getBoundingClientRect(),dx=next.left+next.width/2-x,dy=next.top+next.height/2-y;
      const forward=(horizontal?dx:dy)*(positive?1:-1),side=Math.abs(horizontal?dy:dx);
      if(forward<=1)continue;
      const distance=forward+side*3;
      if(distance<score){best=node;score=distance;}
    }
    if(best){best.focus();best.scrollIntoView({block:'nearest',inline:'nearest'});}
  });
})();
