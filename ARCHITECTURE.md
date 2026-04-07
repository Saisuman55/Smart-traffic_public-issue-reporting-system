# The Civic Authority v2 - Architecture & Design Document

## Project Overview

**The Civic Authority** is a comprehensive civic issue reporting and management platform designed to empower residents to report local problems (road damage, traffic hazards, sanitation issues, water problems, electrical faults, etc.) while enabling administrators to efficiently review, verify, and resolve submissions.

The platform combines evidence-first reporting, precise geolocation, transparent status tracking, admin moderation workflows, and community engagement to create a trustworthy civic intelligence system.

---

## Core Features

### Citizen Features
1. **Secure Authentication**: JWT-based login/registration with OAuth integration
2. **Multi-Step Issue Reporting**: Photo upload, category selection, map-based location picking, description
3. **Interactive Maps**: Reverse geocoding, GPS positioning, location precision
4. **Real-Time Issue Feed**: Browse, filter, and search reported issues
5. **Issue Details**: View full context, comments, upvotes, timeline, status updates
6. **User Profile**: Activity tracking, trust scores, personal issue history
7. **Community Engagement**: Upvote issues, post comments, track community participation

### Admin Features
1. **Admin Dashboard**: Overview of all reports, key metrics, status distribution
2. **Moderation Panel**: Review, verify, reject, or resolve reports
3. **Status Management**: Transition issues through Pending → Verified → In Progress → Resolved/Rejected
4. **User Management**: View user profiles, adjust trust scores, manage roles
5. **Analytics**: Category breakdowns, status distributions, civic metrics, trends
6. **Bulk Actions**: Manage multiple reports efficiently

---

## Database Schema

### Core Tables

#### `users`
Manages user identity, roles, and civic participation metrics.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Surrogate key |
| `openId` | VARCHAR(64) | UNIQUE, NOT NULL | Manus OAuth identifier |
| `email` | VARCHAR(320) | UNIQUE | User email |
| `name` | TEXT | | User display name |
| `role` | ENUM('user', 'admin') | DEFAULT 'user' | Access control |
| `trustScore` | INT | DEFAULT 50 | Community trust metric (0-100) |
| `totalReports` | INT | DEFAULT 0 | Lifetime issue submissions |
| `verifiedReports` | INT | DEFAULT 0 | Reports verified by admins |
| `avatar` | TEXT | | Profile image URL |
| `bio` | TEXT | | User bio/description |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Account creation date |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last profile update |
| `lastSignedIn` | TIMESTAMP | DEFAULT NOW() | Last login timestamp |

#### `issues`
Core issue/report storage with status tracking and metadata.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Surrogate key |
| `reporterId` | INT | FOREIGN KEY (users.id) | Who reported the issue |
| `title` | VARCHAR(255) | NOT NULL | Issue headline |
| `description` | TEXT | NOT NULL | Detailed description |
| `category` | ENUM('road_damage', 'traffic_hazard', 'sanitation', 'water', 'electrical', 'other') | NOT NULL | Issue type |
| `status` | ENUM('pending', 'verified', 'in_progress', 'resolved', 'rejected') | DEFAULT 'pending' | Current status |
| `latitude` | DECIMAL(10, 8) | NOT NULL | GPS latitude |
| `longitude` | DECIMAL(11, 8) | NOT NULL | GPS longitude |
| `address` | TEXT | | Human-readable location |
| `landmark` | VARCHAR(255) | | Nearby landmark reference |
| `imageUrl` | TEXT | | Photo evidence URL (S3) |
| `upvoteCount` | INT | DEFAULT 0 | Community upvotes |
| `commentCount` | INT | DEFAULT 0 | Total comments |
| `verifiedBy` | INT | FOREIGN KEY (users.id) | Admin who verified |
| `resolvedBy` | INT | FOREIGN KEY (users.id) | Admin who resolved |
| `rejectionReason` | TEXT | | Why issue was rejected |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Report submission date |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last status update |
| `resolvedAt` | TIMESTAMP | | Resolution completion date |

