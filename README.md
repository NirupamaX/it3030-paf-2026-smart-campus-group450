# CampusX â€” Smart Campus Management Platform

A full-stack web application for managing campus facilities, bookings, incident tickets, notifications, and users with role-based access control.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 4.0.4 Â· Java 21 Â· Spring Security Â· JWT Â· OAuth2 |
| Database | MySQL 8+ (production) Â· H2 in-memory (development) |
| Frontend | React 19 Â· Lucide Icons Â· Recharts |
| Auth | JWT + Google OAuth2 |

---

## Features

- **Facilities** â€” Browse, search, and manage campus resources (labs, halls, equipment)
- **Bookings** â€” Visual time-slot calendar, conflict detection, admin approve/reject workflow
- **Incidents** â€” Report maintenance issues with image uploads, priority/category, technician assignment, comments
- **Notifications** â€” Real-time alerts for booking and incident events
- **Admin Panel** â€” User and technician management
- **Role-Based Access** â€” `STUDENT`, `USER`, `TECHNICIAN`, `ADMIN`

---

## Getting Started

### Prerequisites

- Java 21+
- Node.js 18+
- MySQL 8+ (or use H2 for development â€” see below)

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

### Development â€” H2 In-Memory (default, no setup needed)

The project ships with H2 configured out of the box. Just run the backend and it works.

```properties
spring.datasource.url=jdbc:h2:mem:campusx
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
```

> H2 console available at `http://localhost:8082/h2-console`
> JDBC URL: `jdbc:h2:mem:campusx` Â· User: `sa` Â· Password: *(empty)*

> âš ï¸ Data resets on every restart with H2.

### Production â€” MySQL

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

CampusX supports **Sign in with Google** via OAuth2. When a user clicks "Continue with Google", they are redirected to Google, authenticated, and returned with a JWT token â€” no password needed.

### How it works

1. User clicks **Continue with Google** on the login page
2. Browser redirects to `http://localhost:8082/oauth2/authorization/google`
3. Google authenticates the user and redirects back to `http://localhost:8082/login/oauth2/code/google`
4. The backend `OAuth2AuthenticationSuccessHandler` creates or finds the user, generates a JWT, and redirects to the frontend with the token as a URL parameter
5. Frontend stores the token in `localStorage` and the user is logged in

### Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project â†’ **APIs & Services** â†’ **Credentials** â†’ **Create OAuth 2.0 Client ID**
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

> âš ï¸ Never commit real credentials to a public repository. Use environment variables in production:
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
| `GOOGLE_CLIENT_ID` | â€” | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | â€” | Google OAuth2 client secret |
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
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ src/main/java/com/example/backend/
â”‚   â”‚   â”œâ”€â”€ config/        # Security, CORS, rate limiting, audit log
â”‚   â”‚   â”œâ”€â”€ controller/    # REST endpoints
â”‚   â”‚   â”œâ”€â”€ dto/           # Request/response objects
â”‚   â”‚   â”œâ”€â”€ model/         # JPA entities
â”‚   â”‚   â”œâ”€â”€ repository/    # Spring Data repositories
â”‚   â”‚   â”œâ”€â”€ security/      # JWT filter, OAuth2 handler
â”‚   â”‚   â””â”€â”€ service/       # Business logic
â”‚   â”œâ”€â”€ src/main/resources/
â”‚   â”‚   â””â”€â”€ application.properties
â”‚   â””â”€â”€ database/
â”‚       â””â”€â”€ campusx_schema.sql
â””â”€â”€ frontend/
    â””â”€â”€ src/
        â”œâ”€â”€ App.js          # Main application
        â”œâ”€â”€ App.css         # All styles
        â”œâ”€â”€ api.js          # API client
        â”œâ”€â”€ LoginPage.jsx   # Auth UI with sliding panel animation
        â””â”€â”€ BookingSystem.jsx # Booking calendar + admin dashboard
```

