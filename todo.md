# The Civic Authority v2 - Development TODO

## Phase 1: Database & Backend Setup
- [x] Create database schema in `drizzle/schema.ts` (users, issues, comments, upvotes, notifications)
- [x] Generate and apply database migrations
- [x] Create query helpers in `server/db.ts`
- [x] Set up tRPC routers for all features

## Phase 2: Authentication & User Management
- [x] Implement user profile page with stats display
- [ ] Add profile update functionality (name, bio, avatar)
- [x] Create user leaderboard (top contributors by verified reports)
- [x] Add trust score display and management
- [x] Implement user role management (user vs admin)

## Phase 3: Issue Reporting System
- [x] Build multi-step issue reporting form (5 steps)
- [x] Implement photo upload with S3 integration
- [x] Add category selection dropdown
- [x] Integrate Google Maps for location picking
- [x] Add reverse geocoding for address display
- [x] Implement GPS positioning feature
- [x] Add form validation and error handling
- [x] Create issue submission API endpoint

## Phase 4: Dashboard & Issue Feed
- [x] Build main dashboard layout
- [x] Implement issue feed with pagination
- [x] Add category filter dropdown
- [x] Add status filter buttons
- [x] Add search functionality
- [x] Create issue card component with status badges
- [ ] Add map view toggle for dashboard
- [ ] Implement real-time feed updates

## Phase 5: Issue Details & Community Features
- [x] Build issue detail page layout
- [ ] Display issue photo, location map, and metadata
- [x] Implement comments section with threading
- [x] Add comment creation and deletion
- [x] Implement upvote/downvote functionality
- [ ] Create status timeline visualization
- [x] Add notification system for status updates
- [x] Display reporter profile and trust score

## Phase 6: Admin Panel & Moderation
- [x] Build admin dashboard layout
- [x] Create moderation queue view
- [x] Implement issue verification workflow
- [x] Add status transition buttons (Pending → Verified → In Progress → Resolved/Rejected)
- [ ] Add rejection reason input field
- [ ] Create bulk action tools
- [ ] Implement user management interface
- [x] Add trust score adjustment controls

## Phase 7: Analytics & Reporting
- [x] Create analytics dashboard page
- [x] Build category breakdown chart
- [ ] Build status distribution chart
- [ ] Add time-series analytics (reports over time)
- [x] Create civic metrics summary (total reports, verified, resolved)
- [ ] Add export functionality for reports
- [x] Implement admin-only analytics access

## Phase 8: Responsive Design & UI Polish
- [x] Ensure mobile-responsive layouts
- [ ] Test on various screen sizes (mobile, tablet, desktop)
- [ ] Implement dark mode support (if needed)
- [x] Add loading states and skeletons
- [x] Add empty state messages
- [x] Implement error boundaries
- [x] Add toast notifications for user feedback
- [ ] Polish animations and transitions

## Phase 9: Testing & Quality Assurance
- [x] Write vitest tests for authentication flows
- [x] Write vitest tests for issue CRUD operations
- [x] Write vitest tests for admin moderation
- [x] Write vitest tests for community features
- [x] Test all API endpoints
- [ ] Test form validation
- [ ] Test map integration
- [ ] Test file upload functionality
- [ ] Cross-browser testing

## Phase 10: Deployment & Launch
- [ ] Set up environment variables
- [ ] Configure database connection
- [ ] Set up S3 bucket for file storage
- [ ] Configure Google Maps API
- [ ] Test production build
- [ ] Deploy frontend and backend
- [ ] Set up monitoring and logging
- [ ] Create user documentation
- [ ] Launch and gather feedback
