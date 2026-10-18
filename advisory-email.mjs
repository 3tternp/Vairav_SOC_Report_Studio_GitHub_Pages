import {signatureHtml} from './cti-signature.mjs';
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function recipients(text){
 const list=[...new Set(text.split(/[\s,;]+/).filter(Boolean))];
 if(!list.length)throw Error('Enter at least one recipient email address.');
 if(list.length>50)throw Error('Use no more than 50 recipients per draft.');
 if(list.some(s=>!(/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/).test(s)))throw Error('Enter valid email addresses separated by commas, semicolons or new lines.');
 return list;
}
export function emailHtml(m){return `<div style="font:15px/1.6 Arial,sans-serif;color:#172c40;max-width:720px"><div style="background:#070363;color:white;padding:24px"><b>VAIRAV CYBER THREAT INTELLIGENCE</b><h2 style="color:white">${escape(m.title)}</h2></div><p>Dear ${escape(m.clientName||'Team')},</p><p>Please find the attached security advisory for your review.</p><p style="white-space:pre-wrap">${escape(m.summary)}</p><p><b>Recommended actions</b></p><p style="white-space:pre-wrap">${escape(m.recommendations)}</p>${signatureHtml()}</div>`;}
function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s).match(/.{1,76}/g).join('\r\n');}
export function emailDraft(m,to,docx){
 const list=recipients(to),boundary='VairavCTI_'+crypto.randomUUID().replaceAll('-','');
 const subject=btoa(String.fromCharCode(...new TextEncoder().encode('Vairav CTI Advisory - '+m.title.slice(0,160))));
 return ['X-Unsent: 1','To: undisclosed-recipients:;','Bcc: '+list.join(', '),'Subject: =?UTF-8?B?'+subject+'?=','MIME-Version: 1.0','Content-Type: multipart/mixed; boundary="'+boundary+'"','','--'+boundary,'Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64','',base64(new TextEncoder().encode(emailHtml(m))),'--'+boundary,'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document','Content-Disposition: attachment; filename="Vairav_CTI_Advisory.docx"','Content-Transfer-Encoding: base64','',base64(docx),'--'+boundary+'--',''].join('\r\n');
}
