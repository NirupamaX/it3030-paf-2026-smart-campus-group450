# CampusX — Functional Requirements (FR), Non‑Functional Requirements (NFR) & System Functions

> Source of truth: derived from the current codebase (frontend + backend) and database schema. This document intentionally avoids copying secrets/credentials.

## Actors

- **Anonymous user**: can access auth + OAuth entrypoints and public uploads.
- **Authenticated user (`USER`/`STUDENT`)**: can browse facilities, create/cancel own bookings, create/view own incidents, view/mark own notifications, comment on incidents they can access.
- **Technician (`TECHNICIAN`)**: can view incident queues, view assigned incidents, update status on assigned incidents, participate in incident comments when assigned.
- **Admin (`ADMIN`)**: full access across facilities/bookings/incidents + user/technician directory.

## Functional Requirements (FR)

### Authentication & Authorization

- **FR-AUTH-1**: The system shall register a user with `fullName`, `email`, `password`, optional `role` (defaults to `USER`), and store a hashed password (BCrypt) and `active=true`.
- **FR-AUTH-2**: The system shall prevent duplicate registrations by enforcing unique email (case-normalized to lowercase).
- **FR-AUTH-3**: The system shall authenticate users via email/password and return an `AuthResponse` containing a JWT plus user identity fields.
- **FR-AUTH-4**: The system shall support stateless JWT sessions where clients send `Authorization: Bearer <token>` on API calls.
- **FR-AUTH-5**: The system shall expose a “current user” endpoint returning the authenticated user profile (id/name/email/role/active/createdAt).
- **FR-AUTH-6**: The system shall support Google OAuth2 login and redirect to the frontend with `?token=<jwt>`; if the email is new, it shall auto-provision a local user with role `USER` and a random password.
- **FR-AUTH-7**: The system shall send an email OTP to a requested email address; OTP shall be 4 digits and expire after `app.otp.expiry-minutes` (configured as 5 minutes).
- **FR-AUTH-8**: The system shall verify OTPs (valid code + not expired) and invalidate OTPs after successful verification (OTP storage is in-memory).

### Facilities

- **FR-FAC-1**: The system shall list facilities to authenticated users, with optional query params `q`, `type`, `location`, `capacityMin`, `capacityMax`, `availableOnly`.
- **FR-FAC-2**: Facility search `q` shall match case-insensitively across facility name/type/location; `capacityMin`/`capacityMax` shall constrain results; invalid ranges (min>max) shall be rejected.
- **FR-FAC-3**: Admins shall create facilities with required fields including name/type/location/capacity/status/availability and operating hours (`openingTime`, `closingTime`, `operatingHours`).
- **FR-FAC-4**: Admins shall update facilities by id with the same validation rules as create.
- **FR-FAC-5**: Admins shall delete facilities by id (subject to database referential constraints).

### Bookings

- **FR-BOOK-1**: The system shall create a booking for a facility (`resourceId`) with date/time window, purpose, and expected attendees; the initial status shall be `PENDING`.
- **FR-BOOK-2**: Booking creation shall validate: end time > start time; booking date not in the past; booking start datetime strictly in the future.
- **FR-BOOK-3**: Booking creation shall validate facility availability: facility must be `available=true` and not in `UNDER_MAINTENANCE` or `OUT_OF_SERVICE`.
- **FR-BOOK-4**: Booking creation shall validate capacity: `expectedAttendees` must be ≤ facility capacity (and must be ≥1 by DTO validation).
- **FR-BOOK-5**: Booking creation shall validate operating hours: requested time window must fall within facility `openingTime`–`closingTime` (and reject misconfigured facility times).
- **FR-BOOK-6**: The system shall prevent overlapping bookings by rejecting any request that overlaps existing `PENDING` or `APPROVED` bookings for the same facility/date (HTTP 409).
- **FR-BOOK-7**: The system shall provide a “slot availability” function that returns `{available, message}` for a facility/date/time window using the same conflict/availability rules.
- **FR-BOOK-8**: The system shall allow a user to list their own bookings (`/mine`) and allow admins to list all bookings with paging and optional filters (`status`, `bookingDate`).
- **FR-BOOK-9**: The system shall allow admins to approve or reject only `PENDING` bookings; status updates shall only allow `APPROVED` or `REJECTED`.
- **FR-BOOK-10**: Booking rejection shall require a non-blank rejection reason; booking approval shall re-check overlaps at decision time to prevent race-condition conflicts.
- **FR-BOOK-11**: The system shall allow cancellation (via DELETE or legacy cancel endpoint) by the booking owner or an admin; it shall block cancellation if already started or already cancelled.
- **FR-BOOK-12**: Booking cancellation by an admin shall notify the booking owner.

