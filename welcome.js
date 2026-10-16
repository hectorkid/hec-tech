(function(){
const KEY='hec-welcome-seen-v1';
function start(force=false){
 if(document.getElementById('hec-welcome'))return;
 if(!force){
   // Mark the welcome as seen BEFORE showing it. If storage cannot persist, fail closed.
   try {
     if(localStorage.getItem(KEY)==='1')return;
     if(localStorage.getItem('tool-inventory-v1')!==null)return;
     if(location.search.includes('session=')||location.hash.includes('access_token'))return;
     localStorage.setItem(KEY,'1');
     if(localStorage.getItem(KEY)!=='1')return;
   } catch(error) {
     console.warn('Welcome disabled because persistent storage is unavailable',error);
     return;
   }
 }
 const style=document.createElement('style');style.textContent=`
 #hec-welcome{position:fixed;inset:0;z-index:99999;background:rgba(9,15,25,.82);display:grid;place-items:center;padding:18px;overflow:auto}
 #hec-welcome *{box-sizing:border-box}#hec-welcome .hw-card{width:min(100%,440px);background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 25px 80px #0008;font-family:system-ui,Arial,sans-serif;color:#1b2330}
 #hec-welcome .hw-hero{background:linear-gradient(145deg,#171d28,#303b4c);color:white;text-align:center;padding:30px 24px 26px}
 #hec-welcome .hw-logo{width:78px;height:78px;border:3px solid #d3222a;border-radius:23px;background:#10151e;display:grid;place-items:center;margin:0 auto 15px;font-size:27px;font-weight:900;color:#fff;box-shadow:0 8px 28px #0005}
 #hec-welcome .hw-logo span{color:#ef4444}#hec-welcome h2{font-size:27px;line-height:1.15;margin:0 0 8px;color:#fff}#hec-welcome .hw-hero p{color:#d7deea;font-size:14px;margin:0}
 #hec-welcome .hw-body{padding:24px}#hec-welcome .hw-intro{text-align:center;color:#556274;font-size:14px;margin:0 0 18px}
 #hec-welcome .hw-step{display:flex;align-items:flex-start;gap:13px;margin:15px 0}#hec-welcome .hw-icon{width:43px;height:43px;flex:none;display:grid;place-items:center;background:#fce8e9;border-radius:13px;font-size:21px}
 #hec-welcome .hw-step strong{display:block;font-size:15px}#hec-welcome .hw-step small{display:block;color:#667084;line-height:1.4;margin-top:3px;font-size:12px}
 #hec-welcome .hw-start{width:100%;background:#d3222a;color:white;border:0;border-radius:13px;padding:15px;font-size:16px;font-weight:800;margin-top:14px;cursor:pointer}
 #hec-welcome .hw-foot{text-align:center;color:#7b8492;font-size:11px;margin:12px 0 0}
 @media(max-height:650px){#hec-welcome{place-items:start center}#hec-welcome .hw-hero{padding:17px}#hec-welcome .hw-body{padding:15px}#hec-welcome .hw-step{margin:9px 0}}
 `;document.head.appendChild(style);
 const overlay=document.createElement('div');overlay.id='hec-welcome';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Welcome to HEC TECH');
 overlay.innerHTML='<div class="hw-card"><div class="hw-hero"><div class="hw-logo">H<span>T</span></div><h2>Welcome to HEC TECH</h2><p>Your gear. Your gadgets. All in one place.</p></div><div class="hw-body"><p class="hw-intro">Keep track of everything you own — simply and securely.</p><div class="hw-step"><div class="hw-icon">🧰</div><div><strong>Add your first item</strong><small>Save tools, home devices, gadgets and more.</small></div></div><div class="hw-step"><div class="hw-icon">📸</div><div><strong>Keep the important details</strong><small>Add photos, receipts, manuals and notes.</small></div></div><div class="hw-step"><div class="hw-icon">☁️</div><div><strong>Back up your collection</strong><small>Use your own Google Drive or save a file to iCloud.</small></div></div><button class="hw-start" type="button">Get Started</button><p class="hw-foot">Your collection starts empty and stays on your device unless you choose to back it up.</p></div></div>';
 document.body.appendChild(overlay);
 overlay.querySelector('button').addEventListener('click',()=>{try{localStorage.setItem(KEY,'1');sessionStorage.setItem(KEY,'1');}catch(e){console.warn('Welcome preference not persisted',e)}overlay.remove();});
 overlay.querySelector('button').focus();
}
window.HECPreviewWelcome=()=>start(true);
// Welcome is intentionally user-invoked only; never auto-open on refresh.\n// The hamburger menu calls window.HECPreviewWelcome explicitly.
})();