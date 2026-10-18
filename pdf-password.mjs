// PDF.js invokes this only when the document needs a password or rejects one.
export function requestPdfPassword(incorrect=false){
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');
  dialog.setAttribute('aria-labelledby','pdf-password-title');
  dialog.style.cssText='border:1px solid #cbd5e1;border-radius:14px;padding:28px;max-width:420px;width:calc(100% - 48px);color:#182c40';
  const form=document.createElement('form');form.method='dialog';
  const title=document.createElement('h2');title.id='pdf-password-title';title.textContent='Password-protected PDF';
  const info=document.createElement('p');info.textContent=incorrect?'Incorrect password. Please try again.':'Enter the password to open this PDF. The password is used only in this browser.';
  info.setAttribute('role','status');
  const label=document.createElement('label');label.textContent='PDF password';
  const input=document.createElement('input');input.type='password';input.autocomplete='off';input.autofocus=true;input.style.cssText='display:block;width:100%;box-sizing:border-box;margin:8px 0 20px;padding:12px';label.append(input);
  const cancel=document.createElement('button');cancel.type='button';cancel.className='button';cancel.textContent='Cancel';
  const submit=document.createElement('button');submit.type='submit';submit.className='button primary';submit.textContent='Unlock PDF';
  let done=false;
  const finish=value=>{if(done)return;done=true;input.value='';dialog.close();dialog.remove();resolve(value);};
  cancel.onclick=()=>finish(null);
  dialog.addEventListener('cancel',e=>{e.preventDefault();finish(null);});
  form.addEventListener('submit',e=>{e.preventDefault();finish(input.value);});
  form.append(title,info,label,cancel,submit);dialog.append(form);document.body.append(dialog);dialog.showModal();input.focus();
 });
}

export async function openPdfWithPassword(pdfjs,options,prompt=requestPdfPassword){
 const task=pdfjs.getDocument(options);
 let rejectCancelled;
 const cancelled=new Promise((_,reject)=>{rejectCancelled=reject;});
 task.onPassword=(updatePassword,reason)=>{
  Promise.resolve().then(()=>prompt(reason===pdfjs.PasswordResponses.INCORRECT_PASSWORD)).then(password=>{
   if(password===null){const error=new Error('PDF opening cancelled. Select a PDF to try again.');error.name='AbortError';rejectCancelled(error);return task.destroy();}
   updatePassword(password);
  }).catch(rejectCancelled);
 };
 try{return await Promise.race([task.promise,cancelled]);}
 catch(error){await task.destroy();throw error;}
}
