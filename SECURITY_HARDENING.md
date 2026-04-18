# Security Hardening Implementation Guide

## Overview
This document outlines the production-ready security improvements implemented in the Smart Campus Management Platform (CampusX).

---

## 🔐 Critical Security Changes

### 1. **JWT Token Storage: localStorage → httpOnly Cookies**

**Problem:** Storing JWT in `localStorage` exposes tokens to XSS attacks.

**Solution:** Tokens are now stored in secure httpOnly cookies.

#### Backend Changes:
- **New File:** `JwtCookieUtil.java` - Manages JWT cookie operations
  - `addJwtToCookie()` - Sets secure httpOnly cookie with SameSite=Strict
  - `getJwtFromCookie()` - Reads JWT from cookie
  - `removeJwtCookie()` - Clears JWT cookie on logout

- **Updated:** `JwtAuthFilter.java`
  - Now checks both Authorization header AND cookies for JWT
  - Backward compatible with token-in-header approach

- **Updated:** `AuthController.java`
  - `/api/auth/login` - Sets JWT cookie on successful login
  - `/api/auth/register` - Sets JWT cookie on successful registration
  - `/api/auth/logout` - NEW endpoint to clear JWT cookie

- **Updated:** `OAuth2AuthenticationSuccessHandler.java`
  - Redirects to frontend after setting JWT cookie (instead of URL parameter)
  - Eliminates token exposure in browser history/logs

#### Frontend Changes:
- **Updated:** `api.js`
  - Removed `getToken()` and localStorage references
  - Added `credentials: 'include'` to all fetch calls
  - Added CSRF token handling via `getCsrfToken()`
  - JWT is now automatically sent via cookie

#### Cookie Security Configuration:
```properties
# Backend (application.properties)
app.jwt.cookie.secure=false    # Set to true for HTTPS in production
app.jwt.expiration-ms=86400000 # 24 hours
```

**Cookie Attributes:**
- `HttpOnly=true` - Not accessible via JavaScript (XSS protection)
- `Secure=true` - Only sent over HTTPS (must be true in production)
- `SameSite=Strict` - Only sent on same-site requests (CSRF protection)
- `Path=/` - Available to entire application
- `MaxAge=86400` - 24-hour expiration

---

### 2. **CSRF Protection: Disabled → Enabled**

**Problem:** CSRF was disabled (`csrf(AbstractHttpConfigurer::disable)`), making forms vulnerable.

**Solution:** Re-enabled CSRF with cookie-based token repository.

#### Backend Changes:
- **Updated:** `SecurityConfig.java`
  - Enabled CSRF protection using `CookieCsrfTokenRepository`
  - Created CSRF token as cookie with safety attributes
  - Used `XorCsrfTokenRequestAttributeHandler` for token processing
  - Excluded image upload endpoint (`/api/incidents/uploads`) for multipart forms

#### Frontend Changes:
- **Updated:** `api.js`
  - Added `getCsrfToken()` function to extract CSRF token from cookie
  - Added X-CSRF-Token header to state-changing requests
  - Token is automatically included in all POST, PUT, PATCH, DELETE requests

**CSRF Configuration:**
```java
// Cookie attributes for CSRF token
csrfTokenRepository.setCookieHttpOnly(false);  // Frontend needs to read it
csrfTokenRepository.setCookieSecure(true);     // HTTPS only in production
csrfTokenRepository.setCookieSameSite("Strict");
```

---

### 3. **Security Headers: Added Protection**

**Problem:** Missing security headers expose app to various attacks.

**Solution:** Added comprehensive security headers via Spring Security configuration.

#### Implemented Headers:

| Header | Purpose | Value |
|--------|---------|-------|
| **HSTS** (HTTP Strict Transport Security) | Force HTTPS | `max-age=31536000; includeSubDomains; preload` |
| **X-Content-Type-Options** | Prevent MIME type sniffing | `nosniff` |
| **X-Frame-Options** | Prevent clickjacking | `SAMEORIGIN` |
| **X-XSS-Protection** | Browser XSS protection | Enabled |
| **CSP** (Content Security Policy) | Restrict resource loading | `default-src 'self'; script-src 'self' 'unsafe-inline'; ...` |

#### Backend Implementation:
```java
.headers(headers -> headers
    .frameOptions(frame -> frame.sameOrigin())
    .httpStrictTransportSecurity()
        .includeSubDomains(true)
        .preload(true)
        .maxAgeInSeconds(31536000)
    .and()
    .contentSecurityPolicy(csp -> csp
        .policyDirectives("default-src 'self'; ...")
    )
    .xssProtection()
    .and()
    .contentTypeOptions()
)
```

---

### 4. **Removed Default JWT Secret**

**Problem:** Default JWT secret in code is a production risk.

**Solution:** Removed default secret; now requires environment variable.

#### Configuration Change:
```properties
# BEFORE (Insecure)
app.jwt.secret=${JWT_SECRET:CampusXSecretKeyCampusXSecretKey1234}

# AFTER (Secure)
app.jwt.secret=${JWT_SECRET:}  # Empty default → MUST be set via env var
```

