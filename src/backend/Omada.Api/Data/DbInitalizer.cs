using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Constants;

namespace Omada.Api.Data;

/// <summary>
/// Development / thesis demo seed: two tenants (university + corporate), curriculum, floorplans,
/// documents, work-time, published timetables, announcements, tasks, and grades.
/// Runs once when <c>Users</c> is empty.
/// </summary>
/// <remarks>
/// Demo logins (password for all: <c>Password123!</c>):
/// <list type="bullet">
/// <item><c>admin@omada.com</c> — SuperAdmin in both orgs (admin console demo).</item>
/// <item><c>alex.jordan@omada.com</c> — member showcase in both orgs (all catalog widgets except Rooms).</item>
/// </list>
/// Orgs: <b>Demo University</b> (<c>DEMOUNI</c>) · <b>Demo Corp</b> (<c>DEMOCORP</c>).
/// </remarks>
public static partial class DbInitializer
{
    private const string DefaultPasswordPlaintext = "Password123!";

    public static async Task SeedAsync(ApplicationDbContext context, IWebHostEnvironment env)
    {
        if (await context.Users.AnyAsync())
            return;

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(DefaultPasswordPlaintext);
        var now = DateTime.UtcNow;
        var tomorrow8Am = now.Date.AddDays(1).AddHours(8);
        // Published weekly timetable: June → September (demo term window).
        var termScheduleStart = new DateTime(2026, 6, 1, 8, 0, 0, DateTimeKind.Utc);

        var state = new SeedState();
        state.Cs101BatchId = Guid.NewGuid();

        await SeedUsersAsync(context, state, passwordHash);
        await ApplyDirectoryHierarchyAsync(context, state);

        await SeedOrganizationsAsync(context, state);
        await SeedRolesAsync(context, state);
        await SeedMembershipsAsync(context, state);

        await SeedEventTypesAsync(context, state);

        await SeedBuildingsFloorsMapPinsAndRoomsAsync(context, state);
        await SeedGroupsAndMembersAsync(context, state);

        await SeedUniversityCurriculumAsync(context, state, termScheduleStart);
        await SeedDemoGradeCategoriesAsync(context, state);

        await SeedScheduleEventsAsync(context, state, tomorrow8Am);
        await SeedAttendanceAsync(context, state, termScheduleStart, now);
        await SeedAnnouncementsDemoAsync(context, state);
        await SeedTasksAsync(context, state, now);
        await SeedGradesAsync(context, state);
        await SeedDemoPresentationDataAsync(context, state, env, now, tomorrow8Am);
    }

    // -------------------------------------------------------------------------
    // 1. Users & preferences (avatars + JSON toggles; Digital ID is JWT-based — we seed profile + permissions)
    // -------------------------------------------------------------------------

    private static async Task SeedUsersAsync(ApplicationDbContext context, SeedState s, string passwordHash)
    {
        // Preferences: notification / UI toggles (matches typical client shape)
        static string Prefs(bool announcements, bool compact, string digest) =>
            JsonSerializer.Serialize(new Dictionary<string, object?>
            {
                ["announcementAlerts"] = announcements,
                ["compactSchedule"] = compact,
                ["emailDigest"] = digest
            });

        s.Users =
        [
            new User
            {
                FirstName = "Admin",
                LastName = "User",
                Email = "admin@omada.com",
                PasswordHash = passwordHash,
                PhoneNumber = "555-0000",
                Title = "System Admin",
                AvatarUrl = "/images/avatars/user1.jpg",
                ThemePreference = "system",
                LanguagePreference = "en",
                IsPublicInDirectory = true,
                PreferencesJson = Prefs(true, false, "daily")
            },
            new User
            {
                FirstName = "James",
                LastName = "Wilson",
                Email = "james.wilson@univ.edu",
                PasswordHash = passwordHash,
                PhoneNumber = "555-0101",
                Title = "Professor of Computer Science",
                AvatarUrl = "/images/avatars/user2.jpg",
                ThemePreference = "light",
                LanguagePreference = "en",
                Bio = "Algorithms, distributed systems.",
                PreferencesJson = Prefs(true, true, "off")
            },
            new User
            {
                FirstName = "Linda",
                LastName = "Martinez",
                Email = "linda.martinez@univ.edu",
                PasswordHash = passwordHash,
                PhoneNumber = "555-0102",
                Title = "Dean of Engineering",
                AvatarUrl = "/images/avatars/user3.jpg",
                ThemePreference = "dark",
                LanguagePreference = "en",
                PreferencesJson = Prefs(true, false, "weekly")
            },
            new User
            {
                FirstName = "Michael",
                LastName = "Brown",
                Email = "michael.brown@student.univ.edu",
                PasswordHash = passwordHash,
                PhoneNumber = "555-0103",
                Title = "Student",
                AvatarUrl = "/images/avatars/user4.jpg",
                ThemePreference = "system",
                LanguagePreference = "en",
                IsPublicInDirectory = true,
                PreferencesJson = Prefs(true, false, "daily")
            },
            new User
            {
                FirstName = "Emily",
                LastName = "Davis",
                Email = "emily.davis@student.univ.edu",
                PasswordHash = passwordHash,
                PhoneNumber = "555-0104",
                Title = "Student",
                AvatarUrl = "/images/avatars/user5.jpg",
                ThemePreference = "light",
                LanguagePreference = "ro",
                PreferencesJson = Prefs(false, true, "off")
            },
            new User
            {
                FirstName = "Robert",
                LastName = "Taylor",
                Email = "robert.taylor@nexus.corp",
                PasswordHash = passwordHash,
                PhoneNumber = "555-0201",
                Title = "Director of Engineering",
                AvatarUrl = "/images/avatars/user6.jpg",
                ThemePreference = "dark",
                LanguagePreference = "en",
                PreferencesJson = Prefs(true, false, "weekly")
            },
            new User
            {
                FirstName = "Sarah",
                LastName = "Connor",
                Email = "sarah.connor@nexus.corp",
                PasswordHash = passwordHash,
                PhoneNumber = "555-0202",
                Title = "Project Manager",
                AvatarUrl = "/images/avatars/user7.jpg",
                ThemePreference = "system",
                LanguagePreference = "en",
                PreferencesJson = Prefs(true, true, "daily")
            },
            new User
            {
                FirstName = "David",
                LastName = "Anderson",
                Email = "david.anderson@nexus.corp",
                PasswordHash = passwordHash,
                PhoneNumber = "555-0203",
                Title = "Senior Developer",
                AvatarUrl = "/images/avatars/user8.jpg",
                ThemePreference = "light",
                LanguagePreference = "en",
                PreferencesJson = Prefs(true, false, "off")
            },
            new User
            {
                FirstName = "Jessica",
                LastName = "Thomas",
                Email = "jessica.thomas@nexus.corp",
                PasswordHash = passwordHash,
                PhoneNumber = "555-0204",
                Title = "HR Manager",
                AvatarUrl = "/images/avatars/user9.jpg",
                ThemePreference = "system",
                LanguagePreference = "en",
                PreferencesJson = Prefs(true, false, "weekly")
            },
            new User
            {
                FirstName = "Alex",
                LastName = "Jordan",
                Email = "alex.jordan@omada.com",
                PasswordHash = passwordHash,
                PhoneNumber = "555-0301",
                Title = "Student & Intern",
                AvatarUrl = "/images/avatars/user10.jpg",
                ThemePreference = "dark",
                LanguagePreference = "en",
                Bio = "Demo member — university student and corporate intern (all widgets except room booking).",
                PreferencesJson = Prefs(true, false, "daily")
            }
        ];

        await context.Users.AddRangeAsync(s.Users);
        await context.SaveChangesAsync();

        // Shortcuts
        s.Admin = s.Users[0];
        s.UniProf = s.Users[1];
        s.UniDean = s.Users[2];
        s.UniStudent1 = s.Users[3];
        s.UniStudent2 = s.Users[4];
        s.CorpDirector = s.Users[5];
        s.CorpPm = s.Users[6];
        s.CorpDev = s.Users[7];
        s.CorpHr = s.Users[8];
        s.DualUser = s.Users[9];
    }

