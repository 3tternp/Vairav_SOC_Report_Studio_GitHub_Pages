import {reportSections,brand,dateLabel} from './advisory-template.mjs';
// Local high-resolution image rendering, without remote fonts or image services.
export function renderAdvisoryImage(model,makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;},logo=null){
 const width=1600,margin=92,inner=width-margin*2,measure=makeCanvas(8,8).getContext('2d'),ops=[];
 const color={navy:'#070363',ink:'#20354a',muted:'#526a7d',orange:'#da5b2b',line:'#dce5ed',light:'#f1f6fa'};
 const font=(size,bold=false)=>`${bold?'700':'400'} ${size}px Arial, sans-serif`;
 function wrap(value,max,size,bold=false){measure.font=font(size,bold);const out=[];for(const paragraph of String(value||'Not specified').split('\n')){if(!paragraph.trim()){out.push('');continue;}let line='';for(let word of paragraph.split(/\s+/)){if(measure.measureText(word).width>max){if(line){out.push(line);line='';}let part='';for(const char of word){if(measure.measureText(part+char).width>max){out.push(part);part=char;}else part+=char;}line=part;continue;}const next=line?line+' '+word:word;if(measure.measureText(next).width>max&&line){out.push(line);line=word;}else line=next;}if(line)out.push(line);}return out;}
 function text(value,x,y,max,size=26,bold=false,fill=color.ink,lineHeight=Math.round(size*1.45)){const lines=wrap(value,max,size,bold);ops.push(c=>{c.font=font(size,bold);c.fillStyle=fill;c.textBaseline='top';lines.forEach((s,i)=>c.fillText(s,x,y+i*lineHeight));});return y+lines.length*lineHeight;}
 function rect(x,y,w,h,fill){ops.push(c=>{c.fillStyle=fill;c.fillRect(x,y,w,h);});}
 function rule(y){rect(margin,y,inner,2,color.line);}
 let y=0;
 if(logo)ops.push(c=>c.drawImage(logo,width-margin-240,70,240,293));
 const titleLines=wrap(model.title,inner-120,46,true),subtitleLines=model.subtitle?wrap(model.subtitle,inner-120,27):[];
 const headerHeight=760+titleLines.length*62+subtitleLines.length*40,headerY=410;
 rect(0,headerY,width-margin,headerHeight,color.navy);
 let cy=text(model.title,margin,headerY+90,inner-120,46,true,'#ffffff',62)+20;
 if(model.subtitle)cy=text(model.subtitle,margin,cy,inner-120,27,false,'#ffffff',40)+15;
 rect(margin,cy+55,420,8,'#ffffff');cy+=135;
 cy=text('Vairav Security Advisory Report',margin,cy,inner-120,48,true,'#ffffff')+30;
 cy=text('Date: '+dateLabel(model.date),margin,cy,inner-120,29,true,'#ffffff')+16;
 cy=text(brand.team,margin,cy,inner-120,29,true,'#ffffff')+55;
 cy=text(brand.company,margin,cy,inner-120,36,true,'#ffffff')+22;
 text(brand.address+'\nPhone: '+brand.phone+'  |  Mobile: '+brand.mobile+'\nEmail: '+brand.email,margin,cy,inner-120,25,false,'#ffffff',36);
 y=headerY+headerHeight+70;
 const badgeColor={CRITICAL:'#9f2634',HIGH:'#b34b24',MEDIUM:'#87600f',LOW:'#286e52',REVIEW:'#526a7d'}[model.priority]||color.muted;
 rect(margin,y,inner,64,color.light);text(`SOC PRIORITY  ${model.priority}`,margin+22,y+19,500,23,true,badgeColor);text('Analyst triage assessment',margin+600,y+20,inner-630,21,false,color.muted);y+=100;
 y=text('PRODUCT',margin,y,inner,19,true,color.orange)+8;y=text(model.product,margin,y,inner,29,true)+24;y=text(`Vendor severity: ${model.vendorSeverity}`,margin,y,inner,23,false,color.muted)+32;rule(y);y+=35;
 function section(title,body){y=text(title.toUpperCase(),margin,y,inner,22,true,color.orange)+14;y=text(body,margin,y,inner,27,false,color.ink,39)+34;}
 for(const sectionData of reportSections(model)){
 y=text(sectionData.title.toUpperCase(),margin,y,inner,24,true,color.ink)+20;
 for(const b of sectionData.blocks){
  if(b.type==='table'){
   const n=b.rows[0].length,cw=inner/n;
   b.rows.forEach((row,ri)=>{const height=Math.max(...row.map(cell=>wrap(cell,cw-28,23,ri===0).length))*34+28;rect(margin,y,inner,height,ri===0?color.light:'#ffffff');
    row.forEach((cell,ci)=>{rect(margin+ci*cw,y,1,height,color.line);text(cell,margin+ci*cw+14,y+14,cw-28,23,ri===0,color.ink,34);});rect(margin,y+height,inner,2,color.line);y+=height;
   });y+=28;
  }else if(b.type==='h3')y=text(b.text,margin,y,inner,28,true)+18;
  else if(b.type==='reference'){y=text(b.text,margin,y,inner,22,true)+6;y=text(b.url,margin,y,inner,21,false,color.muted)+22;}
  else y=text(b.text,margin,y,inner,b.type==='code'?23:27,false,color.ink,39)+28;
 }y+=20;
 }
 rule(y);y+=80;
 section('CONTACT US',brand.company+'\nEmpowering Your Cyber Defence\n'+brand.team+'\n'+brand.address+'\nPhone: '+brand.phone+'\nMobile: '+brand.mobile+'\nEmail: '+brand.email+'\nWebsite: '+brand.website);
 y+=30;rect(0,y,width,110,color.navy);text('VAIRAV TECH  •  CYBER DEFENDER',margin,y+36,inner,27,true,'#ffffff');const height=Math.ceil(y+110);
 if(height>16000)throw Error('This advisory is too long for one PNG. Use Word / PDF export.');const canvas=makeCanvas(width,height),ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);for(const op of ops)op(ctx);return canvas;
}
