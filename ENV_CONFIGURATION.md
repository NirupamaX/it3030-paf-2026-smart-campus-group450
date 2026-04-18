# CampusX Environment Configuration Guide

This guide provides environment variable setup for development, staging, and production deployments.

---

## 🚀 Quick Start (Development)

### 1. Backend Setup

Create `.env` file in the backend root directory or set environment variables:

```bash
# Minimal development setup
export JWT_SECRET="dev-secret-key-min-32-chars-required"
export JWT_COOKIE_SECURE="false"
export GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

Run backend:
```bash
cd backend
./mvnw spring-boot:run
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend will run on `http://localhost:3000`
Backend expects to run on `http://localhost:8082`

---

## 📋 Complete Environment Variables

### Core Security Variables

```bash
# JWT Configuration
JWT_SECRET="your-256-bit-secret-key-base64-encoded"     # Required! Use: openssl rand -base64 32
JWT_EXPIRATION_MS="86400000"                            # 24 hours in milliseconds (default)
JWT_COOKIE_SECURE="false"                               # Set to "true" for HTTPS/production

# OAuth2 Google Authentication
GOOGLE_CLIENT_ID="xxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"

# CORS Configuration
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"  # Comma-separated URLs
FRONTEND_BASE_URL="http://localhost:3000"                           # Where frontend is hosted
```

### Database Configuration

```bash
# H2 (Development - default, no setup needed)
# Uses jdbc:h2:mem:campusx (in-memory, resets on restart)

# MySQL (Production)
DB_HOST="mysql.example.com"
DB_PORT="3306"
DB_NAME="campusx"
DB_USER="campusx_user"
DB_PASSWORD="secure-database-password"
DB_SSL="true"  # Enable SSL for production
DB_SSL_MODE="REQUIRED"

# Complete MySQL connection string (if needed)
SPRING_DATASOURCE_URL="jdbc:mysql://DB_HOST:DB_PORT/DB_NAME?useSSL=true&serverTimezone=UTC"
SPRING_DATASOURCE_USERNAME="DB_USER"
SPRING_DATASOURCE_PASSWORD="DB_PASSWORD"
```

### File Upload Configuration

```bash
# Local file storage
UPLOAD_DIR="/var/campusx/uploads"  # Absolute path to upload directory
# Ensure this directory exists and is writable:
# mkdir -p /var/campusx/uploads
# chmod 755 /var/campusx/uploads
# chown campusx:campusx /var/campusx/uploads

# Max file sizes
# Configured in application.properties:
# spring.servlet.multipart.max-file-size=5MB
# spring.servlet.multipart.max-request-size=15MB
```

### Rate Limiting Configuration

```bash
# Rate limiting per IP address
RATE_LIMIT_REQUESTS="100"           # Max requests
RATE_LIMIT_WINDOW_SECONDS="60"      # Time window

# Example: 100 requests per 60 seconds per IP
```

### Logging Configuration

```bash
# Audit logging
LOGGING_LEVEL_AUDIT="INFO"          # Set to DEBUG for more verbose logs

# Application logging
LOGGING_LEVEL_COM_EXAMPLE_BACKEND="INFO"  # Info level for application
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK="WARN"   # Warn level for Spring logs
```

---

## 🔧 Environment-Specific Configurations

### Development Configuration (`.env.dev`)

```bash
# Development - relaxed security
JWT_SECRET="dev-secret-key-change-in-production"
JWT_COOKIE_SECURE="false"
CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"
FRONTEND_BASE_URL="http://localhost:3000"

# Database - H2 (default)
# No additional config needed for H2

# Uploads
UPLOAD_DIR="./uploads"

# Rate limiting - relaxed
RATE_LIMIT_REQUESTS="1000"
RATE_LIMIT_WINDOW_SECONDS="60"

# Logging - verbose
LOGGING_LEVEL_COM_EXAMPLE_BACKEND="DEBUG"
```

### Staging Configuration (`.env.staging`)

