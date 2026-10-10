(function(){
  function start(){
    const host=document.querySelector('main.wrap');
    if(!host)return;
    const standalone=window.matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
    if(standalone)return;

    const section=document.createElement('section');
    section.style.cssText='margin:20px 0 8px;padding:12px 14px;border:1px solid #d8dce3;border-radius:12px;background:#fff';
    const details=document.createElement('details');
    const title=document.createElement('summary');
    title.textContent='Install HEC TECH on this device';
    title.style.cssText='font-weight:650;cursor:pointer';
    const message=document.createElement('p');
    message.style.cssText='font-size:14px;margin:10px 0';
    const button=document.createElement('button');
    button.type='button';
    button.textContent='Install HEC TECH';
    button.className='primary';
    button.hidden=true;
    let prompt=null;
    const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
    if(ios){
      message.textContent='On iPhone or iPad, open this page in Safari, tap Share, then Add to Home Screen.';
    }else{
      message.textContent='On Android, open this page in Chrome and choose Install app or Add to Home screen from the browser menu.';
    }
    details.append(title,message,button);
    section.append(details);
    host.append(section);

    window.addEventListener('beforeinstallprompt',event=>{
      event.preventDefault();
      prompt=event;
      button.hidden=false;
    });
    button.addEventListener('click',async()=>{
      if(!prompt)return;
      button.hidden=true;
      prompt.prompt();
      const result=await prompt.userChoice;
      prompt=null;
      if(result&&result.outcome==='accepted')message.textContent='Installing HEC TECH…';
    });
    window.addEventListener('appinstalled',()=>{
      message.textContent='HEC TECH is installed on this device.';
      button.hidden=true;
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();
