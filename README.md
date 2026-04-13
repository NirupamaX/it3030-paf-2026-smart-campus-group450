# <span style="color:#22c55e">Smart</span> <span style="color:#3b82f6">Campus</span> <span style="color:#ec4899">Operations</span> <span style="color:#ef4444">Hub</span>

> A clean full-stack web application to manage facilities, bookings, and maintenance.

---

## 🟢 <span style="color:#22c55e">Overview</span>

Smart Campus Operations Hub provides a centralized system for handling campus resources, scheduling, and issue tracking with a structured workflow.

---

## 🔵 <span style="color:#3b82f6">Features</span>

### Facilities & Assets

* Manage lecture halls, labs, rooms, and equipment
* Store capacity, location, and availability
* Search and filter resources

### Booking System

* Create booking requests
* Prevent scheduling conflicts
* Track booking status
* View user bookings

### Maintenance & Tickets

* Report issues with resources
* Upload images as evidence
* Track ticket progress
* Assign technicians and manage updates

### Notifications

* Receive updates for bookings and tickets
* In-app notification system

### Authentication & Security

* Secure login system
* Role-based access control
* Protected routes and APIs

---

## 🟣 <span style="color:#ec4899">Tech Stack</span>

* **Backend:** Spring Boot, REST API, JPA/Hibernate, MySQL/PostgreSQL
* **Frontend:** React, Axios/Fetch, Tailwind CSS/Bootstrap
* **Tools:** Git, GitHub, GitHub Actions

---

## 🔴 <span style="color:#ef4444">Project Structure</span>

```
backend/
frontend/
docs/
README.md
```

---

## 🟢 <span style="color:#22c55e">Getting Started</span>

### Prerequisites

* Java 17+
* Node.js (v18+)
* MySQL / PostgreSQL

### Backend Setup

```
cd backend
./mvnw spring-boot:run
```

### Frontend Setup

```
cd frontend
npm install
npm start
```

---

## 🔵 <span style="color:#3b82f6">Environment Configuration</span>

Create `.env` files for:

* Database connection
* API base URL
* Authentication credentials

---

## 🟣 <span style="color:#ec4899">API Overview</span>

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| GET    | /api/resources     | Get all resources |
| POST   | /api/resources     | Create resource   |
| GET    | /api/bookings      | Get bookings      |
| POST   | /api/bookings      | Create booking    |
| PUT    | /api/bookings/{id} | Update booking    |
| DELETE | /api/bookings/{id} | Cancel booking    |
| POST   | /api/tickets       | Create ticket     |
| GET    | /api/tickets       | Get tickets       |

---

## 🔴 <span style="color:#ef4444">Testing</span>

* Unit testing
* API testing (Postman)
* UI testing

---

## 🟢 <span style="color:#22c55e">Future Improvements</span>

* Analytics dashboard
* QR-based booking system
* Email notifications
* Mobile integration

---

## License

For educational use.

---

<p align="center">✨ Simple • Clean • Functional</p>
