const number=n=>Number(n||0).toLocaleString('en-US');
const list=items=>items.length>1?items.slice(0,-1).join(', ')+' and '+items.at(-1):items[0]||'';
const friendly=name=>({'SSH Connections CP':'SSH connections','RDP Connection CP':'RDP connections','VPN Connection CP':'VPN connections','Third Party VPN':'third-party VPN activity','Firewall Policy Changes FG':'firewall policy changes','Firewall Audit FG':'firewall administrative activity','SSH Authentication Events':'SSH authentication events','Suspicious Connection Internal to External':'suspicious outbound connections','Suspicious Connection from External IP to Internal IP Addresses':'suspicious inbound connections','Telnet Connection CP':'Telnet connections','RDP Logon':'RDP logons'}[name]||name);
const get=(m,name)=>m.coverage.find(s=>s.name===name)||{rows:[],count:0,status:'Missing'};
export function clientLimitations(m){
 const limitations=[];
 const uncertain=m.coverage.filter(s=>s.status==='Missing'||s.status==='Needs review');
 if(uncertain.length)limitations.push('Information for '+list(uncertain.map(s=>friendly(s.name)))+' is incomplete or requires validation. These areas remain outside a conclusive assessment.');
 if(m.warnings.some(w=>/overlap/i.test(w)))limitations.push('The reporting windows overlap, so combined event totals may include repeated activity.');
 if(!m.from||!m.to)limitations.push('The reporting window requires confirmation.');
 if(m.warnings.length&&!limitations.length)limitations.push('Some supporting information requires validation before a definitive assessment can be issued.');
 return limitations;
}
export function buildConclusion(m){
 const suspicious=m.coverage.filter(s=>s.name.startsWith('Suspicious Connection')&&s.count>0);
 const pending=m.findings.filter(f=>f.severity!=='INFO'||f.title==='VPN status is unspecified');
 const limits=clientLimitations(m);
 let verdict;
 if(suspicious.length)verdict='Further investigation is required. The reports identify '+suspicious.map(s=>number(s.count)+' '+friendly(s.name)+' events').join(' and ')+'. These observations require correlation with the associated assets, security indicators and incident records before intent or impact can be determined.';
 else if(pending.length||m.warnings.length||!m.total)verdict='Further validation is required before concluding that no suspicious activity occurred during the reporting period. '+(pending.length?'The outstanding review items are '+list([...new Set(pending.map(f=>f.title.toLowerCase()))])+'.':'The available information does not support an unqualified security verdict.');
 else verdict='Based on the reported security activity, no suspicious activity was identified within the reported monitoring categories during the reporting period. This assessment is limited to the available evidence and does not establish the absence of threats outside the monitoring scope.';
 const actions=[...new Set(pending.map(f=>f.action).filter(Boolean))];
 const followup=actions.length?'The SOC and relevant asset owners should prioritize the following follow-up: '+actions.slice(0,3).join(' '):'Continue routine monitoring, validate privileged access against approved business requirements, and investigate any new security alerts or deviations from established controls.';
 const boundary='Connection acceptance and VPN status records must be interpreted in their operational context; they do not independently establish user authorization, successful authentication, service availability or compromise. No improvement, deterioration or recovery trend is asserted without comparable time-based evidence.';
 return [verdict,followup,...limits,boundary].join('\n\n');
}
export function buildExecutiveSummary(m){
 const paragraphs=[],active=m.coverage.filter(s=>s.count>0).sort((a,b)=>b.count-a.count),scope=m.from&&m.to?'from '+m.from+' to '+m.to:'during the reporting period';
 paragraphs.push('This executive assessment summarizes security monitoring for '+m.client+' '+scope+'. '+(m.total?'The available records include '+number(m.total)+' events across '+number(active.length)+' monitoring '+(active.length===1?'category':'categories')+' with reported activity. '+(active.length?'The largest categories were '+active.slice(0,3).map(s=>friendly(s.name)+' ('+number(s.count)+' events, '+(100*s.count/m.total).toFixed(1)+'% of the recorded total)').join('; ')+'.':''):'A complete quantitative activity overview is not available; the assessment must be confirmed against the supporting security observations.')+' Event volumes describe recorded activity and should not be interpreted as unique users, sessions or incidents.');
 const ssh=get(m,'SSH Connections CP'),rdp=get(m,'RDP Connection CP'),auth=get(m,'SSH Authentication Events'),vpn=get(m,'VPN Connection CP');
 if(ssh.count||rdp.count||auth.count||vpn.count){let text='Identity and remote-access monitoring recorded '+[ssh.count?number(ssh.count)+' SSH connection events':'',rdp.count?number(rdp.count)+' RDP connection events':'',auth.count?number(auth.count)+' SSH authentication events':'',vpn.count?number(vpn.count)+' VPN connection events':''].filter(Boolean).join(', ')+'. ';if(m.topFlows.length){const top=m.topFlows[0];text+='The highest-volume reported SSH/RDP source-to-destination flow was '+top.source+' to '+top.destination+' using '+top.protocol+' ('+number(top.count)+' events). ';}text+='Access owners should confirm the business purpose and authorization of administrative connections. A permitted network connection alone does not confirm a successful or authorized login.';paragraphs.push(text);}
 const third=get(m,'Third Party VPN');
 if(third.count){const counts={};for(const r of third.rows)counts[r.status]=(counts[r.status]||0)+r.count;let text='Third-party VPN monitoring accounted for '+number(third.count)+' events. ';if(counts.success)text+=number(counts.success)+' records carried a success status. ';if(counts.dpd_failure)text+=number(counts.dpd_failure)+' dead-peer detection failures warrant a review of tunnel availability, connectivity and potential service impact. ';if(counts['-'])text+=number(counts['-'])+' records had no stated status, limiting interpretation of their connection outcome. ';const other=Object.keys(counts).filter(k=>!['success','dpd_failure','-'].includes(k));if(other.length)text+='Other recorded statuses included '+other.map(k=>k+' ('+number(counts[k])+')').join(', ')+'. ';text+='The available totals do not establish failure duration, recovery order or a confirmed outage.';paragraphs.push(text);}
 const policy=get(m,'Firewall Policy Changes FG'),audit=get(m,'Firewall Audit FG');
 if(policy.count||audit.count){let text='Firewall governance and administrative monitoring recorded '+[policy.count?number(policy.count)+' policy-change events':'',audit.count?number(audit.count)+' firewall audit events':''].filter(Boolean).join(' and ')+'. ';const users=[...new Set([...policy.rows,...audit.rows].map(r=>r.user).filter(u=>u&&u!=='-'))];if(users.length)text+='The reported administrative accounts included '+list(users.slice(0,5))+(users.length>5?' and additional accounts':'')+'. ';text+='Changes and administrative actions should be reconciled with approved change records and the responsibilities of the associated accounts; event counts alone do not establish whether an action was authorized.';paragraphs.push(text);}
 const threats=m.coverage.filter(s=>s.name.startsWith('Suspicious Connection'));
 if(threats.some(s=>s.count))paragraphs.push('Threat-focused network monitoring identified '+threats.filter(s=>s.count).map(s=>number(s.count)+' events in '+friendly(s.name)).join(' and ')+'. These observations require investigation of the related sources, destinations and security indicators. Their inclusion in a suspicious-connection category is a trigger for validation rather than proof of compromise.');
 else if(threats.length===2&&threats.every(s=>s.status==='No relevant data'))paragraphs.push('The reported inbound and outbound suspicious-connection categories contained no relevant activity. This is a category-specific observation and does not resolve other access-review items or provide assurance for systems and threats outside the reporting scope.');
 const pending=[...new Map(m.findings.filter(f=>f.severity!=='INFO').map(f=>[f.title,f])).values()];
 if(pending.length)paragraphs.push('The principal management follow-up items are '+list(pending.map(f=>f.title.toLowerCase()))+'. '+pending.slice(0,3).map(f=>f.action).join(' ')+' These items should remain open until the responsible teams verify the supporting evidence and document the outcome.');
 const telnet=get(m,'Telnet Connection CP');if(telnet.count)paragraphs.push('The reports also recorded '+number(telnet.count)+' Telnet connection events. Confirm the operational requirement and endpoint roles, and review whether an encrypted administrative protocol can replace this access.');
 paragraphs.push(...clientLimitations(m));
 paragraphs.push('Overall assessment: '+buildConclusion(m).split('\n\n')[0]);
 return paragraphs.join('\n\n');
}
export function clientExportModel(m){
 // Technical diagnostics remain in the workbench; exports retain business-relevant limitations.
 const clean=s=>String(s??'').replace(/\[R\d+(?:\s+p\.\d+)?\]\s*/g,'').replace(/(\d[\d,]*) events parsed on PDF pages [\d, ]+\./g,'$1 events were reported.').trim();
 return {...m,summary:clean(m.summary),conclusion:clean(m.conclusion||buildConclusion(m)),warnings:clientLimitations(m),findings:m.findings.map(f=>({...f,evidence:clean(f.evidence),action:clean(f.action)})),coverage:m.coverage.map(s=>({...s,status:s.status==='Missing'?'Not assessed':s.status==='Needs review'?'Requires validation':s.status,reportedCount:s.status==='Missing'||(s.status==='Needs review'&&!s.count)?'Not available':number(s.count)}))};
}