    /// <summary>Org-chart links (same schema for all tenants; directory filters by org).</summary>
    private static async Task ApplyDirectoryHierarchyAsync(ApplicationDbContext context, SeedState s)
    {
        // University: Dean at top; Prof reports to Dean; students advised by Prof
        s.UniDean.ManagerId = null;
        s.UniProf.ManagerId = s.UniDean.Id;
        s.UniStudent1.ManagerId = s.UniProf.Id;
        s.UniStudent2.ManagerId = s.UniProf.Id;

        // Corporate: Director top; PM and HR report to Director; Dev reports to PM
        s.CorpDirector.ManagerId = null;
        s.CorpPm.ManagerId = s.CorpDirector.Id;
        s.CorpHr.ManagerId = s.CorpDirector.Id;
        s.CorpDev.ManagerId = s.CorpPm.Id;

        // Dual org user: single global manager FK — line manager at Nexus (internship); uni advising via groups/classes.
        s.DualUser.ManagerId = s.CorpPm.Id;

        await context.SaveChangesAsync();
    }

    // -------------------------------------------------------------------------
    // 2. Organizations
    // -------------------------------------------------------------------------

    private static async Task SeedOrganizationsAsync(ApplicationDbContext context, SeedState s)
    {
        s.OrgUni = new Organization
        {
            Name = "Demo University",
            OrganizationType = OrganizationType.University,
            ShortName = "DemoU",
            EmailDomain = "univ.edu",
            LogoUrl = "/images/orgs/omada-university.png",
            PrimaryColor = "#7f1d1d",
            SecondaryColor = "#fbbf24",
            TertiaryColor = "#0ea5e9",
            IsActive = true,
            InviteCode = "DEMOUNI",
            EnabledWidgetKeysJson = null,
            OnboardingCompletedStepsJson = DemoOnboardingJson,
            SpiderSchedulePageUrl = DemoSpiderScheduleUrl,
        };

        s.OrgCorp = new Organization
        {
            Name = "Demo Corp",
            OrganizationType = OrganizationType.Corporate,
            ShortName = "DemoCorp",
            EmailDomain = "nexus.corp",
            LogoUrl = "/images/orgs/nexus-solutions.png",
            PrimaryColor = "#0f172a",
            SecondaryColor = "#38bdf8",
            TertiaryColor = "#a78bfa",
            IsActive = true,
            InviteCode = "DEMOCORP",
            EnabledWidgetKeysJson = null,
            OnboardingCompletedStepsJson = DemoOnboardingJson,
        };

        await context.Organizations.AddRangeAsync(s.OrgUni, s.OrgCorp);
        await context.SaveChangesAsync();
    }

    // -------------------------------------------------------------------------
    // 3. Roles & permissions
    // -------------------------------------------------------------------------

