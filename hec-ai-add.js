/* HEC Tech AI-assisted add: requires authenticated Cloudflare Worker with OPENAI_API_KEY secret. */
(function(){
let photoData='',photoFile=null;
const el=id=>document.getElementById(id);
window.openAIAdd=function(){
 photoData='';photoFile=null;
 el('modalContent').innerHTML='<h2>🎙 AI Add Item</h2><p>Tell AI what to add, then take or upload a photo of the label or product.</p><button type="button" id="hec-ai-mic">🎤 Speak</button><label for="hec-ai-words">What would you like to add?</label><textarea id="hec-ai-words" rows="3" placeholder="Add this Honeywell air filter to my inventory"></textarea><label for="hec-ai-photo">Take or upload photo</label><input type="file" id="hec-ai-photo" accept="image/*" capture="environment"><img id="hec-ai-photo-preview" alt="Selected item photo"><div id="hec-ai-status" class="hec-ai-status"></div><div class="controls"><button type="button" class="primary" id="hec-ai-analyze">✨ Identify item</button><button type="button" onclick="document.getElementById(\'modal\').close()">Cancel</button></div>';
 el('modal').showModal();
 el('hec-ai-mic').onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){el('hec-ai-status').textContent='Voice input is not supported by this browser. You can type instead.';return}
  const rec=new SR();rec.lang='en-US';rec.interimResults=false;el('hec-ai-status').textContent='Listening…';
  rec.onresult=e=>{el('hec-ai-words').value=(el('hec-ai-words').value+' '+e.results[0][0].transcript).trim();el('hec-ai-status').textContent='Voice captured.'};
  rec.onerror=e=>el('hec-ai-status').textContent='Microphone: '+e.error;rec.start();
 };
 el('hec-ai-photo').onchange=async e=>{
  photoFile=e.target.files[0];if(!photoFile)return;
  if(!photoFile.type.startsWith('image/')){el('hec-ai-status').textContent='Please select an image.';return}
  try{
   const im=new Image(),url=URL.createObjectURL(photoFile);
   await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject;im.src=url});
   const ratio=Math.min(1,1100/im.width,1100/im.height);
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(im.width*ratio));canvas.height=Math.max(1,Math.round(im.height*ratio));
   canvas.getContext('2d').drawImage(im,0,0,canvas.width,canvas.height);photoData=canvas.toDataURL('image/jpeg',.7);URL.revokeObjectURL(url);
   el('hec-ai-photo-preview').src=photoData;el('hec-ai-photo-preview').style.display='block';
  }catch(e){el('hec-ai-status').textContent='Could not read image.'}
 };
 el('hec-ai-analyze').onclick=async()=>{
  const instructions=el('hec-ai-words').value.trim();
  if(!instructions&&!photoData){el('hec-ai-status').textContent='Add a photo or say what the item is.';return}
  const token=localStorage.getItem('hec-tech-drive-worker-session');
  if(!token){el('hec-ai-status').textContent='Connect Google Drive in Backup Options first to authorize AI Add.';return}
  el('hec-ai-analyze').disabled=true;el('hec-ai-status').textContent='Identifying item…';
  try{
   const res=await fetch('https://hec-tech-drive.hectech.workers.dev/api/ai-item',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({instructions,image:photoData})});
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw Error(data.error||'AI service unavailable');
   const x=data.item||{};el('modal').close();edit(null);
   for(const k of ['name','brand','category','model','notes']){const input=el('toolForm').elements.namedItem(k);if(input&&x[k])input.value=String(x[k])}
   if(photoFile){try{const dt=new DataTransfer();dt.items.add(photoFile);el('photo').files=dt.files}catch(e){}}
   const h=el('toolForm').querySelector('h2');if(h)h.textContent='Review AI result';
   const note=document.createElement('p');note.textContent='Review the details and photo, then press Save to add the item.';el('toolForm').prepend(note);
  }catch(e){el('hec-ai-status').textContent=e.message+' — You can still use + Add item manually.'}
  finally{const b=el('hec-ai-analyze');if(b)b.disabled=false}
 };
};
})();