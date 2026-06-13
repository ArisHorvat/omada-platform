# Coursework (tasks, assignments, grading)

University orgs use **coursework** — batched assignments per course offering, student turn-in, teaching-team grading, and optional **grade breakdown** categories. Corporate orgs use the same **`tasks`** widget for **personal/work tasks** only (no coursework inbox).

---

## Product model

| Concept | Detail |
|---------|--------|
| **Widget key** | **`tasks`** only in the roles UI (labeled **Tasks**). Legacy **`assignments`** rows in `RolePermission` still work via backend/frontend aliases. |
| **Batch** | One teacher post → many `TaskItem` rows (one per enrolled student), shared `AssignmentBatchId`. |
| **Offering scope** | Coursework tied to `CourseOffering` + optional `OfferingGradeCategory`. |
| **Teaching team** | Host + `OfferingInstructors` (primary / co-instructor). Authorization: **`OfferingTeachingAuthorization`**. |
| **Grade plan** | Per-offering category weights (exam, lab, bonus). **Only the course host** may edit categories. |
| **Org type** | Coursework UI is **university-only**. Use **`isUniversityOrg()`** — API returns `organizationType` as string **`"University"`** or enum `0`, not only `OrganizationType.University === 0`. |

---

## Who can do what (RBAC)

### Widget: `tasks` (roles workspace)

| Level | Students | Teachers | Corporate |
|-------|----------|----------|-----------|
| **View** | See/submit coursework inbox; `PATCH .../submission` | See assigned work | See own tasks |
| **Edit** | — | Post batches, grade, view submissions | Create/edit own tasks |
| **Admin** | — | Delegate personal work tasks (`tasks.assign`) | Assign work to others |

**Capabilities (mobile):** `permissions.config.ts` — `tasks` View includes `assignments.submit`; Edit includes `assignments.grade`. **`WIDGET_PERMISSION_ALIASES`** maps `tasks` ↔ `assignments`.

**Bypass:** Org **Admin** role and **SuperAdmin** bypass widget checks on the API (`PermissionHandler`).

### Org structure (not the `tasks` widget)

| Surface | Who |
|---------|-----|
| **Periods**, **curriculum packages**, **term offerings** CRUD | Org **Admin** role only — **`[RequiresOrgAdmin]`** on `OrganizationAdminController` (periods), `OfferingPackagesAdminController`, `CourseOfferingsAdminController` (except grade-plan read/write for teaching team). |
| **Post coursework / grade students** | **`tasks` Edit** + on **teaching team** for that offering (or org Admin). |

Do **not** gate periods/offerings on the **`settings`** widget.

---

## Surfaces & routes (mobile)

| Who | Route | Screen |
|-----|-------|--------|
| **Student** | Tasks tab → coursework inbox | `screens/widgets/tasks/` — submit via assignment detail |
| **Teacher** | Tasks → **Teach coursework** | `/coursework-teaching` → `AssignmentsWorkspaceScreen` (`mode="member"`) |
| **Teacher** | Grade one batch | `/coursework-batch/[batchId]` → `AssignmentBatchGradingScreen` |
| **Org admin** | Admin → Structure → **Coursework** | `/assignments-workspace` → same screen (`mode="admin"`) |
| **Assignment detail** | `/assignment/[id]` | Student turn-in or full detail; teachers use batch grading UI preferentially |

**Gates:** `CourseworkTeachingGate` — requires `canTeachCoursework` → `assignments.grade` (resolves from **tasks Edit**).

**Offering picker:**

- **Org admin console:** all offerings in selected term (`offeringsApi.listForPeriod`) via `useCourseworkOfferings`.
- **Teachers:** `GET /api/Offerings/assignable` — offerings where user is host or on teaching team (`OfferingTeachingAuthorization`). If no **current period**, assignable lists courses across terms.

---

## Backend API

### Tasks (`TasksController` — `api/Tasks`)