    private static async Task SeedRolesAsync(ApplicationDbContext context, SeedState s)
    {
        // Shared widget sets — include digital-id for realistic mobile profile
        var uniStudentPerms = new Dictionary<string, AccessLevel>
        {
            { WidgetKeys.Tasks, AccessLevel.View },
            { WidgetKeys.Grades, AccessLevel.View },
            { WidgetKeys.Attendance, AccessLevel.View },
            { WidgetKeys.Map, AccessLevel.View },
            { WidgetKeys.Rooms, AccessLevel.View },
            { WidgetKeys.Schedule, AccessLevel.View },
            { WidgetKeys.Announcements, AccessLevel.View },
            { WidgetKeys.DigitalId, AccessLevel.View }
        };

        var uniProfPerms = new Dictionary<string, AccessLevel>(uniStudentPerms)
        {
            [WidgetKeys.Tasks] = AccessLevel.Edit,
            [WidgetKeys.Grades] = AccessLevel.Edit,
            [WidgetKeys.Attendance] = AccessLevel.Edit,
            [WidgetKeys.Users] = AccessLevel.View,
            [WidgetKeys.Schedule] = AccessLevel.Edit,
            [WidgetKeys.Announcements] = AccessLevel.Edit,
        };

        var memberPerms = new Dictionary<string, AccessLevel>(uniStudentPerms);

        // Demo member showcase — every catalog widget at View except room booking (Rooms omitted).
        var uniShowcasePerms = new Dictionary<string, AccessLevel>
        {
            { WidgetKeys.Users, AccessLevel.View },
            { WidgetKeys.Announcements, AccessLevel.View },
            { WidgetKeys.Schedule, AccessLevel.View },
            { WidgetKeys.Tasks, AccessLevel.View },
            { WidgetKeys.Grades, AccessLevel.View },
            { WidgetKeys.Attendance, AccessLevel.View },
            { WidgetKeys.Map, AccessLevel.View },
            { WidgetKeys.DigitalId, AccessLevel.View },
        };

        var corpShowcasePerms = new Dictionary<string, AccessLevel>
        {
            { WidgetKeys.Users, AccessLevel.View },
            { WidgetKeys.Announcements, AccessLevel.View },
            { WidgetKeys.Schedule, AccessLevel.View },
            { WidgetKeys.Tasks, AccessLevel.View },
            { WidgetKeys.Documents, AccessLevel.View },
            { WidgetKeys.Attendance, AccessLevel.View },
            { WidgetKeys.Map, AccessLevel.View },
            { WidgetKeys.DigitalId, AccessLevel.View },
        };

        var unassignedPerms = new Dictionary<string, AccessLevel>();

        var adminPerms = new Dictionary<string, AccessLevel>
        {
            { WidgetKeys.Users, AccessLevel.Admin },
            { WidgetKeys.Settings, AccessLevel.Admin },
            { WidgetKeys.Announcements, AccessLevel.Admin },
            { WidgetKeys.Schedule, AccessLevel.Admin },
            { WidgetKeys.Tasks, AccessLevel.Admin },
            { WidgetKeys.Grades, AccessLevel.Admin },
            { WidgetKeys.Attendance, AccessLevel.Admin },
            { WidgetKeys.Map, AccessLevel.Admin },
            { WidgetKeys.Rooms, AccessLevel.Admin },
            { WidgetKeys.Documents, AccessLevel.Admin },
            { WidgetKeys.DigitalId, AccessLevel.View },
        };

        var uniDeanPerms = new Dictionary<string, AccessLevel>
        {
            { WidgetKeys.Announcements, AccessLevel.Edit },
            { WidgetKeys.Users, AccessLevel.Edit },
            { WidgetKeys.Map, AccessLevel.Admin },
            { WidgetKeys.Rooms, AccessLevel.Edit },
            { WidgetKeys.Schedule, AccessLevel.View },
            { WidgetKeys.DigitalId, AccessLevel.View }
        };

        // Employee: same baseline as typical members — schedule/attendance + directory-style reads for status/busy APIs.
        var corpEmployeePerms = new Dictionary<string, AccessLevel>
        {
            { WidgetKeys.Tasks, AccessLevel.View },
            { WidgetKeys.Documents, AccessLevel.View },
            { WidgetKeys.Map, AccessLevel.View },
            { WidgetKeys.Rooms, AccessLevel.View },
            { WidgetKeys.Schedule, AccessLevel.Edit },
            { WidgetKeys.Announcements, AccessLevel.View },
            { WidgetKeys.DigitalId, AccessLevel.View },
            { WidgetKeys.Users, AccessLevel.View },
            { WidgetKeys.Attendance, AccessLevel.Edit }
        };

        var corpPmPerms = new Dictionary<string, AccessLevel>(corpEmployeePerms)
        {
            [WidgetKeys.Tasks] = AccessLevel.Admin,
            [WidgetKeys.Documents] = AccessLevel.Edit,
            [WidgetKeys.Users] = AccessLevel.View,
            [WidgetKeys.Schedule] = AccessLevel.Edit,
            [WidgetKeys.Announcements] = AccessLevel.Edit,
            [WidgetKeys.DigitalId] = AccessLevel.View,
            [WidgetKeys.Map] = AccessLevel.Admin,
            [WidgetKeys.Rooms] = AccessLevel.Edit,
        };

        var corpDirectorPerms = new Dictionary<string, AccessLevel>
        {
            { WidgetKeys.Announcements, AccessLevel.Edit },
            { WidgetKeys.Users, AccessLevel.View },
            { WidgetKeys.Documents, AccessLevel.Admin },
            { WidgetKeys.Schedule, AccessLevel.View },
            { WidgetKeys.DigitalId, AccessLevel.View }
        };

        var corpHrPerms = new Dictionary<string, AccessLevel>
        {
            { WidgetKeys.Users, AccessLevel.Admin },
            { WidgetKeys.Documents, AccessLevel.Admin },
            { WidgetKeys.Announcements, AccessLevel.Edit },
            { WidgetKeys.DigitalId, AccessLevel.View }
        };

        var superAdminPerms = new Dictionary<string, AccessLevel>
        {
            { WidgetKeys.Users, AccessLevel.Admin },
            { WidgetKeys.Schedule, AccessLevel.Admin },
            { WidgetKeys.Rooms, AccessLevel.Admin },
            { WidgetKeys.DigitalId, AccessLevel.Admin },
            { WidgetKeys.Map, AccessLevel.Admin },
        };

        s.RUniStudent = CreateRole(s.OrgUni.Id, RoleNames.Member, memberPerms);
        s.RUniDemoShowcase = CreateRole(s.OrgUni.Id, "Demo Showcase", uniShowcasePerms);
        s.RUniProf = CreateRole(s.OrgUni.Id, "Professor", uniProfPerms);
        s.RUniDean = CreateRole(s.OrgUni.Id, "Dean", uniDeanPerms);
        s.RUniAdmin = CreateRole(s.OrgUni.Id, RoleNames.Admin, adminPerms);
        s.RUniUnassigned = CreateRole(s.OrgUni.Id, RoleNames.Unassigned, unassignedPerms);
        s.RCorpEmployee = CreateRole(s.OrgCorp.Id, RoleNames.Member, corpEmployeePerms);
        s.RCorpDemoShowcase = CreateRole(s.OrgCorp.Id, "Demo Showcase", corpShowcasePerms);
        s.RCorpPm = CreateRole(s.OrgCorp.Id, "Project Manager", corpPmPerms);
        s.RCorpDirector = CreateRole(s.OrgCorp.Id, "Director", corpDirectorPerms);
        s.RCorpHr = CreateRole(s.OrgCorp.Id, "HR Manager", corpHrPerms);
        s.RCorpAdmin = CreateRole(s.OrgCorp.Id, RoleNames.Admin, adminPerms);
        s.RCorpUnassigned = CreateRole(s.OrgCorp.Id, RoleNames.Unassigned, unassignedPerms);
        s.RSysAdminUni = CreateRole(s.OrgUni.Id, "Super Admin", superAdminPerms);
        s.RSysAdminCorp = CreateRole(s.OrgCorp.Id, "Super Admin", superAdminPerms);

        await context.Roles.AddRangeAsync(
            s.RUniAdmin, s.RUniStudent, s.RUniDemoShowcase, s.RUniUnassigned, s.RUniProf, s.RUniDean,
            s.RCorpAdmin, s.RCorpEmployee, s.RCorpDemoShowcase, s.RCorpUnassigned, s.RCorpPm, s.RCorpDirector, s.RCorpHr,
            s.RSysAdminUni, s.RSysAdminCorp);
        await context.SaveChangesAsync();
    }

