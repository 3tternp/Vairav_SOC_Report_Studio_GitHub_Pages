# Microsoft 365 advisory sending

The GitHub Pages app can generate a paginated PDF and send it directly through Microsoft Graph after a user signs in and clicks **Generate PDF and send advisory**. No separate mail server, SMTP password or client secret is used. This is interactive delivery, not an unattended background scheduler. Closing the tab stops the workflow.

## One-time administrator setup

1. In the [Microsoft Entra admin center](https://entra.microsoft.com), open **App registrations → New registration**. Name it **Vairav CTI Advisory Studio**, and select **Accounts in this organizational directory only**.
2. Add the **Single-page application (SPA)** platform with this exact redirect URI:

   `https://3tternp.github.io/Vairav_SOC_Report_Studio_GitHub_Pages/m365-callback.html`

3. Add Microsoft Graph **delegated** permissions **User.Read** and **Mail.Send**. If analysts send from the shared CTI mailbox, also add **Mail.Send.Shared**. Grant consent according to your tenant policies. Do not add application permissions, create a client secret, or enable implicit token flows.
4. For shared-mailbox mode, grant the signing-in analyst **Send As** permission on `securityoperationscenter@vairavtech.com` in Exchange Online. The Graph delegated permission alone does not grant mailbox rights. The app uses `/me/sendMail` with the selected `from` mailbox; Exchange enforces those rights. The sent item is saved under the signed-in user's mailbox; shared-mailbox sent-copy settings are managed in Exchange.
5. Copy the **Directory (tenant) ID** and **Application (client) ID** from the registration's Overview page. These are public identifiers, not credentials. Enter them in the app's **Microsoft 365 connection setup**. They remain in the current tab; recipients and tokens are never written to GitHub or browser storage.

## Sending

1. Generate or edit the advisory and review the PDF using **Download PDF**.
2. Enter the client/team name, sender mailbox and client email addresses. Addresses are used as Bcc, so recipients do not see each other's addresses.
3. For shared CTI sending, leave shared-mailbox mode enabled and sign in with an authorized analyst's work account. Otherwise disable it and sign in as the sending mailbox owner.
4. Tick the advisory review checkbox, then click **Generate PDF and send advisory**. The PDF is generated in the browser and attached automatically with the approved CTI signature in the email body.
5. A **202 Accepted** response means Microsoft accepted the request, not that recipients received it. Check Outlook Sent Items and any delivery failures. Failed or uncertain requests are never retried automatically, to avoid duplicates.

## Privacy and limits

- PDFs, recipients and the client name are sent directly to Microsoft Graph over HTTPS. Microsoft 365 retains messages and recipients under your organization’s retention and auditing policies.
- The app uses authorization code flow with PKCE S256, a random state value, an exact-origin/window callback check and a tenant-specific Microsoft authority. Access tokens are held in memory only. No refresh tokens or offline access are requested. Reconnect when the session expires.
- Disconnect clears the app's local session; it does not revoke Microsoft account consent or sign out of other Microsoft sites.
- The app supports Latin-font/English advisory text. It rejects unsupported characters rather than emitting a broken PDF. Direct attachments are capped at 2.5 MB; larger reports can be sent manually through Outlook.
- Keep app registration access limited to the relevant staff under your tenant policies. Do not paste mailbox passwords or client secrets into the app or repository.

## Validation

`m365-tests.mjs` checks PKCE/state validation, PDF generation, Bcc isolation, attachment byte round trips, mocked Microsoft sign-in, accepted sends, missing shared-mailbox authorization and error handling. It sends no live email. Live sign-in and delivery must be tested after the tenant registration and Exchange permissions are configured.

## Microsoft references

- [SPA registration/configuration](https://learn.microsoft.com/en-us/entra/identity-platform/scenario-spa-app-configuration)
- [Authorization code flow with PKCE](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)
- [Graph sendMail and attachment format](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0)
- [Shared-mailbox sending permissions](https://learn.microsoft.com/en-us/graph/outlook-send-mail-from-other-user)
