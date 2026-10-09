# HEC TECH — safe phone test deployment

This branch is a **test build**, not a published test site.

## Isolation requirements

1. Publish this branch's files under a **different HTTPS origin** from the existing installed HEC TECH app, preferably a separate GitHub Pages repository such as `hectorkid/hec-tech-phone-test` at `https://hectorkid.github.io/hec-tech-phone-test/`. Do **not** put the test in a subfolder of the current website: localStorage and IndexedDB are origin-scoped, not folder-scoped.
2. Google Drive test inventory uses `hec-tech-PHONE-TEST-inventory.json`; PDF names use `hec-tech-PHONE-TEST-pdf-<id>.pdf`. These are separate from live backup filenames, though they reside in the same Google account's private app-data area.
3. The existing Google OAuth web client must permit the **test origin** as an authorized JavaScript origin in Google Cloud Console. For the suggested GitHub Pages URL, that origin is `https://hectorkid.github.io`. **Caution:** If the production site is also on `hectorkid.github.io`, these sites share the same browser origin even though their URL paths differ! Use a different hostname for true isolation, such as a distinct GitHub Pages account or a dedicated test subdomain.
4. Do not share or enter Google passwords in ChatGPT. Authorize through Google's normal sign-in screen on the test site.
5. Test with a **sample tool and sample PDF**, not the owner's existing inventory.
6. Confirm local PDF works offline; complete JSON export and restore; Drive upload and restore; re-authentication; failed/missing PDF behavior.
7. Confirm a separate test site uses distinct browser storage **and** does not overwrite the production Google Drive backup.
8. Do not merge the development PR or uninstall the existing app before checks pass.

## Release blockers

- Separate-origin HTTPS staging deployment is not yet created.
- Authorized OAuth origin for staging is not yet verified.
- Browser/device tests and real Drive upload/restore are not yet performed.
- GitHub Actions static tests have not returned a successful run.

## Phone test order

Open staging in Chrome on Pixel; verify address; create sample tool; attach a PDF; view it offline; reconnect; sign into Google; back up; verify success status; export complete backup to Downloads; restore only on staging; compare tool count and PDF. Do not clear site data or uninstall the production app.