    private static async Task SeedMembershipsAsync(ApplicationDbContext context, SeedState s)
    {
        var memberships = new List<OrganizationMember>
        {
            new() { OrganizationId = s.OrgUni.Id, UserId = s.Admin.Id, RoleId = s.RSysAdminUni.Id },
            new() { OrganizationId = s.OrgCorp.Id, UserId = s.Admin.Id, RoleId = s.RSysAdminCorp.Id },
            new() { OrganizationId = s.OrgUni.Id, UserId = s.UniProf.Id, RoleId = s.RUniProf.Id },
            new() { OrganizationId = s.OrgUni.Id, UserId = s.UniDean.Id, RoleId = s.RUniDean.Id },
            new() { OrganizationId = s.OrgUni.Id, UserId = s.UniStudent1.Id, RoleId = s.RUniStudent.Id },
            new() { OrganizationId = s.OrgUni.Id, UserId = s.UniStudent2.Id, RoleId = s.RUniStudent.Id },
            new() { OrganizationId = s.OrgCorp.Id, UserId = s.CorpDirector.Id, RoleId = s.RCorpDirector.Id },
            new() { OrganizationId = s.OrgCorp.Id, UserId = s.CorpPm.Id, RoleId = s.RCorpPm.Id },
            new() { OrganizationId = s.OrgCorp.Id, UserId = s.CorpDev.Id, RoleId = s.RCorpEmployee.Id },
            new() { OrganizationId = s.OrgCorp.Id, UserId = s.CorpHr.Id, RoleId = s.RCorpHr.Id },
            new() { OrganizationId = s.OrgUni.Id, UserId = s.DualUser.Id, RoleId = s.RUniDemoShowcase.Id },
            new() { OrganizationId = s.OrgCorp.Id, UserId = s.DualUser.Id, RoleId = s.RCorpDemoShowcase.Id }
        };

        await context.OrganizationMembers.AddRangeAsync(memberships);
        await context.SaveChangesAsync();
    }

    // -------------------------------------------------------------------------
    // 4. Event types
    // -------------------------------------------------------------------------

    private static async Task SeedEventTypesAsync(ApplicationDbContext context, SeedState s)
    {
        s.UniEventTypes =
        [
            new EventType { Name = "Lecture", ColorHex = "#3b82f6", OrganizationId = s.OrgUni.Id },
            new EventType { Name = "Seminar", ColorHex = "#10b981", OrganizationId = s.OrgUni.Id },
            new EventType { Name = "Exam", ColorHex = "#ef4444", OrganizationId = s.OrgUni.Id },
            new EventType { Name = "Office Hours", ColorHex = "#f97316", OrganizationId = s.OrgUni.Id }
        ];

        s.CorpEventTypes =
        [
            new EventType { Name = "Client Meeting", ColorHex = "#8b5cf6", OrganizationId = s.OrgCorp.Id },
            new EventType { Name = "Sprint Standup", ColorHex = "#f59e0b", OrganizationId = s.OrgCorp.Id },
            new EventType { Name = "Town Hall", ColorHex = "#6366f1", OrganizationId = s.OrgCorp.Id },
            new EventType { Name = "Deep Work Block", ColorHex = "#14b8a6", OrganizationId = s.OrgCorp.Id }
        ];

        await context.EventTypes.AddRangeAsync(s.UniEventTypes);
        await context.EventTypes.AddRangeAsync(s.CorpEventTypes);
        await context.SaveChangesAsync();
    }

    // -------------------------------------------------------------------------
    // 5. Buildings, floors, rooms, map pins (GPS + floorplans + equipment JSON)
    // -------------------------------------------------------------------------

