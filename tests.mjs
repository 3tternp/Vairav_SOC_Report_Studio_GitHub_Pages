import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {analyze,groupItems} from './analyzer.mjs';
import {makeDocx} from './exporter.mjs';
const require=createRequire(import.meta.url);
const runtime=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
if(!runtime)throw Error('Set CODEX_PRIMARY_RUNTIME_NODE_MODULES or adapt JSZip import to local node_modules.');
globalThis.JSZip=require(`${runtime}/jszip`);
const basic=analyze(['DAILY REPORT DEMO BANK\nReporting Period\nFrom\n10/16/2026, 9:00:00 PM\nTo\n10/17/2026, 9:00:00 AM','SSH Connections CP\n1 10.0.0.1 203.0.113.9 Accept 4']);
assert.equal(basic.total,4);assert.equal(basic.client,'DEMO BANK');assert.ok(basic.warnings.length);assert.ok(basic.findings.some(f=>f.title.includes('Outbound')));
const unparsed=analyze(['SSH Connections CP\n1 unknown layout']);assert.equal(unparsed.coverage[3].status,'Needs review');assert.ok(unparsed.warnings.some(s=>s.includes('unparsed')));
assert.equal(analyze(['random document']).total,0);
const missing=analyze(['SSH Connections CP\n1 10.0.0.1 10.0.0.2 Accept 2\n3 10.0.0.1 10.0.0.3 Accept 3']);assert.ok(missing.warnings.some(s=>s.includes('gaps')));
let model=basic;
const firewall=analyze(['Firewall Policy Changes FG\n1 admin Edit - 2\n2 operator Edit Policy updated by administrator 10','Firewall Audit FG\n1 admin 10.0.0.1 login - 7\n2 admin 10.0.0.1 logout Administrator logged out 4']);
assert.equal(firewall.coverage[0].count,12);assert.equal(firewall.coverage[8].count,11);
assert.equal(firewall.coverage[0].rows[1].message,'Policy updated by administrator');
assert.equal(firewall.coverage[8].rows[1].message,'Administrator logged out');
assert.equal(firewall.coverage[8].rows[0].source,'10.0.0.1');
assert.equal(firewall.charts[0].values.reduce((a,b)=>a+b,0),23);
for(const section of ['Firewall Policy Changes FG','Firewall Audit FG']){
 assert.equal(analyze([section+'\nNo Relevant Data.']).coverage.find(s=>s.name===section).status,'No relevant data');
 assert.equal(analyze([section+'\n1 unsupported row']).coverage.find(s=>s.name===section).status,'Needs review');
}
if(process.env.SOC_TEST_FIREWALL_PDF){
 const pdfjs=await import('./vendor/pdf.mjs');
 const pdf=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(process.env.SOC_TEST_FIREWALL_PDF)),isEvalSupported:false,standardFontDataUrl:`${runtime}/pdfjs-dist/standard_fonts/`}).promise;
 const pages=[];for(let i=1;i<=pdf.numPages;i++)pages.push(groupItems((await(await pdf.getPage(i)).getTextContent()).items));
 model=analyze(pages,'source-report.pdf');
 assert.equal(model.total,12183);assert.deepEqual(model.warnings,[]);
 assert.deepEqual(model.coverage.map(s=>s.count),[12,15,0,1401,0,9598,13,1,11,0,1132]);
 assert.equal(model.coverage[0].rows.length,2);assert.equal(model.coverage[8].rows.length,6);
 assert.equal(model.coverage[8].rows.filter(r=>r.action==='login').reduce((a,r)=>a+r.count,0),7);
 assert.equal(model.coverage[8].rows.filter(r=>r.action==='logout').reduce((a,r)=>a+r.count,0),4);
 await pdf.destroy();
}
if(process.env.SOC_TEST_PDF){
 const pdfjs=await import(pathToFileURL(`${runtime}/pdfjs-dist/legacy/build/pdf.mjs`));
 const pdf=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(process.env.SOC_TEST_PDF)),isEvalSupported:false,standardFontDataUrl:`${runtime}/pdfjs-dist/standard_fonts/`}).promise;const pages=[];
 for(let i=1;i<=pdf.numPages;i++)pages.push(groupItems((await(await pdf.getPage(i)).getTextContent()).items));
 model=analyze(pages,'source-report.pdf');
 assert.equal(model.total,12271);assert.equal(model.coverage[3].count,1812);assert.equal(model.coverage[5].count,9294);assert.equal(model.coverage[10].count,1154);assert.equal(model.coverage[1].count,4);assert.equal(model.coverage[6].count,7);assert.equal(model.coverage.filter(s=>s.status==='No relevant data').length,6);assert.equal(model.warnings.length,0);assert.equal(model.charts[1].values[0],8245);assert.equal(model.charts[2].values[0],2873);assert.equal(model.coverage[5].rows.length,59);assert.ok(model.from);assert.ok(model.to);await pdf.destroy();
}
for(const type of ['pie','bar']){const bytes=await makeDocx(model,{chartType:type});const z=await JSZip.loadAsync(bytes);assert.ok(z.file('word/charts/chart1.xml'));assert.ok(z.file('word/embeddings/data1.xlsx'));const wb=await JSZip.loadAsync(await z.file('word/embeddings/data1.xlsx').async('uint8array'));assert.ok(wb.file('xl/worksheets/sheet1.xml'));assert.ok((await z.file('word/document.xml').async('text')).includes('Executive Summary'));if(process.env.SOC_TEST_OUT)fs.writeFileSync(`${process.env.SOC_TEST_OUT}-${type}.docx`,bytes);}
const fallback=await makeDocx(model,{images:model.charts.map(()=> 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jVh0AAAAASUVORK5CYII=')});const fz=await JSZip.loadAsync(fallback);assert.ok((await fz.file('word/document.xml').async('text')).includes('mc:AlternateContent'));assert.ok(fz.file('word/media/chart1.png'));
console.log('PASS: parser totals, missing/unparsed inputs, dates, charts, embedded workbooks, pie and bar export.');
