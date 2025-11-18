# Login System Improvements

## Overview
The login flow has been hardened for an offline-only deployment. All legacy inline handlers were retired and replaced by the new `js/auth/login-robust.js` module, which now owns authentication, session lifecycle, and failure handling. Legacy administrator credentials (`MasterAdmin/FFA@dm1n2025!` and `Doc121/FFA121`) are preserved and short-circuit before any hashing.

## Security & Stability Enhancements

- **PBKDF2-SHA-256 password storage**
  - 100k iterations, 16-byte per-user salt, Hex + PBKDF2 metadata stored beside each account.
  - Legacy SHA-256 / base64 hashes are auto-migrated on first successful login.
- **Client-side rate limiting**
  - Five failed attempts trigger a 60-second lock enforced via `sessionStorage` keys.
  - Friendly countdown/error messaging surfaced in the form.
- **Session lifecycle enforcement**
  - 120-minute TTL maintained via `refreshLoginSessionTTL()` helper.
  - Every auto-login path (account creation, dev bypass, Chrome extension flows) now refreshes the TTL.
  - `CareConnectAuth.clearLoginState()` + enhanced `logout()` reset attempts, TTL, and UI state.
- **Resilient DOM initialization**
  - `waitForElement()` with retry loop prevents null dereferences.
  - All critical SessionStorage operations are wrapped in try/catch.
- **Strong default CSP & SRI**
  - CSP tightened with `form-action 'self'` and `frame-ancestors 'none'`.
  - The new module is served with `integrity="sha384-Ac2DdHV86VST4ShBNy56I9JO083MV7E3YG/HTt1YrlyGSevt1o6uysRUrOO4H9ZQ"` and `crossorigin="anonymous"`.
- **UI integration**
  - Original inline login block is fully commented out; the HTML now delegates to `window.handleLogin` exposed by the module.
  - Auxiliary helpers (`showWelcomeAnimation`, `updateUserDisplay`, account creation UI) remain and reuse the module for credential work.

## Integration Notes

- Load order: `<script defer src="js/auth/login-robust.js" integrity="…">` in the `<head>` guarantees the module initializes before the login screen renders.
- Global APIs exposed:
  - `window.handleLogin(event)` – primary submit handler (includes rate limiting, TTL, encryption bootstrap).
  - `window.isLoggedIn()` – checks login state + TTL.
  - `window.CareConnectAuth.addUserAccount / verifyCredentials / clearLoginState / setSessionExpiry`.
- Helper `refreshLoginSessionTTL(ttlMinutes)` is available within `CareConnect-Pro_v12.1-STABLE.html` for any bespoke login pathways.
- Legacy auto-login paths (dev + Chrome extension) still function, but now comply with the new TTL + cleanup logic.

## Testing Checklist

- [ ] MasterAdmin (`FFA@dm1n2025!`) login succeeds.
- [ ] Legacy Doc121 (`FFA121`) login succeeds.
- [ ] PBKDF2 account login succeeds and auto-migrates any legacy hash.
- [ ] Invalid credentials trigger rate limiting and the 60-second lock after five attempts.
- [ ] TTL expiry (manually update clock or wait) forces relogin and clears encrypted context.
- [ ] Logout hides the app, clears attempts, and shows the login screen with reset form.
- [ ] Chrome extension auto-login paths refresh TTL and still initialize encryption.
- [ ] CSP/SRI: loading the HTML in an iframe should now fail; tampering with `login-robust.js` should raise an SRI error.

## Operational Guidance

- **Landing page integration**: Continue to point new front-end experiences at `window.handleLogin` and/or `CareConnectAuth.verifyCredentials`. The module already exposes everything needed for future onboarding / tutorials.
- **Offline resilience**: All state persists only in sandboxed `localStorage`/`sessionStorage`. Include TTL refreshes whenever new entry points set `isLoggedIn` manually.
- **Extension workflows**: Ensure `sessionStorage.setItem('allowExtensionAutoLogin','true')` remains explicit; the module will otherwise require manual login.

## Future Considerations

- Session-expiry warnings prior to forced logout.
- Optional WebAuthn / Passkey support once browser compatibility requirements change.
- Secure backup/export of account vault (salted hashes) for disaster recovery.
- UI for rate-limit countdown and TTL indicator if coaches request visibility.

