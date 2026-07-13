# Attendance & participation

Omada uses **one schedule-backed attendance store** (`Event` + `EventAttendance`) for university class sessions and corporate meeting RSVP. **Corporate workdays** add a separate **`WorkTimeEntry`** model for clock in/out and breaks. University **offering rules** (minimum attendance %) live on **`CourseOffering`**.

---

## Product model by org type

| Mode | Primary UX | Storage |
|------|------------|---------|
| **University** | Attendance tied to **schedule events** linked to **term offerings** (lecture, lab, seminar via **event type**) | `EventAttendance` per `(EventId, UserId, InstanceDate)` |
| **Corporate (events)** | RSVP / participation on meetings (optional) | Same `EventAttendance` — status **Accepted** / **Declined** / **Maybe** |
| **Corporate (workday)** | **Clock in** → **break** → **clock out**; recent days list | `WorkTimeEntry` per user per calendar day |

**Schedule link (university):** Calendar events are created manually or via **Publish to schedule** from the offering weekly pattern (`/timetables-workspace`). Events set **`OfferingId`** (+ **`EventTypeId`**, optional **`CohortGroupId`**) so roster and student reports scope correctly.

---

## Who can do what

| Action | Permission | Notes |
|--------|------------|-------|
| View own attendance / work time | `attendance` **View** | `GET /api/Attendance/me`, work-time routes |
| Student offering breakdown | `attendance` **View** | `GET /api/Attendance/my-offerings` |
| Mark roster / scan / record member | `attendance` **Edit** | University: **host only** for teacher session list; roster write also for offering teaching team on that event |
| Set required attendance % on offering | Org **Admin** | Periods workspace (same as credits) |
| Corporate clock in/out | `attendance` **View** | Own entries only |

**Digital ID:** Scan verifies identity; staff still records via **`POST /api/Attendance/record`** or **session roster** UI. See [`DigitalId.md`](DigitalId.md).

---

## University flows

### Student (`/(widgets)/attendance` — student view)

1. Compact inline stats (present / absent / rate) — no large hero card.
2. **By course (offering):** each enrolled offering shows rate %, breakdown by **activity type**, and optional **required %** badge (`AttendanceOfferingsPanel`).
3. **Recent history** — flat list with green **Present** / red **Absent** badges (`isAttendancePresent` in `attendanceLabels.ts`).
4. **Next session** — self check-in from schedule (`POST /api/Schedule/{id}/attendance`).

### Teacher (`/(widgets)/attendance` — teacher view)

1. **This week's sessions** — calendar week (Mon–Sun), **host-only** for university (`HostId == userId`). Past sessions in the week are excluded.
2. Tap session → **`/attendance-session/[eventId]?instanceDate=`** (full ISO from `startTime`) → roster:
   - Enrolled students for **`OfferingId`** (cohort filter when set)
   - **Alternate-section** swap-ins listed when they have `Added` attendance on that instance; students who **declined** (swapped away) are hidden from the base roster
   - Per-row: **Present** / **Absent** / **Clear** — everyone starts **neutral** until the teacher marks
   - **Present** chip: grey when unselected, **green when selected**
   - Bulk save → **`POST .../sessions/{eventId}/roster`**
3. **Scan Digital ID** → `/digital-id-scanner` when `attendance.take` or `digital-id.manage`.

### Admin

- **Periods workspace:** per offering — **Credits** + **Required attendance %** (0–100, optional).
- **Timetables publish:** creates **`Event`** rows from weekly patterns — **does not** auto-seed `Expected` attendance (teacher marks roll explicitly).

---

## Instance dates (critical)

Attendance rows are keyed by **`InstanceDate`** (occurrence start, minute precision UTC).

| Helper | Location | Role |
|--------|----------|------|
| **`AttendanceInstanceHelper`** | `Infrastructure/AttendanceInstanceHelper.cs` | Resolve canonical occurrence from event + requested day; match stored rows; pick preferred row when duplicates exist |

**Rules:**

- **Non-recurring events:** instance = event `StartTime` (truncated to minute).
- **Recurring events:** instance = requested calendar day + event wall-clock time (not midnight).
- **Roster GET/POST** both use the same resolved instant — pass full ISO `instanceDate` from the teacher session list.
- **History** dedupes by `(EventId, calendar day)` — one row per session day in `GET /api/Attendance/me`.
- **Save** upserts by day; duplicate rows for the same user/event/day are soft-deleted on consolidate.

---

## Status semantics

