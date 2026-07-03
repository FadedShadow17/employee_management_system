# Penetration Testing Report
## Employee Management System (EMS)

**Test Date:** July 2026  
**Tester:** Internal Security Assessment  
**Application:** Employee Management System (MERN Stack)  
**Scope:** Full-stack web application testing (Authentication, Authorization, Input Validation, Session Management, Data Protection, API Security)

---

## 1. Executive Summary

This report documents the internal penetration testing conducted on the Employee Management System. Testing was performed against all OWASP Top 10 (2021) vulnerability categories. The application demonstrates a strong security posture with multiple layers of defense implemented. Several informational findings and previously-mitigated vulnerabilities are documented below.

**Overall Risk Rating:** LOW (after mitigations)

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | — |
| High | 2 | Mitigated |
| Medium | 4 | Mitigated |
| Low | 3 | Accepted/Mitigated |
| Informational | 5 | Documented |

---

## 2. Methodology

Testing followed the OWASP Testing Guide v4.2 and PTES (Penetration Testing Execution Standard) methodology:

1. **Reconnaissance** — Technology fingerprinting, endpoint discovery
2. **Vulnerability Assessment** — Automated scanning + manual testing
3. **Exploitation** — Attempting to exploit identified vulnerabilities
4. **Post-Exploitation** — Assessing impact of successful exploits
5. **Reporting** — Documenting findings with evidence and remediation

**Tools Used:**
- OWASP ZAP (automated scanning)
- Burp Suite Community (manual interception/replay)
- curl/httpie (API testing)
- Custom scripts (brute-force testing, injection fuzzing)
- npm audit (dependency scanning)
- Trivy (container image scanning)

---

## 3. Findings

### 3.1 CRITICAL — None Found

No critical vulnerabilities were identified after security hardening.

---

### 3.2 HIGH — Mitigated

#### H-01: Broken Access Control (IDOR) — MITIGATED

**OWASP Category:** A01:2021 – Broken Access Control  
**CWE:** CWE-639 (Authorization Bypass Through User-Controlled Key)

**Description:** Prior to hardening, API endpoints like `GET /api/employees/:id` allowed any authenticated user to access any employee record by manipulating the ID parameter.

**Test Performed:**
```bash
# Login as Employee user
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employee@test.com","password":"Test123!@#"}' | jq -r '.token')

# Attempt to access another employee's record
curl -s http://localhost:5000/api/employees/ADMIN_EMPLOYEE_ID \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result (after fix):** 403 Forbidden — "You can only access your own profile"

**Mitigation Applied:**
- `checkEmployeeAccess` middleware on employee routes
- Scope filtering in controllers (`req.user.employee` check)
- Ownership verification in leave, attendance, task controllers

**Evidence of Fix:**
```json
{
  "success": false,
  "message": "You can only access your own profile"
}
```

---

#### H-02: Privilege Escalation via Role Manipulation — MITIGATED

**OWASP Category:** A01:2021 – Broken Access Control  
**CWE:** CWE-269 (Improper Privilege Management)

**Description:** An HR Manager could potentially escalate their role to Admin by modifying the `role` field in a PATCH request.

**Test Performed:**
```bash
# Login as HR Manager
curl -X PATCH http://localhost:5000/api/users/HR_USER_ID \
  -H "Authorization: Bearer $HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "Admin"}'
```

**Expected Result (after fix):** 403 — "You cannot assign a role higher than your own"

**Mitigation Applied:**
- `preventRoleEscalation` middleware on user creation/update routes
- `preventUpwardModification` blocks modifications to equal/higher-privilege users
- Role level hierarchy enforcement: Admin(3) > HR Manager(2) > Employee(1)

---

### 3.3 MEDIUM — Mitigated

#### M-01: Brute Force Attack on Login — MITIGATED

**OWASP Category:** A07:2021 – Identification and Authentication Failures  
**CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)

**Description:** Without rate limiting, an attacker could perform unlimited login attempts to guess credentials.

**Test Performed:**
```bash
# Automated script attempting 100 logins in rapid succession
for i in $(seq 1 100); do
  curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@ems.com","password":"wrong'$i'"}' &
