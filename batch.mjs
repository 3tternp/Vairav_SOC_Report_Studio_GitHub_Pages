import {buildExecutiveSummary,buildConclusion} from './report-narrative.mjs';
import {analyze} from './analyzer.mjs';
import {analyzeCyberArk,analyzeGeneric,isCyberArk} from './supplemental-analyzers.mjs';
export function combineReports(sources){
 if(!sources.length)throw Error('Select at least one report.');
 const clients=[...new Set(sources.map(s=>s.analysis.client).filter(c=>c!=='Client name').map(c=>c.toLowerCase().trim()))];
 if(clients.length>1)throw Error('Reports contain different client names. Process each client separately.');
 const first=sources[0].analysis,m={...first,name:sources.map(s=>`${s.id}: ${s.name}`).join('; '),sources,findings:[],warnings:[],charts:[]};
 const coverageNames=[...new Set(sources.flatMap(s=>s.analysis.coverage.map(c=>c.name)))];
 m.coverage=coverageNames.map(name=>{const parts=sources.map(r=>r.analysis.coverage.find(c=>c.name===name)||{rows:[],count:0,pages:[],status:'Missing'}),sample=parts.find(p=>p.status!=='Missing')||parts[0];return {...sample,name,rows:parts.flatMap((p,j)=>p.rows.map(r=>({...r,sourceId:sources[j].id}))),count:parts.reduce((a,p)=>a+p.count,0),pages:parts.flatMap((p,j)=>p.pages.map(n=>`${sources[j].id}:p${n}`)),status:parts.some(p=>p.status==='Needs review')?'Needs review':parts.some(p=>p.count)?'Activity':'No relevant data'};});
 m.risk=sources.some(s=>s.analysis.risk==='MEDIUM')?'MEDIUM':'REVIEW';
 m.total=m.coverage.reduce((a,s)=>a+s.count,0);
 m.client=sources.find(s=>s.analysis.client!=='Client name')?.analysis.client||'Client name';
 const dates=sources.flatMap(s=>[s.analysis.from,s.analysis.to]).filter(x=>Number.isFinite(Date.parse(x))).sort((a,b)=>Date.parse(a)-Date.parse(b));
 m.from=dates[0]||first.from;m.to=dates.at(-1)||first.to;
 for(const s of sources){m.warnings.push(...s.analysis.warnings.map(w=>`${s.id}: ${w}`));m.findings.push(...s.analysis.findings.map(f=>({...f,id:`${s.id}-${f.id}`,evidence:`[${s.id}] ${f.evidence}`})));}
 const sourceTotal=sources.reduce((sum,s)=>sum+s.analysis.coverage.reduce((n,c)=>n+c.count,0),0);
 m.integrity={sourceReports:sources.length,sourceTotal,combinedTotal:m.total,reconciled:sourceTotal===m.total,requiresReview:m.warnings.length>0,method:'Counts are deterministically summed from parsed source rows. This is a reconciliation check, not a statistical accuracy percentage.'};
 for(let i=0;i<sources.length;i++)for(let j=i+1;j<sources.length;j++){const a=sources[i].analysis,b=sources[j].analysis;if(Date.parse(a.from)<Date.parse(b.to)&&Date.parse(b.from)<Date.parse(a.to))m.warnings.push(`${sources[i].id} and ${sources[j].id}: reporting periods overlap. Combined counts may double-count events; use non-overlapping reports for totals.`);}
 const active=m.coverage.filter(s=>s.count).sort((a,b)=>b.count-a.count);
 if(active.length)m.charts.push({title:'Event counts by use case',labels:active.map(s=>s.name),values:active.map(s=>s.count)});
 const vpn=m.coverage.find(s=>s.name==='Third Party VPN')?.rows||[],states=[...new Set(vpn.map(r=>r.status))];if(states.length)m.charts.push({title:'Third Party VPN status',labels:states,values:states.map(k=>vpn.filter(r=>r.status===k).reduce((a,r)=>a+r.count,0))});
 const flows=new Map();for(const section of m.coverage.filter(s=>['SSH Connections CP','RDP Connection CP'].includes(s.name)))for(const r of section.rows){const protocol=section.name.startsWith('SSH')?'SSH':'RDP',key=[protocol,r.source,r.destination,r.action].join('|'),old=flows.get(key);flows.set(key,{...r,protocol,count:(old?.count||0)+r.count});}
 m.topFlows=[...flows.values()].sort((a,b)=>b.count-a.count).slice(0,8);
 const bySource=new Map();for(const r of flows.values())bySource.set(r.source,(bySource.get(r.source)||0)+r.count);const ranked=[...bySource].sort((a,b)=>b[1]-a[1]);if(ranked.length)m.charts.push({title:'SSH and RDP by source',labels:[...ranked.slice(0,3).map(r=>r[0]),'Other sources'],values:[...ranked.slice(0,3).map(r=>r[1]),ranked.slice(3).reduce((a,r)=>a+r[1],0)]});
 if(sources.length===1)m.charts=first.charts;
 m.summary=buildExecutiveSummary(m);m.conclusion=buildConclusion(m);
 return m;
}
export function sourceReport(pages,name,id){if(!pages.some(p=>p.trim()))throw Error(`${name}: no extractable text. Run OCR first.`);const daily=analyze(pages,name),analysis=isCyberArk(pages)?analyzeCyberArk(pages,name):daily.coverage.some(s=>s.status!=='Missing')?daily:analyzeGeneric(pages,name);return {id,name,pages,analysis};}
