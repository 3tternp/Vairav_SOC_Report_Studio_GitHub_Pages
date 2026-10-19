# Full-content AI executive summaries

The executive page supports one PDF or up to ten reports for the same client. Password prompts work for each encrypted PDF. Extraction and count-based summaries run locally. AI is optional and requires deployment of the supplied server; publishing GitHub Pages alone does not activate AI.

## Deploy the protected service

Use Node.js 22 or newer on a private server or managed Node host. Keep this directory structure: `ai-service/server.mjs` imports `../ai-core.mjs`. Start with `node ai-service/server.mjs` from the project directory.

Configure environment variables in your host's secret manager:

- `OPENAI_API_KEY`: your organization's OpenAI project API key. Never commit it or enter it in the public page.
- `OPENAI_MODEL`: a Responses API model supporting structured outputs; default `gpt-4.1`.
- `SERVICE_TOKEN`: a cryptographically random access token of at least 32 characters. Generate with `openssl rand -hex 32`. Share privately with authorized analysts; rotate if exposed. This grants use of the service, so do not put it in page source.
- `ALLOWED_ORIGIN`: `https://3tternp.github.io` (exact origin; no path or trailing slash).
- `PORT`: host port; default 8787.

Put HTTPS in front of the service, restrict network access to authorized staff where possible, and set the proxy request timeout to at least ten minutes. Do not enable request-body logging in your hosting provider/proxy. One request runs at a time; additional requests return 429. Set provider project spending limits. The service provides shared-token authentication; use your organization's identity gateway for individual access control if needed. CORS is an origin restriction, not a substitute for authentication.

In the executive page, expand **AI service connection**, enter `https://YOUR-HOST/summarize`, enter the private service token, acknowledge text sharing, and generate. The token is only in the current page's memory/DOM; re-enter after reload. No browser storage is used. The service never returns the provider API key.

## Processing and limits

All extracted text is divided into 18,000-character chunks, including long pages; nothing is silently truncated. Each chunk gets a structured analysis, then the service synthesizes all notes with parsed table totals. Limits: 500 pages and 500,000 extracted characters per AI request. Larger batches must be split. This is a summary pipeline, not a guarantee that every statement will appear in the final summary. Inspect all source text and verify material facts.

Generated evidence quotations must match the specified source/page or the response is rejected. This checks quotations, not the truth of every narrative inference. AI findings are appended to the existing rule-based findings for review. Summary, findings and conclusion remain editable and export in the existing Word/PDF format. Charts continue to use parsed counts, never invented AI values. Unrecognized report formats can be summarized with AI, but do not receive inferred charts or totals.

Identical PDF files are rejected. Overlapping periods trigger warnings: event aggregates are additive, not deduplicated. Cross-client combinations are blocked when extracted client names differ; manually confirm names when a format does not provide them. Reports with no extractable text are rejected; OCR them first. Extraction cannot read embedded image content.

The backend sends extracted text to OpenAI with Responses API `store:false`. This does not override provider retention/abuse-monitoring policies; review your organization's provider agreement before processing confidential reports. No PDFs or report text are deliberately saved by the service. Deployment, key provisioning and live-provider validation remain the administrator's responsibility.

API references: https://developers.openai.com/api/reference/resources/responses/methods/create and https://developers.openai.com/api/docs/guides/structured-outputs

## Validation

Run `node batch-ai-tests.mjs`. Existing parser/Word chart checks remain in `tests.mjs`. No live provider calls are included in tests.
