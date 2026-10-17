# Threat Advisory Studio

Open `advisory.html` from the existing GitHub Pages site. The executive-report page links to it in the sidebar.

## Capabilities

- A prepared NGINX advisory for the requested 15 October 2026 Hacker News article, with official NGINX version ranges and upstream fix references.
- Editable title, ID, issue date, SOC priority, vendor severity, summary, exploitation status, impact, vulnerability records, mitigation, monitoring, client actions and source references.
- Preview and export to genuine editable DOCX, Markdown, and printable HTML / PDF.
- Direct HTTPS news import when the publisher permits cross-origin browser requests; no external proxy or API key.
- Pasted-text input when direct import is blocked. Other articles produce a deterministic template draft with extracted CVE IDs and a source excerpt. The app does not automatically verify facts, invent CVSS scores or silently reuse the NGINX advisory for unrelated articles.
- Review confirmation is reset after edits. No email distribution, remote draft storage or analytics is added.

## Data handling

Direct import sends a request to the specified publisher; publisher/network access logs can record it. Pasted content remains in browser memory and generated downloads. References open in a new tab only when clicked. The app uses no AI service, remote proxy or persistent local storage.

## Verification limits

The NGINX source check is dated 17 October 2026. Version ranges and NGINX severity are primary-source supported; news-only impact and workaround details are labeled as such. F5 advisory bodies were not fully readable through the research interface, so no unverified F5 CVSS scores or commercial fixed-build numbers are asserted. Exploitation status is a dated 15 October news report, not a live KEV check. SOC priority HIGH is an analyst triage recommendation rather than vendor severity.

Before client distribution, confirm current vendor guidance and relevant asset exposure. Generated drafts are not automatically saved or published. Editing reference rows can change numbering; review inline citations after source changes.
