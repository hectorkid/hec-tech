/* HEC Tech free "Use My AI" flow. No paid AI API: Android shares the photo/prompt to an installed AI app. */
(function(){
const el=id=>document.getElementById(id);
const TEMP_PHOTO='hec-ai-temp-photo-v1';
const PROMPT='Identify this physical item from the attached photo for my HEC Tech inventory. Do not guess a model number. Reply using EXACTLY these lines so HEC Tech can import it:\nHEC TECH ITEM\nName: <item name>\nBrand: <brand or blank>\nCategory: <Power Tools, Hand Tools, Lawn & Garden, Home & Kitchen, Automotive, or Other>\nModel: <model or blank>\nNotes: <important specifications or details>';
let photoFile=null,photoData='';

function parseResult(raw){
 const text=String(raw||'').trim(),out={};
 for(const line of text.split(/\r?\n/)){
  const m=line.match(/^\s*(Name|Brand|Category|Model|Notes)\s*:\s*(.*)$/i);
  if(m)out[m[1].toLowerCase()]=m[2].trim();
 }
 if(!out.name){const json=text.match(/\{[\s\S]*\}/);if(json)try{const j=JSON.parse(json[0]);for(const k of ['name','brand','category','model','notes'])if(j[k]!=null)out[k]=String(j[k]).trim()}catch(e){} }
 if(!out.name)return null;
 const allowed=['Power Tools','Hand Tools','Lawn & Garden','Home & Kitchen','Automotive','Other'];
 if(!allowed.includes(out.category))out.category='Other';
 return out;
}
function dataUrlFile(data,name='hec-tech-item.jpg'){
 try{const a=data.split(','),mime=(a[0].match(/:(.*?);/)||[])[1]||'image/jpeg',bin=atob(a[1]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new File([u],name,{type:mime})}catch(e){return null}
}
function reviewImported(raw){
 const x=parseResult(raw);
 if(!x){alert('HEC Tech could not read that result. Ask the AI to use the HEC TECH ITEM format, then paste or share it again.');return}
 const savedPhoto=localStorage.getItem(TEMP_PHOTO)||'';
 el('modal').close();edit(null);
 for(const k of ['name','brand','category','model','notes']){const input=el('toolForm').elements.namedItem(k);if(input&&x[k])input.value=x[k]}
 if(savedPhoto){const f=dataUrlFile(savedPhoto);if(f)try{const dt=new DataTransfer();dt.items.add(f);el('photo').files=dt.files}catch(e){}}
 const note=document.createElement('p');note.textContent='AI result imported. Review everything, then press Save.';el('toolForm').prepend(note);
 localStorage.removeItem(TEMP_PHOTO);
}
window.openAIAdd=function(){
 photoFile=null;photoData='';
 el('modalContent').innerHTML='<h2>📷 AI Add Item</h2><p><b>1. Take or upload a photo.</b><br><b>2. Add a note if needed.</b><br><b>3. Tap Use My AI.</b></p><label>Add a photo</label><div class="controls"><button type="button" id="hec-ai-camera">📷 Take Photo</button><button type="button" id="hec-ai-gallery">🖼 Choose Existing Photo</button></div><input type="file" id="hec-ai-photo" accept="image/*" capture="environment" style="display:none"><input type="file" id="hec-ai-gallery-file" accept="image/*" style="display:none"><img id="hec-ai-photo-preview" alt="Selected item photo"><label for="hec-ai-words">Optional note</label><div style="display:flex;gap:8px;align-items:stretch"><textarea id="hec-ai-words" rows="2" style="flex:1" placeholder="Example: Add this to my garage"></textarea><button type="button" id="hec-ai-mic" aria-label="Speak optional note" title="Speak optional note">🎤</button></div><div id="hec-ai-status" class="hec-ai-status"></div><div class="controls"><button type="button" class="primary" id="hec-ai-send">📤 Use My AI</button><button type="button" id="hec-ai-paste">📋 Paste AI Result</button><button type="button" onclick="document.getElementById(\'modal\').close()">Cancel</button></div>';
 el('modal').showModal();
 el('hec-ai-mic').onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){el('hec-ai-status').textContent='Voice typing is not available in this installed app. Tap the note box and use the microphone on your phone keyboard instead.';el('hec-ai-words').focus();return}
  const btn=el('hec-ai-mic'),rec=new SR();rec.lang='en-US';rec.interimResults=false;rec.continuous=false;btn.disabled=true;btn.textContent='Listening…';el('hec-ai-status').textContent='Listening — say your note now.';
  rec.onresult=e=>{const said=Array.from(e.results).map(r=>r[0].transcript).join(' ');el('hec-ai-words').value=(el('hec-ai-words').value+' '+said).trim();el('hec-ai-status').textContent='✓ I heard: “'+said+'”';};
  rec.onnomatch=()=>el('hec-ai-status').textContent='I did not hear anything. Try again or use the keyboard microphone.';
  rec.onerror=e=>el('hec-ai-status').textContent=(e.error==='not-allowed'?'Microphone permission is blocked. Use your keyboard microphone or allow microphone permission.':'Voice did not start. Use your keyboard microphone or try again.');
  rec.onend=()=>{btn.disabled=false;btn.textContent='🎤';};try{rec.start()}catch(e){rec.onend();el('hec-ai-status').textContent='Voice did not start. Use your keyboard microphone instead.'}
 };
 const handlePhoto=async e=>{
  photoFile=e.target.files[0]||null;if(!photoFile)return;
  try{
   const im=new Image(),url=URL.createObjectURL(photoFile);await new Promise((res,rej)=>{im.onload=res;im.onerror=rej;im.src=url});
   const ratio=Math.min(1,1100/im.width,1100/im.height),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*ratio));c.height=Math.max(1,Math.round(im.height*ratio));c.getContext('2d').drawImage(im,0,0,c.width,c.height);
   photoData=c.toDataURL('image/jpeg',.72);URL.revokeObjectURL(url);localStorage.setItem(TEMP_PHOTO,photoData);
   el('hec-ai-photo-preview').src=photoData;el('hec-ai-photo-preview').style.display='block';
  }catch(e){el('hec-ai-status').textContent='Could not read that photo.'}
 };
 el('hec-ai-camera').onclick=()=>el('hec-ai-photo').click();
 el('hec-ai-gallery').onclick=()=>el('hec-ai-gallery-file').click();
 el('hec-ai-photo').onchange=handlePhoto;
 el('hec-ai-gallery-file').onchange=handlePhoto;
 el('hec-ai-send').onclick=async()=>{
  if(!photoFile){el('hec-ai-status').textContent='Take or upload a photo first.';return}
  const extra=el('hec-ai-words').value.trim(),text=PROMPT+(extra?'\nUser note: '+extra:'');
  try{await navigator.clipboard.writeText(text)}catch(e){localStorage.setItem('hec-ai-prompt-v1',text)}
  el('modalContent').innerHTML='<h2>🤖 Choose Your AI</h2><p><b>Next:</b> tap ChatGPT or Gemini below. In the AI app, attach the same photo and paste the request HEC Tech copied for you.</p><div class="controls" style="display:grid;grid-template-columns:1fr 1fr"><button type="button" class="primary" id="hec-open-chatgpt">Open ChatGPT</button><button type="button" class="primary" id="hec-open-gemini">Open Gemini</button></div><p style="font-size:13px">When the AI replies, copy its full reply. Come back to HEC Tech and tap <b>Paste AI Result</b>.</p><div class="controls"><button type="button" id="hec-ai-return-paste">📋 Paste AI Result</button><button type="button" id="hec-ai-back">← Back</button></div><div id="hec-ai-status" class="hec-ai-status"></div>';
  el('hec-open-chatgpt').onclick=()=>{window.open('https://chatgpt.com/','_blank')};
  el('hec-open-gemini').onclick=()=>{window.open('https://gemini.google.com/app','_blank')};
  el('hec-ai-return-paste').onclick=()=>{const t=prompt('Paste the AI reply here:');if(t)reviewImported(t)};
  el('hec-ai-back').onclick=()=>openAIAdd();
 };
 el('hec-ai-paste').onclick=()=>{const t=prompt('Paste the AI reply here. First send the photo to ChatGPT or Gemini and copy its reply.');if(t)reviewImported(t)};
};
window.addEventListener('DOMContentLoaded',()=>{
 const q=new URLSearchParams(location.search),shared=q.get('hecText')||'';
 if(shared){
  history.replaceState(null,'',location.pathname);
  setTimeout(()=>{el('modalContent').innerHTML='<h2>Import AI Result</h2><p>HEC Tech received this shared result. Review it before saving.</p><textarea id="hec-shared-result" rows="9"></textarea><div class="controls"><button class="primary" id="hec-import-shared">Review Item</button><button type="button" onclick="document.getElementById(\'modal\').close()">Cancel</button></div>';el('hec-shared-result').value=shared;el('modal').showModal();el('hec-import-shared').onclick=()=>reviewImported(el('hec-shared-result').value)},250);
 }
});
})();