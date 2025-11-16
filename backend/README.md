# EcoPromise Backend API

RESTful API for the EcoPromise Green Commitment Wall platform built with Express.js, TypeScript, MongoDB, and Gemini AI.

## Features

- 🔐 NextAuth JWT authentication with Google OAuth
- 🌱 AI-powered commitment interpretation using Gemini
- 📊 Carbon savings estimation and tracking
- 🎯 Milestone generation and progress tracking
- 🏆 Gamification with badges and levels
- 🌍 Public commitment wall with filtering
- 💬 Social features (likes, comments, challenges)
- 🏢 Organization support with CSR reporting
- 👮 Admin moderation tools

## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** NextAuth JWT (shared secret)
- **AI:** Google Gemini API
- **Validation:** express-validator & Zod

## Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Google Gemini API key
- NextAuth configured frontend (for shared secret)

## Installation

1. **Clone and install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ecopromise
NEXTAUTH_SECRET=your-shared-secret-key
GEMINI_API_KEY=your-gemini-api-key
ALLOWED_ORIGINS=http://localhost:3000
```

3. **Run development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
All protected routes require `Authorization: Bearer <JWT_TOKEN>` header.

### Health Check
- `GET /health` - Server health status

### Users
- `GET /api/users/me` - Get current user profile (Auth)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/me` - Update profile (Auth)

### Commitments
- `POST /api/commitments` - Create commitment with AI interpretation (Auth)
- `GET /api/commitments/:id` - Get commitment details
- `PATCH /api/commitments/:id` - Update commitment (Auth, Owner)
- `DELETE /api/commitments/:id` - Delete commitment (Auth, Owner)
- `POST /api/commitments/:id/like` - Like/unlike commitment (Auth)
- `POST /api/commitments/:id/comments` - Add comment (Auth)
- `GET /api/commitments/:id/comments` - Get comments
- `GET /api/commitments/user/:userId` - Get user's commitments

### Wall
- `GET /api/wall` - Get public commitments wall
  - Query params: `sort` (recent/impact/popular), `category`, `dateRange`, `carbonRange`, `search`, `page`, `limit`
- `GET /api/wall/trending` - Get trending commitments
- `GET /api/wall/contributors` - Get top contributors
- `GET /api/wall/stats` - Get wall statistics

### Progress & Dashboard
- `POST /api/commitments/:id/progress` - Add progress update (Auth)
- `GET /api/commitments/:id/progress` - Get progress updates
- `GET /api/commitments/:id/milestones` - Get milestones
- `GET /api/dashboard/me` - Get user dashboard with stats (Auth)

### Notifications
- `GET /api/notifications` - Get user notifications (Auth)
- `PATCH /api/notifications/:id/read` - Mark as read (Auth)

### Challenges
- `POST /api/challenges` - Create challenge (Auth)
- `POST /api/challenges/:id/join` - Join challenge (Auth)
- `GET /api/challenges/:id` - Get challenge details
- `GET /api/challenges` - List challenges

### Social
- `GET /api/leaderboard` - Get leaderboard
  - Query params: `metric` (carbonSaved/commitments/level), `period` (all/today/week/month), `limit`
- `POST /api/flag` - Flag inappropriate content (Auth)

### Organizations
- `GET /api/organizations/:id` - Get organization details
- `GET /api/organizations/:id/csr-report` - Get CSR report

### Admin (Admin role required)
- `GET /api/admin/flags` - Get all flags (Admin)
- `PATCH /api/admin/flags/:id` - Resolve flag (Admin)

## Data Models

### User
```typescript
{
  googleId: string
  email: string
  name: string
  image?: string
  username?: string
  bio?: string
  location?: string
  sustainabilityFocusAreas: string[]
  role: 'user' | 'org_admin' | 'admin'
  totalCarbonSaved: number
  totalCommitments: number
  completedMilestones: number
  level: number
  badges: string[]
}
```

### Commitment
```typescript
{
  userId: ObjectId
  text: string
  mediaType: 'text' | 'image' | 'video'
  mediaUrl?: string
  category: 'transport' | 'energy' | 'food' | 'waste' | 'water' | 'consumption' | 'other'
  frequency: 'daily' | 'weekly' | 'monthly' | 'once'
  duration?: string
  visibility: 'public' | 'private' | 'group'
  estimatedCarbonSavings: {
    perPeriod: number
    total: number
    unit: string
  }
  actualCarbonSaved: number
  status: 'active' | 'completed' | 'archived'
  likeCount: number
  commentCount: number
  likes: ObjectId[]
}
```

## Gemini AI Integration

The backend uses Google Gemini for three AI features:

1. **Commitment Interpretation** - Extracts category, frequency, and parameters from text
2. **Carbon Estimation** - Calculates CO2 savings based on commitment details
3. **Milestone Suggestions** - Generates achievable milestones

All AI functions have fallback logic for reliability.

## Error Handling

Responses follow consistent format:
```json
{
  "status": "success" | "fail" | "error",
  "data": { ... },
  "message": "Error message"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request / Validation Error
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Development

```bash
npm run dev    # Run with auto-reload
npm run build  # Compile TypeScript
npm run lint   # Run ESLint
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts
│   ├── controllers/
│   │   ├── commitment.controller.ts
│   │   ├── progress.controller.ts
│   │   ├── social.controller.ts
│   │   ├── user.controller.ts
│   │   └── wall.controller.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validator.ts
│   ├── models/
│   │   ├── Challenge.ts
│   │   ├── Comment.ts
│   │   ├── Commitment.ts
│   │   ├── Flag.ts
│   │   ├── Milestone.ts
│   │   ├── Notification.ts
│   │   ├── Organization.ts
│   │   ├── ProgressUpdate.ts
│   │   └── User.ts
│   ├── routes/
│   │   ├── commitment.routes.ts
│   │   ├── progress.routes.ts
│   │   ├── social.routes.ts
│   │   ├── user.routes.ts
│   │   └── wall.routes.ts
│   ├── services/
│   │   ├── gamification.service.ts
│   │   ├── gemini.service.ts
│   │   └── notification.service.ts
│   └── index.ts
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

## License

ISC
