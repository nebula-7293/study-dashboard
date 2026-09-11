# 📅 Daily Work Schedule & Progress Tracker (Sept 10 – Sept 21)

> **Goal**: Build and ship the StudyPulse Dashboard by September 21st.  
> **Commitment**: ~1.5 to 2 hours per day.  
> **Rule**: Check off items as you complete them!

---

### Day 1 (Thu, Sep 10): Scaffolding & Server Setup
- [x] Initialize Python virtual environment (`.venv`)
- [x] Install base packages: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `pydantic`
- [x] Create directory structure (`backend/app/`, `frontend/`)
- [x] Write first FastAPI app in `backend/app/main.py` with `GET /api/health`
- [x] Test server locally (`uvicorn backend.app.main:app --reload`)

### Day 2 (Fri, Sep 11): Data Modeling & SQLite
- [x] Setup `database.py` with SQLite connection & engine
- [x] Create SQLAlchemy model for `Task` (id, title, description, urgency, scope, completed, due_date)
- [x] Create model for `Deadline` (id, title, course, date, weight, scope)
- [x] Create model for `Course` (id, name, credits, grade_point, target_grade)
- [x] Create model for `ScheduleSlot` (id, day, start_time, end_time, title, location, scope)
- [x] Verify SQLite DB file and tables create automatically on startup

### Day 3 (Sat, Sep 12): Tasks & Urgency REST API
- [ ] Define Pydantic request/response schemas in `schemas/task.py`
- [ ] Create router in `routers/tasks.py`:
  - `GET /api/tasks` (with optional `?scope=uni&urgency=high` filters)
  - `POST /api/tasks` (create task)
  - `PATCH /api/tasks/{task_id}` (toggle completed or edit)
  - `DELETE /api/tasks/{task_id}`
- [ ] Test all task operations in Swagger UI (`http://127.0.0.1:8000/docs`)

### Day 4 (Sun, Sep 13): Deadlines & Courses REST API
- [ ] Create schemas & routers for Deadlines (`GET`, `POST`, `DELETE`)
- [ ] Create schemas & routers for Courses (`GET`, `POST`, `PATCH`, `DELETE`)
- [ ] Test filtering by `scope` (university vs personal)
- [ ] Review REST response status codes (200, 201, 404)

### Day 5 (Mon, Sep 14): GPA Calculator Logic & Pytest
- [ ] Write GPA calculation algorithms in `services/gpa_calc.py`:
  - Semester GPA (weighted average of grade points by credits)
  - Cumulative GPA
  - What-if grade projection
- [ ] Set up `pytest` in `backend/tests/test_gpa.py`
- [ ] Run automated tests to verify math & edge cases (e.g., zero credits)

### Day 6 (Tue, Sep 15): Frontend Base & Dashboard Shell
- [ ] Create `frontend/index.html` with Tailwind CSS grid layout
- [ ] Build top navigation bar with **University / Personal / All** scope toggle
- [ ] Create empty card containers for each of the 5 widgets
- [ ] Write `frontend/js/api.js` (reusable async fetch wrapper for API calls)

### Day 7 (Wed, Sep 16): Widget 1 — 3-Tier Emergency To-Do List
- [ ] Build 3-column UI: 🔴 Urgent (High), 🟡 Important (Medium), 🟢 Backlog (Low)
- [ ] Fetch tasks from `/api/tasks` and render into respective columns
- [ ] Add task creation modal / quick-input form
- [ ] Add checkbox to mark completed (triggers `PATCH /api/tasks/{id}`)

### Day 8 (Thu, Sep 17): Widget 2 — Deadlines & Exams Countdown
- [ ] Build Deadlines widget card
- [ ] Fetch upcoming deadlines from `/api/deadlines`
- [ ] Implement days-remaining calculation (e.g., "In 2 days", "Tomorrow")
- [ ] Add visual urgency badges based on how close the deadline is

### Day 9 (Fri, Sep 18): Widget 3 — Pomodoro Timer
- [ ] Build timer display (25:00 work / 5:00 break)
- [ ] Implement countdown timer logic with Start, Pause, and Reset
- [ ] Add session completion sound or notification
- [ ] Log completed study session to backend

### Day 10 (Sat, Sep 19): Widget 4 & 5 — GPA & Schedule Widgets
- [ ] Build GPA summary card (Current GPA badge + course grade list)
- [ ] Connect GPA widget to `/api/courses` & GPA service endpoint
- [ ] Build Schedule card ("Today's Classes & Blocks")
- [ ] Wire up scope switching so changing to "Personal" hides uni classes/grades

### Day 11 (Sun, Sep 20): External API Practice & UI Polish
- [ ] Practice external API: Add a daily motivational quote or study advice widget
- [ ] Add smooth loading animations and empty-state placeholders
- [ ] Review responsive mobile/tablet layout

### Day 12 (Mon, Sep 21): Final Testing & Demo Ready! 🚀
- [ ] Run full end-to-end test of all features
- [ ] Run `pytest` suite
- [ ] Clean up code, add comments and docstrings
- [ ] Project completed and ready for showcase!