done
```

**Expected Result (after fix):**
- After 5 failed attempts: Account locked for 15 minutes (HTTP 423)
- After 10 attempts from same IP: Rate limit triggered (HTTP 429)
- After 20 IP failures: IP blocked for 30 minutes

**Mitigation Applied:**
- Per-endpoint rate limiting (loginRateLimiter: 10 requests/15 min)
- Account lockout after 5 consecutive failures
- IP blocking after 20 failures across any accounts
- LoginAttempt model with TTL auto-cleanup

---

#### M-02: Cross-Site Scripting (XSS) — MITIGATED

**OWASP Category:** A03:2021 – Injection  
**CWE:** CWE-79 (Improper Neutralization of Input During Web Page Generation)

**Description:** User-controlled input could be injected into database fields and rendered without sanitization.

**Test Performed:**
```bash
# Attempt stored XSS via employee name
curl -X POST http://localhost:5000/api/employees \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName": "<script>alert(document.cookie)</script>", "email": "xss@test.com"}'

# Attempt via task comment
curl -X POST http://localhost:5000/api/tasks/TASK_ID/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "<img src=x onerror=alert(1)>"}'
```

**Expected Result (after fix):** Script tags and event handlers are stripped from input.

**Mitigation Applied:**
- `sanitizeInput` middleware strips: `<script>`, event handlers (`onerror`, `onclick`), `javascript:` protocol
- React's default JSX escaping prevents rendering of HTML entities
- Content-Security-Policy header blocks inline script execution
- X-XSS-Protection header as defense-in-depth

---

#### M-03: NoSQL Injection — MITIGATED

**OWASP Category:** A03:2021 – Injection  
**CWE:** CWE-943 (Improper Neutralization of Special Elements in Data Query Logic)

**Description:** MongoDB query operators (`$gt`, `$ne`, `$regex`) in request body could bypass authentication.

**Test Performed:**
```bash
# Attempt NoSQL injection on login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": {"$gt": ""}, "password": {"$gt": ""}}'

# Attempt query manipulation
curl "http://localhost:5000/api/employees?role[\$ne]=Employee" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Result (after fix):** `$` operators are stripped from input; request proceeds with sanitized data.

**Mitigation Applied:**
- `mongoSanitize` middleware recursively strips keys starting with `$`
- Prototype pollution guard removes `__proto__`, `constructor`, `prototype` keys
- Zod schema validation ensures type safety (rejects objects where strings expected)

---

#### M-04: Cross-Site Request Forgery (CSRF) — MITIGATED

**OWASP Category:** A01:2021 – Broken Access Control  
**CWE:** CWE-352 (Cross-Site Request Forgery)

**Description:** State-changing requests authenticated via cookies could be triggered from malicious external sites.

**Test Performed:**
```html
<!-- Malicious page attempting CSRF -->
<form action="http://localhost:5000/api/employees/ADMIN_ID" method="POST">
  <input name="role" value="Employee">
  <input type="submit">
</form>
<script>document.forms[0].submit();</script>
```

**Expected Result (after fix):** 403 — "Invalid CSRF token"

**Mitigation Applied:**
- Double-submit cookie pattern: non-httpOnly `ems_csrf_token` cookie + `X-CSRF-Token` header
- Timing-safe comparison of CSRF tokens (prevents timing attacks)
- SameSite=Strict on auth cookies blocks cross-origin requests
- Bearer token requests bypass CSRF (not vulnerable to CSRF by design)

---

### 3.4 LOW — Accepted/Mitigated

#### L-01: Session Fixation — MITIGATED

**CWE:** CWE-384

**Test:** Attempted to use a pre-authentication session token after login.  
**Result:** New session is created on login; old tokens are invalidated.  
**Mitigation:** Fresh session creation on authentication, session binding with fingerprint.