```bash
# Staging - medium security
JWT_SECRET=$(openssl rand -base64 32)  # Generate and store securely
JWT_COOKIE_SECURE="true"
CORS_ALLOWED_ORIGINS="https://staging.campusx.example.com"
FRONTEND_BASE_URL="https://staging.campusx.example.com"

# Database - MySQL staging
SPRING_DATASOURCE_URL="jdbc:mysql://mysql-staging.internal:3306/campusx_staging"
SPRING_DATASOURCE_USERNAME="campusx_staging"
SPRING_DATASOURCE_PASSWORD="staging-db-password"

# Uploads
UPLOAD_DIR="/var/campusx-staging/uploads"

# OAuth2
GOOGLE_CLIENT_ID="staging-google-client-id"
GOOGLE_CLIENT_SECRET="staging-google-secret"

# Rate limiting - moderate
RATE_LIMIT_REQUESTS="500"
RATE_LIMIT_WINDOW_SECONDS="60"

# Logging - normal
LOGGING_LEVEL_COM_EXAMPLE_BACKEND="INFO"
```

### Production Configuration (`.env.prod`)

```bash
# Production - strict security
JWT_SECRET="[MUST BE SET - use: openssl rand -base64 32]"
JWT_COOKIE_SECURE="true"
CORS_ALLOWED_ORIGINS="https://campusx.example.com"
FRONTEND_BASE_URL="https://campusx.example.com"

# Database - MySQL production
SPRING_DATASOURCE_URL="jdbc:mysql://mysql-prod.internal:3306/campusx_prod"
SPRING_DATASOURCE_USERNAME="campusx_prod"
SPRING_DATASOURCE_PASSWORD="${DB_PASSWORD_VAULT}"  # From secrets manager

# Uploads - persistent storage
UPLOAD_DIR="/mnt/shared-storage/campusx/uploads"

# OAuth2
GOOGLE_CLIENT_ID="prod-google-client-id"
GOOGLE_CLIENT_SECRET="${GOOGLE_SECRET_VAULT}"  # From secrets manager

# Rate limiting - strict
RATE_LIMIT_REQUESTS="100"
RATE_LIMIT_WINDOW_SECONDS="60"

# Logging - minimal
LOGGING_LEVEL_COM_EXAMPLE_BACKEND="WARN"
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK="ERROR"
```

---

## 🔐 Generating Secure Secrets

### Generate JWT Secret (256-bit)

```bash
# Generate base64-encoded 256-bit secret
openssl rand -base64 32

# Example output:
# aBcDeFgHiJkLmNoPqRsTuVwXyZ1a2b3c4D5e6F7g8H=

# Store in environment variable
export JWT_SECRET="aBcDeFgHiJkLmNoPqRsTuVwXyZ1a2b3c4D5e6F7g8H="
```

### Generate Database Password

```bash
# Generate secure random password
openssl rand -base64 16

# Example output:
# aB3dE7fGhIj9kLmN

# Store in secrets manager, not in source code
export DB_PASSWORD="aB3dE7fGhIj9kLmN"
```

### Generate Google OAuth2 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
4. Select "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:8082/login/oauth2/code/google` (dev)
   - `https://campusx.example.com/login/oauth2/code/google` (prod)
6. Copy Client ID and Client Secret to environment variables

```bash
export GOOGLE_CLIENT_ID="xxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## 🐳 Docker Deployment

### Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: campusx
      MYSQL_USER: campusx_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql-data:/var/lib/mysql
      - ./backend/database/campusx_schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    environment:
      JWT_SECRET: ${JWT_SECRET}
      JWT_COOKIE_SECURE: "true"
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/campusx
      SPRING_DATASOURCE_USERNAME: campusx_user
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      CORS_ALLOWED_ORIGINS: http://frontend:3000
      FRONTEND_BASE_URL: http://localhost:3000
    depends_on:
      - mysql
    ports:
      - "8082:8082"

  frontend:
    build: ./frontend
    environment:
      REACT_APP_API_BASE: http://localhost:8082/api
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  mysql-data:
```

Run with:
```bash
docker-compose --env-file .env.prod up -d
```

---

## 🔒 Kubernetes Deployment

### Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: campusx-secrets
  namespace: production
type: Opaque
stringData:
  JWT_SECRET: "{{ base64_encoded_256_bit_secret }}"
  DB_PASSWORD: "{{ database_password }}"
  GOOGLE_CLIENT_ID: "{{ google_client_id }}"
  GOOGLE_CLIENT_SECRET: "{{ google_client_secret }}"
```

### Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: campusx-config
  namespace: production
data:
  JWT_COOKIE_SECURE: "true"
  CORS_ALLOWED_ORIGINS: "https://campusx.example.com"
  FRONTEND_BASE_URL: "https://campusx.example.com"
  DATABASE_HOST: "mysql-service.production"
  RATE_LIMIT_REQUESTS: "100"
  RATE_LIMIT_WINDOW_SECONDS: "60"
```

