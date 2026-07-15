# NeuralPatch: AI-Powered DevSecOps SaaS Platform

NeuralPatch is a modern, real-time DevSecOps auditing platform that automatically scans repositories for security vulnerabilities, generates cryptographic threat ledgers, and engineers automated Git patches using AI to mitigate vulnerabilities.

---

## 🚀 Key Architecture & Technologies
- **Frontend**: React (Vite), TailwindCSS, Lucide Icons (compiled using strict production bundles).
- **Backend**: Node.js, Express, MongoDB (Mongoose), Redis (BullMQ worker queue for asynchronous scan jobs).
- **AI Engine**: Google Gemini Pro (used to analyze source code diffs and write secure mitigation patches).

---

## 🛡️ Hardened Security Features (Real-User Ready)
- **Strict Tenant Isolation**: All endpoints (listing repositories, running scans, applying patches, etc.) validate and verify repository ownership against the authenticated user (`req.user.userId`).
- **Cryptographic Encryption at Rest**: Sensitive data (such as user GitHub OAuth tokens) is encrypted in MongoDB using **AES-256-CBC**.
- **Brute-Force & DoS Protection**: Authenticated endpoints are guarded by strict rate-limiting policies (`express-rate-limit`).
- **Production-Ready Headers**: Integrated `helmet` middleware for HTTP security header protection (XSS/Clickjacking protections).
- **Production Error Masking**: Sanitized application-level errors and database paths. Stack traces are masked for production clients.

---

## 🛠️ Local Sandbox & Dev Setup

### Prerequisites
- **Node.js**: v18+
- **MongoDB**: Local or Atlas connection
- **Redis**: Running instance (port `6379`)

### 1. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Configure environment variables in `backend/.env`:
   ```ini
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/devsecops
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=secure_jwt_secret_here
   ENCRYPTION_KEY=d3f6d71b56934c9c8a9947f631bcde41 # 32-byte hex key
   SANDBOX_MODE=true # Allows local demo sign-in bypass
   FRONTEND_URL=http://localhost:3000
   ```
4. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `frontend/.env`:
   ```ini
   VITE_API_URL=http://localhost:5000
   ```
4. Run in dev mode:
   ```bash
   npm run dev
   ```

---

## 🧪 Local Webhook & Scan Testing
To simulate a repository scan and see the dashboard updates without setting up real GitHub hooks, run the local PowerShell workflow script from the project root:
```powershell
powershell -File .\test_workflow.ps1
```
This script connects a mock repository (`main-api-service`) and posts a signed webhook signature using the captured HMAC-SHA256 protocol.
