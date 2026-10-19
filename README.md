# Vairav SOC Report Studio · v1.2.0

Generate reviewed SOC executive reports and separate CTI advisories. The executive page accepts a single PDF or multiple reports for one client, creates a detailed local draft with source totals, and exports Word reports with native editable pie/bar charts. Optional AI summarizes all extracted report text through a protected backend.

[Executive reports](https://3tternp.github.io/Vairav_SOC_Report_Studio_GitHub_Pages/) · [Threat advisories](https://3tternp.github.io/Vairav_SOC_Report_Studio_GitHub_Pages/advisory.html) · [Changelog](CHANGELOG.md)

## Current status

- The GitHub Pages interface is published; local PDF extraction and Word export work without an API key.
- The AI backend source and Render Free deployment configuration are ready. AI is not active until a Render service is deployed, its secrets are configured, and its endpoint is entered in the executive page.
- Live AI and Microsoft 365 sending require their respective administrator setup and validation. No API keys or client recipient lists are committed.

## Deploy the AI backend on Render Free

1. Sign in to [Render](https://dashboard.render.com), then choose **New → Blueprint** and connect this GitHub repository. Review the GitHub permissions requested by Render.
2. Use the repository-root `render.yaml`. It defines one **Free** Node 22 web service in Singapore. Keep the repository root as the working directory; `ai-service/server.mjs` imports `../ai-core.mjs`.
3. Enter a **replacement** `OPENAI_API_KEY` privately in Render when prompted. Do not use a key previously disclosed in chat, source or logs. Render generates `SERVICE_TOKEN`; retrieve it privately from the service environment after creation.
4. Review `EXPIRES_AT`: the supplied trial deadline is **2026-10-26T01:15:26Z**, or **26 October 2026 at 07:00:26 Nepal time**. New AI requests receive HTTP 410 after this deadline. Restarts do not extend it; requests already running may finish. This blocks API use, but does not delete the hosted service or revoke provider credentials.
5. Deploy and wait for Render's healthy status. Open the service's `/health` path; expected JSON is `{"status":"ok","version":"1.2.0"}`. Health reveals no credentials or reports.
6. In the executive page, expand **AI service connection**, enter the actual Render URL ending in `/summarize` and the generated **SERVICE_TOKEN**, then acknowledge text sharing and generate. Never enter the provider API key in the page.
7. Test with a nonsensitive PDF before sending confidential client content. Check source evidence, generated claims, limitations and counts, then export after analyst review.

Render Free may sleep after 15 idle minutes; the first request can take longer. Hosting is free within Render's allowances; AI provider usage is billed separately. Set project spending controls. The service accepts one active generation at a time and returns 429 for concurrent requests. A CORS allowlist is not authentication; keep the service token private. See [AI setup and data handling](AI-SETUP.md).

### End the seven-day trial / reuse later

After the trial, delete or suspend the Render service and revoke the trial provider key. GitHub Pages, Word generation and the source code remain. For future use, redeploy the Blueprint, set a new valid future `EXPIRES_AT`, supply a new provider key, and rotate the service token. An old deadline intentionally prevents accidental reactivation. No scheduled deletion has been configured.

## Executive report workflow

1. Select **1–10 digital PDFs** for the same client: up to **25 MB per PDF**, **100 MB per batch**, **250 pages per PDF**, and **500 pages total**. Enter each PDF's password when prompted. Scans/images require OCR first.
2. Review counts, findings, reporting periods and extraction warnings. Identical files are rejected. Overlapping periods warn of double-counting; counts are additive log events, not unique sessions/users. Different extracted client names block combination; verify identity manually for unrecognized formats.
3. Optionally run AI. Every extracted page is chunked, analyzed and synthesized with parsed totals. AI requests are limited to 500,000 extracted characters; oversized requests are rejected without silent truncation. Images are not analyzed. Evidence quotes are checked against their cited pages, but all generated claims still require analyst review.
4. Edit narrative, findings and conclusion. Choose pie or bar, confirm review, and download Word or print to PDF. AI never changes the parsed chart values.

The deterministic parser recognizes eleven Trident headings: Firewall Policy Changes FG, SSH Authentication Events, Suspicious Connection Internal to External, SSH Connections CP, RDP Logon, Third Party VPN, VPN Connection CP, Telnet Connection CP, Firewall Audit FG, Suspicious Connection from External IP to Internal IP Addresses, and RDP Connection CP. Unsupported rows and missing sections remain visible as warnings. Other digital formats can use AI but do not receive invented chart totals. Accepted traffic does not prove successful authentication or compromise.

## Data handling

PDF parsing, charts and Word generation run in browser memory. Only the explicit AI action sends extracted text to the configured backend and its provider. Backend and provider access controls, logging and retention settings must meet your organization's requirements. The supplied service does not deliberately persist reports and uses OpenAI Responses with `store:false`, which does not override provider retention policies. Credentials are not saved to browser storage. Clearing the app cannot erase downloaded files or guarantee memory zeroization.

## Editable Word charts

Use Word desktop → right-click chart → **Edit Data**. Embedded `.xlsx` workbooks contain the editable data. Web/mobile viewers may differ; PDF and chart preview images are static. Editing narrative does not change extracted values.

## Separate advisory page

The CTI workflow stays separate from executive reports. See [advisory guide](ADVISORY-README.md), [CTI template](CTI-TEMPLATE.md) and [Microsoft 365 setup](MICROSOFT365-SETUP.md). Recipients are entered manually; do not store client email lists in this repository. The existing Microsoft 365 flow requires an active signed-in browser; GitHub Pages alone does not run background email campaigns.

## Source and hosting

- `app.mjs`, `index.html`, `style.css`: executive interface.
- `analyzer.mjs`, `batch.mjs`, `pdf-password.mjs`: extraction, aggregation and password prompts.
- `exporter.mjs`, `print.mjs`: editable Word charts and printable reports.
- `ai-core.mjs`, `ai-service/server.mjs`, `render.yaml`: AI processing and protected deployment.
- `VERSION`, `CHANGELOG.md`: release version/history.
- `vendor/`: local PDF.js/JSZip and license files; advisory PDF library.
- `.github/workflows/pages.yml`: static GitHub Pages deployment. GitHub Pages does not execute the Node service.

For a new Pages deployment, upload the repository contents and choose GitHub Actions in Settings → Pages. All frontend paths are relative. For local frontend development: `python3 -m http.server 8000`, then open `http://localhost:8000`. Serve over HTTP(S), not `file://`.

## Validation

Run `node batch-ai-tests.mjs` for batch handling, full-text chunks, checked evidence, mocked AI synthesis, authentication, CORS, health and expiry. Run `node tests.mjs` with JSZip available through `CODEX_PRIMARY_RUNTIME_NODE_MODULES` for parser and editable-chart export checks. Optional `SOC_TEST_PDF` / `SOC_TEST_FIREWALL_PDF` point to local, uncommitted test reports. Tests make no live AI calls.

Actual supplied-report totals were verified as **12,271 + 12,183 = 24,454**, and combined pie/bar Word exports passed chart/workbook/source-reference checks. Live hosted AI validation remains pending Render deployment and secret provisioning.
