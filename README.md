# Solicitor Client Management System

A secure, full-stack application for managing client case files, documents, audit logs, and role-based permissions for legal teams.

---

## 🚀 Deployment (Docker & DigitalOcean)

### ✅ Requirements
- MongoDB Atlas connection string
- Gmail with App Password
- DigitalOcean App or VPS
- Node.js 18+, Docker, Git

### 🗂️ Folder Structure
```
/project-root
  /frontend         # React client UI
  /backend          # Node.js API
  .env              # Do not commit
  docker-compose.yml
```

### 🔧 .env Setup
Create a `.env` file using the template from `.env.example`:
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/yourdb
GMAIL_USER=youremail@gmail.com
GMAIL_PASS=yourapppassword
ALERT_RECEIVER=admin@example.com
JWT_SECRET=your_jwt_secret
```

### 🐳 Run Locally
```bash
docker-compose up -d --build
```
- Access backend at: http://localhost:5000
- Access frontend at: http://localhost:3000

### 🌱 Seed Sample Data
```bash
node backend/seed.js
```

### 🛡️ Features
- Role-based login (JWT)
- Secure document upload (S3-ready structure)
- MongoDB for client & audit logs
- Audit log viewer with filters
- Email alerts on sensitive actions

---

## ☁️ Deploy to DigitalOcean (App Platform)
1. Push project to GitHub
2. Connect GitHub repo to DigitalOcean App
3. Configure build for `/frontend` and `/backend`
4. Add environment variables securely
5. Set backend start command: `node upload.js`

Optionally configure domain, scaling, and HTTPS.

---

## 🔄 CI/CD with GitHub
- Ensure your GitHub repo is connected to DigitalOcean
- Enable auto-deploys on commit
- Add production branches (e.g., `main`) under auto-deploy settings
- Test build before merging to production

---

## 🧑‍💼 Admin Manual (UI Usage)

### 🧾 Login
- Admin: `admin@example.com`, Password: `password`
- Staff: `staff@example.com`, Password: `password`

### 📂 Clients
- View, update, and track client data from dashboard

### 📁 Documents
- Upload files per client
- Admin can delete; staff can only upload/view

### 📜 Audit Log
- Admins can view actions performed in the app
- Filter logs by action/user/key in real time

### ⚠️ Alerts
- Email sent to `ALERT_RECEIVER` when deletion is attempted

---

## 📧 Gmail Setup
- Enable 2FA on your Gmail
- Go to https://myaccount.google.com/security → **App Passwords**
- Generate for "Mail" + "Other (Custom name)"
- Use that password in `GMAIL_PASS`

---

## 📄 License
MIT License © Your Firm Name
