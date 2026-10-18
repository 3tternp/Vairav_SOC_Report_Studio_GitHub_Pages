import {recipients,emailHtml} from './advisory-email.mjs';
const GRAPH='https://graph.microsoft.com/v1.0',GUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const b64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
const b64url=bytes=>b64(bytes).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
export function validateRegistration(tenant,client){if(!GUID.test(tenant)||!GUID.test(client))throw Error('Enter the Directory (tenant) ID and Application (client) ID from your Entra app registration.');}
export async function pkce(){const verifier=b64url(crypto.getRandomValues(new Uint8Array(32)));return {verifier,challenge:b64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))))};}
export function checkCallback(query,state){const p=new URLSearchParams(query);if(p.get('state')!==state)throw Error('Microsoft sign-in state did not match. Sign in again.');if(p.get('error'))throw Error(p.get('error_description')||p.get('error'));if(!p.get('code'))throw Error('Microsoft did not return an authorization code.');return p.get('code');}
let session=null,signingIn=false;
export function signedIn(){return session&&Date.now()<session.expires?session:null;}
export function disconnect(){session=null;}
export async function signIn({tenantId,clientId,shared=false}){
 validateRegistration(tenantId,clientId);if(signingIn)throw Error('Microsoft sign-in is already open.');
 signingIn=true;session=null;const popup=window.open('about:blank','VairavMicrosoftSignIn','width=560,height=720');if(!popup){signingIn=false;throw Error('Allow the Microsoft sign-in popup, then try again.');}
 try{
  const {verifier,challenge}=await pkce(),state=b64url(crypto.getRandomValues(new Uint8Array(32))),redirectUri=new URL('./m365-callback.html',location.href).href,scopes=['https://graph.microsoft.com/User.Read','https://graph.microsoft.com/Mail.Send',...(shared?['https://graph.microsoft.com/Mail.Send.Shared']:[])];
  const code=await new Promise((resolve,reject)=>{let timer;const cleanup=()=>{clearInterval(timer);window.removeEventListener('message',receive);};const receive=event=>{if(event.origin!==location.origin||event.source!==popup||event.data?.type!=='vairav-m365-callback')return;cleanup();try{resolve(checkCallback(event.data.query,state));}catch(e){reject(e);}};
   window.addEventListener('message',receive);const start=Date.now();timer=setInterval(()=>{if(popup.closed||Date.now()-start>300000){cleanup();popup.close();reject(Error('Microsoft sign-in was cancelled or timed out.'));}},500);
   const u=new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);u.search=new URLSearchParams({client_id:clientId,response_type:'code',redirect_uri:redirectUri,response_mode:'query',scope:scopes.join(' '),state,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'}).toString();popup.location.replace(u.href);
  });
  const response=await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,grant_type:'authorization_code',code,redirect_uri:redirectUri,code_verifier:verifier,scope:scopes.join(' ')}),credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(30000)});
  const token=await response.json();if(!response.ok||!token.access_token)throw Error(token.error_description||'Microsoft sign-in failed. Check the Entra SPA redirect URI and permissions.');
  const profileResponse=await fetch(GRAPH+'/me?$select=displayName,mail,userPrincipalName',{headers:{Authorization:'Bearer '+token.access_token},credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(30000)});if(!profileResponse.ok)throw Error('Microsoft profile lookup failed. Grant delegated User.Read permission.');const profile=await profileResponse.json();session={token:token.access_token,expires:Date.now()+Math.max(0,(Number(token.expires_in)||3600)-60)*1000,profile,shared};return session;
 }finally{signingIn=false;popup.close();}
}
export function graphPayload(model,addresses,pdf,sender){
 const to=recipients(addresses),from=recipients(sender);if(from.length!==1)throw Error('Choose one sender mailbox.');
 if(!(pdf instanceof Uint8Array)||new TextDecoder().decode(pdf.subarray(0,5))!=='%PDF-')throw Error('The generated attachment is not a valid PDF.');if(pdf.length>2500000)throw Error('The PDF exceeds the direct-send size limit. Download it and send through Outlook.');
 return {message:{subject:'Vairav CTI Advisory - '+model.title,body:{contentType:'HTML',content:emailHtml(model)},from:{emailAddress:{address:from[0]}},bccRecipients:to.map(address=>({emailAddress:{address}})),attachments:[{'@odata.type':'#microsoft.graph.fileAttachment',name:(model.id||'Vairav_CTI_Advisory').replace(/[^a-z0-9_-]/gi,'_')+'.pdf',contentType:'application/pdf',contentBytes:b64(pdf)}]},saveToSentItems:true};
}
export async function sendAdvisory(model,addresses,pdf,sender,request=fetch){
 const auth=signedIn();if(!auth)throw Error('Sign in to Microsoft 365 before sending.');const own=[auth.profile.mail,auth.profile.userPrincipalName].filter(Boolean).map(s=>s.toLowerCase());if(!own.includes(sender.toLowerCase())&&!auth.shared)throw Error('For a shared CTI mailbox, enable shared mailbox mode and sign in again. Exchange Send As permission is also required.');
 const payload=graphPayload(model,addresses,pdf,sender);let response;
 try{response=await request(GRAPH+'/me/sendMail',{method:'POST',headers:{Authorization:'Bearer '+auth.token,'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(30000)});}catch{throw Error('No send confirmation was received. Check Outlook Sent Items before retrying to avoid a duplicate.');}
 if(response.status!==202){if(response.status===401){disconnect();throw Error('Microsoft sign-in expired. Sign in again.');}throw Error(response.status===403?'Microsoft denied sending. Check delegated permissions and Exchange Send As rights for the selected mailbox.':`Microsoft returned HTTP ${response.status}. No automatic retry was attempted; check Outlook before resending.`);}
 return {accepted:true,count:payload.message.bccRecipients.length};
}
