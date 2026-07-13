# 📚 Curriculum & course offerings

University orgs define **academic periods** (terms), reusable **curriculum packages** (course templates with instructors), and **term offerings** (concrete course instances per period). Corporate orgs use **periods** for reporting boundaries only — the offerings workspace is hidden for them.

---

## Product behavior

| Decision | Detail |
|----------|--------|
| **Who** | **University** organizations only for curriculum packages and term apply UI |
| **Periods** | Org-wide reporting boundaries (`Name`, `StartDate`, `EndDate`, `IsCurrent`) — semesters, trimesters, or quarters |
| **Packages** | Reusable curriculum templates: one **degree program** per package + list of **courses** |
| **Program scope** | Admin UI picks **one program at package level**; all courses inherit it. Same course for another program → duplicate the package or add a second package |
| **Courses in package** | Name, optional code, **lead instructor (host)**, **teaching team** (co-instructors). Collapsible rows; trash icon to remove |
| **Apply to term** | Creates **`CourseOffering`** rows for the selected period, links programs, sets instructors, optionally **enrolls students** from linked program groups |
| **Credits** | **`CourseOffering.Credits`** — org admin sets per offering in **periods workspace**; drives Grades **transcript** and credit-weighted **term final** — see [`Grades.md`](Grades.md) |
| **Skip existing** | Apply skips offerings whose **name** already exists in that period; can still **enroll** students on those existing offerings |
| **Undo apply** | **Revert** removes term offerings whose names match package courses (and their enrollments) — does not delete the package |
| **Periods workspace** | Manage periods only — **no** package apply or offering editor there (all in **`/offerings-workspace`**) |
| **Permissions** | Org **Admin** role only — **`[RequiresOrgAdmin]`** on periods, packages, and term-offering CRUD (not the **`settings`** widget). **Grade plan** on offerings uses **`tasks`** View/Edit for teaching team — see [`Coursework.md`](Coursework.md). |
| **Groups** | Programs are **`Group`** rows (type **program** in university org chart). Host/team pickers search org members and group-filtered members |

---

## Admin workflows

### 1. Define periods (`/periods-workspace`)

1. Create a period with name + date range (single **range calendar** via **`ClayDatePicker`** `mode="range"`).
2. Optionally **Set as current** — only one current period per org.
3. Edit inline or delete (with confirm).
4. For each **term offering** in the period: set **Credits (transcript)** via **`OfferingCreditsField`** (used on the member **Grades** transcript).

Copy is org-aware: university → “Academic periods”; corporate → “Reporting periods”.

### 2. Build curriculum packages (`/offerings-workspace`)

1. **Filter / search** the package list — text search (name, description, program, course names) + **program filter** dropdown.
2. Create or select a package; set **name**, optional description, required **program**.
3. Add courses; expand rows to set host and teaching team.
4. **Save package details** and **Save courses** (or rely on auto-save before apply).

Staff pickers:

- Filter by **group** (faculty, department, program tree).
- **Search** members via API (`q` param) — do not request `pageSize > 100` (backend max **100** per **`PagedRequestValidator`**).

### 3. Apply to a term

1. Choose **academic period** in the offerings workspace.
2. **Apply package to term** — backend saves package + items first, then creates offerings.
3. Review summary: created / skipped / enrollments / enrollments on existing offerings.
4. Read-only list shows matching offerings in that term.
5. **Undo on this term** (revert) if the apply was wrong — destructive; confirms first.

Deleting a **package** does **not** remove offerings already created in terms.

---

## Backend API

Base route: **`/api/Organizations/current`**. All routes require Bearer JWT + org context.

### Periods (existing org admin)

| Method | Route | Permission |
|--------|-------|------------|
| `GET` | `/periods` | Org **Admin** (`[RequiresOrgAdmin]`) |
| `POST` | `/periods` | Org **Admin** |
| `PUT` | `/periods/{id}` | Org **Admin** |
| `DELETE` | `/periods/{id}` | Org **Admin** |

### Curriculum packages

Controller: **`OfferingPackagesAdminController`** → **`/offering-packages`**

| Method | Route | Permission | Purpose |
|--------|-------|------------|---------|
| `GET` | `/offering-packages` | Org **Admin** | List packages |
| `GET` | `/offering-packages/{id}` | Org **Admin** | Package detail |
| `POST` | `/offering-packages` | Org **Admin** | Create package |
| `PUT` | `/offering-packages/{id}` | Org **Admin** | Update name, description, programs |
| `DELETE` | `/offering-packages/{id}` | Org **Admin** | Soft-delete package |
| `PUT` | `/offering-packages/{id}/items` | Org **Admin** | Replace/save course rows |
| `POST` | `/offering-packages/{id}/apply/{periodId}` | Org **Admin** | Apply to term |
| `POST` | `/offering-packages/{id}/revert/{periodId}` | Org **Admin** | Remove matching term offerings |

**Apply body** (`ApplyOfferingPackageRequest`):