#### `comments`
Threaded comments on issues for community discussion.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Surrogate key |
| `issueId` | INT | FOREIGN KEY (issues.id) | Parent issue |
| `authorId` | INT | FOREIGN KEY (users.id) | Comment author |
| `content` | TEXT | NOT NULL | Comment text |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Comment date |
| `updatedAt` | TIMESTAMP | DEFAULT NOW() | Last edit date |

#### `upvotes`
Tracks user upvotes on issues for community validation.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Surrogate key |
| `issueId` | INT | FOREIGN KEY (issues.id) | Issue being upvoted |
| `userId` | INT | FOREIGN KEY (users.id) | User who upvoted |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Upvote date |
| **Unique Constraint** | | UNIQUE(issueId, userId) | Prevent duplicate upvotes |

#### `notifications`
Real-time notifications for status updates and community activity.

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | INT | PRIMARY KEY, AUTO_INCREMENT | Surrogate key |
| `userId` | INT | FOREIGN KEY (users.id) | Recipient |
| `issueId` | INT | FOREIGN KEY (issues.id) | Related issue |
| `type` | ENUM('status_update', 'comment', 'upvote', 'mention') | NOT NULL | Notification type |
| `message` | TEXT | NOT NULL | Notification content |
| `isRead` | BOOLEAN | DEFAULT FALSE | Read status |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Notification date |

---

## API Architecture (tRPC Procedures)

### Authentication Router
- `auth.me` - Get current user profile
- `auth.logout` - Clear session

### Issues Router
- `issues.list` - Get paginated issue feed with filters (category, status, search)
- `issues.getById` - Get full issue details with comments
- `issues.create` - Submit new issue report
- `issues.updateStatus` - Admin: change issue status
- `issues.reject` - Admin: reject issue with reason
- `issues.resolve` - Admin: mark as resolved

### Comments Router
- `comments.list` - Get comments for an issue
- `comments.create` - Post new comment
- `comments.delete` - Delete own comment

### Upvotes Router
- `upvotes.toggle` - Add/remove upvote on issue
- `upvotes.getByIssue` - Get upvote count for issue

### Users Router
- `users.getProfile` - Get user profile with stats
- `users.updateProfile` - Update profile info
- `users.getLeaderboard` - Get top contributors
- `users.getByAdmin` - Admin: get user details

### Admin Router
- `admin.getStats` - Dashboard statistics
- `admin.getAnalytics` - Category/status breakdowns
- `admin.updateUserRole` - Promote/demote users
- `admin.adjustTrustScore` - Modify user trust score
- `admin.bulkUpdateStatus` - Update multiple issues

---

## Frontend Architecture

### Page Structure
- **Home**: Landing page with login/signup
- **Dashboard**: Main issue feed with filters and map view
- **ReportForm**: Multi-step issue submission wizard
- **IssueDetail**: Full issue view with comments and timeline
- **AdminPanel**: Moderation and analytics dashboard
- **UserProfile**: Personal profile and activity history
- **Leaderboard**: Top contributors and civic leaders

### Key Components
- **IssueCard**: Compact issue display with status badge
- **IssueMap**: Interactive map for location selection and visualization
- **CommentThread**: Threaded comments with upvotes
- **StatusTimeline**: Visual issue status progression
- **FilterBar**: Category, status, and search filters
- **AdminModeration**: Issue review and action panel
- **AnalyticsChart**: Category and status visualizations

---

## Design System

### Color Palette (Professional Civic Theme)
- **Primary**: `#0066CC` (Trust Blue) - Main CTAs, status badges
- **Secondary**: `#6B7280` (Neutral Gray) - Secondary actions
- **Success**: `#10B981` (Green) - Resolved status
- **Warning**: `#F59E0B` (Amber) - Pending/In Progress
- **Danger**: `#EF4444` (Red) - Rejected status
- **Background**: `#FFFFFF` (White) - Light, clean interface
- **Surface**: `#F9FAFB` (Light Gray) - Card backgrounds