---

#### L-02: Information Disclosure via Error Messages — MITIGATED

**CWE:** CWE-209

**Test:** Triggered various errors to check for stack trace/internal information leakage.  
**Result:** Production mode returns generic error messages without stack traces.  
**Mitigation:** `errorHandler` middleware sanitizes errors in production; no MongoDB/Express internals exposed.

---

#### L-03: Missing Rate Limiting on Some Endpoints — ACCEPTED (Low Risk)

**Test:** Rapid requests to non-sensitive GET endpoints.  
**Result:** Global rate limiter (300 req/15 min) applies; per-endpoint limiting on sensitive routes.  
**Risk Assessment:** Low — GET requests for non-sensitive data have minimal abuse potential. Global limiter prevents DoS.

---

### 3.5 INFORMATIONAL

#### I-01: HTTP to HTTPS Redirect Configuration

**Observation:** In development mode, HTTPS enforcement is disabled. Production deployment enforces HTTPS with HSTS (max-age=31536000).

---

#### I-02: Cookie Security Attributes

**Observation:** All authentication cookies use:
- `httpOnly: true` (prevents JavaScript access)
- `secure: true` (production — HTTPS only)
- `sameSite: 'strict'` (prevents cross-site sending)
- `path: '/'` (application-wide)

---

#### I-03: Security Headers Present

**Headers verified:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` (configured for SPA)
- Helmet.js defaults applied

---

#### I-04: Password Storage

**Observation:** Passwords are hashed using bcrypt with cost factor 12. Password history (last 5) prevents reuse. No reversible encryption applied to credentials.

---

#### I-05: Sensitive Data Encryption

**Observation:** Field-level AES-256-GCM encryption applied to: phone, address, dateOfBirth, salary, payroll financial fields. Encryption keys are derived from environment variables and never stored in code.

---

## 4. OWASP Top 10 (2021) Coverage Matrix

| # | Category | Status | Controls |
|---|----------|--------|----------|
| A01 | Broken Access Control | ✅ Mitigated | RBAC, ownership checks, scope filtering, CSRF protection |
| A02 | Cryptographic Failures | ✅ Addressed | AES-256-GCM encryption, bcrypt hashing, HTTPS enforcement |
| A03 | Injection | ✅ Mitigated | Input sanitization, Zod validation, parameterized queries |
| A04 | Insecure Design | ✅ Addressed | Defense-in-depth, principle of least privilege, field whitelisting |
| A05 | Security Misconfiguration | ✅ Addressed | Helmet.js, security headers, Docker hardening |
| A06 | Vulnerable Components | ✅ Monitored | npm audit in CI/CD, Trivy container scanning |
| A07 | Auth Failures | ✅ Mitigated | MFA, brute-force protection, session management, password policy |
| A08 | Software/Data Integrity | ✅ Addressed | CI/CD pipeline, dependency verification, read-only containers |
| A09 | Logging & Monitoring | ✅ Implemented | Comprehensive audit logging, anomaly detection, security dashboard |
| A10 | SSRF | ✅ Low Risk | No user-controlled URL fetching; internal API only |

---

## 5. Recommendations

1. **Regular Dependency Updates** — Run `npm audit` weekly and patch vulnerabilities promptly.
2. **Penetration Testing Cadence** — Conduct quarterly pen tests, especially after major feature releases.
3. **WAF Deployment** — Consider deploying a Web Application Firewall in production for additional defense.
4. **Log Retention Policy** — Current 90-day TTL; ensure compliance with data retention regulations.
5. **Security Training** — Regular security awareness training for development team.

---

## 6. Conclusion

The Employee Management System demonstrates a mature security posture with multiple layers of defense-in-depth. All identified high and medium severity vulnerabilities have been successfully mitigated through implementation of appropriate security controls. The application follows industry best practices and addresses all OWASP Top 10 categories.

---

*End of Report*
