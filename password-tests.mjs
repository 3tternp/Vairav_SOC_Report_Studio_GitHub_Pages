import assert from 'node:assert/strict';
import fs from 'node:fs';
import {openPdfWithPassword} from './pdf-password.mjs';
import * as pdfjs from './vendor/pdf.mjs';
import {analyze,groupItems} from './analyzer.mjs';
// Supply a locally encrypted copy of a supported report; no client report is committed.
const file=process.env.SOC_PASSWORD_TEST_PDF;
if(!file)throw Error('Set SOC_PASSWORD_TEST_PDF to an encrypted test report.');
const options=()=>({data:new Uint8Array(fs.readFileSync(file)),isEvalSupported:false,standardFontDataUrl:`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/pdfjs-dist/standard_fonts/`});
const reasons=[];
const pdf=await openPdfWithPassword(pdfjs,options(),incorrect=>{reasons.push(incorrect);return incorrect?'test-password-only':'wrong-password';});
assert.deepEqual(reasons,[false,true]);
const pages=[];for(let i=1;i<=pdf.numPages;i++)pages.push(groupItems((await(await pdf.getPage(i)).getTextContent()).items));
assert.equal(analyze(pages).total,12183);await pdf.destroy();
await assert.rejects(openPdfWithPassword(pdfjs,options(),()=>null),{name:'AbortError'});
const retry=await openPdfWithPassword(pdfjs,options(),()=> 'test-password-only');await retry.destroy();
if(process.env.SOC_UNPROTECTED_TEST_PDF){
 const plain=await openPdfWithPassword(pdfjs,{data:new Uint8Array(fs.readFileSync(process.env.SOC_UNPROTECTED_TEST_PDF)),isEvalSupported:false},()=>{throw Error('Unencrypted PDF must not prompt');});await plain.destroy();
}
console.log('PASS: password request, wrong-password retry, extraction, cancellation, reopen, and unprotected PDF.');