### Typography
- **Headings**: Inter Bold (18px-32px)
- **Body**: Inter Regular (14px-16px)
- **Labels**: Inter Medium (12px-14px)

### Spacing & Layout
- **Grid**: 4px base unit (4, 8, 12, 16, 24, 32px)
- **Radius**: 8px default (smooth, modern feel)
- **Shadows**: Subtle elevation shadows for depth

---

## User Flows

### Citizen Reporting Flow
1. User logs in or signs up
2. Clicks "Report Issue" button
3. **Step 1**: Captures or uploads photo evidence
4. **Step 2**: Selects issue category from dropdown
5. **Step 3**: Picks location on interactive map or uses GPS
6. **Step 4**: Adds title, description, and optional landmark
7. **Step 5**: Reviews and submits report
8. Report appears in feed with "Pending" status
9. User receives notifications when status changes

### Admin Moderation Flow
1. Admin logs into dashboard
2. Views incoming reports in moderation queue
3. Clicks issue to review details, photo, and location
4. Verifies issue authenticity
5. Transitions status: Pending → Verified → In Progress → Resolved
6. Adds resolution notes
7. System notifies reporter of status changes

### Community Engagement Flow
1. User views issue in feed
2. Can upvote to show support
3. Can post comment with additional context
4. Can view other community comments
5. Upvotes and comments increase issue visibility

---

## Technical Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Vite | Modern UI framework |
| **Styling** | Tailwind CSS 4 | Utility-first styling |
| **Backend** | Express 4 + tRPC 11 | API and RPC procedures |
| **Database** | MySQL/TiDB | Relational data storage |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **Authentication** | Manus OAuth + JWT | Secure user sessions |
| **Maps** | Google Maps API | Location selection and visualization |
| **File Storage** | AWS S3 | Image and media storage |
| **UI Components** | shadcn/ui | Pre-built accessible components |
| **Forms** | React Hook Form + Zod | Form validation |
| **Charts** | Recharts | Analytics visualizations |
| **Notifications** | Sonner | Toast notifications |

---

## Security Considerations

1. **Authentication**: JWT tokens with secure cookie storage
2. **Authorization**: Role-based access control (user vs admin)
3. **Data Validation**: Zod schemas on frontend and backend
4. **File Upload**: Validate image types, size limits, scan for malware
5. **Rate Limiting**: Prevent spam reporting and API abuse
6. **CORS**: Restrict API access to authorized origins
7. **SQL Injection**: Use parameterized queries via Drizzle ORM
8. **XSS Protection**: React's built-in XSS prevention + sanitized HTML

---

## Performance Optimization

1. **Lazy Loading**: Code-split pages and components
2. **Image Optimization**: Compress uploads, serve via CDN
3. **Pagination**: Load issues in batches (20 per page)
4. **Caching**: Cache user profiles, category lists, admin stats
5. **Database Indexing**: Index on `status`, `category`, `createdAt`
6. **API Optimization**: Use tRPC's automatic batching and deduplication

---

## Deployment Strategy

- **Frontend**: Vercel or Netlify (SPA with client-side routing)
- **Backend**: Manus hosting or Railway (Node.js server)
- **Database**: Neon Postgres or TiDB (managed database)
- **Storage**: AWS S3 (file uploads and media)
- **Environment Variables**: Managed via `.env` (never committed)

---

## Success Metrics

1. **User Adoption**: Track sign-ups, active users, report submissions
2. **Report Resolution**: Monitor average time to resolve issues
3. **Community Engagement**: Track upvotes, comments, participation rate
4. **Data Quality**: Monitor report accuracy, rejection rate
5. **Performance**: Track page load times, API response times
6. **Admin Efficiency**: Monitor moderation queue size, resolution rate

