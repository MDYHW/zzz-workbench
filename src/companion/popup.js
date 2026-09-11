import { collectParty } from './collect.js';
import { readParty, convertGear } from './adapter.js';
const q = selector => document.querySelector(selector);
const collect=q('#collect'), shortcut=q('#shortcut'), result=q('#result'), output=q('#output');
const open=q('#open'), raw=q('#raw'), status=q('#status');
let destination=null;
let collected=null, selectedParty=null, edits={};
function message(text,error=false){status.textContent=text;status.classList.toggle('error',error);}
function clear(){destination=null;collected=null;selectedParty=null;edits={};result.hidden=true;output.value='';open.disabled=true;raw.open=false;raw.hidden=true;}
function renderConversion(){
  destination=null;open.disabled=true;raw.open=false;raw.hidden=true;
  const conversion=convertGear(selectedParty,collected,edits);
  const members=q('#members');members.replaceChildren();
  for(const text of conversion.errors) {
    const p=document.createElement('p');p.textContent=text;members.append(p);
  }
  const details=document.createElement('details');
  const detailLabel=document.createElement('summary');detailLabel.textContent='반영·제외 내역 확인';details.append(detailLabel);
  for(const text of [...conversion.summaries,...conversion.notices]){const p=document.createElement('p');p.textContent=text;details.append(p);}

  for(const issue of conversion.issues||[]) {
    const label=document.createElement('label');label.textContent=issue.label+' 비교용 선택';
    const select=document.createElement('select');select.setAttribute('aria-label',label.textContent);
    const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='직접 선택하세요';select.append(placeholder);
    for(const option of issue.options){const el=document.createElement('option');el.value=option.id;el.textContent=option.label;select.append(el);}
    select.addEventListener('change',()=>{if(select.value){edits[issue.agentId]={...edits[issue.agentId],[issue.key]:select.value};renderConversion();}});
    label.append(select);members.append(label);
  }
  members.append(details);
  if(Object.keys(edits).length){const reset=document.createElement('button');reset.textContent='비교용 변경 취소';reset.type='button';reset.onclick=()=>{edits={};renderConversion();};members.append(reset);}
  result.hidden=false;destination=conversion.url;
  q('#summary').textContent=destination?(Object.keys(edits).length?'비교용 변경을 포함한 세팅':'파티 3명 변환 완료'):(conversion.issues?.length?'비교용 선택이 필요합니다':'현재 구성은 변환할 수 없습니다');
  if(destination){output.value=destination;open.disabled=false;message('세팅을 열 수 있습니다. 반영·제외 내역은 아래에서 확인하세요.');}
  else {output.value=JSON.stringify(collected,null,2);raw.hidden=false;message('자동으로 반영할 수 없는 항목이 있습니다. 아래 사유를 확인하세요.',true);}
}
function partyLabel(party){return party.targets.map(t=>t.names[0]+(t.workbenchId===party.focusAgentId?' (주력)':'')).join(' · ');}
shortcut.addEventListener('input',()=>{
  clear();
  try {q('#party').textContent=partyLabel(readParty(shortcut.value));collect.disabled=false;message('파티를 확인하고 HoYoLAB 전적에서 장비를 읽으세요.');}
  catch(error){q('#party').textContent='파티와 주력을 먼저 선택해 주세요.';collect.disabled=true;message(error.message,true);}
});
collect.addEventListener('click',async()=>{
  clear();collect.disabled=true;shortcut.disabled=true;
  message('파티 세 명의 장비를 읽고 있습니다. 팝업을 열어 두세요.');
  try {
    const party=readParty(shortcut.value);
    if(!globalThis.chrome?.scripting)throw Error('확장 기능으로 설치한 뒤 실행하세요.');
    const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(!tab?.id||!tab.url)throw Error('현재 전적 탭을 확인할 수 없습니다.');
    const url=new URL(tab.url);
    if(url.origin!=='https://act.hoyolab.com'||url.pathname!=='/app/zzz-game-record/index.html')throw Error('공식 HoYoLAB 전적 화면에서 실행하세요.');
    const [injection]=await chrome.scripting.executeScript({target:{tabId:tab.id},func:collectParty,args:[party.targets],world:'ISOLATED'});
    if(!injection?.result?.ok)throw Error(injection?.result?.error||'장비 수집에 실패했습니다.');
    selectedParty=party;collected=injection.result.data;renderConversion();
  }catch(error){message(error.message||'장비 수집에 실패했습니다.',true);}
  finally{shortcut.disabled=false;try{readParty(shortcut.value);collect.disabled=false;}catch{collect.disabled=true;}}
});
open.addEventListener('click',async()=>{
  if(!destination)return;
  const requestedDestination=destination;
  try{await chrome.tabs.create({url:requestedDestination});}
  catch{
    if(destination!==requestedDestination)return;
    raw.hidden=false;raw.open=true;output.value=requestedDestination;output.focus();output.select();
    message('탭을 열지 못했습니다. 선택된 주소를 복사해 브라우저 주소창에서 열어 주세요.',true);
  }
});

