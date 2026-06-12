# Agentic PM

Agentic PM is a full-stack project management and CRM prototype with AI-powered planning, task generation, code assistance, lead scoring, and automated email follow-up.

## Project structure

- `client/` - React + Vite frontend
- `server/` - Express backend with MongoDB, Notion sync, email service, and AI agent integrations

## Key features

- User registration and login with JWT authentication
- AI project planning endpoint for generating project plans
- Task breakdown generation from project plans
- Code generation and automated review flows
- Lead scoring and CRM communication automation
- Notion integration for project and task sync
- Email follow-up support using Gmail SMTP

## Tech stack

- Frontend: React, Vite, Axios, lucide-react
- Backend: Node.js, Express, Mongoose, JWT, bcryptjs
- Integrations: Notion API, Gmail SMTP, Google Generative AI SDK

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas or another MongoDB connection string
- Gmail account or SMTP credentials for sending email
- Notion integration token and parent page ID if using Notion sync

## Setup

### 1. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Configure environment variables

Create a `.env` file in `server/` with the following entries:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NOTION_API_KEY=your_notion_integration_token
NOTION_PAGE_ID=your_notion_parent_page_id
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

Notes:

- `NOTION_API_KEY` and `NOTION_PAGE_ID` are optional. If Notion is not configured, sync operations are skipped.
- For Gmail, use an App Password if your account has 2FA enabled.

### 3. Run the backend

```bash
cd server
npm run dev
```

The backend starts on port `5000` by default.

### 4. Run the frontend

```bash
cd client
npm run dev
```

The frontend runs on Vite default port `5173` or `5174`.

## API endpoints

### Auth
- `POST /api/auth/register` - Register a user
- `POST /api/auth/login` - Login and receive a JWT

### Project planning
- `POST /api/plan` - Generate a project plan from an idea

### Task generation
- `POST /api/tasks` - Generate tasks from a project plan

### Code assistance
- `POST /api/generate-code` - Generate code and review it

### CRM
- `POST /api/crm/score` - Analyze and score lead data
- `POST /api/crm/communicate` - Generate follow-up communication and optionally send email

### Health check
- `GET /health` - Returns API status

## Notes

- The server includes an offline admin login fallback when MongoDB is unavailable: login as `admin` with the configured `JWT_SECRET`.
- The backend uses HTTP CORS only for `http://localhost:5174` and `http://localhost:5173`.

## Deployment

1. Build the frontend:

```bash
cd client
npm run build
```

2. Deploy the server and serve the built frontend as needed.

---

Ready to push to GitHub with a clean repo overview and setup instructions.