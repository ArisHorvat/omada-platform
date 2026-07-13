# Timetables (native build, preview, publish)

> Org admins define **weekly session patterns** per term offering, preview conflicts, **publish** to the member **Schedule** (`Event` rows), and optionally **import** legacy HTML via the web spider tab.

**Admin route:** `/timetables-workspace` (Structure → **Timetables**).  
**Scoped agent rules:** `.cursor/rules/domain-timetables.mdc`

---

## Two timetable systems (do not confuse)

| System | Storage | Who sees it | Purpose |
|--------|---------|-------------|---------|
| **Native timetables** | `CourseOffering.WeeklySessionPlanJson` → publish → **`Event`** | Members on **Schedule → My schedule** | Source of truth for in-app calendar, attendance seeding, rooms |
| **Web spider import** | **`WeeklySessionPlanJson`** (via map & apply) and/or **`ScrapedClassEvent`** (optional sync) | Admin import tab; members after **publish** only | Scrape HTML → map labels → apply pattern; optional reference store |

See [`WebSpider.md`](WebSpider.md) for import/scrape/mapping details.

---

## Import schedule tab (web spider)

Full reference: [`WebSpider.md`](WebSpider.md).

### What it does (admin)

1. **Scrape** a public timetable URL (index, year page, group page, or single course page).
2. **Scope** large scrapes (≥120 rows): pick program/year page + study group.
3. **Preview** parsed rows on a **Mon–Fri week grid** (reporting period picker).
4. **Toggle** individual sessions on/off before import.
5. **Map** scraped labels to Omada: event types, hosts, rooms, groups (program/series/group/subgroup), offerings — with suggestions; **create new** types when needed.
6. **Apply** to a term offering’s **`WeeklySessionPlanJson`** (Build tab data).
7. **Publish** from **Build & publish** so members see events on **Schedule**.

> Apply alone does **not** update member Schedule — **publish** is still required.

### Single-offering pages

When the HTML table lists only **Curs / Laborator / Seminar** (course title is in the **page heading**):

- Backend **`ScrapedScheduleRowEnricher`** + scrape-time course heading detection fill the real course name — **exact** activity-only labels only.
- UI suggests **All rows → this offering** (`importAllScopedRows`).

### Multi-course group/year pages (e.g. IE3)

When the table has a **Disciplina** column (UBB: Ziua, Orele, …, Tipul, **Disciplina**, Cadrul didactic):

- Each row’s **`ClassName`** must come from **Disciplina**, not the page title (`IE3`).
- **`IsActivityOnlyLabel`** must not treat discipline names like *Proiect de cercetare* as activity-only (substring *proiect* ≠ activity token **Proiect**).
- **`IsProgramOrGroupPageCode`** rejects program/year codes as course hints.
- Map each distinct subject to a term offering in the **import wizard**; use **Add course** → **existing package** (no program picker) or **new package** (program required).

### Week grid vs session list

| Shows on grid | Stays in list only |
|---------------|-------------------|
| Parsed **Mon–Fri** rows | Unparsed time/day |
| Enabled sessions | Disabled (excluded) sessions |
| Each row separately | **Weekend** rows |

### Import API (org Admin)

| Route | Purpose |
|-------|---------|
| `POST /api/web-spider/schedule/import-resolution` | Mapping suggestions |
| `POST /api/web-spider/schedule/apply-to-offering/preview` | Preview weekly pattern |
| `POST /api/web-spider/schedule/apply-to-offering` | Write pattern to offering |

Optional legacy store: **`POST /api/web-spider/schedule/sync`** → Hangfire → **`ScrapedClassEvent`**.

### Frontend map (import)

| Piece | Location |
|-------|----------|
| Import tab | `components/TimetablesImportTab.tsx` |
| Scope (large scrape) | `ImportScheduleScopePanel.tsx`, `utils/importScheduleScope.ts` |
| Week grid | `ImportScheduleWeekPreview.tsx`, `utils/scrapedDisplaySlots.ts` |
| Session toggles | `ImportScheduleSessionList.tsx`, `utils/scrapedSessionKey.ts` |
| Map & apply | `ImportScheduleWizard.tsx`, `import-wizard/*`, `ImportScheduleCreateOfferingSheet.tsx`, `ImportScheduleCreateEntitySheet.tsx` |
| Scrape UI (shared) | `screens/admin/web-spider-workspace/` |
| Temp API wrappers | `api/scrapedScheduleImportApi.ts`, `api/scrapedScheduleApplyApi.ts` |

---

## Recommended term workflow

