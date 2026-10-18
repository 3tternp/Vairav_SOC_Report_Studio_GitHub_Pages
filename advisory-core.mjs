import {templateFields} from './advisory-template.mjs';
export {markdown,reportHtml,advisoryDocx} from './advisory-template.mjs';
export const sectionList=templateFields;
export const escape=s=>String(s??'').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function safeUrl(s){try{const u=new URL(s);if(u.protocol!=='https:'||u.username||u.password)return null;return u.href;}catch{return null;}}
export function blank(){return{id:'VTS-TA-'+new Date().toISOString().slice(0,10).replaceAll('-',''),date:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Kathmandu'}),title:'New threat advisory',product:'Not verified',priority:'REVIEW',vendorSeverity:'Not verified — check vendor advisory',confidence:'Unverified draft — analyst review required',summary:'',exploitation:'Not independently verified. Check the vendor advisory and current exploitation reporting before release.',impact:'Assess confidentiality, integrity and availability impact against verified vendor information and your asset exposure.',recommendations:'Identify affected assets and validate the vulnerable versions and required configuration.\nFollow vendor remediation guidance and test changes through the approved change process.\nRecord remediation owners, target dates and validation evidence.',monitoring:'Define monitoring from the verified vulnerability behavior and available telemetry. Do not treat generic errors as proof of exploitation.',clientAction:'Confirm affected products and versions, exposure, remediation owner and planned completion date.',vulnerabilities:[],sources:[]};}
export function draftFromText(text,url=''){
 if(text.trim().length<100)throw Error('Paste at least 100 characters of relevant article text or analyst notes.');
 const m=blank();const clean=text.replace(/\r/g,'').trim(),lines=clean.split('\n').map(s=>s.trim()).filter(Boolean);
 m.title=lines[0].slice(0,180);m.summary='Source excerpt for analyst review — not an independently verified conclusion:\n'+clean.split(/\s+/).slice(0,130).join(' ');
 const ids=[...new Set(clean.match(/CVE-\d{4}-\d{4,7}/gi)||[])].map(x=>x.toUpperCase());
 m.vulnerabilities=ids.map(cve=>({cve,issue:'Confirm with vendor',affected:'Not verified',condition:'Not verified',impact:'Not verified',mitigation:'Verify the vendor-supported fixed release or workaround.'}));
 if(safeUrl(url))m.sources.push(['User-provided news source',safeUrl(url)]);
 m.confidence='Template draft from supplied text. CVE identifiers are extracted strings; scores, affected versions, exploitation and patch availability have not been verified. Replace the excerpt with your assessed summary before distribution.';
 return m;
}
