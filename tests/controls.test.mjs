import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const source=await fs.readFile(new URL('../controls.js',import.meta.url),'utf8');
let active,modal=null,keydown,closed=0;
function button(x,y,{input=false,hidden=false}={}){
  return {clicks:0,matches:()=>input,getClientRects:()=>hidden?[]:[{}],closest:()=>null,
    getBoundingClientRect:()=>({left:x,top:y,width:44,height:44}),focus(){active=this;},scrollIntoView(){},click(){this.clicks++;}};
}
const left=button(0,50),right=button(100,50),above=button(100,0),invisible=button(45,50,{hidden:true}),input=button(0,100,{input:true});
const welcome={querySelectorAll:()=>[left,invisible,right,above,input]};
let previous;
const fallback={open:false,classList:{add(){},contains:()=>true},setAttribute(){},removeAttribute(){},dispatchEvent(){closed++;},
  querySelector:()=>right,querySelectorAll:selector=>selector.startsWith('form')?[]:[right,above]};
const document={get activeElement(){return active;},querySelectorAll:()=>[fallback],querySelector:selector=>selector==='dialog[open]'?modal:welcome,
  addEventListener:(type,handler)=>{if(type==='keydown')keydown=handler;}};
vm.runInContext(source,vm.createContext({document,Event:class{}}));
function press(key,extra={}){let prevented=false;keydown({key,preventDefault(){prevented=true;},...extra});return prevented;}
left.focus();assert.equal(press('ArrowRight'),true);assert.equal(active,right,'Right arrow skips hidden controls');
press('ArrowUp');assert.equal(active,above);press('ArrowLeft');assert.equal(active,left);
press('OK');assert.equal(left.clicks,1);press('Select');assert.equal(left.clicks,2);
input.focus();assert.equal(press('ArrowRight'),false);assert.equal(active,input,'Typing retains native text navigation');
left.focus();fallback.showModal();modal=fallback;assert.equal(active,right);
above.focus();press('Tab');assert.equal(active,right,'Fallback modal traps forward Tab');
press('Tab',{shiftKey:true});assert.equal(active,above,'Fallback modal traps reverse Tab');
press('GoBack');modal=null;assert.equal(fallback.open,false);assert.equal(active,left);assert.equal(closed,1);
console.log('Arrow-key / TV remote navigation, OK/Select activation, text-field navigation, modal fallback, focus trapping and Back close passed.');