1. **Structure** — [`CurriculumOfferings.md`](CurriculumOfferings.md): period → apply package → term offerings exist.
2. **Enroll** — cohorts/students on offerings (audience + **`Expected`** attendance on publish).
3. **Event types** — `/event-types-workspace` (Lecture, Lab, colors).
4. **Build patterns** — Timetables → **Build & publish**: activities, times, instructors, groups, **rooms** (per block when using multiple schedule blocks).
5. **Preview** — **View** tab: narrow scope, Mon–Fri grid or list, fix red conflicts.
6. **Publish** — per course or **bulk publish ready**; conflicts block unless **Publish anyway** (`forceDespiteConflicts`).
7. **Verify** — **Member Schedule check** (View tab) + log in as student/teacher on **Schedule** widget.

Until publish, members only see **published** events — admin preview **proposed** slots are not on member Schedule.

---

## Admin UI — three tabs

| Tab | Purpose |
|-----|---------|
| **View** | Week preview (list + Mon–Fri grid), conflicts banner, scope filters, **Member Schedule check** |
| **Build & publish** | Edit patterns per offering, publish status, bulk publish |
| **Import (web)** | Scrape public HTML → scope (large indexes) → week grid → **session toggles** → **map & apply** to offering pattern; optional sync to `ScrapedClassEvent` — see [`WebSpider.md`](WebSpider.md) |

**Scope filters** (top **Timetable scope** sheet): period (required), then optional **teacher**, **program**, **group/series/subgroup**, **course offering**, **room**. At least one narrow filter (not period alone) is required for the **week grid**; list view works broader.

**Publish vs preview scope:** View preview respects scope filters. **Publish status** and **bulk publish** conflict counts use the **full term** (unscoped) so hidden conflicts cannot slip through — UI explains this when filters are active.

---

## Weekly session pattern (frontend)

Stored in **`WeeklySessionPlanJson`** on `CourseOffering`; edited via **`TermOfferingSessionCard`** / **`WeeklySessionRow`**.

