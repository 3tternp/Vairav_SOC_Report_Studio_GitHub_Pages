# Vairav SOC Report Studio

A static, browser-local report builder for digital Trident SOC PDFs. Upload a PDF, review extracted metrics and evidence-based draft findings, edit the narrative and priorities, select pie or bar charts, and download a Word report with native editable Office charts and embedded workbooks. Chart preview images provide a fallback for compatible viewers. Printing supports a static PDF copy.

## GitHub Pages deployment

1. Create a repository such as `soc-report-studio` on GitHub.
2. Upload the **contents** of this folder, including `vendor/`, `.nojekyll`, and `.github/workflows/pages.yml`. No customer PDFs or generated client reports are included.
3. In Settings → Pages, set Source to **GitHub Actions**.
4. Push to `main` or run **Deploy SOC Report Studio** from Actions.
5. Open the URL shown by the deployment, normally `https://YOUR-USERNAME.github.io/soc-report-studio/`.

Alternative: choose Deploy from a branch → `main` → `/ (root)` and remove the Actions workflow to avoid duplicate publishing methods.

All URLs are relative, so project Pages paths work. No build, backend, API key, account or external CDN is required at runtime. Serve over HTTPS or localhost; opening `index.html` directly with `file://` does not support module loading.

For local development: `python3 -m http.server 8000 --directory .`, then open http://localhost:8000.

## Supported report format

The parser recognizes the eleven exact Trident headings used in the supplied report: Firewall Policy Changes FG, SSH Authentication Events, Suspicious Connection Internal to External, SSH Connections CP, RDP Logon, Third Party VPN, VPN Connection CP, Telnet Connection CP, Firewall Audit FG, Suspicious Connection from External IP to Internal IP Addresses, and RDP Connection CP.

Recognized rows are aggregated by their displayed Count field. PDF page numbers shown in the app are physical PDF page numbers, including the cover and contents. Missing sections and unsupported rows generate review warnings. Unknown firewall policy/audit layouts are not silently counted. Scanned/image PDFs require OCR elsewhere. PDFs are limited to 25 MB and 250 pages. This is a deterministic template-based analyzer, not a general-purpose AI PDF summarizer or an incident verdict engine.

The app identifies private/public address patterns for review; an external destination is not automatically malicious. It does not query threat intelligence. Accepted connections do not prove authenticated sessions. Success VPN records do not prove recovery order. Users must review extraction, dates, priorities and narrative before export. PDF totals may reflect overlapping use cases and are not unique session counts.

## Data handling

PDF parsing, chart creation and DOCX generation occur in browser memory. The app uses no analytics, cookies, local storage, report upload endpoint or third-party runtime requests. Clearing the report removes app references; it cannot erase downloaded files or guarantee memory zeroization. Hosting providers still receive ordinary page requests. The app does not encrypt generated reports or add access control. Keep downloaded reports under your organization's normal handling controls.

## Word charts

Use Microsoft Word desktop: right-click a chart → Edit Data. Embedded `.xlsx` files carry the editable source data. Word web, Google Docs and mobile/preview viewers can differ in chart support. PDF exports are static. Original chart data remains tied to the PDF; changing findings does not change extracted counts.

## Source files

- `index.html`, `style.css`, `app.mjs`: interface and upload/export workflow.
- `analyzer.mjs`: PDF text reconstruction and deterministic analysis.
- `exporter.mjs`: OOXML Word/chart/workbook generation.
- `vendor/`: local PDF.js 4.10.38 and JSZip, including third-party licenses.
- `.github/workflows/pages.yml`: GitHub Pages deployment.

## Validation

`tests.mjs` can run under Node with the JSZip package available. It verifies the supplied report's expected counts from an external local PDF path, flags unsupported inputs, and exports a DOCX for layout verification. Test fixtures contain no customer report data. Set `SOC_TEST_PDF` and `SOC_TEST_OUT` when running it.
