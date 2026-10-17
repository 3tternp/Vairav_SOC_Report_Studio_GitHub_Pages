export const CASES=['Firewall Policy Changes FG','SSH Authentication Events','Suspicious Connection Internal to External','SSH Connections CP','RDP Logon','Third Party VPN','VPN Connection CP','Telnet Connection CP','Firewall Audit FG','Suspicious Connection from External IP to Internal IP Addresses','RDP Connection CP'];
const ip='(?:\\d{1,3}\\.){3}\\d{1,3}';
export function analyze(pages,name='report.pdf') {
 const sections=new Map(); const warnings=[];
 // Recognize a section only when its heading starts a body page, excluding the contents page.
 let current=null;
 for(let pi=0;pi<pages.length;pi++){
  const lines=pages[pi].split('\n').map(s=>s.trim()).filter(Boolean);
  const heading=lines.find(l=>CASES.includes(l));
  if(heading){current=heading;if(!sections.has(current))sections.set(current,{name:current,rows:[],pages:[],noData:false,unparsed:[]});}
  if(!current)continue;
  const s=sections.get(current);s.pages.push(pi+1);
  for(const line of lines){
   if(/No Relevant Data/i.test(line))s.noData=true;
   if(!/^\d+\s/.test(line))continue;
   const tok=line.split(/\s+/); let row=null;
   if(current==='Firewall Policy Changes FG'){
    const m=line.match(/^(\d+)\s+(\S+)\s+(\S+)\s+(.+?)\s+(\d+)$/);
    if(m)row={index:+m[1],user:m[2],action:m[3],message:m[4],count:+m[5]};
   }
   if(current==='Firewall Audit FG'){
    const m=line.match(new RegExp('^(\\d+)\\s+(\\S+)\\s+('+ip+'|-)\\s+(\\S+)\\s+(.+?)\\s+(\\d+)$'));
    if(m)row={index:+m[1],user:m[2],source:m[3],action:m[4],message:m[5],count:+m[6]};
   }
   if(current==='Third Party VPN'&&tok.length===8&&new RegExp('^'+ip+'$').test(tok[1])&&/^\d+$/.test(tok[7]))row={index:+tok[0],source:tok[1],destination:tok[2],status:tok[3],tunnel:tok[4],role:tok[5],count:+tok[7]};
   // PDF text extraction can tokenize the VPN table into seven fields, as in the supplied report.
   if(current==='Third Party VPN'&&tok.length===7&&new RegExp('^'+ip+'$').test(tok[1])&&/^\d+$/.test(tok[6]))row={index:+tok[0],source:tok[1],destination:tok[2],status:tok[3],tunnel:tok[4],role:tok[5],count:+tok[6]};
   if(['SSH Connections CP','RDP Connection CP','VPN Connection CP','Telnet Connection CP','Suspicious Connection Internal to External','Suspicious Connection from External IP to Internal IP Addresses'].includes(current)){
    const m=line.match(new RegExp('^(\\d+)\\s+('+ip+')\\s+('+ip+')\\s+(\\S+)\\s+(\\d+)$'));
    if(m)row={index:+m[1],source:m[2],destination:m[3],action:m[4],count:+m[5]};
   }
   if(current==='SSH Authentication Events'&&tok.length===8&&/^\d+$/.test(tok[7]))row={index:+tok[0],source:tok[1],user:tok[2],agentIP:tok[3],agent:tok[4],description:tok[5],count:+tok[7]};
   if(current==='SSH Authentication Events'&&tok.length===7&&/^\d+$/.test(tok[6]))row={index:+tok[0],source:tok[1],user:tok[2],agentIP:tok[3],agent:tok[4],description:tok[5],count:+tok[6]};
   if(row&&Number.isSafeInteger(row.count))s.rows.push(row);else s.unparsed.push(line);
  }
 }
 const coverage=CASES.map(n=>{const s=sections.get(n);return{name:n,rows:s?.rows||[],pages:s?.pages||[],status:!s?'Missing':s.unparsed.length?'Needs review':s.noData&&!s.rows.length?'No relevant data':s.rows.length?'Activity':'Needs review',count:(s?.rows||[]).reduce((a,r)=>a+r.count,0),unparsed:s?.unparsed||[]};});
 for(const s of coverage){if(s.status==='Missing')warnings.push(`${s.name}: section not found.`);if(s.status==='Needs review')warnings.push(`${s.name}: unsupported or unparsed rows; verify before export.`);const ids=s.rows.map(r=>r.index);if(new Set(ids).size!==ids.length)warnings.push(`${s.name}: repeated row numbers detected.`);if(ids.length&&Math.max(...ids)!==ids.length)warnings.push(`${s.name}: row sequence has gaps; verify source.`);}
 const total=coverage.reduce((a,s)=>a+s.count,0), active=coverage.filter(s=>s.status==='Activity').length;
 const get=n=>coverage.find(s=>s.name===n).rows;
 const ssh=get('SSH Connections CP'),rdp=get('RDP Connection CP'),vpn=get('Third Party VPN'),connections=[...ssh.map(r=>({...r,protocol:'SSH'})),...rdp.map(r=>({...r,protocol:'RDP'})),...get('VPN Connection CP').map(r=>({...r,protocol:'VPN'}))];
 const privateIP=s=>{const a=s.split('.').map(Number);return a[0]===10||(a[0]===172&&a[1]>=16&&a[1]<=31)||(a[0]===192&&a[1]===168);};
 const publicIP=s=>{const a=s.split('.').map(Number);return !privateIP(s)&&a.every(x=>x>=0&&x<=255)&&![0,127].includes(a[0])&&a[0]<224&&!(a[0]===169&&a[1]===254)&&!(a[0]===100&&a[1]>=64&&a[1]<=127);};
 const outbound=connections.filter(r=>privateIP(r.source)&&publicIP(r.destination));
 const findings=[];let seq=0;const add=(severity,title,evidence,action)=>findings.push({id:++seq,severity,title,evidence,action});
 if(outbound.length)add('MEDIUM','Outbound remote access requires authorization review',outbound.map(r=>`${r.source} → ${r.destination} (${r.protocol}, ${r.action}, ${r.count} events)`).join('; '),'Confirm asset owner, user and approved business purpose. Correlate endpoint and authentication logs; restrict unapproved access. Firewall Accept does not prove successful authentication.');
 const fail=vpn.filter(r=>r.status==='dpd_failure');if(fail.length)add('LOW','VPN dead-peer detection failures',fail.map(r=>`${r.tunnel}: ${r.count}`).join('; '),'Review timestamped tunnel logs, network availability and service impact. Aggregated success records do not prove recovery order or duration.');
 const unknown=get('SSH Authentication Events').filter(r=>[r.source,r.user,r.agentIP,r.agent].some(x=>x==='-'));
 if(unknown.length)add('LOW','SSH authentication attribution is incomplete',`${unknown.reduce((a,r)=>a+r.count,0)} events contain missing source, user or asset fields.`,'Review raw events and decoder mappings. Restore identity, asset and authentication outcome fields.');
 const inbound=get('VPN Connection CP').filter(r=>publicIP(r.source));if(inbound.length)add('LOW','External traffic to VPN destinations requires validation',inbound.map(r=>`${r.source} → ${r.destination} (${r.action}, ${r.count})`).join('; '),'Verify destination roles, source authorization and VPN authentication outcomes. Intent cannot be determined from connection counts alone.');
 const unspecified=vpn.filter(r=>r.status==='-');if(unspecified.length)add('INFO','VPN status is unspecified',`${unspecified.reduce((a,r)=>a+r.count,0)} events have no reported status.`,'Review raw message types and field mappings. Keep unspecified records separate from successes and failures.');
 const sources={};for(const r of [...ssh,...rdp])sources[r.source]=(sources[r.source]||0)+r.count;
 const sorted=Object.entries(sources).sort((a,b)=>b[1]-a[1]);if(sorted.length)add('INFO','Remote access source concentration',`${sorted[0][0]} accounts for ${sorted[0][1]} of ${ssh.concat(rdp).reduce((a,r)=>a+r.count,0)} SSH/RDP events.`,'Confirm whether the source is an approved jump host or PAM server. Establish an authorized access baseline.');
 for(const s of coverage.filter(s=>s.name.startsWith('Suspicious Connection')&&s.count))add('MEDIUM',`${s.name} requires investigation`,`${s.count} events parsed on PDF pages ${s.pages.join(', ')}.`,'Review raw events and applicable indicators; establish source, destination, action and business context before classification.');
 const cover=pages[0]||'';const from=cover.match(/From\s+(\d{1,2}\/\d{1,2}\/\d{4},?\s+\d{1,2}:\d{2}:\d{2}\s*[AP]M)/i)?.[1]||'';const to=cover.match(/To\s+(\d{1,2}\/\d{1,2}\/\d{4},?\s+\d{1,2}:\d{2}:\d{2}\s*[AP]M)/i)?.[1]||'';
 const client=(cover.match(/DAILY REPORT\s+([\s\S]*?)\s+Reporting Period/i)?.[1]||'Client name').replace(/\s+/g,' ').trim();
 if(!from||!to)warnings.push('Reporting period not fully extracted. Enter it manually.');
 if(!total)warnings.push('No supported event rows were extracted. Scanned PDFs require OCR before upload.');
 const pie=[{title:'Event counts by use case',labels:coverage.filter(s=>s.count).sort((a,b)=>b.count-a.count).map(s=>({'SSH Authentication Events':'SSH authentication','SSH Connections CP':'SSH CP','RDP Connection CP':'RDP CP','VPN Connection CP':'VPN CP'}[s.name]||s.name)),values:coverage.filter(s=>s.count).sort((a,b)=>b.count-a.count).map(s=>s.count)},{title:'Third Party VPN status',labels:['Success','Unspecified','DPD failure','Other'],values:['success','-','dpd_failure','other'].map(k=>vpn.filter(r=>k==='other'?!['success','-','dpd_failure'].includes(r.status):r.status===k).reduce((a,r)=>a+r.count,0))},{title:'SSH and RDP by source',labels:[...sorted.slice(0,3).map(x=>x[0]),'Other sources'],values:[...sorted.slice(0,3).map(x=>x[1]),sorted.slice(3).reduce((a,r)=>a+r[1],0)]}].filter(c=>c.values.some(Boolean));
 const summary=`The supplied report lists ${total.toLocaleString('en-US')} event counts across ${coverage.filter(s=>s.status!=='Missing').length} recognized use cases. ${active} use cases show parsed activity; ${coverage.filter(s=>s.status==='No relevant data').length} return no relevant data. Counts represent log events rather than unique sessions or users and may overlap across use cases.\n\n${outbound.length?'Outbound remote-access traffic requires business-purpose validation. ':''}${fail.length?'VPN dead-peer detection failures require operational review. ':''}${unknown.length?'Incomplete SSH attribution limits investigation. ':''}The supplied aggregates do not establish compromise or successful authentication. Confirm the findings against raw logs, asset inventory and approved access records.`;
 return{client,from,to,name,total,coverage,findings,summary,warnings,charts:pie,risk:findings.some(f=>f.severity==='MEDIUM')?'MEDIUM':'REVIEW',status:'MONITOR AND VALIDATE',topFlows:[...ssh.map(r=>({...r,protocol:'SSH'})),...rdp.map(r=>({...r,protocol:'RDP'}))].sort((a,b)=>b.count-a.count).slice(0,8)};
}
export function groupItems(items){
 const lines=[];for(const item of items.filter(x=>x.str?.trim()).sort((a,b)=>b.transform[5]-a.transform[5]||a.transform[4]-b.transform[4])){let line=lines.find(l=>Math.abs(l.y-item.transform[5])<2.2);if(!line){line={y:item.transform[5],items:[]};lines.push(line);}line.items.push(item);}
 return lines.sort((a,b)=>b.y-a.y).map(l=>l.items.sort((a,b)=>a.transform[4]-b.transform[4]).map(x=>x.str).join(' ')).join('\n');
}
