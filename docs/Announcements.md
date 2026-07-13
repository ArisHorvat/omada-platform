# 📣 Announcements

Organization-scoped **channels** with **posts** and **comments** — replaces the legacy **Chat** and **News** member widgets with one surface: org-wide, group, and course updates in a single tab.

---

## Product behavior

| Decision | Detail |
|----------|--------|
| **Replaces** | Separate **Chat** and **News** tabs/widgets → one **Announcements** widget (`announcements`) |
| **Content model** | **Posts** (title + body) with **threaded comments** — no chat-style free-form messages, no Message/Announcement toggle |
| **Channels** | **General** (org-wide), **Group** (per group tree node), **CourseOffering** (per term course the member teaches or is enrolled in) |
| **Auto-provision** | Channels are created on first access when the user is eligible — no manual channel admin |
| **Posting** | **`announcements` Edit** — create posts in channels the user can access |
| **Comments** | **`announcements` View** — any member who can read the channel may comment |
| **Unread** | Per-channel count from read cursor; sidebar shows red badge (not post preview); opening a channel marks read |
| **Realtime** | SignalR pushes new posts/comments; React Query cache updated optimistically + refetch on app resume |
| **Legacy permissions** | Stored **`chat`** / **`news`** role rows and catalog keys still satisfy **`announcements`** policies (and vice versa) |

**Not in scope (yet):** file attachments on posts; audience picker when posting to course channels; tab-bar unread badge (dashboard bento uses total unread).

---

## Channel access rules

| Kind | Who sees the channel | Display name |
|------|----------------------|--------------|
| **General** | Everyone with widget access | Org name |
| **Group** | Direct group membership, cohort enrollment on offerings linked to the group, group managers, plus **ancestor groups** via `IGroupScopeService.ExpandWithAncestorsAsync` (subgroup member sees parent channels, not sibling subgroups) | Group name |
| **CourseOffering** | Enrolled students + teaching team (host/co-instructors) | Offering name |

Channels are filtered server-side in **`AnnouncementService.GetAccessibleChannelsAsync`** — the client does not compute membership.

---

## Backend API

Base route: **`/api/announcements`** · Controller: **`AnnouncementsController`** · Service: **`AnnouncementService`**

| Method | Route | Permission | Purpose |
|--------|-------|------------|---------|
| `GET` | `/channels` | `announcements` **View** | Accessible channels + `unreadCount`, `lastPostAt` |
| `GET` | `/feed` | **View** | Cross-channel post feed (paginated) |
| `GET` | `/channels/{channelId}/posts` | **View** | Posts in one channel |
| `POST` | `/channels/{channelId}/posts` | **Edit** | Create post (`CreateAnnouncementPostRequest`: title, content) |
| `GET` | `/posts/{postId}/comments` | **View** | Comment thread |
| `POST` | `/posts/{postId}/comments` | **View** | Add comment |
| `POST` | `/channels/{channelId}/read` | **View** | Update read cursor (`UserAnnouncementChannelRead`) |

**Responses:** standard **`ServiceResponse<T>`** envelope.

### Entities

| Entity | Role |
|--------|------|
| `AnnouncementChannel` | `Kind` (General / Group / CourseOffering), optional `GroupId` / `CourseOfferingId`, `DisplayName` |
| `AnnouncementPost` | Author, title, content, `ChannelId` |
| `AnnouncementComment` | Author, content, `PostId` |
| `UserAnnouncementChannelRead` | Per user/org/channel `LastReadAt` for unread counts |

EF configurations live under **`Data/Configurations/`**. Migrations: `AddAnnouncementChannels`, `AddAnnouncementComments`, `AddUserAnnouncementChannelReads`.

### SignalR (`AppHub` at `/ws/app`)

After connect, the client calls **`JoinOrganization(orgId)`** — server adds the connection to group `{organizationId}`.

| Hub event | Payload | When |
|-----------|---------|------|
| `announcement_post` | `{ type, data: AnnouncementPostDto }` | After `CreatePostAsync` |
| `announcement_comment` | `{ type, data: AnnouncementCommentDto }` | After `CreateCommentAsync` |

Broadcast: **`Clients.Group(orgId.ToString())`**.

### CORS (web + SignalR)

SignalR negotiate with JWT requires **explicit origins + `AllowCredentials`** — not `AllowAnyOrigin`. See **`Infrastructure/CorsOriginPolicy.cs`**. Dev allows localhost, LAN IPs, and `AppConfig:PublicAppUrl`.

---

## Mobile routes & entry

| Route | Screen | Notes |
|-------|--------|-------|
| **`/(tabs)/announcements`** | `AnnouncementsScreen` | Primary tab when widget enabled |
| **`/(widgets)/news`**, **`/(tabs)/chat`** | Redirect → `/announcements` | Legacy routes |
| Dashboard | `AnnouncementsBento` | Total unread badge when widget enabled |