### Backend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: campusx-backend
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: campusx-backend
  template:
    metadata:
      labels:
        app: campusx-backend
    spec:
      containers:
      - name: backend
        image: campusx-backend:latest
        ports:
        - containerPort: 8082
        envFrom:
        - configMapRef:
            name: campusx-config
        - secretRef:
            name: campusx-secrets
        livenessProbe:
          httpGet:
            path: /api/auth/me
            port: 8082
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/auth/me
            port: 8082
          initialDelaySeconds: 10
          periodSeconds: 5
```

---

## ✅ Configuration Checklist

### Before Development
- [ ] Generate JWT_SECRET: `openssl rand -base64 32`
- [ ] Add Google OAuth2 credentials
- [ ] Set JWT_COOKIE_SECURE="false" for local development
- [ ] CORS_ALLOWED_ORIGINS includes localhost

### Before Staging
- [ ] Generate new JWT_SECRET for staging
- [ ] Set JWT_COOKIE_SECURE="true"
- [ ] Configure MySQL database
- [ ] Set staging CORS origins
- [ ] Update Google OAuth2 redirect URIs

### Before Production
- [ ] Generate production JWT_SECRET
- [ ] Store secrets in vault (AWS Secrets Manager, HashiCorp Vault, etc.)
- [ ] Enable HTTPS/SSL
- [ ] Set JWT_COOKIE_SECURE="true"
- [ ] Configure production database with backups
- [ ] Set production CORS origins (no wildcards)
- [ ] Configure persistent upload directory
- [ ] Set up monitoring and alerting
- [ ] Test disaster recovery procedures

---

## 🧪 Testing Configuration

### Test Login
```bash
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123456"}'
```

### Test Environment Variables
```bash
# Check if variables are set
env | grep -E 'JWT_|GOOGLE_|DB_|CORS_'

# Verify backend picks up variables
curl http://localhost:8082/api/auth/me
# Should return 401 (not authenticated)
```

### Verify HTTPS/SSL (Production)
```bash
curl -I https://campusx.example.com/api/facilities

# Check for security headers
# Should include: Strict-Transport-Security, X-Content-Type-Options, etc.
```

---

## 📚 File Structure for Environment Setup

```
campusx/
├── .env                          # Current environment (gitignored)
├── .env.example                  # Template for developers
├── .env.dev                      # Development variables (gitignored)
├── .env.staging                  # Staging variables (gitignored)
├── .env.prod                     # Production variables (gitignored)
├── backend/
│   ├── application.properties    # Spring Boot configuration
│   └── src/main/resources/
│       └── application.properties
└── frontend/
    ├── .env.example
    └── .env                      # Frontend env file (gitignored)
```

---

## ⚠️ Security Best Practices

1. **Never commit secrets to git**
   - Add `.env*` to `.gitignore` (except `.env.example`)
   - Use `.env.example` as template for developers

2. **Use secrets management tools**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Google Cloud Secret Manager

3. **Rotate secrets regularly**
   - Change JWT_SECRET annually
   - Rotate database passwords every 6 months
   - Update OAuth2 credentials when compromised

4. **Log configuration carefully**
   - Never log sensitive values
   - Mask passwords in logs
   - Use structured logging for security events

5. **Environment-specific handling**
   - Different secrets for each environment
   - No production secrets in development
   - Audit trail for secret access

---

## 📞 Troubleshooting

### Issue: "JWT_SECRET not set"
```
Solution: Set environment variable before running application
export JWT_SECRET=$(openssl rand -base64 32)
```

### Issue: "CORS error"
```
Solution: Check CORS_ALLOWED_ORIGINS matches your frontend URL
export CORS_ALLOWED_ORIGINS="https://your-frontend.com"
```

### Issue: "Database connection refused"
```
Solution: Verify database host, port, and credentials
export SPRING_DATASOURCE_URL="jdbc:mysql://HOST:PORT/DB_NAME"
```

### Issue: "OAuth2 redirect mismatch"
```
Solution: Add redirect URI to Google Console
https://console.cloud.google.com/apis/credentials
Add: https://your-domain/login/oauth2/code/google
```

---

**Last Updated:** April 18, 2026
**Version:** 1.0
