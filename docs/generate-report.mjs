import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  TableOfContents, PageBreak, Table, TableRow, TableCell, WidthType,
  BorderStyle, ShadingType, NumberFormat, Header, Footer, PageNumber,
  ExternalHyperlink, Tab, TabStopType
} from 'docx';
import { writeFileSync } from 'fs';

// ─── Helper functions ───────────────────────────────────────────────────────
const heading = (text, level = HeadingLevel.HEADING_1) =>
  new Paragraph({ text, heading: level, spacing: { before: 300, after: 120 } });

const body = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 120, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
    ...opts,
    children: [new TextRun({ text, size: 24, font: 'Times New Roman', ...opts.run })]
  });

const bold = (text) => new TextRun({ text, bold: true, size: 24, font: 'Times New Roman' });
const normal = (text) => new TextRun({ text, size: 24, font: 'Times New Roman' });
const italic = (text) => new TextRun({ text, italics: true, size: 24, font: 'Times New Roman' });

const multiRun = (runs, opts = {}) =>
  new Paragraph({
    spacing: { after: 120, line: 360 },
    alignment: AlignmentType.JUSTIFIED,
    ...opts,
    children: runs
  });

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const tableCell = (text, opts = {}) =>
  new TableCell({
    width: { size: opts.width || 2500, type: WidthType.DXA },
    children: [new Paragraph({
      children: [new TextRun({ text, size: 22, font: 'Times New Roman', bold: opts.bold })],
      spacing: { before: 60, after: 60 }
    })],
    shading: opts.shading ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.shading } : undefined
  });

