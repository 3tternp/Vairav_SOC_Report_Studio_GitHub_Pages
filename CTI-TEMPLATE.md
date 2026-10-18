# Vairav CTI advisory format

The CTI workspace is `advisory.html`; executive reporting remains at `index.html`. Their navigation and editors are separate.

The supplied Vairav reference PDF informs the navy cover, extracted logo, CTI attribution, technical sections and contact page. Its vulnerability claims are not imported as current facts. Existing sample advisories retain their own dates, references and verification scope.

Optional sections include exploitation analysis, timeline, prerequisites, related threats, risk assessment, MITRE mapping, incident response and detection guidance. Empty optional fields are omitted from exports. Pipe-delimited tables become editable native Word tables and HTML tables. Fenced code is displayed as text and is never executed. Word and print exports use A4. PNG exports are a single long image with a size guard for very long reports.

## Email drafts

Enter recipients only in the browser. The application does not store an address book or write recipients to GitHub, browser storage or a server. Downloading an `.eml` creates an unsent message with an HTML CTI signature, Bcc recipients and an editable Word advisory attachment. The draft file itself contains the entered recipients. Open it in a compatible email application and check recipients and attachment before sending. The legacy draft route uses no SMTP credentials. Direct PDF delivery is now available through Microsoft 365 sign-in after Entra registration and mailbox permissions are configured; see MICROSOFT365-SETUP.md. The page does not perform unattended background sending.

## Tests

Set `CODEX_PRIMARY_RUNTIME_NODE_MODULES` to the bundled runtime dependencies and run `advisory-template-tests.mjs`. The tests cover escaped text, optional sections, pipe tables, embedded logo, contact page and native Word tables. Report parsing and executive chart tests remain in `tests.mjs`.