    private static async Task SeedBuildingsFloorsMapPinsAndRoomsAsync(ApplicationDbContext context, SeedState s)
    {
        // Real-world style coordinates (Cambridge, MA & San Francisco, CA)
        s.BldUniMain = new Building
        {
            Name = "Whitaker Hall",
            ShortCode = "WHIT",
            Address = "77 Massachusetts Ave, Cambridge, MA",
            Latitude = 42.360_083,
            Longitude = -71.094_009,
            OrganizationId = s.OrgUni.Id
        };
        s.BldUniScience = new Building
        {
            Name = "Science & Engineering Complex",
            ShortCode = "SEC",
            Address = "45 Carleton St, Cambridge, MA",
            Latitude = 42.361_2,
            Longitude = -71.093_4,
            OrganizationId = s.OrgUni.Id
        };
        s.BldCorpHq = new Building
        {
            Name = "Nexus Headquarters",
            ShortCode = "HQ",
            Address = "555 Market St, San Francisco, CA",
            Latitude = 37.789_7,
            Longitude = -122.401_8,
            OrganizationId = s.OrgCorp.Id
        };

        await context.Buildings.AddRangeAsync(s.BldUniMain, s.BldUniScience, s.BldCorpHq);
        await context.SaveChangesAsync();

        s.FloorMain1 = new Floor
        {
            BuildingId = s.BldUniMain.Id,
            LevelNumber = 1,
            FloorplanImageUrl = "/images/maps/building1_floor1.png"
        };
        s.FloorMain2 = new Floor
        {
            BuildingId = s.BldUniMain.Id,
            LevelNumber = 2,
            FloorplanImageUrl = "/images/maps/building1_floor2.png"
        };
        s.FloorSci1 = new Floor
        {
            BuildingId = s.BldUniScience.Id,
            LevelNumber = 1,
            FloorplanImageUrl = "/images/maps/building2_floor1.png"
        };
        s.FloorHq1 = new Floor
        {
            BuildingId = s.BldCorpHq.Id,
            LevelNumber = 1,
            FloorplanImageUrl = "/images/maps/building3_floor1.png"
        };

        await context.Floors.AddRangeAsync(s.FloorMain1, s.FloorMain2, s.FloorSci1, s.FloorHq1);
        await context.SaveChangesAsync();

        static string EquipmentJson(string projector, int seats, string av) =>
            JsonSerializer.Serialize(new Dictionary<string, object?>
            {
                ["projector"] = projector,
                ["seats"] = seats,
                ["av"] = av,
                ["whiteboards"] = 2,
                ["videoConference"] = true
            });

        static string RoomAmenitiesJson(params RoomAmenity[] amenities) =>
            JsonSerializer.Serialize(amenities.Select(a => a.ToString()).ToList());

        s.RoomLectureHall = new Room
        {
            Name = "Lecture Hall A",
            Location = "Whitaker Hall · Floor 1",
            Capacity = 120,
            OrganizationId = s.OrgUni.Id,
            BuildingId = s.BldUniMain.Id,
            FloorId = s.FloorMain1.Id,
            CoordinateX = 0.32,
            CoordinateY = 0.41,
            CustomAttributes = EquipmentJson("4K laser", 120, "Dolby surround"),
            Resources = "Podium, wireless mic, document camera",
            AmenitiesJson = RoomAmenitiesJson(
                RoomAmenity.VideoProjector,
                RoomAmenity.MicrophoneArray,
                RoomAmenity.DocumentCamera,
                RoomAmenity.VideoConference,
                RoomAmenity.WhiteboardWall,
                RoomAmenity.DimmingLights),
            IsBookable = true
        };
        s.RoomSeminar = new Room
        {
            Name = "Seminar Room 204",
            Location = "Whitaker Hall · Floor 2",
            Capacity = 24,
            OrganizationId = s.OrgUni.Id,
            BuildingId = s.BldUniMain.Id,
            FloorId = s.FloorMain2.Id,
            CoordinateX = 0.55,
            CoordinateY = 0.38,
            CustomAttributes = EquipmentJson("Short-throw HD", 24, "Stereo"),
            Resources = "Whiteboard, projector, video conference",
            AmenitiesJson = RoomAmenitiesJson(
                RoomAmenity.VideoProjector,
                RoomAmenity.VideoConference,
                RoomAmenity.InteractiveSmartBoard,
                RoomAmenity.WhiteboardWall),
            IsBookable = true
        };
        s.RoomComputerLab = new Room
        {
            Name = "Computer Lab 1",
            Location = "SEC · Floor 1",
            Capacity = 32,
            OrganizationId = s.OrgUni.Id,
            BuildingId = s.BldUniScience.Id,
            FloorId = s.FloorSci1.Id,
            CoordinateX = 0.44,
            CoordinateY = 0.52,
            CustomAttributes = JsonSerializer.Serialize(new Dictionary<string, object?>
            {
                ["workstations"] = 32,
                ["os"] = "Linux + Windows dual boot",
                ["gpu"] = "Lab NVIDIA A4000",
                ["locks"] = "Smart card entry"
            }),
            Resources = "PC lab, dual monitors, projector",
            AmenitiesJson = RoomAmenitiesJson(
                RoomAmenity.ComputerWorkstations,
                RoomAmenity.VideoProjector,
                RoomAmenity.VideoConference),
            IsBookable = true
        };
        s.RoomBoard = new Room
        {
            Name = "Executive Boardroom",
            Location = "HQ · Floor 1",
            Capacity = 14,
            OrganizationId = s.OrgCorp.Id,
            BuildingId = s.BldCorpHq.Id,
            FloorId = s.FloorHq1.Id,
            CoordinateX = 0.28,
            CoordinateY = 0.35,
            CustomAttributes = EquipmentJson("Ceiling array", 14, "Teams Room Premium"),
            AmenitiesJson = RoomAmenitiesJson(
                RoomAmenity.VideoConference,
                RoomAmenity.MicrophoneArray,
                RoomAmenity.VideoProjector,
                RoomAmenity.AcousticPanels,
                RoomAmenity.DimmingLights),
            IsBookable = true
        };
        s.RoomHuddle = new Room
        {
            Name = "Huddle 3B",
            Location = "HQ · Floor 1",
            Capacity = 6,
            OrganizationId = s.OrgCorp.Id,
            BuildingId = s.BldCorpHq.Id,
            FloorId = s.FloorHq1.Id,
            CoordinateX = 0.72,
            CoordinateY = 0.60,
            CustomAttributes = JsonSerializer.Serialize(new Dictionary<string, object?>
            {
                ["display"] = "55\" 4K",
                ["camera"] = "PTZ",
                ["acoustic"] = "soundproof"
            }),
            Resources = "Display, camera, whiteboard",
            AmenitiesJson = RoomAmenitiesJson(
                RoomAmenity.VideoConference,
                RoomAmenity.WirelessPresentation,
                RoomAmenity.WhiteboardWall),
            IsBookable = true
        };

        // Allowed event types (many-to-many)
        s.RoomLectureHall.AllowedEventTypes.Add(s.UniEventTypes[0]); // Lecture
        s.RoomLectureHall.AllowedEventTypes.Add(s.UniEventTypes[2]); // Exam
        s.RoomSeminar.AllowedEventTypes.Add(s.UniEventTypes[1]); // Seminar
        s.RoomSeminar.AllowedEventTypes.Add(s.UniEventTypes[0]);
        s.RoomComputerLab.AllowedEventTypes.Add(s.UniEventTypes[0]);
        s.RoomComputerLab.AllowedEventTypes.Add(s.UniEventTypes[3]); // Office hours
        s.RoomBoard.AllowedEventTypes.Add(s.CorpEventTypes[0]);
        s.RoomBoard.AllowedEventTypes.Add(s.CorpEventTypes[2]);
        s.RoomHuddle.AllowedEventTypes.Add(s.CorpEventTypes[1]);
        s.RoomHuddle.AllowedEventTypes.Add(s.CorpEventTypes[3]);

        await context.Rooms.AddRangeAsync(
            s.RoomLectureHall, s.RoomSeminar, s.RoomComputerLab, s.RoomBoard, s.RoomHuddle);
        await context.SaveChangesAsync();

        // Map pins: room anchors + entrance (Exit pin type per product convention)
        var pins = new List<MapPin>
        {
            new()
            {
                FloorId = s.FloorMain1.Id,
                PinType = PinType.Room,
                Label = "Lecture Hall A",
                CoordinateX = 0.32,
                CoordinateY = 0.41,
                RoomId = s.RoomLectureHall.Id
            },
            new()
            {
                FloorId = s.FloorMain1.Id,
                PinType = PinType.Exit,
                Label = "Entrance",
                CoordinateX = 0.12,
                CoordinateY = 0.78,
                RoomId = null
            },
            new()
            {
                FloorId = s.FloorSci1.Id,
                PinType = PinType.Room,
                Label = "Computer Lab 1",
                CoordinateX = 0.44,
                CoordinateY = 0.52,
                RoomId = s.RoomComputerLab.Id
            },
            new()
            {
                FloorId = s.FloorHq1.Id,
                PinType = PinType.Room,
                Label = "Executive Boardroom",
                CoordinateX = 0.28,
                CoordinateY = 0.35,
                RoomId = s.RoomBoard.Id
            },
            new()
            {
                FloorId = s.FloorHq1.Id,
                PinType = PinType.Exit,
                Label = "Entrance",
                CoordinateX = 0.90,
                CoordinateY = 0.15,
                RoomId = null
            }
        };
        await context.MapPins.AddRangeAsync(pins);
        await context.SaveChangesAsync();
    }

    // -------------------------------------------------------------------------
    // 7. Schedule — corporate + public uni events (term offerings seeded separately)
    // -------------------------------------------------------------------------

