// Local high-resolution image rendering, without remote fonts or image services.
export function renderAdvisoryImage(model,makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;}){
 const width=1600,margin=92,inner=width-margin*2,measure=makeCanvas(8,8).getContext('2d'),ops=[];
 const color={navy:'#123554',ink:'#20354a',muted:'#526a7d',orange:'#da5b2b',line:'#dce5ed',light:'#f1f6fa'};
 const font=(size,bold=false)=>`${bold?'700':'400'} ${size}px Arial, sans-serif`;
 function wrap(value,max,size,bold=false){measure.font=font(size,bold);const out=[];for(const paragraph of String(value||'Not specified').split('\n')){if(!paragraph.trim()){out.push('');continue;}let line='';for(let word of paragraph.split(/\s+/)){if(measure.measureText(word).width>max){if(line){out.push(line);line='';}let part='';for(const char of word){if(measure.measureText(part+char).width>max){out.push(part);part=char;}else part+=char;}line=part;continue;}const next=line?line+' '+word:word;if(measure.measureText(next).width>max&&line){out.push(line);line=word;}else line=next;}if(line)out.push(line);}return out;}
 function text(value,x,y,max,size=26,bold=false,fill=color.ink,lineHeight=Math.round(size*1.45)){const lines=wrap(value,max,size,bold);ops.push(c=>{c.font=font(size,bold);c.fillStyle=fill;c.textBaseline='top';lines.forEach((s,i)=>c.fillText(s,x,y+i*lineHeight));});return y+lines.length*lineHeight;}
 function rect(x,y,w,h,fill){ops.push(c=>{c.fillStyle=fill;c.fillRect(x,y,w,h);});}
 function rule(y){rect(margin,y,inner,2,color.line);}
 let y=0;const titleLines=wrap(model.title,inner,55,true),headerHeight=245+titleLines.length*72;
 rect(0,0,width,headerHeight,color.navy);rect(0,0,16,headerHeight,color.orange);
 text('VAIRAV TECHNOLOGY',margin,48,inner,30,true,'#ffffff');text('CSOC  /  THREAT ADVISORY',margin,100,inner,21,true,'#b4cbdc');text(model.title,margin,155,inner,55,true,'#ffffff',72);text(`${model.id}   |   ${model.date}`,margin,headerHeight-52,inner,22,false,'#d4e2ed');y=headerHeight+42;
 const badgeColor={CRITICAL:'#9f2634',HIGH:'#b34b24',MEDIUM:'#87600f',LOW:'#286e52',REVIEW:'#526a7d'}[model.priority]||color.muted;
 rect(margin,y,inner,64,color.light);text(`SOC PRIORITY  ${model.priority}`,margin+22,y+19,500,23,true,badgeColor);text('Analyst triage assessment',margin+600,y+20,inner-630,21,false,color.muted);y+=100;
 y=text('PRODUCT',margin,y,inner,19,true,color.orange)+8;y=text(model.product,margin,y,inner,29,true)+24;y=text(`Vendor severity: ${model.vendorSeverity}`,margin,y,inner,23,false,color.muted)+32;rule(y);y+=35;
 function section(title,body){y=text(title.toUpperCase(),margin,y,inner,22,true,color.orange)+14;y=text(body,margin,y,inner,27,false,color.ink,39)+34;}
 section('Executive summary',model.summary);
 if(model.vulnerabilities?.length){y=text('VULNERABILITIES AND EXPOSURE',margin,y,inner,22,true,color.orange)+24;for(let i=0;i<model.vulnerabilities.length;i++){const v=model.vulnerabilities[i];rect(margin,y,inner,3,color.navy);y+=22;y=text(`${String(i+1).padStart(2,'0')}  ${v.cve}`,margin,y,inner,29,true,color.navy)+8;y=text(v.issue,margin,y,inner,31,true)+15;
 for(const[label,value]of [['Affected versions',v.affected],['Exposure',v.condition],['Potential impact',v.impact],['Remediation',v.mitigation]]){const a=text(label.toUpperCase(),margin,y,260,18,true,color.muted,27),b=text(value,margin+285,y,inner-285,25,false,color.ink,36);y=Math.max(a,b)+16;}y+=23;}}
 section('Potential impact',model.impact);section('Recommended actions',model.recommendations);section('SOC monitoring guidance',model.monitoring);section('Exploitation status',model.exploitation);section('Client action requested',model.clientAction);rule(y);y+=32;section('Verification scope',model.confidence);
 y=text('SOURCE REFERENCES',margin,y,inner,22,true,color.orange)+18;for(let i=0;i<(model.sources||[]).length;i++){const[t,u]=model.sources[i];y=text(`[${i+1}] ${t}`,margin,y,inner,21,true,color.ink,30)+4;y=text(u,margin,y,inner,20,false,color.muted,29)+16;}
 y+=24;rect(0,y,width,122,color.navy);text('VAIRAV TECHNOLOGY  •  SECURITY OPERATIONS CENTER',margin,y+25,inner,22,true,'#ffffff');text('Potential exposure is not evidence of compromise. Validate against your environment.',margin,y+65,inner,20,false,'#bdd0df');const height=Math.ceil(y+122);
 if(height>16000)throw Error('This advisory is too long for one PNG. Shorten the text or use Word / PDF export.');const canvas=makeCanvas(width,height),ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);for(const op of ops)op(ctx);return canvas;
}
