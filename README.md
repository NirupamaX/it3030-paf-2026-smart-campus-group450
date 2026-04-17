# CampusX — Smart Campus Management Platform

A full-stack web application for managing campus facilities, bookings, incident tickets, notifications, and users with role-based access control.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 4.0.4 · Java 21 · Spring Security · JWT · OAuth2 |
| Database | MySQL 8+ (production) · H2 in-memory (development) |
| Frontend | React 19 · Lucide Icons · Recharts |
| Auth | JWT + Google OAuth2 |

---

## Features

- **Facilities** — Browse, search, and manage campus resources (labs, halls, equipment)
- **Bookings** — Visual time-slot calendar, conflict detection, admin approve/reject workflow
- **Incidents** — Report maintenance issues with image uploads, priority/category, technician assignment, comments
- **Notifications** — Real-time alerts for booking and incident events
- **Admin Panel** — User and technician management
- **Role-Based Access** — `STUDENT`, `USER`, `TECHNICIAN`, `ADMIN`

---

## Getting Started

### Prerequisites

- Java 21+
- Node.js 18+
- MySQL 8+ (or use H2 for development — see below)

### 1. Clone the repo

```bash
git clone <repo-url>
cd campusx
```

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run
```

Runs on `http://localhost:8082`

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Runs on `http://localhost:3000`

---

## Database Configuration

### Development — H2 In-Memory (default, no setup needed)

The project ships with H2 configured out of the box. Just run the backend and it works.

```properties
spring.datasource.url=jdbc:h2:mem:campusx
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
```

> H2 console available at `http://localhost:8082/h2-console`
> JDBC URL: `jdbc:h2:mem:campusx` · User: `sa` · Password: *(empty)*

> ⚠️ Data resets on every restart with H2.

### Production — MySQL

1. Create the database:

```sql
CREATE DATABASE campusx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Run the schema:

```bash
mysql -u root -p campusx < backend/database/campusx_schema.sql
```

3. Update `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/campusx
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect
```

---

## Google OAuth2 Authentication

CampusX supports **Sign in with Google** via OAuth2. When a user clicks "Continue with Google", they are redirected to Google, authenticated, and returned with a JWT token — no password needed.

### How it works

1. User clicks **Continue with Google** on the login page
2. Browser redirects to `http://localhost:8082/oauth2/authorization/google`
3. Google authenticates the user and redirects back to `http://localhost:8082/login/oauth2/code/google`
4. The backend `OAuth2AuthenticationSuccessHandler` creates or finds the user, generates a JWT, and redirects to the frontend with the token as a URL parameter
5. Frontend stores the token in `localStorage` and the user is logged in

### Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services** → **Credentials** → **Create OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add to **Authorized redirect URIs**:
   ```
   http://localhost:8082/login/oauth2/code/google
   ```
5. Copy your **Client ID** and **Client Secret** into `application.properties`:

```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_CLIENT_SECRET
spring.security.oauth2.client.registration.google.scope=openid,profile,email
```

> ⚠️ Never commit real credentials to a public repository. Use environment variables in production:
> ```bash
> export GOOGLE_CLIENT_ID=your-client-id
> export GOOGLE_CLIENT_SECRET=your-client-secret
> ```

---

## Environment Variables

All sensitive config supports environment variable overrides:

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `CampusXSecretKey...` | JWT signing secret (change in production) |
| `JWT_EXPIRATION_MS` | `86400000` | Token expiry (24h) |
| `GOOGLE_CLIENT_ID` | — | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth2 client secret |
| `FRONTEND_BASE_URL` | `http://localhost:3000` | Frontend URL for OAuth redirect |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `UPLOAD_DIR` | `uploads` | Directory for incident image uploads |
| `RATE_LIMIT_REQUESTS` | `100` | Max requests per IP per window |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | Rate limit window in seconds |

---

## API Overview

| Module | Base Path |
|---|---|
| Auth | `/api/auth` |
| Facilities | `/api/facilities` |
| Bookings | `/api/bookings` |
| Incidents | `/api/incidents` |
| Notifications | `/api/notifications` |
| Admin | `/api/admin` |

---

## Default Seed Users

The app seeds two users on startup (see `DataInitializer.java`):

| Email | Password | Role |
|---|---|---|
| `admin@campusx.com` | `admin123` | ADMIN |
| `tech@campusx.com` | `tech123` | TECHNICIAN |

---

## Project Structure

```
campusx/
├── backend/
│   ├── src/main/java/com/example/backend/
│   │   ├── config/        # Security, CORS, rate limiting, audit log
│   │   ├── controller/    # REST endpoints
│   │   ├── dto/           # Request/response objects
│   │   ├── model/         # JPA entities
│   │   ├── repository/    # Spring Data repositories
│   │   ├── security/      # JWT filter, OAuth2 handler
│   │   └── service/       # Business logic
│   ├── src/main/resources/
│   │   └── application.properties
│   └── database/
│       └── campusx_schema.sql
└── frontend/
    └── src/
        ├── App.js          # Main application
        ├── App.css         # All styles
        ├── api.js          # API client
        ├── LoginPage.jsx   # Auth UI with sliding panel animation
        └── BookingSystem.jsx # Booking calendar + admin dashboard
```
