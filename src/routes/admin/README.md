# Admin Dashboard

## Quick Start

### Creating & Assigning a Learning Path

1. Go to `/admin/learning-paths`
2. **Phase 1: Brief** - Enter learner's situation and goals
3. **Phase 2: Generate** - AI creates the syllabus (4 weeks)
4. **Phase 3: Review** - Preview the generated path
5. **Phase 4: Assign** - Search for user by email/name, assign the path

### Monitoring Learners

1. Go to `/admin/learners`
2. View learners grouped by status:
   - **Needs Attention** - No activity for 5+ days
   - **Slow Progress** - No activity for 3-5 days
   - **On Track** - Active and progressing
   - **Completed** - Finished the path
   - **Invited** - Not started yet
3. Click a learner to see detailed progress

---

## Features

### `/admin/learning-paths`

- Create personalized 4-week learning paths
- Single brief input (situation + goals)
- C1/C2 level support
- User search autocomplete for assignment
- Email notification on assignment

### `/admin/learners`

- Overview of all learners with assigned paths
- Status-based grouping for quick triage
- Progress stats (sessions, time, last active)
- Learner detail view with weekly breakdown

---

## What to Test

### Learning Path Creation

- [ ] Generate a path with different levels (A1-C2)
- [ ] Verify syllabus is in English (not target language)
- [ ] Check that 4 weeks are created with themes

### Path Assignment

- [ ] Search for user by email (partial match)
- [ ] Search for user by display name
- [ ] Assign path and verify status becomes "active"
- [ ] Check email notification sends (if enabled)

### Home Page Integration

- [ ] Assigned user sees path scenarios on home page
- [ ] Learning path header shows week number and theme
- [ ] Non-assigned users see default featured scenarios

### Learner Monitoring

- [ ] Learners list shows correct status grouping
- [ ] Progress stats calculate correctly
- [ ] Detail view shows week-by-week progress
- [ ] Recent conversations display properly

---

## Planned Features

### Short Term

- [ ] Bulk assign paths to multiple users
- [ ] Edit/update existing paths
- [ ] Resend assignment email
- [ ] Archive/deactivate assignments

### Medium Term

- [ ] Weekly progress notifications for coaches
- [ ] In-app messaging to learners
- [ ] Progress charts and analytics
- [ ] Export learner data

### Long Term

- [ ] Cohort management (groups of learners)
- [ ] A/B testing different path structures
- [ ] AI-powered intervention suggestions
- [ ] Integration with calendar for scheduling

---

## API Endpoints

| Endpoint                              | Method | Description                |
| ------------------------------------- | ------ | -------------------------- |
| `/api/learning-paths`                 | POST   | Create a new path          |
| `/api/learning-paths/[pathId]/assign` | POST   | Assign path to user        |
| `/api/admin/users/search`             | GET    | Search users by email/name |

---

## Database Tables

- `learning_paths` - Path definitions and syllabus
- `learning_path_assignments` - User-path assignments
- `adaptive_weeks` - Weekly themes and conversation seeds
- `week_progress` - User progress per week
- `week_sessions` - Individual session records