**Global realtime:** **`useAnnouncementsRealtime`** in **`app/(app)/_layout.tsx`** — one org hub per session (not per screen mount).

**Widget gating:** **`useAnnouncementsTabEnabled`** — tab + hub only when org catalog + role allow **`announcements`** (legacy **`chat`** / **`news`** keys count).

---

## Frontend structure (`screens/widgets/announcements/`)

```text
components/
  AnnouncementsScreen.tsx       Tab shell — channel sidebar + post list
  AnnouncementsChannelPanel.tsx Channel list + unread badges
  AnnouncementPostCard.tsx      Post + expandable comments
  AnnouncementComposePanel.tsx  New post (Edit permission)
  AnnouncementsBento.tsx        Dashboard tile
hooks/
  useAnnouncementsLogic.ts      Channels, posts, mark-read, compose
  useAnnouncementComments.ts    Per-post comment fetch/submit
utils/
  announcementQueryCache.ts     React Query optimistic updates
  announcementRealtimePayload.ts Parse SignalR payloads
  announcementViewState.ts      Tracks open channel (unread + realtime)
  announcementIds.ts            normalizeGuid / guidsEqual (web list stability)
```

**API:** **`announcementsApi.ts`** wraps NSwag **`AnnouncementsClient`**. Until NSwag regen includes comment/read routes, **`getPostComments`**, **`createComment`**, **`markChannelRead`** use **`apiClient`** directly — remove after **`npm run generate-api`**.

**Permissions:** **`permissions.config.ts`** — widget key **`announcements`**; aliases **`chat`** / **`news`**; capabilities **`announcements.view`**, **`announcements.post`**, **`announcements.manage`**.

---

## Realtime lifecycle (mobile background)

When the app is **backgrounded**, the OS suspends JS — the WebSocket idle-times out. **`useOrganizationHub`** handles this explicitly:

| App state | Hub behavior |
|-----------|--------------|
| **`background`** | Stop SignalR cleanly (serialized queue) |
| **`active`** | Start fresh connection → `JoinOrganization` → invalidate announcement queries (catch missed events) |

**Do not** stop on **`inactive`** alone — on iOS resume goes `background → inactive → active`; stopping on `inactive` races with reconnect and logs *“stopped during negotiation”* / *“before stop() was called”*.

Implementation: **`hooks/useOrganizationHub.ts`** + **`hooks/useAnnouncementsRealtime.ts`** (`onAppForeground`).

**Web list pitfall:** normalize channel GUIDs in query keys and **`FlatList` `extraData`**; posts query uses **`structuralSharing: false`** so realtime cache patches re-render on web.

---

## Permissions & org catalog

| Layer | Detail |
|-------|--------|
| **Widget key** | `announcements` in **`WidgetKeys`** / **`WidgetRegistry`** (catalog toggleable, all org types) |
| **Legacy keys** | `chat`, `news` — **`IsInOrgCatalog: false`**; permission aliases in **`PermissionHandler`** and **`permissions.config.ts`** |
| **Legacy catalog JSON** | Orgs that stored `chat`/`news` in **`EnabledWidgetKeysJson`** get **`announcements`** merged in **`OrganizationWidgetKeys.GetEffectiveEnabledKeys`** |
| **Role UI** | Admin roles workspace shows **Announcements**; old Chat/News rows may still exist in DB until migrated |

---

## Common workflows

### Add a field to posts or comments

1. Entity + EF configuration + migration
2. DTO + validator + service mapping
3. Controller (if new route) or extend existing
4. SignalR payload if clients should update live
5. **`npm run generate-api`** → wire mobile + cache helpers

### Debug missing group channel

1. Confirm user has direct membership, cohort enrollment, or manager role on group or ancestor
2. Check **`GetUserGroupIdsAsync`** uses **`ExpandWithAncestorsAsync`**
3. Confirm channel **`Kind`** is string **`"Group"`** in API JSON (not numeric) — use **`isGroupChannel()`** helpers on mobile

### Debug stale UI after background

1. Confirm **`useOrganizationHub`** is mounted from **`(app)/_layout`**
2. Resume should invalidate **`QUERY_KEYS.announcements.channels(orgId)`** and active channel posts
3. Check API reachable after long background (JWT refresh via **`apiClient`**)

---

## Related docs

- [`Backend.md`](Backend.md) — controller/service index
- [`Frontend.md`](Frontend.md) — tab bar, API layer, widget folders
- [`Architecture.md`](Architecture.md) — widget catalog overview
- Scoped agent rules: **`.cursor/rules/domain-announcements.mdc`**