**Production Setup:**
```bash
export JWT_SECRET="your-256-bit-secret-key-generate-with-openssl"
export JWT_COOKIE_SECURE="true"
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

---

## 🛡️ Additional Security Improvements

### Session Management
- **Stateless Authentication:** `SessionCreationPolicy.STATELESS`
- No server-side session storage (API-friendly)
- Each request validated independently via JWT

### Authorization
- Role-based access control (RBAC) with `@PreAuthorize`
- Endpoint-level authorization in SecurityConfig
- Admin-only endpoints protected

### Rate Limiting
- 100 requests per 60 seconds per IP
- Sliding window implementation
- Configurable via environment variables

### File Upload Security
- Content-type whitelist (JPG, PNG, WEBP only)
- File size limit (5MB per file, max 3 files)
- Path traversal protection with `normalize()` and `startsWith()`
- UUID-based filenames to prevent enumeration

---

## 📋 Deployment Checklist

### Before Production Deployment:

- [ ] **Set JWT_SECRET environment variable**
  ```bash
  export JWT_SECRET=$(openssl rand -base64 32)
  ```

- [ ] **Enable HTTPS**
  - Set `app.jwt.cookie.secure=true`
  - Configure SSL certificate on load balancer/reverse proxy
  - Enable HSTS preload

- [ ] **Configure CORS**
  - Update `app.cors.allowed-origins` for production domain
  - Avoid using wildcard (`*`) in production

- [ ] **Set Google OAuth2 Credentials**
  - Generate credentials at https://console.cloud.google.com
  - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars

- [ ] **Database Configuration**
  - Switch from H2 to MySQL
  - Use strong database password
  - Enable connection encryption (SSL)

- [ ] **Upload Directory**
  - Set `UPLOAD_DIR` to persistent storage location
  - Ensure proper file permissions (user-specific directory)
  - Configure cleanup job for old uploads

- [ ] **Monitoring & Logging**
  - Enable audit logging: `logging.level.AUDIT=INFO`
  - Configure centralized log collection
  - Set up alerts for 401/403 errors

- [ ] **Dependency Updates**
  - Run `./mvnw dependency:check` for security vulnerabilities
  - Update Spring Boot to latest patch version
  - Review OWASP Dependency Check report

---

## 🔄 Migration Guide for Existing Deployments

### If Previously Using localStorage:

1. **Backend Update:**
   - Deploy updated `SecurityConfig.java` with CSRF enabled
   - Deploy `JwtCookieUtil.java` and `JwtAuthFilter.java`
   - Deploy updated `AuthController.java` with `/api/auth/logout`

2. **Frontend Update:**
   - Deploy updated `api.js` (removes localStorage operations)
   - Deploy updated `App.js` (uses isAuthenticated state)
   - Deploy updated `LoginPage.jsx` for new Google OAuth handling

3. **User Impact:**
   - Users will be logged out after update (no cookies in old sessions)
   - They will be prompted to log in again
   - New sessions use secure httpOnly cookies

4. **Verification:**
   ```bash
   # Test login
   curl -X POST http://localhost:8082/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'
   
   # Check for Set-Cookie header with authToken
   # Cookie should have: HttpOnly, Secure, SameSite=Strict
   ```

---

## 🧪 Security Testing Commands

### Test JWT Cookie:
```bash
# Login and capture cookie
curl -c cookies.txt -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Use cookie in subsequent request
curl -b cookies.txt http://localhost:8082/api/auth/me
```

### Test CSRF Token:
```bash
# Get CSRF token from login page
curl -i http://localhost:8082/api/auth/me

# CSRF token should be in Set-Cookie header: _csrf=...
```

### Test Security Headers:
```bash
curl -I http://localhost:8082/api/facilities

# Look for:
# Strict-Transport-Security
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy
```

### Test HTTPS Redirect (Production):
```bash
curl -I http://your-domain.com/api/facilities
# Should redirect to https://
```

---

## 📚 References

- [OWASP Top 10 - A01:2021 Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [OWASP Top 10 - A03:2021 Injection](https://owasp.org/Top10/A03_2021-Injection/)
- [OWASP Top 10 - A05:2021 Cross-Site Request Forgery (CSRF)](https://owasp.org/Top10/A05_2021-Cross-Site_Request_Forgery_(CSRF)/)
- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

---

## ✅ Implemented Changes Summary

| Component | Change | Status |
|-----------|--------|--------|
| JWT Storage | localStorage → httpOnly cookies | ✅ Done |
| CSRF Protection | Disabled → Enabled | ✅ Done |
| Security Headers | Added HSTS, CSP, X-* headers | ✅ Done |
| JWT Secret | Removed default configuration | ✅ Done |
| OAuth2 Redirect | Token in URL → Cookie via redirect | ✅ Done |
| Frontend Auth | Token-based → Cookie-based | ✅ Done |
| Logout Endpoint | Added `/api/auth/logout` | ✅ Done |
| Cookie Util | New `JwtCookieUtil.java` | ✅ Done |

---

**Last Updated:** April 18, 2026
**Security Level:** Production-Ready