### Incidents + Attachments + Comments

- **FR-INCD-1**: The system shall allow authenticated users to create incident tickets with title/description/location/category/priority and optional preferred contact info.
- **FR-INCD-2**: New incidents shall start with status `OPEN` and record `createdAt`/`updatedAt`.
- **FR-INCD-3**: Incident creation shall accept either a single `imageUrl` or an `imageUrls` list (max 3); the system shall store attachments as separate records and set the first image as the ticket preview `imageUrl`.
- **FR-UPLOAD-1**: The system shall support uploading 1–3 incident image files via multipart; each file must be JPG/PNG/WEBP and ≤5MB.
- **FR-UPLOAD-2**: Uploaded images shall be stored on the backend filesystem under the configured upload directory and returned as public URLs under `/uploads/...`.
- **FR-INCD-4**: The system shall allow a reporter to list their own incidents with paging.
- **FR-INCD-5**: The system shall allow admins and technicians to list incidents with paging; and provide a separate “assigned” list (admins get all; technicians get only those assigned to them).
- **FR-INCD-6**: Admins shall assign a technician to an incident; assignment shall validate the assignee has role `TECHNICIAN` and shall set the incident status to `IN_PROGRESS`.
- **FR-INCD-7**: Admins and technicians shall update incident status; technicians may only update incidents assigned to them.
- **FR-INCD-8**: Incident rejection (`REJECTED`) shall require a non-blank rejection reason; resolution notes are optional.
- **FR-INCD-9**: The system shall enforce access to incident attachments/comments: admins always; reporters; and the assigned technician.
- **FR-INCD-10**: The system shall allow authorized participants to add comments to incidents; only the comment author can edit/delete their own comments.

### Notifications

- **FR-NOTIF-1**: The system shall create notifications for key actions (booking created/approved/rejected/cancelled; incident created/assigned/status updates/comments).
- **FR-NOTIF-2**: The system shall let a user list their notifications (most recent first), fetch unread count, and mark individual notifications as read; users may not modify another user’s notifications.

### Admin

- **FR-ADMIN-1**: Admins shall list all users and list technicians (users whose role is `TECHNICIAN`).

### System/Compatibility

- **FR-SYS-1**: The system shall expose a health endpoint returning `{application: "CampusX", status: "UP"}`.
- **FR-COMPAT-1**: The system shall expose facilities and bookings under both `/api/...` and `/api/v1/...` paths for backward compatibility.

## Non‑Functional Requirements (NFR)

### Security

- **NFR-SEC-1**: Authentication shall use BCrypt-hashed passwords and stateless JWT (HS256) with configurable secret + expiry (default 24h).
- **NFR-SEC-2**: Authorization shall enforce RBAC using Spring Security + method-level guards (e.g., admin-only operations on bookings/facilities/admin routes).
- **NFR-SEC-3**: User accounts shall support an `active` flag; inactive accounts shall be unable to authenticate.
- **NFR-SEC-4**: CORS shall be restricted to configured allowed origins and allow credentials for `/api/**`.
- **NFR-SEC-5**: CSRF protection is disabled (appropriate for stateless APIs, but requires care if cookies are introduced).
- **NFR-SEC-6**: The backend shall apply IP-based rate limiting (default 100 requests / 60 seconds) and return HTTP 429 on limit exceed.
- **NFR-SEC-7**: File uploads shall enforce content-type allowlist, max count, and max size; and prevent path traversal by validating target paths stay under the upload root.

### Observability / Auditability

- **NFR-OBS-1**: Mutating API calls (POST/PUT/PATCH/DELETE) shall be audit-logged with user, IP, method, URI, and response status.

### Data & Integrity

- **NFR-DATA-1**: Data integrity shall be protected via database constraints (enums via checks, FK relationships, booking time window checks, unique email, etc.).