| Concept | Behavior |
|---------|----------|
| **Activity** | Event type, hours, frequency (weekly / biweekly / monthly) |
| **Audience** | All enrolled vs **selected groups** (series / groups / subgroups) |
| **Multiple schedule blocks** | Split groups across different day/time/instructor/**room** per block (`cohortAssignments`) |
| **Cohort delivery** | Split = one event per group; Combined = one event with `AudienceCohortGroupIdsJson` |
| **Room** | Optional; **building → room** picker (`TimetableRoomPickerField`). Session-level room for single-block; **per block** when multiple schedule blocks |
| **Publish** | Creates recurring **`Event`** rows with `PeriodId`, `OfferingId`, `HostId`, `CohortGroupId` or audience JSON, **`RoomId`** |

Hooks/API (until NSwag includes all routes): **`offeringsApi.ts`** — `previewTimetable`, `getTimetablePublishStatus`, `bulkPublishTimetable`, `publishTimetable`, `memberSchedulePreview`.

---

## Preview & conflicts

**API:** `POST /api/Organizations/current/periods/{periodId}/preview-timetable`

Expands patterns + already-**published** events for the selected week. Conflict types:

| Type | Rule |
|------|------|
| **host** | Same instructor overlapping |
| **cohort** | Same student group / enrollment overlap |
| **room** | Same room overlapping (including split groups in the same room at the same time) |

Complementary split groups (same course, same slot, non-overlapping cohorts) suppress **host/cohort** false positives but **not** room double-booking.

**UI:** conflict banner on View; per-course status on Build; bulk publish **results sheet** with per-offering message when skipped.

---

## Publish guardrails & bulk publish

**Per course:** `POST .../periods/{periodId}/offerings/{offeringId}/publish-timetable`  
Body: `replaceExisting`, `forceDespiteConflicts`, `clientUtcOffsetMinutes`.

**Status:** `POST .../periods/{periodId}/timetable-publish-status` — counts published / ready / **ready to republish** (`needsRepublish`) / conflicts (`scopeFiltersApplied` when narrow filters sent).

**Bulk:** `POST .../periods/{periodId}/bulk-publish-timetable` — publishes ready offerings in scope; skips conflicts unless forced; returns **`BulkPublishTimetableResultDto`** per course (`published` vs `republished`).

**Republish changed (Build tab):** bulk action targets published courses whose **`WeeklySessionPlanJson`** differs from **`TimetablePublishedPlanJson`** (snapshot taken at last publish). Use after import apply or manual pattern edits.

### Republish replaces all term events for that course

When **`replaceExisting: true`** (automatic for any already-published offering, per-course **Republish**, or bulk republish):

- **Soft-deletes every `Event`** for that **`OfferingId` + `PeriodId`** in the org — not only IDs listed in **`TimetablePublishedEventIdsJson`**. This prevents **orphan duplicates** from stacking after repeated republishes.
- Creates fresh recurring events from the current pattern and updates **`TimetablePublishedPlanJson`** snapshot.

**After upgrading** or if the View grid shows far more blocks than expected: open **Build & publish** → **Republish** each affected course once (or **Republish changed** when the pattern changed). Orphan rows from older republish behavior are removed on replace.

### Combined cohort delivery (same slot → one block)

When multiple study groups share the **same activity, instructor, room, day, time, and frequency** (including biweekly phase):

| Layer | Behavior |
|-------|----------|
| **Import consolidate** | **`OfferingSessionPlanConsolidation.MergeCompatibleCohortSlots`** merges scrape rows before writing **`WeeklySessionPlanJson`** |
| **Publish / preview** | **`MergeCompatibleInstructorBlocks`** unions cohort IDs; **`cohortDelivery: combined`** → one **`Event`** with **`AudienceCohortGroupIdsJson`** |
| **View grid** | **`mergeTimetableDisplaySlots`** collapses split rows for display; shows combined group labels |

**Split** delivery is only used when groups genuinely differ by day, time, instructor, room, or frequency. Same-slot groups A + B must not create two conflicting blocks.

### Wall-clock times & timezone

Admin-entered times (pattern **`startTimeLocal`**, scrape **Orele**) are **wall-clock** in the admin’s browser timezone:

- Frontend sends **`clientUtcOffsetMinutes: new Date().getTimezoneOffset()`** on preview, publish, bulk publish, and publish-status (JS convention: minutes to add to local to get UTC).
- Backend **`ScheduleWallClock.ToUtcInstant`** converts calendar date + hour/minute + offset → UTC **`Event.StartTime`** / **`EndTime`**.
- View grid and member Schedule render UTC instants in the user’s local timezone via **`parseApiUtc`**.

**Pitfall:** Events published before offset was wired (or from a different timezone) may show shifted hours until **republish** from the correct browser session.

### Biweekly scrape semantics (Romanian `sapt.`)

| Scrape label | Omada |
|--------------|-------|
| **`sapt. 1`**, **`sapt1`**, **impar** / **odd** | Biweekly **phase 1** — odd weeks from period start |
| **`sapt. 2`**, **`sapt2`**, **par** / **even** | Biweekly **phase 2** — even weeks from period start |

Parsed in **`ScheduleTimeParser`** (backend) and **`scrapedScheduleTiming.ts`** (import review). Per-block **`frequency`** / **`biweeklyPhase`** on **`cohortAssignments`** when Curs and Lab differ. Publish uses **`ComputeFirstOccurrenceUtc`** with phase offset (+7 days for phase 2) and **`FREQ=WEEKLY;INTERVAL=2`**.

### Import tab state

The **Import schedule** tab stays mounted when switching Timetables tabs (`display: none`) so scrape results, scope, toggles, and wizard progress are not lost. Finish with **Build & publish** → **publish** (or **republish**) for member Schedule.

---

## Member Schedule (end-to-end)

Publish writes **`Event`**; members see them via **`GET /api/Schedule`** with **`myScheduleOnly=true`**.

**Visibility** (`ScheduleUserVisibilityContext` / `EventAudienceHelper`):

- **Host** on the event
- **Teaching team** on the offering (`OfferingInstructors`) — all sessions for that course
- **Group / cohort** membership on `GroupId` / `CohortGroupId`
- **Offering enrollment** + audience rules (all enrolled, split cohort, combined audience JSON)
- **Enrollment cohort** on `OfferingEnrollment` when group membership is missing
- **`Expected`** / **`Added`** attendance rows

**Admin check:** `POST .../periods/{periodId}/member-schedule-preview` — same rules as member **My schedule** for a chosen user/week.

**Member UI:** Schedule widget shows **room**, **course** (`offeringName`), **cohort** (`cohortGroupName`) on event detail when present.

---

## Attendance linkage

On publish, **`SeedExpectedAttendanceInternalAsync`** creates **`EventAttendance`** rows (`Expected`) for enrolled users matching **`EnrollmentMatchesEvent`** (same audience rules as Schedule). See [`Attendance.md`](Attendance.md).

---

## Backend map

| Piece | Location |
|-------|----------|
| Service | `Services/OfferingTimetableService.cs` |
| Period APIs | `Controllers/PeriodTimetableAdminController.cs` |
| Per-offering publish | `Controllers/CourseOfferingsAdminController.cs` |
| Schedule visibility | `Repositories/ScheduleRepository.cs`, `Infrastructure/ScheduleUserVisibilityContext.cs`, `Infrastructure/EventAudienceHelper.cs` |
| DTOs | `DTOs/Offerings/PreviewTimetableDtos.cs`, `PublishTimetableDtos.cs`, `TimetablePublishStatusDtos.cs`, `MemberSchedulePreviewDtos.cs` |
| Session JSON | `Infrastructure/OfferingSessionPlanJson.cs` — parse/normalize, **`TimetablePublishedPlanJson`** snapshot, **`PatternChangedSincePublish`** |
| **OfferingSessionPlanConsolidation** | `Infrastructure/OfferingSessionPlanConsolidation.cs` — scrape import dedupe + **merge compatible cohort slots** |
| **ScheduleWallClock** | `Infrastructure/ScheduleWallClock.cs` — wall-clock → UTC via **`clientUtcOffsetMinutes`** |

**Permission:** org **Admin** (`[RequiresOrgAdmin]`) for period timetable endpoints and offering publish — not the `schedule` widget.

---

## Import schedule tab (web spider)

Full spider reference: [`WebSpider.md`](WebSpider.md). This tab is the **bridge** from legacy HTML timetables into native patterns — not a substitute for publish.

### End-to-end path to member Schedule

```text
Scrape → scope (if large) → toggle sessions → map labels → apply to offering
  → Build & publish (edit pattern if needed) → publish → member Schedule widget
```

| Step | UI | Backend |
|------|-----|---------|
| Scrape | URL + Preview / Discover | `POST /api/web-spider/schedule/preview` |
| Narrow scope | Program page + study group when ≥120 rows | Frontend `importScheduleScope.ts` |
| Preview | Mon–Fri grid + session list | `scrapedDisplaySlots.ts`, `ScheduleTimeParser` |
| Toggle sessions | Tap rows in session list | Frontend only — filtered `events` sent to apply |
| Map & apply | Activity→event type, teacher→host, room, group, offering | `POST .../import-resolution`, `POST .../apply-to-offering` |
| Publish | **Build & publish** tab | `POST .../publish-timetable` → **`Event`** |

### Mapping rules admins should know

- **Curs / Laborator / Seminar** map to org **event types** — create new (e.g. "Lecture") if no match.
- **Study groups** map to Omada **program / series / group / subgroup** — create with explicit type when needed.
- **Single offering pages** often lack a subject column — course comes from the **page title**; use **All rows → this offering**.
- **Group/year pages** (e.g. IE3) have **Disciplina** per row — never substitute the page code as the course name; map each subject in the wizard.
- **Add course while mapping:** existing curriculum package → no program picker; new package → pick program ([`WebSpider.md`](WebSpider.md)).
- **Rooms created during import** without a floor appear under **Locations & maps** → unassigned rooms panel when a level is selected — assign to a building/level there.
- **Week grid** shows Mon–Fri parsed rows only; weekend and unparsed rows remain in the list.

### Optional: sync to scraped store

**Sync to DB** (Hangfire) upserts **`ScrapedClassEvent`** for migration reference — separate from apply/publish.

---

## Frontend map

| Piece | Location |
|-------|----------|
| Screen | `screens/admin/timetables-workspace/` |
| Hook | `hooks/useTimetablesWorkspace.ts` |
| View | `TimetablesViewTab`, `TimetableWeekGrid`, `TimetableSlotDetailSheet` |
| Build | `TimetablesBuildTab`, `TimetablesBuildSummaryBar`, `TimetablesBulkPublishResultsSheet` |
| **Import schedule** | **Import schedule** tab — scrape URL, import wizard (context → map → review), week grid, session toggles; optional sync to `ScrapedClassEvent` |
| Scope | `TimetablesScopeSheet`, `TimetablesScopeTrigger` |
| Member check | `TimetableMemberScheduleCheck` |
| **Import preview** | `ImportScheduleWeekPreview`, `utils/scrapedDisplaySlots.ts` |
| **Import map & apply** | `ImportScheduleWizard.tsx`, `import-wizard/*`, `ImportScheduleCreateOfferingSheet.tsx`, `ImportScheduleCreateEntitySheet.tsx`, `hooks/useImportScheduleMappingCatalogs.ts` |
| Room picker | `TimetableRoomPickerField`, `hooks/useTimetableRoomPicker.ts` |
| Pattern editor | `screens/admin/offerings-workspace/` — `TermOfferingSessionCard`, `WeeklySessionRow`, `SessionCohortAudienceEditor` |

---

## Related docs

- [`CurriculumOfferings.md`](CurriculumOfferings.md) — periods, packages, term offerings
- [`Attendance.md`](Attendance.md) — roll, expected rows, work time
- [`Frontend.md`](Frontend.md) — admin workspace table
- [`Backend.md`](Backend.md) — controllers/services index
- [`WebSpider.md`](WebSpider.md) — import tab only
