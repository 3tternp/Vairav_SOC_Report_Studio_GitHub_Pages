# Changelog

Versions follow semantic versioning. Dates are Asia/Kathmandu. Earlier work had no release tags; the 1.0.0 entry records that baseline, not a previously published Git tag.

## Unreleased

### Changed
- Moved the CTI Threat Advisory Studio, its Microsoft 365 delivery workflow and advisory-only PDF/export dependencies into the standalone `Vairav_CTI_Advisory_Studio` repository. This repository now contains only the SOC Executive Report Studio.

## [1.3.0] - 2026-10-19

### Changed
- Expanded report-specific executive summaries and conclusions covering observed activity, business implications, prioritized actions and a scoped evidence-based verdict.
- AI narrative guidance targets 6–9 summary paragraphs and 3–4 conclusion paragraphs where the source evidence supports that detail.
- Word and print/PDF exports omit software diagnostics, raw row counts, internal source IDs, source-quote dumps and chart-editing instructions. Material monitoring limitations remain in business language.
- AI evidence and review notes remain available in a dedicated analyst-only inspector.
- Existing editable charts, source counts, authentication, trial expiry and separate advisory workflow retained.

### Added
- Verdict checks for suspicious activity, incomplete evidence, overlapping periods and unspecified VPN outcomes.
- Automated validation for narrative behavior, native editable Word charts and client-facing Word/print contents.

### Deployment
- Refresh the GitHub Pages frontend and redeploy the updated Render backend to activate the new AI narrative instructions. No live provider summary is included in automated tests.

## [1.2.0] - 2026-10-19

### Added
- Render Free Blueprint (`render.yaml`) for the protected AI backend, with Node 22 and generated service-access token.
- Public `/health` endpoint containing only service status and version.
- Server-side `EXPIRES_AT` deadline. This trial blocks new AI requests after 26 October 2026, 07:00:26 Nepal time; restarts do not extend the deadline. In-flight requests may finish.
- `VERSION` and this versioned changelog; visible executive-page version updated.
- README instructions for Render activation, seven-day shutdown and future reuse.

### Deployment status
- GitHub Pages serves the interface. Render deployment requires an authenticated Render account and a replacement provider key entered in Render's secret settings.
- No provider key is included in source. Live AI/provider validation is pending deployment.

## [1.1.0] - 2026-10-19

### Added
- One or up to ten PDFs per executive report, with existing per-file password handling retained.
- Combined event counts, charts, source references, duplicate-file rejection, cross-client checks and overlapping-period warnings.
- More detailed local summaries with actual counts and actionable findings.
- Optional full-content AI chunk analysis and synthesis, checked evidence quotations, structured findings and conclusions.
- Protected Node AI service with token authentication, exact-origin CORS, request limits and a single active request.
- Tests for aggregation, source provenance, full-text chunking, evidence validation and service authentication.

### Validation
- Supplied reports: 12,271 + 12,183 = 24,454 parsed event counts.
- Pie/bar Word exports passed native-chart and source-reference checks.
- Mocked AI checks passed. No live provider calls were performed; browser smoke testing was unavailable locally.

## [1.0.0] - 2026-10-18

### Existing baseline
- Trident report extraction, analyst review, editable Word pie/bar charts and print-to-PDF workflow.
- Fortigate policy/audit parsing fixes and password-protected PDF prompts.
- Separate advisory page, CTI template, PDF/image generation and approved CTI signature/address.
- Microsoft 365 delegated sign-in and advisory email sending code with manually entered private recipients. Tenant setup and live sending validation require administrator configuration.
