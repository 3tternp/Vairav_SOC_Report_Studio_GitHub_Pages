import assert from 'node:assert/strict';
import {signatureText,signatureHtml} from './cti-signature.mjs';
import {emailHtml,emailDraft} from './advisory-email.mjs';
for(const value of ['Warm regards,','Cyber Threat Intel Team','+977-9820104286','securityoperationscenter@vairavtech.com','MinBhawan Marg, New Baneshwor, Kathmandu','SOC 2 and ISO 27001','notify the sender','No guarantee is implied'])assert.ok(signatureText.includes(value));
const m={title:'Example',summary:'Example',recommendations:'Review'},html=emailHtml(m);
assert.ok(html.includes(signatureHtml()));assert.ok(!html.includes('sales@vairavtech.com'));
const bytes=new Uint8Array([0,1,2,127,128,255]);const draft=emailDraft(m,'example@example.com',bytes);const parts=draft.split(/\r\n--VairavCTI_[a-f0-9]+/);const attachment=parts.find(s=>s.includes('Content-Disposition: attachment'));const body=attachment.split('\r\n\r\n')[1].trim();assert.deepEqual(new Uint8Array(Buffer.from(body,'base64')),bytes);
console.log('PASS: full CTI signature, disclaimer, contact replacement and attachment binary round trip.');