| Status | University meaning | Counts as present? | Roster display |
|--------|-------------------|--------------------|----------------|
| `None` | Not marked | No | Neutral |
| `Expected` | Legacy / unused after publish seed removed | No | **Not marked** (mapped to `None`) |
| `Added` | Present (teacher or self check-in) | Yes | Present |
| `Accepted` | Present (corporate RSVP) | Yes (corporate) | Present |
| `Declined` | Absent / swapped away | No | Absent |

**Teacher bulk mark:** Present → `Added`, Absent → `Declined`, Clear → `None` (soft-delete row).

---

## Corporate flows

### Employee (`/(widgets)/attendance` — work time panel)

When **`organizationKind === Corporate`**:

1. **Today:** Clock **In** / **Out**, edit **break minutes**.
2. **Computed:** net worked time = `(clockOut - clockIn) - break`.
3. **Recent days:** list last ~14 **`WorkTimeEntry`** rows.

Meeting RSVP remains on **schedule** + participation summary.

---

## Backend API

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/api/Attendance/me` | Summary, deduped history, next session, teacher sessions |
| `GET` | `/api/Attendance/admin/records` | Org-wide flat list (`attendance` Edit) |
| `POST` | `/api/Attendance/record` | Staff marks one member for one session instance |
| `GET` | `/api/Attendance/sessions/{eventId}/roster?instanceDate=` | Session roster (`attendance` Edit + can manage session) |
| `POST` | `/api/Attendance/sessions/{eventId}/roster` | Bulk mark roster |
| `GET` | `/api/Attendance/my-offerings?periodId=` | Per-offering + by event type |
| `GET/POST/PUT` | `/api/Attendance/work-time/*` | Corporate clock in/out/break |
| `POST` | `/api/Schedule/{id}/attendance` | Student self RSVP / check-in |

**Services:** `AttendanceService` (roster, history, work time), `ScheduleService.ApplyAttendanceForUserAsync` (single-user write + duplicate consolidation).

**Performance:** `GET /api/Attendance/me` uses **lightweight event queries** for `nextSession` and `teacherSessions` — it does **not** call full `GetScheduleAsync` (which loads every event’s attendances). Uses `AsSplitQuery()` + enrollment batching instead.

---

## Data model

| Entity | Role |
|--------|------|
| `Event` | Schedule session; **`OfferingId`**, **`EventTypeId`**, **`PeriodId`**, recurrence |
| `EventAttendance` | Status per user per **instance date** |
| `OfferingEnrollment` | Roster source when event has offering |
| `CourseOffering` | **`RequiredAttendancePercent`** (nullable 0–100), **`Credits`**, session plan JSON |
| `WorkTimeEntry` | Corporate day: **`WorkDate`**, **`ClockInUtc`**, **`ClockOutUtc`**, **`BreakMinutes`** |

---

## Frontend map

| Area | Path |
|------|------|
| Attendance screen | `screens/widgets/attendance/components/AttendanceScreen.tsx` |
| Work time (corporate) | `components/WorkTimeClockPanel.tsx` |
| Offering breakdown (university) | `components/AttendanceOfferingsPanel.tsx` |
| Session roster | `components/AttendanceSessionRosterScreen.tsx` → `attendance-session/[eventId]` |
| Labels & status helpers | `utils/attendanceLabels.ts` — `normalizeAttendanceStatus`, `isAttendancePresent`, `isAttendanceAbsent` |
| Styles | `styles/attendance.styles.ts` — history cards use `contentOverflow="visible"`, no badge `maxWidth` clip |
| Temp API | `api/attendanceExtendedApi.ts` until NSwag regen |
| Admin rule field | `periods-workspace/.../OfferingAttendanceRuleField.tsx` |

**UI pitfalls:**

- **`ClayView` `puffy` ≠ content padding** — history/roster cards need explicit padding and `contentOverflow="visible"` so shadows and badges are not clipped.
- **Recent history:** green badge only when `isAttendancePresent(status, statusLabel)`; roster Present chip green **only when selected**.

**Filters:** Reuse **`filterPickerRow.ts`** picker rows for term/course (same pattern as Grades).

---

## Related docs

- [`DigitalId.md`](DigitalId.md) — scanner + manual roll
- [`CurriculumOfferings.md`](CurriculumOfferings.md) — offerings, periods, credits, per-offering enrollment
- [`Timetables.md`](Timetables.md) — publish → schedule events
- [`Coursework.md`](Coursework.md) — separate from attendance widget
- Rules: **`.cursor/rules/domain-attendance.mdc`**
