export function chunksFor(sources,limit=18000){
 const chunks=[];let group=[],size=0;
 for(const s of sources)for(let p=0;p<s.pages.length;p++){
 const text=s.pages[p];for(let offset=0;offset<Math.max(text.length,1);offset+=limit){const part={source:s.id,page:p+1,text:text.slice(offset,offset+limit)};if(size+part.text.length>limit&&group.length){chunks.push(group);group=[];size=0;}group.push(part);size+=part.text.length;}}
 if(group.length)chunks.push(group);return chunks;
}
export function validateResult(r,sources){
 if(!r||typeof r.summary!=='string'||!r.summary.trim()||typeof r.conclusion!=='string'||!Array.isArray(r.findings)||!Array.isArray(r.evidence)||!Array.isArray(r.limitations))throw Error('AI returned an invalid report.');
 const norm=s=>s.replace(/\s+/g,' ').trim();
 for(const e of r.evidence){const source=sources.find(s=>s.id===e.source);if(!source||!Number.isInteger(e.page)||!source.pages[e.page-1]||typeof e.quote!=='string'||norm(e.quote).length<8||!norm(source.pages[e.page-1]).includes(norm(e.quote)))throw Error('AI evidence does not match the source page. No changes applied.');}
 if(!r.evidence.length)throw Error('AI returned no verifiable source evidence.');
 for(const f of r.findings)if(!['INFO','LOW','MEDIUM','HIGH','CRITICAL'].includes(f.severity)||!['title','evidence','action'].every(k=>typeof f[k]==='string'))throw Error('Invalid AI finding.');
 return r;
}