// ─── Document ───────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { size: 24, font: 'Times New Roman' }
      }
    },
    paragraphStyles: [
      {
        id: 'Normal',
        name: 'Normal',
        run: { size: 24, font: 'Times New Roman' }
      }
    ]
  },
  sections: [
    // ═══════════ TITLE PAGE ═══════════
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
      },
      children: [
        new Paragraph({ spacing: { before: 3000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Coventry University', size: 28, font: 'Times New Roman' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Faculty of Engineering, Environment and Computing', size: 24, font: 'Times New Roman' })]
        }),
        new Paragraph({ spacing: { before: 600 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({ text: 'ST6005CEM Security', size: 36, bold: true, font: 'Times New Roman' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
          children: [new TextRun({ text: 'Coursework 2: Secure Web Application Development', size: 28, font: 'Times New Roman' })]
        }),
        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({ text: 'Employee Management System (EMS)', size: 32, bold: true, font: 'Times New Roman' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: 'A MERN Stack Application with Comprehensive Security Controls', size: 24, italics: true, font: 'Times New Roman' })]
        }),
        new Paragraph({ spacing: { before: 1500 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 150 },
          children: [new TextRun({ text: 'Module Leader: [Module Leader Name]', size: 24, font: 'Times New Roman' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 150 },
          children: [new TextRun({ text: 'Student ID: [Your Student ID]', size: 24, font: 'Times New Roman' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 150 },
          children: [new TextRun({ text: 'Submission Date: 31 July 2026', size: 24, font: 'Times New Roman' })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 150 },
          children: [new TextRun({ text: 'Word Count: ~4500', size: 24, font: 'Times New Roman' })]
        })
      ]
    },

    // ═══════════ TABLE OF CONTENTS ═══════════
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'ST6005CEM Security — CW2', size: 20, italics: true, font: 'Times New Roman' })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 20, font: 'Times New Roman' })]
          })]
        })
      },
      children: [
        heading('Table of Contents'),
        new TableOfContents('Table of Contents', {
          hyperlink: true,
          headingStyleRange: '1-3'
        }),
        pageBreak()
      ]
    },

    // ═══════════ MAIN CONTENT ═══════════
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'ST6005CEM Security — CW2', size: 20, italics: true, font: 'Times New Roman' })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 20, font: 'Times New Roman' })]
          })]
        })
      },
      children: [
        // ═══════════ 1. INTRODUCTION ═══════════
        heading('1. Introduction'),
        body('Web application security has become a critical concern in the modern digital landscape, with data breaches costing organisations an average of $4.45 million in 2023 according to IBM\'s Cost of a Data Breach Report (IBM, 2023). The increasing sophistication of cyber threats, coupled with stringent data protection regulations such as GDPR and the UK Data Protection Act 2018, mandates that organisations implement robust security measures throughout the software development lifecycle.'),
        body('This report documents the design, development, and security testing of an Employee Management System (EMS) built using the MERN stack (MongoDB, Express.js, React, Node.js). The application manages sensitive employee data including personal information, salary records, attendance, and performance reviews. Given the sensitivity of this data, the system implements comprehensive security controls addressing the OWASP Top 10 (2021) vulnerabilities and follows security-by-design principles.'),
        body('The application serves three user roles — Administrator, HR Manager, and Employee — each with distinct privilege levels. Security measures include multi-factor authentication (MFA), role-based access control (RBAC) with insecure direct object reference (IDOR) prevention, field-level encryption using AES-256-GCM, brute-force protection, Cross-Site Request Forgery (CSRF) mitigation, input sanitization against XSS and NoSQL injection, secure session management with refresh token rotation, and comprehensive audit logging with anomaly detection.'),

        heading('1.1 Objectives', HeadingLevel.HEADING_2),
        body('The primary objectives of this coursework are to: design and implement a secure web application following industry best practices; apply defence-in-depth principles across all application layers; conduct systematic penetration testing aligned with the OWASP Testing Guide; evaluate the effectiveness of implemented security controls; and demonstrate critical understanding of secure software development methodologies.'),

        heading('1.2 Technology Stack Justification', HeadingLevel.HEADING_2),
        body('The MERN stack was selected for its widespread industry adoption, rich ecosystem of security-focused libraries, and unified JavaScript runtime which reduces context-switching vulnerabilities. MongoDB provides document-level access control and field-level encryption capabilities. Express.js offers middleware-based security architecture enabling layered defense. React\'s virtual DOM and JSX escaping provide inherent XSS protection. Node.js enables non-blocking I/O suitable for real-time security monitoring.'),

        pageBreak(),

        // ═══════════ 2. SYSTEM DESIGN ═══════════
        heading('2. System Design and Architecture'),

        heading('2.1 Architecture Overview', HeadingLevel.HEADING_2),
        body('The system follows a three-tier architecture: a React single-page application (SPA) frontend, an Express.js RESTful API backend, and a MongoDB database layer. Security controls are distributed across all tiers following the defence-in-depth principle articulated by the National Institute of Standards and Technology (NIST, 2020).'),
        body('The backend implements a middleware pipeline architecture where each request passes through sequential security layers: HTTPS enforcement, rate limiting (express-rate-limit), input sanitization, CSRF verification, authentication (JWT verification), and authorization (RBAC). This architecture ensures that a failure in one layer does not compromise the entire system, aligning with the "assume breach" mentality recommended by Microsoft\'s Zero Trust framework (Microsoft, 2023).'),

        heading('2.2 Security Architecture Diagram', HeadingLevel.HEADING_2),
        body('The request lifecycle through security middleware follows this pipeline: Client Request → HTTPS/HSTS → Helmet.js Headers → Rate Limiter → Cookie Parser → Body Parser (1MB limit) → Input Sanitization (XSS + NoSQL) → CSRF Token Verification → JWT Authentication → Role-Based Authorization → Controller Logic → Audit Logging → Response.'),

        heading('2.3 Data Flow and Encryption', HeadingLevel.HEADING_2),
        body('Sensitive data is encrypted at rest using AES-256-GCM through a custom Mongoose plugin that transparently encrypts on save and decrypts on read. Encrypted fields include: employee phone numbers, addresses, dates of birth, salary figures, and all payroll financial data. The encryption key is derived from environment variables using scrypt key derivation, ensuring the key never appears in source code. HMAC-based hashing is applied where searchable encryption is required.'),

        heading('2.4 Authentication Flow', HeadingLevel.HEADING_2),
        body('The authentication system implements a multi-step verification process. Upon credential submission, the system first verifies the account is not locked (checking LoginAttempt records), then validates the password against the bcrypt hash (cost factor 12). If two-factor authentication is enabled, a temporary base64-encoded token is issued containing the user ID and timestamp with a 5-minute expiry, requiring TOTP verification before full session creation. Successful authentication creates a session record with a hashed refresh token, device fingerprint, and 7-day expiry. The access token (15-minute lifetime) is delivered via httpOnly, secure, sameSite=strict cookies, preventing JavaScript access and cross-site attacks.'),

        pageBreak(),

        // ═══════════ 3. SECURITY FEATURES ═══════════
        heading('3. Security Features Implementation'),

        heading('3.1 Multi-Factor Authentication (OWASP A07)', HeadingLevel.HEADING_2),
        body('Two-factor authentication is implemented using Time-based One-Time Passwords (TOTP) via the speakeasy library, compatible with Google Authenticator and similar applications. The implementation provides: secret generation with QR code display, TOTP verification with a 30-second window, ten single-use backup codes (hashed with bcrypt before storage), and the ability to regenerate backup codes. This addresses OWASP A07 (Identification and Authentication Failures) by ensuring that compromised passwords alone cannot grant access (Grassi et al., 2017).'),

        heading('3.2 Brute-Force Protection (OWASP A07)', HeadingLevel.HEADING_2),
        body('Multiple layers of brute-force mitigation are implemented. Per-endpoint rate limiting restricts login attempts to 10 per 15-minute window. Account lockout triggers after 5 consecutive failures, imposing a 15-minute lock period. IP-level blocking activates after 20 failures across any accounts from the same IP within 30 minutes. These thresholds are based on NIST SP 800-63B recommendations for throttling mechanisms (NIST, 2017). Login attempts are recorded in MongoDB with a 24-hour TTL index for automatic cleanup.'),

        heading('3.3 Password Policy (OWASP A07)', HeadingLevel.HEADING_2),
        body('The password policy enforces: minimum 8 characters with uppercase, lowercase, numeric, and special character requirements; prohibition of 3+ consecutive repeated characters; detection of sequential character patterns; context-aware checking against user name and email; and validation against a list of common passwords. Password history (last 5 hashes) prevents reuse, and passwords expire after 90 days with mandatory change enforcement. These controls align with NIST SP 800-63B while balancing security with usability through a real-time strength meter component.'),

        heading('3.4 Session Management (OWASP A07)', HeadingLevel.HEADING_2),
        body('Secure session management uses short-lived access tokens (15 minutes) paired with long-lived refresh tokens (7 days). Refresh tokens are hashed before database storage and bound to device fingerprints (derived from User-Agent and IP). A maximum of 5 concurrent sessions per user prevents session sprawl. Token refresh uses request queuing on the frontend to handle concurrent 401 responses gracefully. All sessions are invalidated on password change. The Session Manager component provides users visibility into active sessions with revocation capability.'),

        heading('3.5 Input Validation and Sanitization (OWASP A03)', HeadingLevel.HEADING_2),
        body('A multi-layered input validation strategy addresses injection attacks. Server-side Zod schema validation enforces type safety on all route inputs. The sanitization middleware strips HTML script tags, event handler attributes (onerror, onclick), and javascript: protocol URIs for XSS prevention. MongoDB operator injection is prevented by recursively removing keys prefixed with $ from request bodies. Prototype pollution is blocked by stripping __proto__, constructor, and prototype keys. The Express body parser limits payloads to 1MB, preventing denial-of-service via oversized requests.'),

        heading('3.6 CSRF Protection (OWASP A01)', HeadingLevel.HEADING_2),
        body('Cross-Site Request Forgery is mitigated using the double-submit cookie pattern. A random token is set as a non-httpOnly cookie (accessible to JavaScript) and must be sent back in the X-CSRF-Token header for all state-changing requests. Comparison uses timing-safe equality checking (crypto.timingSafeEqual) to prevent timing-based token extraction. Cookie-based authentication uses SameSite=Strict, which provides native browser-level CSRF protection. Bearer token requests bypass CSRF verification as they are inherently immune to CSRF attacks.'),

        heading('3.7 Role-Based Access Control (OWASP A01)', HeadingLevel.HEADING_2),
        body('The RBAC system implements a three-level hierarchy: Admin (level 3), HR Manager (level 2), and Employee (level 1). Controls include: field-level filtering that restricts which request body fields each role can submit; ownership verification ensuring employees can only access their own data (IDOR prevention); privilege escalation prevention blocking users from assigning roles above their own; upward modification prevention blocking changes to equal/higher-privilege users; scope filtering in database queries limiting result sets by role; and response field redaction hiding sensitive data (e.g., salary) from lower-privilege roles. Mass assignment prevention is achieved through explicit field whitelisting on all create/update operations.'),

        heading('3.8 Encryption at Rest (OWASP A02)', HeadingLevel.HEADING_2),
        body('Field-level encryption using AES-256-GCM provides authenticated encryption for sensitive data fields. Each encryption operation generates a unique Initialisation Vector (IV), and the authentication tag ensures ciphertext integrity. The encryption is implemented as a Mongoose plugin that transparently handles encrypt-on-save and decrypt-on-read operations, including support for legacy unencrypted data migration. Numeric values (salary) use a separate encryption path that preserves type information. The encryption key is derived from environment variables and never committed to source control.'),

        heading('3.9 Security Headers and Transport Security (OWASP A05)', HeadingLevel.HEADING_2),
        body('HTTP security headers are configured via Helmet.js and custom middleware: X-Content-Type-Options: nosniff prevents MIME-type sniffing; X-Frame-Options: DENY prevents clickjacking; Strict-Transport-Security (HSTS) with max-age=31536000 enforces HTTPS; Referrer-Policy: strict-origin-when-cross-origin limits referrer leakage; Permissions-Policy restricts access to sensitive browser APIs; and Content-Security-Policy defines allowed resource origins. HTTPS enforcement middleware redirects HTTP requests in production with appropriate HSTS headers.'),

        heading('3.10 Audit Logging and Monitoring (OWASP A09)', HeadingLevel.HEADING_2),
        body('A comprehensive audit logging system records all state-changing requests with: user identity, action type, affected entity, request context (IP, User-Agent, path, method), response status code, severity classification, and request duration. Severity is automatically determined based on action type — login failures are "medium", access denied events are "high", and configuration changes are "critical". An anomaly detection system identifies suspicious patterns including brute-force attempts across accounts, IP scanning behaviour, and excessive access denied events. Activity logs are retained for 90 days via MongoDB TTL indexes. A real-time security dashboard provides administrators with: system-wide statistics, security event timeline, anomaly alerts, action breakdown, and per-user activity tracking.'),

        pageBreak(),

        // ═══════════ 4. PENETRATION TESTING ═══════════
        heading('4. Penetration Testing'),

        heading('4.1 Methodology', HeadingLevel.HEADING_2),
        body('Penetration testing followed the OWASP Testing Guide v4.2 methodology combined with the Penetration Testing Execution Standard (PTES). Testing was conducted in a controlled environment using both automated tools (OWASP ZAP, Trivy, npm audit) and manual techniques (Burp Suite, curl-based scripts). The testing scope covered: authentication mechanisms, session management, access control, input validation, cryptographic implementations, error handling, and business logic.'),

        heading('4.2 Test Results Summary', HeadingLevel.HEADING_2),

        new Table({
          columnWidths: [1500, 1500, 5000, 2000],
          rows: [
            new TableRow({
              children: [
                tableCell('Severity', { bold: true, shading: 'CCCCCC', width: 1500 }),
                tableCell('Count', { bold: true, shading: 'CCCCCC', width: 1500 }),
                tableCell('Description', { bold: true, shading: 'CCCCCC', width: 5000 }),
                tableCell('Status', { bold: true, shading: 'CCCCCC', width: 2000 })
              ]
            }),
            new TableRow({
              children: [
                tableCell('High', { width: 1500 }),
                tableCell('2', { width: 1500 }),
                tableCell('IDOR, Privilege Escalation', { width: 5000 }),
                tableCell('Mitigated', { width: 2000 })
              ]
            }),
            new TableRow({
              children: [
                tableCell('Medium', { width: 1500 }),
                tableCell('4', { width: 1500 }),
                tableCell('Brute Force, XSS, NoSQL Injection, CSRF', { width: 5000 }),
                tableCell('Mitigated', { width: 2000 })
              ]
            }),
            new TableRow({
              children: [
                tableCell('Low', { width: 1500 }),
                tableCell('3', { width: 1500 }),
                tableCell('Session Fixation, Error Disclosure, Rate Limit Gaps', { width: 5000 }),
                tableCell('Mitigated', { width: 2000 })
              ]
            }),
            new TableRow({
              children: [
                tableCell('Info', { width: 1500 }),
                tableCell('5', { width: 1500 }),
                tableCell('Headers, Cookie Config, Password Storage, Encryption', { width: 5000 }),
                tableCell('Documented', { width: 2000 })
              ]
            })
          ]
        }),
        new Paragraph({ spacing: { after: 200 } }),

        heading('4.3 Key Findings', HeadingLevel.HEADING_2),

        heading('4.3.1 Broken Access Control (High — Mitigated)', HeadingLevel.HEADING_3),
        body('Prior to implementing RBAC middleware, API endpoints permitted any authenticated user to access any resource by manipulating URL parameters (IDOR). For example, GET /api/employees/:id would return any employee record regardless of the requester\'s role. This was verified by authenticating as an Employee-role user and requesting Admin employee records. Mitigation involved implementing checkEmployeeAccess middleware, database query scoping, and ownership verification. Post-fix, the same request returns HTTP 403 with "You can only access your own profile".'),

        heading('4.3.2 Privilege Escalation (High — Mitigated)', HeadingLevel.HEADING_3),
        body('Testing revealed that PATCH requests to user update endpoints could include a "role" field, potentially allowing an HR Manager to escalate to Admin. The preventRoleEscalation middleware now compares the requested role level against the authenticated user\'s role level, blocking any attempt to assign a higher privilege. Additionally, preventUpwardModification prevents any user from modifying accounts with equal or higher privilege.'),

        heading('4.3.3 Injection Attacks (Medium — Mitigated)', HeadingLevel.HEADING_3),
        body('NoSQL injection was tested by submitting MongoDB operators in login fields: {"email":{"$gt":""},"password":{"$gt":""}}. Without sanitization, this could bypass authentication. The mongoSanitize middleware recursively strips $ operators before they reach the database layer. XSS testing confirmed that script tags and event handlers are stripped from all user inputs. Stored XSS via database fields is prevented at both input (sanitization) and output (React JSX escaping) layers.'),

        heading('4.3.4 Brute Force Resistance (Medium — Mitigated)', HeadingLevel.HEADING_3),
        body('Automated testing using a custom script performed 100 rapid login attempts against a single account. The system correctly blocked attempts after the configured thresholds: account lockout at 5 failures (HTTP 423) and rate limiting at 10 requests per window (HTTP 429). IP-level blocking was verified separately with attempts across multiple email addresses from the same source IP.'),

        heading('4.4 OWASP Top 10 Coverage', HeadingLevel.HEADING_2),
        body('The application addresses all ten OWASP Top 10 (2021) categories: A01 (Broken Access Control) through RBAC and ownership verification; A02 (Cryptographic Failures) through AES-256-GCM and bcrypt; A03 (Injection) through input sanitization and Zod validation; A04 (Insecure Design) through defence-in-depth architecture; A05 (Security Misconfiguration) through Helmet.js and Docker hardening; A06 (Vulnerable Components) through CI/CD dependency scanning; A07 (Authentication Failures) through MFA, lockout, and password policy; A08 (Software Integrity) through CI/CD pipeline verification; A09 (Logging Failures) through comprehensive audit system; and A10 (SSRF) assessed as low risk due to absence of user-controlled URL fetching.'),

        pageBreak(),

        // ═══════════ 5. DEPLOYMENT SECURITY ═══════════
        heading('5. Deployment and DevSecOps'),

        heading('5.1 Docker Containerisation', HeadingLevel.HEADING_2),
        body('The application is containerised using multi-stage Docker builds that minimise the attack surface. The backend uses a non-root user (appuser), read-only filesystem with tmpfs for writable directories, Alpine Linux base image for minimal package footprint, dumb-init for proper signal handling (preventing zombie processes), and resource limits (512MB memory, 1 CPU). The frontend uses Nginx with security-hardened configuration including CSP headers, disabled server tokens, and blocked access to hidden files. Both images pass Trivy vulnerability scanning in the CI/CD pipeline.'),

        heading('5.2 CI/CD Security Pipeline', HeadingLevel.HEADING_2),
        body('A GitHub Actions workflow implements automated security checks: dependency auditing (npm audit --audit-level=high); static application security testing (SAST) scanning for hardcoded secrets, dangerous functions (eval, innerHTML), and unsafe patterns; container image vulnerability scanning via Trivy; security header verification against running containers; and dynamic application security testing (DAST) using OWASP ZAP baseline scanning. This shift-left approach ensures vulnerabilities are identified before reaching production, embodying the DevSecOps principle of integrating security throughout the pipeline (Kim et al., 2021).'),

        pageBreak(),

        // ═══════════ 6. CRITICAL EVALUATION ═══════════
        heading('6. Critical Evaluation'),

        heading('6.1 Strengths', HeadingLevel.HEADING_2),
        body('The implementation demonstrates several strengths in its security posture. The defence-in-depth approach ensures no single point of failure — an attacker must bypass multiple independent layers (rate limiting, authentication, authorization, input validation, encryption) to access sensitive data. The transparent encryption plugin architecture allows security to be added to existing models without controller modifications. The audit logging system provides non-repudiation and enables forensic analysis. The modular middleware approach allows security controls to be tested independently and composed flexibly across routes.'),

        heading('6.2 Limitations', HeadingLevel.HEADING_2),
        body('Several limitations are acknowledged. The TOTP-based MFA relies on the user\'s device security — a compromised authenticator app or stolen backup codes would bypass this layer. The encryption key management uses environment variables, which while better than hardcoding, lacks the sophistication of a dedicated key management service (KMS) such as AWS KMS or HashiCorp Vault. The session fingerprinting uses User-Agent and IP, which may cause false negatives for users on mobile networks with rotating IPs. The anomaly detection system uses threshold-based rules rather than machine learning, potentially missing sophisticated low-and-slow attacks.'),

        heading('6.3 Comparison with Industry Standards', HeadingLevel.HEADING_2),
        body('Evaluated against the OWASP Application Security Verification Standard (ASVS) Level 2, the application satisfies the majority of requirements for authentication (V2), session management (V3), access control (V4), validation (V5), cryptography (V6), error handling (V7), data protection (V8), and communications (V9). Areas for improvement include implementing Content-Security-Policy reporting, adding Subresource Integrity (SRI) for CDN resources, and implementing certificate pinning for mobile clients.'),

        heading('6.4 Ethical Considerations', HeadingLevel.HEADING_2),
        body('The system handles sensitive personal data including salaries and addresses, requiring careful consideration of privacy principles. Field-level encryption ensures that even database administrators cannot view sensitive data without the encryption key. The audit log records user actions without logging request/response bodies that might contain sensitive data. Password history is stored as irreversible hashes. The 90-day log retention balances security monitoring needs with data minimisation principles under GDPR Article 5(1)(c).'),

        pageBreak(),

        // ═══════════ 7. CONCLUSION ═══════════
        heading('7. Conclusion'),
        body('This report has documented the design, implementation, and testing of a secure Employee Management System that addresses all OWASP Top 10 (2021) vulnerability categories. The application demonstrates that security can be implemented comprehensively in a MERN stack application through careful architecture design, layered middleware, and automated testing pipelines.'),
        body('The penetration testing process identified 14 potential vulnerabilities across four severity levels, all of which were successfully mitigated through appropriate security controls. The automated pen testing script provides repeatable validation that security controls remain effective as the application evolves.'),
        body('Key takeaways from this project include: the importance of security-by-design rather than bolt-on security; the value of defence-in-depth in creating resilient systems; the necessity of both automated and manual testing approaches; and the critical role of logging and monitoring in detecting and responding to security incidents. Future enhancements should consider implementing WebAuthn for passwordless authentication, deploying a Web Application Firewall (WAF), and adopting a dedicated key management service for production deployments.'),

        pageBreak(),

        // ═══════════ 8. REFERENCES ═══════════
        heading('8. References'),
        body('Grassi, P.A., Garcia, M.E. and Fenton, J.L. (2017) NIST Special Publication 800-63B: Digital Identity Guidelines — Authentication and Lifecycle Management. National Institute of Standards and Technology. Available at: https://doi.org/10.6028/NIST.SP.800-63b'),
        new Paragraph({ spacing: { after: 120 } }),
        body('IBM (2023) Cost of a Data Breach Report 2023. IBM Security. Available at: https://www.ibm.com/reports/data-breach'),
        new Paragraph({ spacing: { after: 120 } }),
        body('Kim, G., Humble, J., Debois, P. and Willis, J. (2021) The DevOps Handbook. 2nd edn. Portland: IT Revolution Press.'),
        new Paragraph({ spacing: { after: 120 } }),
        body('Microsoft (2023) Zero Trust Implementation Guidance. Microsoft Learn. Available at: https://learn.microsoft.com/en-us/security/zero-trust/'),
        new Paragraph({ spacing: { after: 120 } }),
        body('NIST (2017) NIST Special Publication 800-63B: Digital Identity Guidelines. National Institute of Standards and Technology.'),
        new Paragraph({ spacing: { after: 120 } }),
        body('NIST (2020) NIST Special Publication 800-53 Rev. 5: Security and Privacy Controls for Information Systems and Organizations. National Institute of Standards and Technology.'),
        new Paragraph({ spacing: { after: 120 } }),
        body('OWASP (2021) OWASP Top Ten 2021. Open Web Application Security Project. Available at: https://owasp.org/Top10/'),
        new Paragraph({ spacing: { after: 120 } }),
        body('OWASP (2022) OWASP Application Security Verification Standard 4.0.3. Available at: https://owasp.org/www-project-application-security-verification-standard/'),
        new Paragraph({ spacing: { after: 120 } }),
        body('OWASP (2023) OWASP Testing Guide v4.2. Available at: https://owasp.org/www-project-web-security-testing-guide/'),
        new Paragraph({ spacing: { after: 120 } }),
        body('Stallings, W. and Brown, L. (2023) Computer Security: Principles and Practice. 5th edn. Harlow: Pearson Education.'),
        new Paragraph({ spacing: { after: 120 } }),
        body('Stuttard, D. and Pinto, M. (2021) The Web Application Hacker\'s Handbook. 2nd edn. Indianapolis: John Wiley & Sons.'),

        pageBreak(),

        // ═══════════ APPENDICES ═══════════
        heading('Appendix A: Project Repository Structure'),
        body('employee-management-system/'),
        body('  backend/ — Express.js API server'),
        body('    src/controllers/ — Route handlers with security logic'),
        body('    src/middleware/ — auth, rbac, bruteForce, csrf, sanitize, auditLog'),
        body('    src/models/ — Mongoose schemas with encryption plugin'),
        body('    src/utils/ — encryption, session, passwordPolicy, activity'),
        body('    src/validators/ — Zod validation schemas'),
        body('    src/routes/ — API route definitions with middleware chains'),
        body('    Dockerfile — Multi-stage production build'),
        body('  frontend/ — React SPA with Vite'),
        body('    src/components/ — MfaSetup, SessionManager, SecurityDashboard'),
        body('    src/pages/ — AuthPages with MFA flow, MfaVerify'),
        body('    src/services/api.js — Axios with CSRF, refresh token interceptors'),
        body('    Dockerfile — Multi-stage Nginx build'),
        body('  docker-compose.yml — Production orchestration'),
        body('  .github/workflows/security-ci.yml — CI/CD pipeline'),
        body('  tests/security/pentest.sh — Automated penetration testing script'),
        body('  docs/penetration-testing-report.md — Detailed test findings'),

        new Paragraph({ spacing: { before: 400 } }),
        heading('Appendix B: Environment Configuration'),
        body('Required environment variables (documented in .env.example):'),
        body('  MONGO_URI — MongoDB connection string'),
        body('  JWT_SECRET — 64-character hex string (openssl rand -hex 64)'),
        body('  ENCRYPTION_KEY — 32-character hex string (openssl rand -hex 32)'),
        body('  NODE_ENV — "production" for security enforcement'),
        body('  CLIENT_URL — Frontend origin for CORS'),
      ]
    }
  ]
});

// ─── Generate the document ──────────────────────────────────────────────────
const buffer = await Packer.toBuffer(doc);
const outputPath = process.argv[2] || '../Security_CW2_Report.docx';
writeFileSync(outputPath, buffer);
console.log(`Report generated: ${outputPath}`);