| Field | Default | Meaning |
|-------|---------|---------|
| `enrollLinkedPrograms` | — | Enroll members of linked program groups into each new/existing offering |
| `skipExistingNames` | — | Skip create when offering name already exists in period |

**Apply result** (`ApplyOfferingPackageResultDto`): `offeringsCreated`, `offeringsSkipped`, `enrollmentsCreated`, `offeringsExistingEnrolled`.

**Revert result** (`RevertOfferingPackageResultDto`): `offeringsRemoved`, `enrollmentsRemoved`.

### Term offerings (per period)

Controller: **`CourseOfferingsAdminController`** → **`/periods/{periodId}/offerings`**

Used by apply/revert and for direct CRUD, cohort enroll, rollover (advanced). Package apply delegates to **`ICourseOfferingService`**.

Member-facing routes live under **`OfferingsController`** (`/api/Offerings/...`) for enrolled students.

---

## Data model

| Entity | Role |
|--------|------|
| `OrganizationPeriod` | Term / reporting window |
| `CourseOfferingPackage` | Named curriculum template (`OrganizationId`, name, description) |
| `CourseOfferingPackageProgram` | Links package → program **`Group`** |
| `CourseOfferingPackageItem` | Course row (name, code, sort, `DefaultHostId`, **`InstructorsJson`**) |
| `CourseOfferingPackageItemProgram` | Optional per-item program override (API supports; admin UI uses package-level only) |
| `CourseOffering` | Term instance (period, name, code, host, programs, instructors, **`Credits`**) |
| `OfferingEnrollment` | Student membership on an offering |

**Instructors JSON** on package items stores co-instructors; primary host is `DefaultHostId` + normalized primary role in JSON.

**Migrations:** `AddOfferingPackagesAndMultiProgram`, `AddPackageItemInstructorsJson`.

---

## Services

| Service | Responsibility |
|---------|----------------|
| **`CourseOfferingPackageService`** | Package CRUD, save items, apply/revert, program validation |
| **`CourseOfferingService`** | Term offerings, enrollments, rollover, setup program term |

Program IDs must reference **`Group`** rows in the same org with valid program type (validated in package service).

---

## Mobile implementation

| Area | Path |
|------|------|
| **Route** | `app/(app)/(admin)/offerings-workspace` → **`OfferingsWorkspaceScreen`** |
| **Hook** | `screens/admin/offerings-workspace/hooks/useOfferingsWorkspace.ts` |
| **Periods** | `screens/admin/periods-workspace/` — includes **`OfferingCreditsField`** on offerings |
| **Admin nav** | `screens/admin/config/org-admin-workspaces.ts` — **Offerings** tile under Structure |
| **University gate** | Offerings screen shows info-only message for corporate orgs |

**Components (offerings):**

- `PackageCourseRow` — collapsible course card, meta pills, trash remove
- `ProgramSelectField` — package program (required) + list filter
- `StaffSelectField` / `StaffMultiSelectField` — host + team; **`useGroupStaffPicker`**
- `AdminTextInput` — wraps **`IconInput`** for focus styling on web

**API client:** `src/api/offeringPackagesApi.ts` + `offeringsApi.ts` (axios wrappers until NSwag includes package endpoints — regenerate with `npm run generate-api` when Swagger is updated).

**Query keys:** `QUERY_KEYS.orgAdmin.offeringPackages(orgId)`, `QUERY_KEYS.orgAdmin.offerings(orgId, periodId)`.

### Timetable import — add course shortcut

From **Timetables → Import schedule** mapping wizard, **Add course** (`ImportScheduleCreateOfferingSheet` + `importOfferingViaPackage.ts`):

| Mode | Program |
|------|---------|
| **Existing package** | Not asked — course inherits package-linked programs |
| **New package** | Required — same as Offerings workspace program picker |

Applies the package to the current period (optional toggle) so the new term offering can be mapped immediately.

---

## Related docs

- [`Coursework.md`](Coursework.md) — post assignments, student turn-in, batch grading, grade plan (after offerings exist in a term)
- [`Timetables.md`](Timetables.md) — weekly session patterns, preview/publish to Schedule (after offerings + enrollments)
- [`Grades.md`](Grades.md) — student standing, transcript, teacher gradebook
- [`Backend.md`](Backend.md) — controller/service index
- [`Frontend.md`](Frontend.md) — admin workspace table
- [`.cursor/rules/domain-dashboard-admin-superadmin-webspider.mdc`](../.cursor/rules/domain-dashboard-admin-superadmin-webspider.mdc) — scoped admin rules
- [`.cursor/rules/domain-coursework.mdc`](../.cursor/rules/domain-coursework.mdc) — coursework routes and RBAC

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| **400** on staff/member search | `pageSize > 100` | Use `STAFF_PAGE_SIZE = 100` in pickers |
| **500** on packages | DB missing `InstructorsJson` column | Run EF migrations; restart API |
| Apply **skipped all** courses | No program on package | Select program and save before apply |
| Revert removed nothing | Offering names differ from package course names | Revert matches by **exact name** in that period |
