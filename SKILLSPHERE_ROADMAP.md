# SkillSphere Build Roadmap

SkillSphere is a MERN hyperlocal freelance marketplace. Build it in layers so each week has something demoable.

## Current Starting Point

- React + Vite client exists.
- Express server exists.
- Basic routes/controllers exist for test, users, and in-memory auth.
- MongoDB connection file exists.

## Week 1: Foundation

Goal: users can register, log in, and see role-specific starter dashboards.

Backend:
- Add User model with roles: client, freelancer, admin.
- Replace in-memory auth with MongoDB.
- Hash passwords with bcrypt.
- Return JWT on login.
- Add auth middleware and role middleware.
- Add profile endpoints.

Frontend:
- Replace Vite starter screen.
- Add login/register pages.
- Store auth token safely enough for development.
- Add client, freelancer, and admin dashboard shells.

## Week 2: Marketplace

Goal: clients post gigs and freelancers apply.

Backend:
- Add Gig model.
- Add Proposal model.
- Add gig create/list/detail/update APIs.
- Add proposal submit/accept/reject APIs.
- Add search filters for location, skills, budget, and status.

Frontend:
- Add gig marketplace page.
- Add create gig form for clients.
- Add proposal submission UI for freelancers.
- Add filters and gig detail page.

## Week 3: Collaboration And Trust

Goal: users can communicate and leave verified feedback.

Backend:
- Add messages with Socket.IO.
- Add notifications.
- Add review/rating APIs.
- Add simple reputation score calculation.

Frontend:
- Add chat interface.
- Add notifications panel.
- Add review form and ratings display.

## Week 4: Advanced Demo Polish

Goal: the app feels complete enough for review on July 22, 2026.

Backend:
- Add payment order placeholder or sandbox integration.
- Add admin APIs for user/gig/review moderation.
- Add analytics endpoints.
- Add stronger validation and error handling.

Frontend:
- Add payment UI placeholder or sandbox flow.
- Add admin dashboard.
- Add analytics cards/charts.
- Polish responsive layout and empty/loading/error states.

## Recommended First Build Order

1. Make the backend run reliably.
2. Connect MongoDB.
3. Build real auth.
4. Build role-based dashboards.
5. Build gigs.
6. Build proposals.
7. Add search and matching.
8. Add chat, reviews, notifications, and admin features.

## Notes

- Google OAuth, 2FA, full escrow payments, WebRTC calls, and AI matching are advanced. Build simple versions first, then upgrade.
- For AI matching, start with a local skill-overlap score. Add Hugging Face later when the core marketplace works.