| Method | Route | Permission | Purpose |
|--------|-------|------------|---------|
| `GET` | `/` | `tasks` View | User's visible tasks (paginated) |
| `GET` | `/{id}` | `tasks` View | Task detail — teaching team can read student batch rows |
| `PATCH` | `/{id}/submission` | `tasks` View | **Student turn-in** / undo (assignee only) |
| `PUT` | `/{id}` | `tasks` Edit | Teacher grade, materials, metadata — teaching team can set `grade` / `teacherFeedback` |
| `GET` | `/batches` | `tasks` Edit | Posted batch summaries (scoped to teaching team) |
| `GET` | `/batches/{batchId}/submissions` | `tasks` Edit | Per-student submission rows for grading UI |
| `POST` | `/batches` | `tasks` Edit | Post coursework to offering or group |
| `DELETE` | `/batches/{batchId}` | `tasks` Edit | Remove batch |

**Task access (`TaskRepository.CanAccessTaskAsync`):** assignee, creator, **or teaching team** for offering tasks. Batch tasks are **not** visible via enrollment-only path.

**Batch create:** `TaskService.CreateAssignmentBatchAsync` — requires `CanTeachOfferingAsync` for offering scope.

### Grade plan (`CourseOfferingsAdminController`)

| Method | Route | Permission | Who |
|--------|-------|------------|-----|
| `GET` | `.../offerings/{id}/grade-plan` | `tasks` View | Teaching team — read-only for co-instructors |
| `PUT` | `.../offerings/{id}/grade-plan` | `tasks` Edit | **Course host only** (`IsOfferingHostAsync`) |

Response includes **`canEditGradePlan`** for UI.

### Offerings picker

| Method | Route | Permission |
|--------|-------|------------|
| `GET` | `/api/Offerings/assignable` | `tasks` View |
| `GET` | `/api/Offerings/my` | `tasks` View (student enrollments) |

### Files

| Method | Route | Notes |
|--------|-------|-------|
| `POST` | `/api/Files/upload` | `scope=coursework` — max **15 MB**; mobile shows alert when over limit |

---

## Frontend implementation map

| Area | Path |
|------|------|
| Teaching workspace | `screens/admin/assignments-workspace/` |
| Offerings hook | `hooks/useCourseworkOfferings.ts` |
| Batch grading | `components/AssignmentBatchGradingScreen.tsx` |
| Grade plan editor | `components/GradePlanEditor.tsx` |
| Student detail | `screens/widgets/tasks/components/AssignmentDetailScreen.tsx` |
| Turn-in logic | `hooks/useAssignmentDetailLogic.ts` → `submitTaskSubmission` |
| Temp APIs (regen NSwag) | `api/assignmentsBatchApi.ts`, `api/gradePlanApi.ts`, `api/tasksWorkApi.ts` |
| Org type helper | `screens/widgets/tasks/utils/taskLabels.ts` → **`isUniversityOrg`** |
| Teaching gate | `utils/courseworkTeachingAccess.ts` |

**UI notes (batch grading):** Prefer **flat cards** (border + 12px radius) over deep `ClayView` on dense lists. Inline expand under student row shows **submission link + files** then grade fields.

---

## Common pitfalls

1. **Roles UI has no `assignments` row** — use **Tasks** (View / Edit / Admin).
2. **403 on turn-in** — students need **tasks View**; turn-in uses **`PATCH /submission`**, not `PUT`.
3. **403 / 404 on grade** — teacher must be on **teaching team**; co-instructors can grade after `CanAccessTaskAsync` fix.
4. **Empty course dropdown** — set a **current period**; add teacher as **host** or **primary instructor** on the offering.
5. **“University feature” on corporate org** — usually **`organizationType === 0`** bug; use **`isUniversityOrg()`**.
6. **Co-instructor cannot edit grade breakdown** — by design; only **host** saves grade plan.
7. **Groups tree 403 in coursework** — use **`GET /api/Groups/assignable?context=assignment`**, not full tree (requires `groups` View).

---

## Related docs

- [`CurriculumOfferings.md`](CurriculumOfferings.md) — periods, packages, apply to term, teaching team on package courses
- [`Grades.md`](Grades.md) — student standing, transcript, credits, teacher gradebook on Grades widget
- [`Backend.md`](Backend.md) — controllers overview
- [`Frontend.md`](Frontend.md) — routes and admin workspaces
- Rules: **`domain-coursework.mdc`**, **`domain-dashboard-admin-superadmin-webspider.mdc`**
