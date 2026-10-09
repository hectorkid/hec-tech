(function(){
  function start(){
    const host=document.querySelector('main.wrap');
    if(!host)return;
    const section=document.createElement('section');
    section.style.cssText='margin:14px 0;padding:14px;border:1px solid #ddd;border-radius:14px;background:#fff';
    const title=document.createElement('strong');
    title.textContent='Install HEC TECH on your phone';
    const message=document.createElement('p');
    message.style.fontSize='14px';
    const button=document.createElement('button');
    button.type='button';button.textContent='Install HEC TECH';
    button.hidden=true;
    let prompt=null;
    const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
    const standalone=window.matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
    if(standalone)message.textContent='HEC TECH is installed on this device.';
    else if(ios)message.textContent='On iPhone: open this link in Safari, tap Share, then Add to Home Screen.';
    else message.textContent='On Android: open this link in Chrome and use Install app or Add to Home screen from the browser menu.';
    section.append(title,message,button);
    const controls=host.querySelector('.controls');
    if(controls)controls.after(section);else host.prepend(section);
    window.addEventListener('beforeinstallprompt',event=>{
      event.preventDefault();prompt=event;
      if(!window.matchMedia('(display-mode: standalone)').matches)button.hidden=false;
    });
    button.addEventListener('click',async()=>{
      if(!prompt)return;
      button.hidden=true;
      prompt.prompt();
      await prompt.userChoice;
      prompt=null;
    });
    window.addEventListener('appinstalled',()=>{
      message.textContent='HEC TECH is installed on this device.';
      button.hidden=true;
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);
  else start();
})();
