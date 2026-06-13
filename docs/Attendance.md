# Attendance & participation

Omada uses **one schedule-backed attendance store** (`Event` + `EventAttendance`) for university class sessions and corporate meeting RSVP. **Corporate workdays** add a separate **`WorkTimeEntry`** model for clock in/out and breaks. University **offering rules** (minimum attendance %) live on **`CourseOffering`**.

---

## Product model by org type

| Mode | Primary UX | Storage |
|------|------------|---------|
| **University** | Attendance tied to **schedule events** linked to **term offerings** (lecture, lab, seminar via **event type**) | `EventAttendance` per `(EventId, UserId, InstanceDate)` |
| **Corporate (events)** | RSVP / participation on meetings (optional) | Same `EventAttendance` — status **Accepted** / **Declined** / **Maybe** |
| **Corporate (workday)** | **Clock in** → **break** → **clock out**; recent days list | `WorkTimeEntry` per user per calendar day |

**Schedule link (university):** Calendar events are created manually or via **Publish to schedule** from the offering weekly pattern (periods workspace). Events set **`OfferingId`** (+ **`EventTypeId`**, optional **`CohortGroupId`**) so roster and student reports scope correctly.

---

## Who can do what

| Action | Permission | Notes |
|--------|------------|-------|
| View own attendance / work time | `attendance` **View** | `GET /api/Attendance/me`, work-time routes |
| Student offering breakdown | `attendance` **View** | `GET /api/Attendance/my-offerings` |
| Mark roster / scan / record member | `attendance` **Edit** | Host, session manager, **or offering teaching team** |
| Set required attendance % on offering | Org **Admin** | Periods workspace (same as credits) |
| Corporate clock in/out | `attendance` **View** | Own entries only |

**Teaching team:** For events with **`OfferingId`**, **`OfferingTeachingAuthorization.CanTeachOfferingAsync`** grants roster read/write (host + co-instructors + org Admin).

**Digital ID:** Scan verifies identity; staff still picks session and calls **`POST /api/Attendance/record`** or uses **session roster** UI. See [`DigitalId.md`](DigitalId.md).

---

## University flows

### Student (`/(widgets)/attendance` — student view)

1. Pick **term** (when multiple periods apply).
2. **By course (offering):** each enrolled offering shows:
   - Overall **present / held** count and **rate %**
   - Breakdown by **activity type** (Lab, Seminar, Lecture — from `Event.EventType`)
   - **Required %** from offering (if admin set) + **meets requirement** badge
3. **Recent sessions** — flat history (existing records list).
4. **Next session** — check-in from schedule (existing).

### Teacher (`/(widgets)/attendance` — teacher view)

1. **Sessions to take roll** — upcoming events where user is host, session manager, or **on offering teaching team** (with offering name + event type).
2. Tap session → **`/attendance-session/[eventId]`** roster:
   - Enrolled students for **`OfferingId`** (respect cohort when set)
   - Per-row: Present / Absent / Not marked
   - Bulk save → **`POST .../sessions/{eventId}/roster`**
3. **Scan Digital ID** → existing scanner → record present for selected session.

### Admin

- **Periods workspace:** per offering — **Credits** + **Required attendance %** (0–100, optional).
- Future: auto-seed **`Expected`** rows from enrollments when timetable is published.

---

## Corporate flows

### Employee (`/(widgets)/attendance` — work time panel)

When **`organizationKind === Corporate`**:

1. **Today:** Clock **In** / **Out**, edit **break minutes** (or break start/end in future).
2. **Computed:** net worked time = `(clockOut - clockIn) - break`.
3. **Recent days:** list last ~14 **`WorkTimeEntry`** rows with times and totals.

Meeting RSVP remains on **schedule** + optional participation summary (existing event attendance).

---

## Backend API

### Existing (`AttendanceController`)

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/Attendance/me` | Summary, history, next session, teacher sessions |
| `GET` | `/api/Attendance/admin/records` | Org-wide flat list (`attendance` Edit) |
| `POST` | `/api/Attendance/record` | Staff marks one member for one session instance |

### University (Phase 1+)

| Method | Route | Permission |
|--------|-------|------------|
| `GET` | `/api/Attendance/sessions/{eventId}/roster?instanceDate=` | `attendance` Edit + can manage session |
| `POST` | `/api/Attendance/sessions/{eventId}/roster` | Bulk mark roster |
| `GET` | `/api/Attendance/my-offerings?periodId=` | `attendance` View — per-offering + by event type |

### Corporate work time

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/Attendance/work-time/today` | Today's entry (if any) |
| `GET` | `/api/Attendance/work-time/recent?days=` | Recent day records |
| `POST` | `/api/Attendance/work-time/clock-in` | Start day |
| `POST` | `/api/Attendance/work-time/clock-out` | End day |
| `PUT` | `/api/Attendance/work-time/today/break` | Set break minutes |

### Schedule (self check-in)

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/Schedule/{id}/attendance` | Student self RSVP / check-in |

---

## Data model

| Entity | Role |
|--------|------|
| `Event` | Schedule session; **`OfferingId`**, **`EventTypeId`**, **`PeriodId`**, recurrence |
| `EventAttendance` | Status per user per **instance date** |
| `OfferingEnrollment` | Roster source when event has offering |
| `CourseOffering` | **`RequiredAttendancePercent`** (nullable 0–100), **`Credits`**, session plan JSON |
| `WorkTimeEntry` | Corporate day: **`WorkDate`**, **`ClockInUtc`**, **`ClockOutUtc`**, **`BreakMinutes`** |

**Statuses (`AttendanceStatus`):** University present = `Added` / `Expected` / `Accepted`; absent = `Declined`. Corporate RSVP uses `Accepted` / `Tentative` / `Declined`.

---

## Frontend map

| Area | Path |
|------|------|
| Attendance screen | `screens/widgets/attendance/components/AttendanceScreen.tsx` |
| Work time (corporate) | `components/WorkTimeClockPanel.tsx` |
| Offering breakdown (university) | `components/AttendanceOfferingsPanel.tsx` |
| Session roster | `components/AttendanceSessionRosterScreen.tsx` → route `attendance-session/[eventId]` |
| Labels | `utils/attendanceLabels.ts` |
| Temp API | `api/attendanceExtendedApi.ts` until NSwag regen |
| Admin rule field | `periods-workspace/.../OfferingAttendanceRuleField.tsx` |

**Filters:** Reuse **`filterPickerRow.ts`** picker rows for term/course on university attendance (same pattern as Grades).

---

## Roadmap (later phases)

| Phase | Item |
|-------|------|
| **2** | **Publish timetable** from **`WeeklySessionPlanJson`** → recurring `Event` rows (`POST .../publish-timetable`) |
| **2** | **Auto `Expected`** attendance rows on publish + new enrollments |
| **3** | Per-activity-type rules JSON on offering (different % for lab vs seminar) |
| **3** | Lateness, geofence, scan → auto clock-in |
| **4** | Manager timesheet approval for corporate |

---

## Related docs

- [`DigitalId.md`](DigitalId.md) — scanner + manual roll
- [`CurriculumOfferings.md`](CurriculumOfferings.md) — offerings, periods, credits
- [`Coursework.md`](Coursework.md) — separate from attendance widget
- Rules: **`domain-attendance.mdc`**