    private static async Task SeedScheduleEventsAsync(ApplicationDbContext context, SeedState s, DateTime tomorrow8Am)
    {
        var t0 = tomorrow8Am;
        var events = new List<Event>
        {
            new()
            {
                Title = "Grad Seminar — Distributed Consensus",
                StartTime = t0.AddHours(6),
                EndTime = t0.AddHours(7).AddMinutes(30),
                OrganizationId = s.OrgUni.Id,
                EventTypeId = s.UniEventTypes[1].Id,
                RoomId = s.RoomSeminar.Id,
                HostId = s.UniDean.Id,
                IsPublic = true
            },
            // CORP: Daily standup
            new()
            {
                Title = "Platform Standup",
                StartTime = t0.AddHours(2),
                EndTime = t0.AddHours(2).AddMinutes(15),
                OrganizationId = s.OrgCorp.Id,
                EventTypeId = s.CorpEventTypes[1].Id,
                RoomId = s.RoomHuddle.Id,
                GroupId = s.GrpEng.Id,
                HostId = s.CorpPm.Id,
                RecurrenceRule = "FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR",
                IsPublic = false
            },
            // CORP: Overlapping — deep work block same window as standup (different room)
            new()
            {
                Title = "Focus Block — API Hardening",
                StartTime = t0.AddHours(2),
                EndTime = t0.AddHours(3).AddMinutes(30),
                OrganizationId = s.OrgCorp.Id,
                EventTypeId = s.CorpEventTypes[3].Id,
                RoomId = s.RoomBoard.Id,
                HostId = s.CorpDirector.Id,
                IsPublic = false
            },
            // CORP: Client meeting (single)
            new()
            {
                Title = "Acme Corp — Q1 Roadmap Review",
                Description = "Executive stakeholders; NDA on file.",
                StartTime = t0.AddDays(1).AddHours(5),
                EndTime = t0.AddDays(1).AddHours(6).AddMinutes(30),
                OrganizationId = s.OrgCorp.Id,
                EventTypeId = s.CorpEventTypes[0].Id,
                RoomId = s.RoomBoard.Id,
                HostId = s.CorpPm.Id,
                IsPublic = true
            },
            // CORP: Town hall
            new()
            {
                Title = "All-Hands — Nexus",
                StartTime = t0.AddDays(2).AddHours(4),
                EndTime = t0.AddDays(2).AddHours(5),
                OrganizationId = s.OrgCorp.Id,
                EventTypeId = s.CorpEventTypes[2].Id,
                RoomId = s.RoomBoard.Id,
                HostId = s.CorpDirector.Id,
                IsPublic = true
            }
        };

        await context.Events.AddRangeAsync(events);
        await context.SaveChangesAsync();

        s.EventStandup = events[1];
    }

    private static void AddWeeklyAttendanceHistory(
        ICollection<EventAttendance> rows,
        Event ev,
        Guid userId,
        DateTime historyThrough,
        int absentEveryNthWeek)
    {
        var week = 0;
        for (var instance = ev.StartTime; instance < historyThrough; instance = instance.AddDays(7), week++)
        {
            var status = absentEveryNthWeek > 0 && week % absentEveryNthWeek == 0
                ? AttendanceStatus.Declined
                : AttendanceStatus.Added;

            rows.Add(new EventAttendance
            {
                EventId = ev.Id,
                UserId = userId,
                InstanceDate = instance,
                Status = status,
            });
        }
    }