### Performance & Scalability

- **NFR-PERF-1**: List endpoints shall support paging where implemented (bookings/incidents), and schema includes indexes for common access patterns.

### Maintainability

- **NFR-MAINT-1**: Backend shall follow a layered structure (controller/service/repository) with DTO validation and centralized view mapping.

### Configuration / Deployment

- **NFR-DEPLOY-1**: Configuration shall be environment-driven where supported (JWT secret/expiry, frontend base URL, CORS origins, upload dir, rate limit settings, mail creds, DB URL/creds).

### Testing

- **NFR-TEST-1**: Core risk areas have unit tests (booking overlap + operating hours; upload content-type restrictions).

## System Functions (end‑to‑end capabilities)

- **SF-1: Authentication session** — register/login/OAuth → receive JWT → store client-side → call protected APIs with `Bearer` token.
- **SF-2: Facility discovery** — authenticated user loads facility catalog and searches/filters facilities to find a suitable resource.
- **SF-3: Booking workflow** — user selects facility/date/time/attendees → server validates rules + conflicts → creates `PENDING` booking → user receives notification.
- **SF-4: Booking administration** — admin reviews bookings → approve/reject with reason → server re-checks conflicts → user receives decision notification.
- **SF-5: Booking cancellation** — owner/admin cancels future booking → booking becomes `CANCELLED` → user notified if cancelled by admin.
- **SF-6: Incident reporting** — user uploads images (optional) → submits incident ticket referencing image URLs → incident created as `OPEN` + attachments recorded → reporter notified.
- **SF-7: Incident handling** — admin assigns technician → incident becomes `IN_PROGRESS` → technician + reporter notified.
- **SF-8: Incident resolution** — technician/admin updates status (and optionally resolution note / rejection reason) → participants notified.
- **SF-9: Collaboration** — authorized participants add/edit/delete their own comments on incidents → reporter/technician notified of new comments.
- **SF-10: Notification center** — user views notifications, sees unread count badge, and marks notifications as read.

## Known Gaps / Inconsistencies (from code)

- The frontend defines `forgotPassword` and `resetPassword` API calls, but there are no backend endpoints for them; the frontend forgot-password page is effectively empty.
- OTP verification exists as an API capability, but registration itself does not enforce “OTP verified” server-side (OTP is currently a client-side flow only).
- `/uploads/**` is publicly accessible; if incident images can contain sensitive information, access control may need tightening.

## Evidence (main code entrypoints)

### Backend

- Security + JWT: `backend/src/main/java/com/example/backend/config/SecurityConfig.java`, `backend/src/main/java/com/example/backend/security/JwtAuthFilter.java`
- Auth + OTP + OAuth redirect: `backend/src/main/java/com/example/backend/controller/AuthController.java`, `backend/src/main/java/com/example/backend/service/OtpService.java`, `backend/src/main/java/com/example/backend/security/OAuth2AuthenticationSuccessHandler.java`
- Facilities: `backend/src/main/java/com/example/backend/controller/FacilityController.java`
- Bookings: `backend/src/main/java/com/example/backend/controller/BookingController.java`, `backend/src/main/java/com/example/backend/service/BookingService.java`
- Incidents: `backend/src/main/java/com/example/backend/controller/IncidentController.java`, `backend/src/main/java/com/example/backend/service/IncidentService.java`, `backend/src/main/java/com/example/backend/service/LocalFileStorageService.java`
- Notifications: `backend/src/main/java/com/example/backend/controller/NotificationController.java`, `backend/src/main/java/com/example/backend/service/NotificationService.java`
- Admin: `backend/src/main/java/com/example/backend/controller/AdminController.java`, `backend/src/main/java/com/example/backend/service/UserService.java`
- Audit logging: `backend/src/main/java/com/example/backend/config/AuditLogInterceptor.java`, `backend/src/main/java/com/example/backend/config/WebConfig.java`
- Rate limiting: `backend/src/main/java/com/example/backend/config/RateLimitFilter.java`
- Schema: `backend/database/campusx_schema.sql`

### Frontend

- Main SPA flows: `frontend/src/App.js`
- API client + endpoint mapping: `frontend/src/api.js`
- Login/Register UI: `frontend/src/LoginPage.jsx`

