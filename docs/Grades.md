# Grades (coursework standing, transcript, teacher gradebook)

University members use the **`grades`** widget for **coursework-derived standing** (1–10 scale), **term transcripts** (credits + weighted term final), and — for teachers — a **class gradebook**. A separate **formal transcript** API (`Grade` entity, 4.0 GPA) still powers dashboard hero widgets and legacy admin CRUD.

---

## Product model

| Concept | Detail |
|---------|--------|
| **Widget key** | **`grades`** (university catalog). Capabilities: `grades.view_own` (View), `grades.view_all` / `grades.edit` (Edit), `grades.finalize` (Admin). |
| **Student screen** | **`My grades`** — enrolled offerings + coursework tasks → weighted **grade so far** per course; **transcript** row per course (credits, grade, **term final**). |
| **Teacher screen** | **`Teaching`** tab on the same Grades route — roster of enrolled students + per-student assignment breakdown (same math as student view). |
| **Credits** | **`CourseOffering.Credits`** (decimal) — set by org admin in **periods workspace** per term offering; shown on student transcript; **term final** is credit-weighted when credits &gt; 0. |
| **Scale** | Main Grades UI uses **1–10** (`gradeScale.ts`, backend `CourseworkTenScale`). Dashboard bento/hero may still show **4.0 GPA** from `GET /api/Grades/me`. |
| **Two systems** | **Coursework grades** = `TaskItem.Grade` on batch rows. **Formal transcript** = `Grade` table rows (manual/admin; not auto-synced from offerings). |

**Member-facing label:** roles UI and tab title use **Tasks** (not “Tasks / Coursework”) for the **`tasks`** widget.

---

## Who can do what (RBAC)

| Action | Permission | Notes |
|--------|------------|-------|
| Open Grades widget (student) | `grades` **View** → `grades.view_own` | Biometric gate on native (`GradesBiometricGate`). |
| See term list on Grades screen | `tasks` **View** | `GET /api/Offerings/periods` (also used for teacher mode). |
| Student enrollments + task grades | `tasks` **View** | `GET /api/Offerings/my`, `GET /api/Tasks`. |
| **Teaching** tab + gradebook | `tasks` **Edit** → `assignments.grade` | Must be on **teaching team** for the offering (`OfferingTeachingAuthorization`). |
| Set credits on offerings | Org **Admin** | Periods workspace → **`OfferingCreditsField`** on each offering. |
| Formal transcript admin CRUD | `grades` **Edit** | Legacy **`screens/admin/grades-workspace/`** — **not** in org admin nav. |

Org **Admin** and **SuperAdmin** bypass widget checks on the API where applicable.

---

## Surfaces & routes (mobile)

| Who | Route | Screen / mode |
|-----|-------|----------------|
| **Student** | `/(widgets)/grades` | **`My grades`** — filters, transcript, course cards, breakdown sheet |
| **Teacher** | Same route → **Teaching** toggle | Student roster, status filter (picker row), search, breakdown sheet → assignment detail |
| **Teacher (grade one batch)** | `/coursework-batch/[batchId]` | Still the primary **inline grading** UI — see [`Coursework.md`](Coursework.md) |
| **Admin credits** | `/periods-workspace` | Per-offering **Credits (transcript)** field + Save |

**Gates:** Student view — `can('grades.view_own')`. Teaching — `canTeachCoursework()` → `assignments.grade`.

**Filters UI:** stacked **picker rows** (Term, Course, Cohort, Student status) + search — shared styles in **`src/styles/filterPickerRow.ts`**. Use **explicit `padding` on filter cards** (`filterPanelCardStyles.card`); **`ClayView` `puffy` is shadow only**, not content inset.

---

## Backend API

### Member offerings & gradebook (`OfferingsController`)

| Method | Route | Permission | Purpose |
|--------|-------|------------|---------|
| `GET` | `/api/Offerings/periods` | `tasks` View | Term picker (Grades + teacher mode) |
| `GET` | `/api/Offerings/my?periodId` | `tasks` View | Student enrollments for term |
| `GET` | `/api/Offerings/assignable?periodId` | `tasks` View | Courses user teaches |
| `GET` | `/api/Offerings/{periodId}/{offeringId}/gradebook?cohortGroupId` | `tasks` **Edit** | Teacher roster + aggregates |
| `GET` | `/api/Offerings/{periodId}/{offeringId}/students/{userId}/grade-breakdown` | `tasks` **Edit** | One student’s categorized assignment list |

