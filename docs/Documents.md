# 📁 Documents (corporate file library)

Organization-scoped file repository for **corporate** tenants. Members upload, browse, open, and manage shared files (policies, HR packs, templates, project docs). Binary content is stored on the **web server file system** (not public `wwwroot`); metadata lives in SQL. All file I/O is isolated behind **`DocumentsController`** + **`IOrganizationDocumentStorage`** so migrating to S3/Azure later is a contained change.

---

## Product behavior

| Decision | Detail |
|----------|--------|
| **Org type** | **Corporate only** — not in university catalog; API returns 403 for university orgs |
| **Catalog widget** | Toggleable in **`/widgets-workspace`** (`WidgetAudience.Corporate`) |
| **Folders** | Flat categories (not nested paths): General, Policies & compliance, HR & onboarding, Templates, Project files |
| **Upload UX** | Pick file → **upload sheet** (display name, folder, optional notes) → confirm upload |
| **Open UX** | Tap row → **detail sheet** (metadata + Open / Download / Edit / Delete) — not instant download |
| **Storage** | `storage/org-documents/{organizationId}/` under API content root (gitignored) |
| **Public URLs** | None — download requires JWT via `GET /api/Documents/{id}/download` |

---

## Permissions (`documents` widget)

| Level | Capabilities | API |
|-------|----------------|-----|
| **View** | Browse, open, download | `GET` list/categories/detail/download |
| **Edit** | Upload + rename + move folder + edit notes | `POST` upload, `PUT` update |
| **Admin** | Delete files | `DELETE` |

**Role presets (corporate):** Employee = View; Project Manager = Edit; HR Manager / Director = Admin on documents.

Org **Admin** / **SuperAdmin** roles bypass widget checks (same as other widgets).

---

## Backend API

| Method | Route | Permission | Notes |
|--------|-------|------------|-------|
| `GET` | `/api/Documents/categories` | `documents` View | Folder labels for UI |
| `GET` | `/api/Documents` | View | Paginated list; query `Q`, `Category`, `Page`, `PageSize` |
| `GET` | `/api/Documents/{id}` | View | Metadata |
| `GET` | `/api/Documents/{id}/download` | View | Streams file bytes (`Content-Disposition` attachment) |
| `POST` | `/api/Documents` | Edit | Multipart: `file`, optional `title`, `category`, `description` (max **25 MB**) |
| `PUT` | `/api/Documents/{id}` | Edit | JSON: `title`, `category`, `description` |
| `DELETE` | `/api/Documents/{id}` | Admin | Soft-delete metadata + remove file on disk |

**Do not** use `FilesController` (`/api/Files/upload`) for org library files — that endpoint is for avatars, news, and coursework scopes only.

### Entity: `OrganizationDocument`

`OrganizationId`, `UploadedByUserId`, `Title`, `OriginalFileName`, `ContentType`, `ByteSize`, `StorageRelativePath`, `Category`, `Description?` — tenant-filtered + soft-delete.

### Services & storage

| Type | Role |
|------|------|
| `OrganizationDocumentService` | Corporate guard, CRUD, list/search |
| `IOrganizationDocumentStorage` / `OrganizationDocumentFileStorage` | Save, open stream, delete on disk |
| `DocumentsController` | Single HTTP surface for the feature |

### Universal search

Bucket key **`documents`** (corporate orgs only) → route `/documents`.

---

## Mobile routes & UI

| Route | Screen | Who |
|-------|--------|-----|
| `/documents` | `DocumentsScreen` | Members with `documents` View + corporate org + catalog enabled |

**Dashboard:** `documents` tile in `WidgetRegistry` (corporate orgs when enabled).

### Upload flow

1. **Upload** → system file picker  
2. **`DocumentFormSheet`** — display name (defaults to file name), **folder** picker (`OptionPickerSheet`), optional notes  
3. **Upload** submits multipart to `POST /api/Documents`

Default folder: active list filter if set, else **General**.

### Detail flow

Tap a row → **`DocumentDetailSheet`** (scrollable, ~88% screen height):

- **Open** — preview (web: blob URL in new tab; native: share/open via `useRemoteFileActions`)
- **Download** — save file (web: `<a download>`; native: share sheet)
- **Edit details** — `DocumentFormSheet` in edit mode (only when role has **Edit**)
- **Delete** — `confirmAction` dialog (only when role has **Admin**)

### Frontend structure (`screens/widgets/documents/`)

```text
components/
  DocumentsScreen.tsx       List, filters, sheets
  DocumentsWidget.tsx       Dashboard tile
  DocumentFormSheet.tsx     Upload + edit (folder picker, title, notes)
  DocumentDetailSheet.tsx     Metadata + actions
hooks/
  useDocumentsScreenLogic.ts
utils/
  documentLabels.ts         Folder display labels
styles/
  documents.styles.ts
```

**API:** `documentsApi.ts` — uses NSwag `DocumentsClient` for list/update/delete; **manual multipart** for upload and blob download (RN/web safe). Regenerate after contract changes: `cd src/frontend/mobile && npm run generate-api`.

**Capabilities:** `documents.view`, `documents.upload`, `documents.manage` in `permissions.config.ts`.

---

## Pitfalls

- **University org** — widget hidden by catalog; API forbidden even if called directly.
- **Empty catalog** — new orgs start with `"[]"`; admin must enable **Documents** in widgets workspace.
- **Instant upload on pick** — wrong; always show upload sheet so folder is chosen explicitly.
- **Detail sheet height** — use `ScrollView` + tall sheet so Edit/Delete are not clipped below the fold.
- **Rename on web** — do not use `window.prompt` / `Alert.prompt`; use `DocumentFormSheet`.
- **Permissions** — `PUT` is **Edit**, not Admin; only `DELETE` requires Admin.

---

## Related docs

- [`Architecture.md`](Architecture.md) — org type × widget catalog  
- [`Backend.md`](Backend.md) — controller map  
- [`Frontend.md`](Frontend.md) — widget registry  
- Rules: **`.cursor/rules/domain-documents.mdc`**