    private static async Task SeedAttendanceAsync(
        ApplicationDbContext context,
        SeedState s,
        DateTime termScheduleStart,
        DateTime now)
    {
        if (s.EventCs101 == null || s.EventStandup == null)
            return;

        var historyThrough = now.Date.AddDays(1);
        var rows = new List<EventAttendance>();

        AddWeeklyAttendanceHistory(rows, s.EventCs101, s.UniStudent1.Id, historyThrough, absentEveryNthWeek: 3);
        AddWeeklyAttendanceHistory(rows, s.EventCs101, s.UniStudent2.Id, historyThrough, absentEveryNthWeek: 4);

        // Alex (demo showcase) — ongoing term attendance across CS101 + CS201 for demo screens
        AddWeeklyAttendanceHistory(rows, s.EventCs101, s.DualUser.Id, historyThrough, absentEveryNthWeek: 5);
        if (s.EventCs101Lab != null)
            AddWeeklyAttendanceHistory(rows, s.EventCs101Lab, s.DualUser.Id, historyThrough, absentEveryNthWeek: 6);
        if (s.EventCs101Seminar != null)
            AddWeeklyAttendanceHistory(rows, s.EventCs101Seminar, s.DualUser.Id, historyThrough, absentEveryNthWeek: 8);
        if (s.EventCs201Lecture != null)
            AddWeeklyAttendanceHistory(rows, s.EventCs201Lecture, s.DualUser.Id, historyThrough, absentEveryNthWeek: 7);

        // Corporate standup RSVPs — weekdays since term start
        for (var day = termScheduleStart.Date; day < historyThrough; day = day.AddDays(1))
        {
            if (day.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                continue;

            rows.Add(new EventAttendance
            {
                EventId = s.EventStandup.Id,
                UserId = s.CorpDev.Id,
                InstanceDate = day.AddHours(10),
                Status = day.DayOfWeek == DayOfWeek.Wednesday
                    ? AttendanceStatus.Tentative
                    : AttendanceStatus.Accepted,
            });

            rows.Add(new EventAttendance
            {
                EventId = s.EventStandup.Id,
                UserId = s.DualUser.Id,
                InstanceDate = day.AddHours(10),
                Status = AttendanceStatus.Accepted,
            });
        }

        await context.Set<EventAttendance>().AddRangeAsync(rows);
        await context.SaveChangesAsync();
    }

    // -------------------------------------------------------------------------
    // 9. Tasks — completed, overdue, upcoming
    // -------------------------------------------------------------------------

    private static async Task SeedTasksAsync(ApplicationDbContext context, SeedState s, DateTime now)
    {
        var tasks = new List<TaskItem>
        {
            new()
            {
                OrganizationId = s.OrgUni.Id,
                AssigneeId = s.UniStudent1.Id,
                CreatedByUserId = s.UniProf.Id,
                Title = "CS101 — Homework 4 (Graphs)",
                Description = "Implement Dijkstra; submit PDF + code zip.",
                DueDate = now.AddDays(5),
                IsCompleted = false,
                SubjectId = s.OfferingProgramming?.Id,
                OfferingId = s.OfferingProgramming?.Id,
                PeriodId = s.PeriodSpring2026?.Id,
                AssignmentBatchId = s.Cs101BatchId,
                GradeCategoryId = s.CatHomework?.Id,
                MaxScore = 100,
                Weight = 0.50m,
                Priority = null
            },
            new()
            {
                OrganizationId = s.OrgUni.Id,
                AssigneeId = s.UniStudent2.Id,
                CreatedByUserId = s.UniProf.Id,
                Title = "CS101 — Homework 4 (Graphs)",
                Description = "Implement Dijkstra; submit PDF + code zip.",
                DueDate = now.AddDays(5),
                IsCompleted = false,
                SubjectId = s.OfferingProgramming?.Id,
                OfferingId = s.OfferingProgramming?.Id,
                PeriodId = s.PeriodSpring2026?.Id,
                AssignmentBatchId = s.Cs101BatchId,
                GradeCategoryId = s.CatHomework?.Id,
                MaxScore = 100,
                Weight = 0.50m,
                Priority = null
            },
            new()
            {
                OrganizationId = s.OrgUni.Id,
                AssigneeId = s.UniStudent1.Id,
                CreatedByUserId = s.UniProf.Id,
                Title = "CS101 — Lab safety quiz",
                DueDate = now.AddDays(-5),
                IsCompleted = true,
                Grade = 18,
                TeacherFeedback = "Good awareness of lab protocols.",
                SubjectId = s.OfferingProgramming?.Id,
                OfferingId = s.OfferingProgramming?.Id,
                PeriodId = s.PeriodSpring2026?.Id,
                GradeCategoryId = s.CatLab?.Id,
                Priority = null,
                MaxScore = 20,
                Weight = 1.0m
            },
            new()
            {
                OrganizationId = s.OrgUni.Id,
                AssigneeId = s.DualUser.Id,
                CreatedByUserId = s.UniProf.Id,
                Title = "CS101 — Homework 4 (Graphs)",
                Description = "Implement Dijkstra; submit PDF + code zip.",
                DueDate = now.AddDays(5),
                IsCompleted = false,
                SubjectId = s.OfferingProgramming?.Id,
                OfferingId = s.OfferingProgramming?.Id,
                PeriodId = s.PeriodSpring2026?.Id,
                AssignmentBatchId = s.Cs101BatchId,
                GradeCategoryId = s.CatHomework?.Id,
                MaxScore = 100,
                Weight = 0.50m,
                Priority = null
            },
            new()
            {
                OrganizationId = s.OrgUni.Id,
                AssigneeId = s.DualUser.Id,
                CreatedByUserId = s.UniProf.Id,
                Title = "CS101 — Lab safety quiz",
                DueDate = now.AddDays(-7),
                IsCompleted = true,
                Grade = 19,
                TeacherFeedback = "Excellent lab safety awareness.",
                SubjectId = s.OfferingProgramming?.Id,
                OfferingId = s.OfferingProgramming?.Id,
                PeriodId = s.PeriodSpring2026?.Id,
                GradeCategoryId = s.CatLab?.Id,
                MaxScore = 20,
                Weight = 1.0m,
                Priority = null
            },
            new()
            {
                OrganizationId = s.OrgUni.Id,
                AssigneeId = s.DualUser.Id,
                CreatedByUserId = s.UniProf.Id,
                Title = "CS101 — Midterm exam",
                Description = "In-class written exam — algorithms fundamentals.",
                DueDate = now.AddDays(-14),
                IsCompleted = true,
                Grade = 8,
                TeacherFeedback = "Strong on recursion; review graph proofs.",
                SubjectId = s.OfferingProgramming?.Id,
                OfferingId = s.OfferingProgramming?.Id,
                PeriodId = s.PeriodSpring2026?.Id,
                GradeCategoryId = s.CatExam?.Id,
                MaxScore = 10,
                Weight = 1.0m,
                Priority = null
            },
            new()
            {
                OrganizationId = s.OrgUni.Id,
                AssigneeId = s.DualUser.Id,
                CreatedByUserId = s.UniProf.Id,
                Title = "CS201 — Problem set 2 (Trees)",
                Description = "Balanced BST insert/delete analysis.",
                DueDate = now.AddDays(4),
                IsCompleted = false,
                SubjectId = s.OfferingAlgorithms?.Id,
                OfferingId = s.OfferingAlgorithms?.Id,
                PeriodId = s.PeriodSpring2026?.Id,
                MaxScore = 50,
                Weight = 0.15m,
                Priority = null
            },
            new()
            {
                OrganizationId = s.OrgUni.Id,
                AssigneeId = s.DualUser.Id,
                CreatedByUserId = s.UniProf.Id,
                Title = "Readings — Chapter 7",
                DueDate = now.AddDays(-3),
                IsCompleted = true,
                Grade = 10,
                TeacherFeedback = "Solid notes.",
                SubjectId = s.OfferingProgramming?.Id,
                OfferingId = s.OfferingProgramming?.Id,
                PeriodId = s.PeriodSpring2026?.Id,
                GradeCategoryId = s.CatHomework?.Id,
                MaxScore = 10,
                Weight = 0.10m,
                Priority = null
            },
            new()
            {
                OrganizationId = s.OrgCorp.Id,
                AssigneeId = s.CorpPm.Id,
                CreatedByUserId = s.CorpDirector.Id,
                Title = "Approve FY capital budget",
                DueDate = now.AddDays(2),
                IsCompleted = false,
                Priority = TaskPriority.High,
                ProjectId = null
            },
            new()
            {
                OrganizationId = s.OrgCorp.Id,
                AssigneeId = s.CorpDev.Id,
                CreatedByUserId = s.CorpPm.Id,
                Title = "Patch CVE-2025-12345 in auth service",
                DueDate = now.AddDays(-1),
                IsCompleted = true,
                Priority = TaskPriority.High,
                Description = "Verified in staging; rolled to prod."
            },
            new()
            {
                OrganizationId = s.OrgCorp.Id,
                AssigneeId = s.DualUser.Id,
                CreatedByUserId = s.CorpPm.Id,
                Title = "Onboarding checklist — week 1",
                DueDate = now.AddDays(3),
                IsCompleted = false,
                Priority = TaskPriority.Medium
            }
        };

        await context.Tasks.AddRangeAsync(tasks);
        await context.SaveChangesAsync();
    }

    // -------------------------------------------------------------------------
    // 10. Grades (weighted GPA inputs)
    // -------------------------------------------------------------------------

    private static async Task SeedGradesAsync(ApplicationDbContext context, SeedState s)
    {
        var grades = new List<Grade>
        {
            // Michael
            new()
            {
                OrganizationId = s.OrgUni.Id,
                UserId = s.UniStudent1.Id,
                GroupId = s.CsG1Sub1?.Id,
                CourseName = "CS101 — Intro to Programming",
                Score = 88,
                Credits = 4,
                LetterGrade = "B+",
                Semester = "Spring 2026"
            },
            new()
            {
                OrganizationId = s.OrgUni.Id,
                UserId = s.UniStudent1.Id,
                CourseName = "MATH200 — Calculus II",
                Score = 92,
                Credits = 4,
                LetterGrade = "A-",
                Semester = "Spring 2026"
            },
            new()
            {
                OrganizationId = s.OrgUni.Id,
                UserId = s.UniStudent1.Id,
                CourseName = "ENG150 — Composition",
                Score = 81,
                Credits = 3,
                LetterGrade = "B",
                Semester = "Spring 2026"
            },
            // Emily
            new()
            {
                OrganizationId = s.OrgUni.Id,
                UserId = s.UniStudent2.Id,
                GroupId = s.CsG1Sub1?.Id,
                CourseName = "CS101 — Intro to Programming",
                Score = 94,
                Credits = 4,
                LetterGrade = "A",
                Semester = "Spring 2026"
            },
            new()
            {
                OrganizationId = s.OrgUni.Id,
                UserId = s.UniStudent2.Id,
                CourseName = "PHYS100 — Mechanics",
                Score = 87,
                Credits = 4,
                LetterGrade = "B+",
                Semester = "Spring 2026"
            },
            // Alex (dual) — uni transcript
            new()
            {
                OrganizationId = s.OrgUni.Id,
                UserId = s.DualUser.Id,
                GroupId = s.CsG1Sub1?.Id,
                CourseName = "CS101 — Intro to Programming",
                Score = 90,
                Credits = 4,
                LetterGrade = "A-",
                Semester = "Spring 2026"
            },
            new()
            {
                OrganizationId = s.OrgUni.Id,
                UserId = s.DualUser.Id,
                CourseName = "STAT120 — Statistics",
                Score = 85,
                Credits = 3,
                LetterGrade = "B",
                Semester = "Spring 2026"
            }
        };

        await context.Grades.AddRangeAsync(grades);
        await context.SaveChangesAsync();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static Role CreateRole(Guid orgId, string name, Dictionary<string, AccessLevel> permissions)
    {
        var role = new Role { Name = name, OrganizationId = orgId };
        foreach (var p in permissions)
            role.Permissions.Add(new RolePermission { WidgetKey = p.Key, AccessLevel = p.Value });
        return role;
    }

    /// <summary>Mutable holder for entities created during seed (keeps SeedAsync readable).</summary>
    private sealed partial class SeedState
    {
        public List<User> Users { get; set; } = [];

        public User Admin { get; set; } = null!;
        public User UniProf { get; set; } = null!;
        public User UniDean { get; set; } = null!;
        public User UniStudent1 { get; set; } = null!;
        public User UniStudent2 { get; set; } = null!;
        public User CorpDirector { get; set; } = null!;
        public User CorpPm { get; set; } = null!;
        public User CorpDev { get; set; } = null!;
        public User CorpHr { get; set; } = null!;
        public User DualUser { get; set; } = null!;

        public Organization OrgUni { get; set; } = null!;
        public Organization OrgCorp { get; set; } = null!;

        public Role RUniStudent { get; set; } = null!;
        public Role RUniDemoShowcase { get; set; } = null!;
        public Role RUniProf { get; set; } = null!;
        public Role RUniDean { get; set; } = null!;
        public Role RUniAdmin { get; set; } = null!;
        public Role RUniUnassigned { get; set; } = null!;
        public Role RCorpEmployee { get; set; } = null!;
        public Role RCorpDemoShowcase { get; set; } = null!;
        public Role RCorpPm { get; set; } = null!;
        public Role RCorpDirector { get; set; } = null!;
        public Role RCorpHr { get; set; } = null!;
        public Role RCorpAdmin { get; set; } = null!;
        public Role RCorpUnassigned { get; set; } = null!;
        public Role RSysAdminUni { get; set; } = null!;
        public Role RSysAdminCorp { get; set; } = null!;

        public List<EventType> UniEventTypes { get; set; } = [];
        public List<EventType> CorpEventTypes { get; set; } = [];

        public Building BldUniMain { get; set; } = null!;
        public Building BldUniScience { get; set; } = null!;
        public Building BldCorpHq { get; set; } = null!;

        public Floor FloorMain1 { get; set; } = null!;
        public Floor FloorMain2 { get; set; } = null!;
        public Floor FloorSci1 { get; set; } = null!;
        public Floor FloorHq1 { get; set; } = null!;

        public Room RoomLectureHall { get; set; } = null!;
        public Room RoomSeminar { get; set; } = null!;
        public Room RoomComputerLab { get; set; } = null!;
        public Room RoomBoard { get; set; } = null!;
        public Room RoomHuddle { get; set; } = null!;

        public Group GrpEng { get; set; } = null!;
        public Event EventCs101 { get; set; } = null!;
        public Event? EventCs101Lab { get; set; }
        public Event? EventCs101Seminar { get; set; }
        public Event? EventCs201Lecture { get; set; }
        public Event EventStandup { get; set; } = null!;
    }

    private sealed partial class SeedState
    {
        public OrganizationPeriod? PeriodSpring2026 { get; set; }
        public Group? CsFaculty { get; set; }
        public Group? CsDepartment { get; set; }
        public Group? CsProgram { get; set; }
        public Group? SeProgram { get; set; }
        public Group? CsYear1 { get; set; }
        public Group? SeYear1 { get; set; }
        public Group? CsGroup1 { get; set; }
        public Group? CsGroup2 { get; set; }
        public Group? CsGroup3 { get; set; }
        public Group? CsGroup4 { get; set; }
        public Group? CsG1Sub1 { get; set; }
        public Group? CsG1Sub2 { get; set; }
        public Group? CsG2Sub1 { get; set; }
        public Group? CsG2Sub2 { get; set; }
        public Group? SeGroupA { get; set; }
        public Group? SeGroupB { get; set; }
        public Group? CorpDivision { get; set; }
        public Group? CorpDepartment { get; set; }
        public Group? CorpTeam { get; set; }
        public Group? CorpSquad { get; set; }
        public CourseOffering? OfferingProgramming { get; set; }
        public CourseOffering? OfferingAlgorithms { get; set; }
        public AnnouncementChannel? AnnouncementChannelGeneral { get; set; }
        public AnnouncementChannel? AnnouncementChannelCourse { get; set; }
        public OrganizationPeriod? PeriodCorpQ1 { get; set; }
        public OfferingGradeCategory? CatHomework { get; set; }
        public OfferingGradeCategory? CatExam { get; set; }
        public OfferingGradeCategory? CatLab { get; set; }
        public Guid Cs101BatchId { get; set; }
    }
}