**Service:** **`GradebookService`** — enrollment query + coursework `TaskItem` aggregation; weighted 1–10 via **`Infrastructure/Grading/CourseworkTenScale.cs`**.

**DTOs:** `DTOs/Offerings/GradebookDtos.cs` — `OfferingGradebookDto`, `StudentOfferingGradeBreakdownDto`, etc.

### Formal transcript (`GradesController`)

| Method | Route | Permission |
|--------|-------|------------|
| `GET` | `/api/Grades/me` | `grades` View |
| `GET/POST/PUT` | `/api/Grades/admin` | `grades` Edit |
| `DELETE` | `/api/Grades/{id}` | `grades` Admin |

### Credits on offerings (org admin)

| Field | Entity | Admin UI |
|-------|--------|----------|
| `Credits` | `CourseOffering` | **`PUT .../periods/{periodId}/offerings/{id}`** via **`usePeriodOfferings.updateOfferingCredits`** |

**Migration:** `AddCourseOfferingCredits` — column `CourseOfferings.Credits` `decimal(6,2)`, default 0.

---

## Frontend implementation map

| Area | Path |
|------|------|
| Grades screen | `screens/widgets/grades/components/GradesScreen.tsx` |
| Student logic | `hooks/useGradesScreenLogic.ts`, `utils/courseGradesModel.ts`, `utils/gradeScale.ts` |
| Teacher logic | `hooks/useTeacherGradesScreenLogic.ts` |
| Student filters | `components/GradesFiltersBar.tsx` |
| Teacher filters | `components/GradesTeacherFiltersBar.tsx` |
| Transcript | `components/GradesTranscriptSection.tsx` |
| Student breakdown | `components/GradesCourseBreakdownSheet.tsx` |
| Teacher roster / breakdown | `GradesStudentRosterCard.tsx`, `GradesStudentBreakdownSheet.tsx` |
| Mode toggle | `components/GradesViewModeToggle.tsx` |
| Filter layout | `src/styles/filterPickerRow.ts` |
| Admin credits | `screens/admin/periods-workspace/components/OfferingCreditsField.tsx` |
| Temp API (regen NSwag) | `api/gradebookApi.ts`, `api/offeringsApi.ts` (`credits` on DTOs) |

**Query keys:** `QUERY_KEYS.offerings.gradebook(...)`, `QUERY_KEYS.offerings.studentBreakdown(...)`.

**Dashboard widgets** (`GradesHero`, `GradesCard`, …) may still call **`gradesApi.getMyGrades()`** (4.0 GPA) — not the full-screen coursework model.

---

## Grade math (coursework)

- Per assignment: raw score → **1–10** via max score (or 0–100 fallback).
- **Grade so far:** weighted average of graded assignments using **`effectiveWeight`** (grade category × item weight when grade plan exists).
- **Term final:** credit-weighted average of course **grade so far** values when **`Credits` &gt; 0**; else simple average of courses with grades.

Backend gradebook uses the same rules in **`CourseworkTenScale`**.

---

## Common pitfalls

1. **Empty teacher roster** — pick a **term + course you teach**; students must be **enrolled** on the offering.
2. **Credits show “— cr.”** — admin must set credits in **periods workspace** (defaults 0).
3. **Migration not applied** — run `dotnet ef database update`; credits column must exist on `CourseOfferings`.
4. **403 on gradebook** — needs **`tasks` Edit** + teaching team membership, not `grades` Edit.
5. **Filter panel feels cramped** — add **`padding: 16`** on card style; do not rely on **`puffy`** for inset.
6. **NSwag** — after gradebook/credits contract changes, `cd src/frontend/mobile && npm run generate-api`; merge temp clients into generated client when routes appear in Swagger.

---

## Related docs

- [`Coursework.md`](Coursework.md) — post assignments, batch grading, grade plan
- [`CurriculumOfferings.md`](CurriculumOfferings.md) — periods, offerings, enrollments, credits field
- [`Backend.md`](Backend.md) · [`Frontend.md`](Frontend.md)
- Rules: **`domain-grades.mdc`**, **`domain-coursework.mdc`**
