# Smart Campus Operations Hub - Production Design and Implementation

## 1. Requirements Engineering

### 1.1 Functional Requirements

#### Module A: Facilities Catalogue & Resource Management
- Create, read, update, and delete facilities/resources.
- Resource fields: id, name, type, capacity, location, availability windows, status.
- Search and filter by query, type, location, minimum capacity, maximum capacity.
- Restrict create/update/delete to ADMIN users only.

#### Module B: Booking Workflow & Conflict Checking
- Users create bookings with date, start time, end time, purpose, and attendees.
- Booking workflow: PENDING -> APPROVED/REJECTED -> CANCELLED.
- Conflict detection prevents overlapping bookings for same resource and date.
- Admin approval/rejection with mandatory rejection reason.

#### Module C: Incident Tickets & Technician Updates
- Users create incident tickets with category, description, priority, and contact details.
- Support upload of up to 3 images per ticket through secure upload API.
- Incident workflow: OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED and REJECTED.
- Admin assigns technicians; technicians update statuses.
- Comments support add/edit/delete with ownership rules.

#### Module D: Notifications
- Notifications generated for booking decisions, ticket updates, and comment activities.
- Notification APIs for list, unread count, and mark-as-read.
- Frontend polling every 30 seconds provides real-time-like updates.

#### Module E: Role Management & OAuth
- Roles: USER, ADMIN, TECHNICIAN (legacy STUDENT kept for backward compatibility).
- JWT-secured API with Spring Security method-level RBAC.
- OAuth2 Google client integration enabled in Spring Security configuration.

### 1.2 Non-Functional Requirements

#### Security
- JWT authentication for API requests.
- Role-based authorization using `@PreAuthorize` and endpoint rules.
- Global validation and exception handling.
- Secure file upload with type and size checks.

#### Performance
- Indexed relational schema for bookings/incidents/notifications.
- Efficient conflict query for overlap detection.
- Capacity and text filtering on facilities.

#### Scalability
- Layered backend architecture supporting modular growth.
- Stateless REST APIs suitable for horizontal scaling.
- Polling notification model can be upgraded to WebSockets later.

#### Usability
- Responsive dashboard-style React UI.
- Clear status badges, cards, and workflow actions.
- Contextual forms for each module with validation feedback.

### 1.3 Actor-Based Use Cases

#### USER
- Register/login, browse resources, create bookings, report incidents, add comments, view notifications.

#### ADMIN
- Manage resources, moderate bookings, assign technicians, manage users, monitor analytics/SLA.

#### TECHNICIAN
- View assigned incidents, update incident status, collaborate through comments.

---

## 2. System Architecture

### 2.1 High-Level Architecture (Text Diagram)
- React frontend sends HTTPS REST requests to Spring Boot APIs.
- Spring Security authenticates JWT and authorizes by role.
- Controllers delegate to Services for business logic.
- Services use Repositories (JPA) for persistence in MySQL/PostgreSQL.
- Notifications are persisted and polled by frontend.
- Uploaded images are stored in server upload directory and served as static resources.

### 2.2 Backend Architecture
- Controller Layer: request handling and DTO mapping.
- Service Layer: core business rules, conflict detection, workflow transitions.
- Repository Layer: JPA repositories and custom overlap query.
- DTO + Entity separation: request DTOs for input, ViewMapper for response shape.

### 2.3 Frontend Architecture
- Single-page React app using functional components/hooks.
- Module tabs: Facilities, Bookings, Incidents, Notifications, Admin.
- Reusable UI patterns: cards, status badges, form grid, analytics cards.
- API abstraction in `frontend/src/api.js`.

### 2.4 Data Flow
1. User action from React form/list.
2. API client sends request with JWT.
3. Spring controller validates input and delegates to service.
4. Service enforces rules and persists via repository.
5. Response mapped to presentation-friendly JSON.
6. React updates state and re-renders views.

---

## 3. Module Implementation Summary

### Module A
- Backend:
  - `GET /api/facilities` with `q`, `type`, `location`, `capacityMin`, `capacityMax`.
  - `POST /api/facilities`, `PUT /api/facilities/{id}`, `DELETE /api/facilities/{id}` (ADMIN).
- Frontend:
  - Facilities listing cards and advanced filter row.
  - Admin create/edit/delete facility forms.

### Module B
- Backend:
  - Booking create with date/time validation and overlap conflict check.
  - Admin decision endpoints and cancel flows.
- Frontend:
  - Booking form, status cards, and admin moderation panel.

### Module C
- Backend:
  - Incident create, assignment, status transitions.
  - `POST /api/incidents/uploads` for secure image upload (max 3).
  - Attachments API and comment CRUD with ownership enforcement.
- Frontend:
  - Incident form with category, priority, multi-image upload.
  - Ticket timeline with attachments and comments (add/edit/delete).
  - Technician workspace for assignment and status updates.

### Module D
- Backend:
  - Notification entity and APIs for list/unread/mark-read.
- Frontend:
  - Notifications panel with unread badge and mark-read action.
  - Polling every 30 seconds.

### Module E
- Backend:
  - JWT auth (`/api/auth/login`, `/api/auth/register`, `/api/auth/me`).
  - OAuth2 client enabled (`spring-boot-starter-oauth2-client`, security config).
- Frontend:
  - Role-aware tabs and admin-only actions.
  - Google OAuth call-to-action button in auth UI.

---

## 4. Database Design (ER Explanation)

