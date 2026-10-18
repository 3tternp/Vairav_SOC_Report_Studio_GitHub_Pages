// Approved CTI email signature supplied by Vairav. Kept separate from report-template contacts.
export const signatureText=`Warm regards,

Cyber Threat Intel Team
Security operation center | Vairav Technology
+977-9820104286 | securityoperationscenter@vairavtech.com
MinBhawan Marg, New Baneshwor, Kathmandu
www.vairavtech.com

Vairav Tech is a SOC 2 and ISO 27001 certified company. Check out our SOC solution "TridentSOC."

The information contained in this message is intended for the addressee only and may contain classified information. If you are not the addressee, please delete this message and notify the sender; you should not copy or distribute this message or disclose its contents to anyone. Any views or opinions expressed in this message are those of the individual(s) and not necessarily of the organization. No reliance may be placed on this message without written confirmation from an authorized representative of its contents. No guarantee is implied that this message or any attachment is virus-free or has not been intercepted and amended.`;
const e=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function signatureHtml(){const [greeting,details,certification,disclaimer]=signatureText.split('\n\n');return `<div style="font:14px/1.5 Arial,sans-serif;color:#172c40;margin-top:28px"><p>${e(greeting)}</p><p><b>Cyber Threat Intel Team</b><br>Security operation center | Vairav Technology<br>+977-9820104286 | <a href="mailto:securityoperationscenter@vairavtech.com">securityoperationscenter@vairavtech.com</a><br>MinBhawan Marg, New Baneshwor, Kathmandu<br><a href="https://www.vairavtech.com">www.vairavtech.com</a></p><p>${e(certification)}</p><p style="font-size:11px;color:#666">${e(disclaimer)}</p></div>`;}
