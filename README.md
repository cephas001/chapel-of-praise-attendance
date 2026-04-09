# Chapel Attendance System

A robust, offline-first full-stack web application designed to track student attendance in environments with unstable internet connectivity. Built for speed and reliability, this system allows ushers to seamlessly scan Matriculation Numbers via mobile phone cameras, queue records locally when offline, and automatically synchronize with a centralized PostgreSQL database the moment a connection is restored.

## 🚀 Key Features

- **Offline-First Architecture:** Uses `Dexie.js` (IndexedDB) to securely store scans locally. Network watchers automatically push queued data to the server when the device comes back online.
- **Hardware Integration:** Utilizes `html5-qrcode` to turn any mobile device browser into a high-speed barcode/QR scanner. Includes a manual entry fallback.
- **Conflict Resolution:** Safely handles split-brain scenarios (e.g., two offline ushers scanning the same student) using Prisma compound unique constraints and graceful UI error reporting.
- **State Machine & Rules Engine:** Enforces strict operational rules, such as preventing a student from signing out if they never signed in.
- **Stateless Security:** Uses JWT (JSON Web Tokens) for secure, offline-compatible usher authentication.
- **Super Admin Command Center:** A dedicated dashboard to create events, toggle service phases (Sign-In, Locked/Syncing, Sign-Out), and export finalized attendance records to CSV.

## 🛠️ Tech Stack

**Frontend:**

- Nuxt 3 / Vue 3 (Composition API)
- Tailwind CSS
- Dexie.js (IndexedDB wrapper)
- html5-qrcode

**Backend:**

- Node.js / Express
- Prisma ORM (v7 with Driver Adapters)
- PostgreSQL (Hosted via Supabase)
- JSON Web Tokens (JWT) & bcrypt

## 📦 Local Setup & Installation

### Prerequisites

- Node.js (v18+)
- A PostgreSQL database (e.g., Supabase)

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/YOUR_USERNAME/chapel-attendance.git
cd chapel-attendance
\`\`\`

### 2. Backend Configuration

Navigate to the backend directory and install dependencies:
\`\`\`bash
cd backend
npm install
\`\`\`

Create a `.env` file in the `backend` folder and add your credentials:
\`\`\`env
DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]"
JWT_SECRET="your_secure_random_string"
\`\`\`

Push the Prisma schema to your database and generate the client:
\`\`\`bash
npx prisma db push
npx prisma generate
\`\`\`

Start the backend server:
\`\`\`bash
npm run dev

# Server runs on http://localhost:5000

\`\`\`

### 3. Frontend Configuration

Open a new terminal, navigate to the frontend directory, and install dependencies:
\`\`\`bash
cd frontend
npm install
\`\`\`

Start the Nuxt development server:
\`\`\`bash
npm run dev -- -o

# App runs on http://localhost:3000

\`\`\`

## 🧪 Testing the Flow

1. **Initial Setup:** Send a `POST` request to `http://localhost:5000/api/test-setup` to create the default Super Admin account (Username: `super_admin_1`, Password: `password123`).
2. **Login:** Access `http://localhost:3000/login` and authenticate.
3. **Admin Dashboard:** Navigate to the Command Center to create a new Service Event.
4. **Scan:** Return to the home page, select your event, and point your camera at a barcode (or manually type a Matric Number).
5. **Offline Test:** Disable your device's Wi-Fi, scan a few codes to watch the local queue build up, then reconnect to watch the automatic synchronization.