### Entities and Relationships
- Users (1) -> (many) Bookings
- Users (1) -> (many) IncidentTickets as reporter
- Users (1) -> (many) IncidentTickets as technician
- Facilities (1) -> (many) Bookings
- IncidentTickets (1) -> (many) IncidentAttachments
- IncidentTickets (1) -> (many) TicketComments
- Users (1) -> (many) TicketComments
- Users (1) -> (many) Notifications

### Core Tables
- users
- facilities
- bookings
- incident_tickets
- incident_attachments
- ticket_comments
- notifications

Schema is in `backend/database/campusx_schema.sql`.

---

## 5. API Design

### Authentication
- POST `/api/auth/register`: register account
- POST `/api/auth/login`: login and get JWT
- GET `/api/auth/me`: current user profile

### Facilities
- GET `/api/facilities`: list with filters
- POST `/api/facilities`: create (ADMIN)
- PUT `/api/facilities/{id}`: update (ADMIN)
- DELETE `/api/facilities/{id}`: delete (ADMIN)

### Bookings
- POST `/api/bookings`: create booking
- GET `/api/bookings/mine`: current user bookings
- GET `/api/bookings`: list all (ADMIN)
- PATCH `/api/bookings/{id}/decision`: approve/reject (ADMIN)
- PATCH `/api/bookings/{id}/status`: approve/reject (ADMIN)
- PUT `/api/bookings/{id}/status`: approve/reject (ADMIN)
- DELETE `/api/bookings/{id}`: cancel booking
- PATCH `/api/bookings/{id}/cancel`: legacy cancel
- GET `/api/bookings/availability`: slot check

### Incidents
- POST `/api/incidents`: create incident ticket
- POST `/api/incidents/uploads`: upload ticket images (1-3 files)
- GET `/api/incidents`: list all (ADMIN/TECHNICIAN)
- GET `/api/incidents/mine`: reporter tickets
- GET `/api/incidents/assigned`: assigned tickets
- PATCH `/api/incidents/{id}/assign`: assign technician (ADMIN)
- PATCH `/api/incidents/{id}/status`: update status (ADMIN/TECHNICIAN)
- GET `/api/incidents/{id}/attachments`: list attachments
- GET `/api/incidents/{id}/comments`: list comments
- POST `/api/incidents/{id}/comments`: add comment
- PUT `/api/incidents/{id}/comments/{commentId}`: edit own comment
- DELETE `/api/incidents/{id}/comments/{commentId}`: delete own comment

### Notifications
- GET `/api/notifications`: list notifications
- GET `/api/notifications/unread-count`: unread count
- PATCH `/api/notifications/{id}/read`: mark as read

### Admin
- GET `/api/admin/users`: list users (ADMIN)
- GET `/api/admin/technicians`: list technicians (ADMIN)

### System
- GET `/api/health`: service health

### HTTP Status Codes
- 200 OK, 201 Created, 204 No Content
- 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict

### Standard Error Response
- Handled in global `ApiExceptionHandler` with body including `error`, `status`, and field `details` for validation errors.

---

## 6. Testing and Validation

### Backend Validation
- Bean validation annotations in request DTOs.
- Global exception handling in `ApiExceptionHandler`.

### Added Tests
- `BookingServiceTest`: overlap conflict and facility operating-hour validation.
- `LocalFileStorageServiceTest`: file type validation and persistence behavior.

### Postman Collection Structure (Recommended)
- Folder 1: Auth (register/login/me)
- Folder 2: Facilities
- Folder 3: Bookings
- Folder 4: Incidents (tickets/uploads/comments)
- Folder 5: Notifications
- Folder 6: Admin
- Environment variables: `baseUrl`, `token`, `adminToken`, `techToken`, `userToken`

---

## 7. UI/UX Design

- Modern card-based cockpit UI with responsive grid layouts.
- Separate CSS styling file (`frontend/src/App.css`) with consistent design tokens.
- Soft shadows, rounded cards, clear spacing, readable hierarchy.
- Core pages:
  - Dashboard overview
  - Resource listing and filters
  - Booking page and moderation
  - Ticket system with comments/attachments
  - Notifications
  - Admin analytics panel

---

## 8. Project Structure

### Backend
- backend/src/main/java/com/example/backend
  - config
  - controller
  - dto
  - model
  - repository
  - security
  - service
- backend/src/main/resources
- backend/src/test/java/com/example/backend
- backend/database/campusx_schema.sql

### Frontend
- frontend/src
  - App.js
  - App.css
  - api.js
  - modules/booking
  - index.js

---

## 9. GitHub + CI/CD

### GitHub Strategy
- Branching: `main` + feature branches + pull requests.
- Commit strategy:
  - feat(module): implement business capability
  - fix(module): bug fix
  - test(module): tests
  - docs: documentation
  - ci: pipeline changes

### CI Pipeline
- File: `.github/workflows/ci.yml`
- Backend job: Java 21 setup, Maven test.
- Frontend job: Node 20, npm test, npm build.

---

## 10. Bonus Features

Implemented/highlighted:
- Admin analytics dashboard cards.
- Incident SLA timer panel (24h target).
- Notification polling for near-real-time UX.

Optional extension ideas:
- QR booking verification endpoint + scanner page.
- Notification preference center per user.
- WebSocket upgrade for push notifications.

---

## Production Readiness Checklist
- Layered backend architecture with RBAC and DTO/entity separation.
- Conflict-safe booking workflow.
- Ticket workflow with comments and secure attachments.
- Notifications with unread state and polling.
- CI pipeline for build and test gates.
- Assignment-mapped technical documentation.
