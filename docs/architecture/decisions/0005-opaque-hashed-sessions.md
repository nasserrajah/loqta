# ADR 0005: Opaque hashed sessions and password reset tokens

Status: Accepted

## Context

The API serves both a future browser frontend and API clients. JWTs would require key management and
make immediate revocation harder. Cookies alone would exclude non-browser clients. Password reset
tokens must be single-use and must not remain usable if the database leaks.

## Decision

1. Issue a 32-byte random opaque token at register/login.
2. Store only its SHA-256 hash in `sessions`; return the raw token once in an HttpOnly cookie.
3. Accept the same token as `Authorization: Bearer`.
4. Cookie settings: `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production.
5. Password reset tokens follow the same hash-only pattern, expire, and are consumed with a
   conditional `UPDATE ... WHERE used_at IS NULL` so concurrent use cannot succeed twice.
6. Password changes and resets revoke sessions. A password change keeps the current session; a reset
   revokes all sessions.

## Consequences

- Logout and admin/user revocation are immediate because the server owns session state.
- A database leak exposes neither session tokens nor reset tokens in usable form.
- Every authenticated request performs a session lookup and user lookup; acceptable at this scale.
- Production must use HTTPS, otherwise `Secure` cookies are not sent.
