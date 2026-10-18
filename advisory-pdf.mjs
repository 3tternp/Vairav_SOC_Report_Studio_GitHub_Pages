import {PDFDocument,PDFHeader,StandardFonts,rgb} from './vendor/pdf-lib.mjs';
import {reportSections,brand,dateLabel} from './advisory-template.mjs';
import {logoData} from './advisory-brand.mjs';
// Native, paginated PDF bytes: suitable for both downloading and email attachments.
export async function advisoryPdf(m){
 const doc=await PDFDocument.create();doc.context.header=PDFHeader.forVersion(1,4);doc.setTitle(m.title);doc.setAuthor(brand.team);
 const regular=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),mono=await doc.embedFont(StandardFonts.Courier);
 const navy=rgb(7/255,3/255,99/255),ink=rgb(.08,.08,.08),light=rgb(.92,.95,.97),line=rgb(.84,.86,.89),white=rgb(1,1,1);
 const W=595.28,H=841.89,M=50,I=W-2*M;let page,y;
 const clean=s=>String(s??'').replace(/\u2192/g,' -> ').replace(/\u2190/g,' <- ').replace(/[\u2011\u2212]/g,'-').replace(/[\u202f\u00a0]/g,' ').replace(/[\u200b\x00-\x08\x0b\x0c\x0e-\x1f]/g,'');
 function wrap(value,width,size,font=regular){const output=[];for(const paragraph of clean(value).split('\n')){let row='';if(!paragraph){output.push('');continue;}for(const word of paragraph.split(/\s+/)){try{font.encodeText(word);}catch{throw Error('PDF text contains characters outside the supported Latin fonts. Use an English advisory for automatic PDF generation.');}if(font.widthOfTextAtSize(word,size)>width){if(row){output.push(row);row='';}for(const c of word){if(font.widthOfTextAtSize(row+c,size)>width){output.push(row);row='';}row+=c;}continue;}const next=row?row+' '+word:word;if(font.widthOfTextAtSize(next,size)>width){output.push(row);row=word;}else row=next;}if(row)output.push(row);}return output;}
 function write(text,x,at,size=10.5,font=regular,color=ink){page.drawText(clean(text),{x,y:at,size,font,color});}
 function fresh(){page=doc.addPage([W,H]);y=H-62;}
 function para(value,size=10.5,font=regular){for(const s of wrap(value,I,size,font)){if(y<70)fresh();write(s,M,y,size,font);y-=size*1.45;}y-=10;}
 function heading(text,small=false){if(y<145)fresh();y-=12;para(small?text:text.toUpperCase(),small?11:12,bold);}
 function table(rows){
  const widths=rows[0].length===2?[I*.28,I*.72]:rows[0].map(()=>I/rows[0].length),size=9.3,lh=13;
  function drawLines(lines,header=false){const height=Math.max(...lines.map(a=>a.length))*lh+14;let x=M;for(let i=0;i<lines.length;i++){page.drawRectangle({x,y:y-height,width:widths[i],height,color:header?light:white,borderColor:line,borderWidth:.5});lines[i].forEach((s,j)=>write(s,x+7,y-14-j*lh,size,header?bold:regular));x+=widths[i];}y-=height;}
  const header=rows[0].map((s,i)=>wrap(s,widths[i]-14,size,bold)),hh=Math.max(...header.map(a=>a.length))*lh+14;
  if(y<70+hh+50)fresh();drawLines(header,true);
  for(const row of rows.slice(1)){let lines=row.map((s,i)=>wrap(s,widths[i]-14,size));
   while(lines.some(a=>a.length)){let capacity=Math.floor((y-70-14)/lh);if(capacity<2){fresh();drawLines(header,true);capacity=Math.floor((y-70-14)/lh);}const needed=Math.max(...lines.map(a=>a.length));if(needed>capacity&&needed<(H-140-hh-14)/lh){fresh();drawLines(header,true);capacity=Math.floor((y-70-14)/lh);}const take=Math.min(needed,capacity);drawLines(lines.map(a=>a.slice(0,take)));lines=lines.map(a=>a.slice(take));if(lines.some(a=>a.length)){fresh();drawLines(header,true);}
   }
  }y-=16;
 }
 fresh();const logo=await doc.embedPng(logoData);page.drawImage(logo,{x:W-140,y:H-175,width:90,height:110});page.drawRectangle({x:0,y:90,width:W-50,height:535,color:navy});
 let cy=580;const coverText=(value,size=13,font=regular,gap=12)=>{for(const s of wrap(value,I-25,size,font)){write(s,62,cy,size,font,white);cy-=size*1.3;}cy-=gap;};
 coverText(m.title,18,bold);if(m.subtitle)coverText(m.subtitle,11);cy-=28;coverText('Vairav Security Advisory Report',22,bold,22);coverText('Date: '+dateLabel(m.date),13,bold,10);coverText(brand.team,12,bold,28);coverText(brand.company,16,bold,14);coverText(brand.address+'\nPhone: '+brand.phone+'\nMobile: '+brand.mobile+'\nEmail: '+brand.email,10.5,regular,8);if(cy<102)throw Error('The cover text is too long. Shorten the title or subtitle before generating the PDF.');
 fresh();para(`${m.id} | SOC priority: ${m.priority} (analyst assessment)\n${m.clientName?'Prepared for: '+m.clientName+'\n':''}Product: ${m.product}\nVendor severity: ${m.vendorSeverity}`,9.5);
 for(const s of reportSections(m)){heading(s.title);for(const b of s.blocks){if(b.type==='table')table(b.rows);else if(b.type==='h3')heading(b.text,true);else if(b.type==='reference')para(b.text+'\n'+b.url,9);else para(b.text,b.type==='code'?9:10.5,b.type==='code'?mono:regular);}}
 fresh();y=H-135;for(const [text,size,font]of [['CONTACT US',14,bold],[brand.company,14,bold],['Empowering Your Cyber Defence',12,bold],[brand.team,11,regular],[brand.address,11,regular],['Phone: '+brand.phone,11,regular],['Mobile: '+brand.mobile,11,regular],['Email: '+brand.email,11,regular],['Website: '+brand.website,11,regular]]){for(const s of wrap(text,I,size,font)){write(s,(W-font.widthOfTextAtSize(s,size))/2,y,size,font);y-=size*1.6;}y-=12;}
 const pages=doc.getPages();for(let i=1;i<pages.length;i++){page=pages[i];write(`${i+1} / ${pages.length}`,M,H-30,9,regular,navy);write('VAIRAV TECH - CYBER DEFENDER',W/2-82,30,9,bold,navy);}
 return doc.save({useObjectStreams:false});
}
