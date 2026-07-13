using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Omada.Api.DTOs.Offerings;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Constants;

namespace Omada.Api.Data;

public static partial class DbInitializer
{
    private static async Task SeedUniversityCurriculumAsync(
        ApplicationDbContext context,
        SeedState s,
        DateTime scheduleAnchor)
    {
        if (s.CsProgram == null || s.PeriodSpring2026 == null)
            return;

        var orgId = s.OrgUni.Id;
        var lectureType = s.UniEventTypes.First(t => t.Name == "Lecture");
        var seminarType = s.UniEventTypes.First(t => t.Name == "Seminar");
        var labType = s.UniEventTypes.First(t => t.Name == "Office Hours");

        var package = new CourseOfferingPackage
        {
            OrganizationId = orgId,
            Name = "CS Year 1 — Spring core",
            Description = "Demo curriculum package for BSc Computer Science year 1.",
        };
        await context.CourseOfferingPackages.AddAsync(package);
        await context.SaveChangesAsync();

        await context.CourseOfferingPackagePrograms.AddAsync(new CourseOfferingPackageProgram
        {
            OrganizationId = orgId,
            PackageId = package.Id,
            ProgramGroupId = s.CsProgram.Id,
        });

        var weeklyProgramming = OfferingSessionPlanJson.Serialize(new List<OfferingWeeklySessionDto>
        {
            new()
            {
                EventTypeId = lectureType.Id,
                EventTypeName = lectureType.Name,
                HoursPerSession = 2,
                Frequency = "weekly",
                DayOfWeek = 1,
                StartTimeLocal = "08:00",
                HostId = s.UniProf.Id,
                RoomId = s.RoomLectureHall.Id,
                AudienceScope = "all",
                SortOrder = 0,
            },
            new()
            {
                EventTypeId = seminarType.Id,
                EventTypeName = seminarType.Name,
                HoursPerSession = 1.5m,
                Frequency = "weekly",
                DayOfWeek = 3,
                StartTimeLocal = "10:00",
                HostId = s.UniProf.Id,
                RoomId = s.RoomSeminar.Id,
                AudienceScope = "selected",
                CohortGroupIds = [s.CsG1Sub1!.Id, s.CsG1Sub2!.Id, s.CsG2Sub1!.Id, s.CsG2Sub2!.Id],
                SortOrder = 1,
            },
            new()
            {
                EventTypeId = labType.Id,
                EventTypeName = "Lab",
                HoursPerSession = 2,
                Frequency = "weekly",
                DayOfWeek = 5,
                StartTimeLocal = "14:00",
                HostName = "Dr. Elena Popescu (pending invite)",
                RoomId = s.RoomComputerLab.Id,
                AudienceScope = "all",
                SortOrder = 2,
            },
        });

        var weeklyAlgorithms = OfferingSessionPlanJson.Serialize(new List<OfferingWeeklySessionDto>
        {
            new()
            {
                EventTypeId = lectureType.Id,
                EventTypeName = lectureType.Name,
                HoursPerSession = 2,
                Frequency = "weekly",
                DayOfWeek = 2,
                StartTimeLocal = "09:00",
                HostId = s.UniProf.Id,
                RoomId = s.RoomLectureHall.Id,
                AudienceScope = "all",
                SortOrder = 0,
            },
        });

        var packageItems = new[]
        {
            new CourseOfferingPackageItem
            {
                OrganizationId = orgId,
                PackageId = package.Id,
                Name = "Introduction to Programming",
                Code = "CS101",
                SortOrder = 0,
                DefaultHostId = s.UniProf.Id,
                WeeklySessionPlanJson = weeklyProgramming,
            },
            new CourseOfferingPackageItem
            {
                OrganizationId = orgId,
                PackageId = package.Id,
                Name = "Algorithms & Data Structures",
                Code = "CS201",
                SortOrder = 1,
                DefaultHostId = s.UniProf.Id,
                WeeklySessionPlanJson = weeklyAlgorithms,
            },
        };
        await context.CourseOfferingPackageItems.AddRangeAsync(packageItems);
        await context.SaveChangesAsync();

        s.OfferingProgramming = new CourseOffering
        {
            OrganizationId = orgId,
            PeriodId = s.PeriodSpring2026.Id,
            ProgramGroupId = s.CsProgram.Id,
            Name = "Introduction to Programming",
            Code = "CS101",
            Description = "Foundations of programming with weekly lecture, seminar, and lab.",
            Credits = 6,
            RequiredAttendancePercent = 75,
            HostId = s.UniProf.Id,
            WeeklySessionPlanJson = weeklyProgramming,
            TimetablePublishedAt = DateTime.UtcNow,
        };

        s.OfferingAlgorithms = new CourseOffering
        {
            OrganizationId = orgId,
            PeriodId = s.PeriodSpring2026.Id,
            ProgramGroupId = s.CsProgram.Id,
            Name = "Algorithms & Data Structures",
            Code = "CS201",
            Credits = 5,
            RequiredAttendancePercent = 70,
            HostId = s.UniProf.Id,
            WeeklySessionPlanJson = weeklyAlgorithms,
            TimetablePublishedAt = DateTime.UtcNow,
        };

        await context.CourseOfferings.AddRangeAsync(s.OfferingProgramming, s.OfferingAlgorithms);
        await context.SaveChangesAsync();

        foreach (var offering in new[] { s.OfferingProgramming, s.OfferingAlgorithms })
        {
            await context.CourseOfferingPrograms.AddAsync(new CourseOfferingProgram
            {
                OrganizationId = orgId,
                OfferingId = offering!.Id,
                ProgramGroupId = s.CsProgram!.Id,
            });
            await context.OfferingInstructors.AddAsync(new OfferingInstructor
            {
                OrganizationId = orgId,
                OfferingId = offering.Id,
                UserId = s.UniProf.Id,
                Role = OfferingInstructorRoles.Primary,
            });
        }

        var enrollments = new List<OfferingEnrollment>
        {
            Enroll(orgId, s.OfferingProgramming!.Id, s.UniStudent1.Id, s.CsG1Sub1!.Id),
            Enroll(orgId, s.OfferingProgramming.Id, s.UniStudent2.Id, s.CsG1Sub2!.Id),
            Enroll(orgId, s.OfferingProgramming.Id, s.DualUser.Id, s.CsG1Sub1.Id),
            Enroll(orgId, s.OfferingAlgorithms!.Id, s.UniStudent1.Id, s.CsG1Sub1.Id),
            Enroll(orgId, s.OfferingAlgorithms.Id, s.UniStudent2.Id, s.CsG1Sub2.Id),
            Enroll(orgId, s.OfferingAlgorithms.Id, s.DualUser.Id, s.CsG1Sub1.Id),
        };
        await context.OfferingEnrollments.AddRangeAsync(enrollments);
        await context.SaveChangesAsync();

        var until = s.PeriodSpring2026.EndDate.ToString("yyyyMMdd'T'235959'Z'");
        var weeklyRule = $"FREQ=WEEKLY;INTERVAL=1;UNTIL={until}";

        var lectureStart = scheduleAnchor.Date.AddHours(8);
        s.EventCs101 = new Event
        {
            Title = "Introduction to Programming — Lecture",
            Description = "CS101",
            StartTime = lectureStart,
            EndTime = lectureStart.AddHours(2),
            OrganizationId = orgId,
            EventTypeId = lectureType.Id,
            RoomId = s.RoomLectureHall.Id,
            HostId = s.UniProf.Id,
            PeriodId = s.PeriodSpring2026.Id,
            OfferingId = s.OfferingProgramming.Id,
            RecurrenceRule = weeklyRule,
            IsPublic = false,
        };

        var seminarStart = scheduleAnchor.Date.AddDays(2).AddHours(10);
        var seminarEvent = new Event
        {
            Title = "Introduction to Programming — Seminar (Group 1/1)",
            Description = "CS101",
            StartTime = seminarStart,
            EndTime = seminarStart.AddHours(1.5),
            OrganizationId = orgId,
            EventTypeId = seminarType.Id,
            RoomId = s.RoomSeminar.Id,
            HostId = s.UniProf.Id,
            PeriodId = s.PeriodSpring2026.Id,
            OfferingId = s.OfferingProgramming.Id,
            CohortGroupId = s.CsG1Sub1.Id,
            RecurrenceRule = weeklyRule,
            IsPublic = false,
        };

        var labStart = scheduleAnchor.Date.AddDays(4).AddHours(14);
        var labEvent = new Event
        {
            Title = "Introduction to Programming — Lab",
            Description = "CS101",
            StartTime = labStart,
            EndTime = labStart.AddHours(2),
            OrganizationId = orgId,
            EventTypeId = labType.Id,
            RoomId = s.RoomComputerLab.Id,
            HostDisplayName = "Dr. Elena Popescu (pending invite)",
            PeriodId = s.PeriodSpring2026.Id,
            OfferingId = s.OfferingProgramming.Id,
            RecurrenceRule = weeklyRule,
            IsPublic = false,
        };

        var algoStart = scheduleAnchor.Date.AddDays(1).AddHours(9);
        var algoEvent = new Event
        {
            Title = "Algorithms & Data Structures — Lecture",
            Description = "CS201",
            StartTime = algoStart,
            EndTime = algoStart.AddHours(2),
            OrganizationId = orgId,
            EventTypeId = lectureType.Id,
            RoomId = s.RoomLectureHall.Id,
            HostId = s.UniProf.Id,
            PeriodId = s.PeriodSpring2026.Id,
            OfferingId = s.OfferingAlgorithms.Id,
            RecurrenceRule = weeklyRule,
            IsPublic = false,
        };

        await context.Events.AddRangeAsync(s.EventCs101, seminarEvent, labEvent, algoEvent);
        await context.SaveChangesAsync();

        s.EventCs101Lab = labEvent;
        s.EventCs101Seminar = seminarEvent;
        s.EventCs201Lecture = algoEvent;

        s.OfferingProgramming.TimetablePublishedEventIdsJson = JsonSerializer.Serialize(new[]
        {
            s.EventCs101.Id,
            seminarEvent.Id,
            labEvent.Id,
        });
        s.OfferingAlgorithms!.TimetablePublishedEventIdsJson = JsonSerializer.Serialize(new[] { algoEvent.Id });
        context.CourseOfferings.UpdateRange(s.OfferingProgramming, s.OfferingAlgorithms);
        await context.SaveChangesAsync();

        var channelGeneral = new AnnouncementChannel
        {
            OrganizationId = orgId,
            Kind = AnnouncementChannelKind.General,
            DisplayName = "Campus announcements",
        };
        var channelCsProgram = new AnnouncementChannel
        {
            OrganizationId = orgId,
            Kind = AnnouncementChannelKind.Group,
            GroupId = s.CsProgram.Id,
            DisplayName = "Computer Science program",
        };
        var channelCourse = new AnnouncementChannel
        {
            OrganizationId = orgId,
            Kind = AnnouncementChannelKind.CourseOffering,
            CourseOfferingId = s.OfferingProgramming.Id,
            DisplayName = "CS101 — Introduction to Programming",
        };
        await context.AnnouncementChannels.AddRangeAsync(channelGeneral, channelCsProgram, channelCourse);
        await context.SaveChangesAsync();

        s.AnnouncementChannelGeneral = channelGeneral;
        s.AnnouncementChannelCourse = channelCourse;
    }

    private static OfferingEnrollment Enroll(Guid orgId, Guid offeringId, Guid userId, Guid cohortGroupId) =>
        new()
        {
            OrganizationId = orgId,
            OfferingId = offeringId,
            UserId = userId,
            CohortGroupId = cohortGroupId,
        };

    private static async Task SeedAnnouncementsDemoAsync(ApplicationDbContext context, SeedState s)
    {
        if (s.AnnouncementChannelGeneral == null)
            return;

        await context.AnnouncementPosts.AddRangeAsync(
            new AnnouncementPost
            {
                OrganizationId = s.OrgUni.Id,
                ChannelId = s.AnnouncementChannelGeneral.Id,
                AuthorId = s.UniDean.Id,
                Title = "Spring term welcome",
                Content = "Welcome to Spring–Summer 2026. Check Schedule for your published timetables and Attendance for course standing.",
            },
            new AnnouncementPost
            {
                OrganizationId = s.OrgUni.Id,
                ChannelId = s.AnnouncementChannelGeneral.Id,
                AuthorId = s.UniProf.Id,
                Title = "CS101 lab hosts",
                Content = "Some lab sessions show a pending instructor name until the guest account is linked by email invite.",
            },
            new AnnouncementPost
            {
                OrganizationId = s.OrgCorp.Id,
                ChannelId = (await context.AnnouncementChannels.FirstAsync(c =>
                    c.OrganizationId == s.OrgCorp.Id && c.Kind == AnnouncementChannelKind.General)).Id,
                AuthorId = s.CorpDirector.Id,
                Title = "Q1 town hall recap",
                Content = "Recording and slides are in Documents. Platform standups continue daily in Schedule.",
            });
        await context.SaveChangesAsync();
    }

    private static async Task SeedGroupsAndMembersAsync(ApplicationDbContext context, SeedState s)
    {
        await SeedUniversityGroupTreeAsync(context, s);
        await SeedCorporateGroupTreeAsync(context, s);
    }

    private static async Task SeedUniversityGroupTreeAsync(ApplicationDbContext context, SeedState s)
    {
        var orgId = s.OrgUni.Id;

        s.PeriodSpring2026 = new OrganizationPeriod
        {
            OrganizationId = orgId,
            Name = "Spring–Summer 2026",
            StartDate = new DateTime(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2026, 9, 30, 0, 0, 0, DateTimeKind.Utc),
            IsCurrent = true,
        };
        await context.OrganizationPeriods.AddAsync(s.PeriodSpring2026);
        await context.SaveChangesAsync();

        static Group Node(string name, string type, Guid org, Guid? parent = null, Guid? manager = null, string? year = null) =>
            new()
            {
                Name = name,
                Type = type,
                OrganizationId = org,
                ParentGroupId = parent,
                ManagerId = manager,
                AcademicYear = year,
            };

        s.CsFaculty = Node("Faculty of Computer Science", GroupTypes.Faculty, orgId, manager: s.UniDean.Id);
        await context.Groups.AddAsync(s.CsFaculty);
        await context.SaveChangesAsync();

        s.CsDepartment = Node("Department of Computer Science", GroupTypes.Department, orgId, s.CsFaculty.Id, s.UniDean.Id);
        await context.Groups.AddAsync(s.CsDepartment);
        await context.SaveChangesAsync();

        s.CsProgram = Node("BSc Computer Science", GroupTypes.Program, orgId, s.CsDepartment.Id, s.UniProf.Id);
        s.SeProgram = Node("BSc Software Engineering", GroupTypes.Program, orgId, s.CsDepartment.Id, s.UniDean.Id);
        await context.Groups.AddRangeAsync(s.CsProgram, s.SeProgram);
        await context.SaveChangesAsync();

        s.CsYear1 = Node("Year 1", GroupTypes.Series, orgId, s.CsProgram.Id, year: "1");
        s.SeYear1 = Node("Year 1", GroupTypes.Series, orgId, s.SeProgram.Id, year: "1");
        await context.Groups.AddRangeAsync(s.CsYear1, s.SeYear1);
        await context.SaveChangesAsync();

        s.CsGroup1 = Node("Group 1", GroupTypes.Group, orgId, s.CsYear1.Id);
        s.CsGroup2 = Node("Group 2", GroupTypes.Group, orgId, s.CsYear1.Id);
        s.CsGroup3 = Node("Group 3", GroupTypes.Group, orgId, s.CsYear1.Id);
        s.CsGroup4 = Node("Group 4", GroupTypes.Group, orgId, s.CsYear1.Id);
        s.SeGroupA = Node("Group A", GroupTypes.Group, orgId, s.SeYear1.Id);
        s.SeGroupB = Node("Group B", GroupTypes.Group, orgId, s.SeYear1.Id);
        await context.Groups.AddRangeAsync(s.CsGroup1, s.CsGroup2, s.CsGroup3, s.CsGroup4, s.SeGroupA, s.SeGroupB);
        await context.SaveChangesAsync();

        s.CsG1Sub1 = Node("Group 1/1", GroupTypes.Subgroup, orgId, s.CsGroup1.Id);
        s.CsG1Sub2 = Node("Group 1/2", GroupTypes.Subgroup, orgId, s.CsGroup1.Id);
        s.CsG2Sub1 = Node("Group 2/1", GroupTypes.Subgroup, orgId, s.CsGroup2.Id);
        s.CsG2Sub2 = Node("Group 2/2", GroupTypes.Subgroup, orgId, s.CsGroup2.Id);
        await context.Groups.AddRangeAsync(s.CsG1Sub1, s.CsG1Sub2, s.CsG2Sub1, s.CsG2Sub2);
        await context.SaveChangesAsync();

        var members = new List<GroupMember>
        {
            new() { GroupId = s.CsG1Sub1.Id, UserId = s.UniStudent1.Id, RoleInGroup = "Student" },
            new() { GroupId = s.CsG1Sub2.Id, UserId = s.UniStudent2.Id, RoleInGroup = "Student" },
            new() { GroupId = s.CsG1Sub1.Id, UserId = s.DualUser.Id, RoleInGroup = "Student" },
            new() { GroupId = s.CsG2Sub2.Id, UserId = s.UniProf.Id, RoleInGroup = "Teaching assistant" },
            new() { GroupId = s.CsGroup3.Id, UserId = s.UniDean.Id, RoleInGroup = "Observer" },
        };
        await context.GroupMembers.AddRangeAsync(members);
        await context.SaveChangesAsync();
    }

    private static async Task SeedCorporateGroupTreeAsync(ApplicationDbContext context, SeedState s)
    {
        var orgId = s.OrgCorp.Id;

        static Group Node(string name, string type, Guid org, Guid? parent = null, Guid? manager = null) =>
            new() { Name = name, Type = type, OrganizationId = org, ParentGroupId = parent, ManagerId = manager };

        s.CorpDivision = Node("Engineering Division", GroupTypes.Division, orgId, manager: s.CorpDirector.Id);
        await context.Groups.AddAsync(s.CorpDivision);
        await context.SaveChangesAsync();

        s.CorpDepartment = Node("Platform Engineering", GroupTypes.Department, orgId, s.CorpDivision.Id, s.CorpDirector.Id);
        await context.Groups.AddAsync(s.CorpDepartment);
        await context.SaveChangesAsync();

        s.CorpTeam = Node("Product Platform Team", GroupTypes.Team, orgId, s.CorpDepartment.Id, s.CorpPm.Id);
        await context.Groups.AddAsync(s.CorpTeam);
        await context.SaveChangesAsync();

        s.CorpSquad = Node("API Squad", GroupTypes.Squad, orgId, s.CorpTeam.Id, s.CorpPm.Id);
        await context.Groups.AddAsync(s.CorpSquad);
        await context.SaveChangesAsync();

        s.GrpEng = s.CorpSquad;

        await context.GroupMembers.AddRangeAsync(
            new GroupMember { GroupId = s.CorpSquad.Id, UserId = s.CorpDev.Id, RoleInGroup = "Developer" },
            new GroupMember { GroupId = s.CorpSquad.Id, UserId = s.CorpPm.Id, RoleInGroup = "Engineering Manager" },
            new GroupMember { GroupId = s.CorpSquad.Id, UserId = s.DualUser.Id, RoleInGroup = "Intern" });
        await context.SaveChangesAsync();

        var corpChannel = new AnnouncementChannel
        {
            OrganizationId = orgId,
            Kind = AnnouncementChannelKind.General,
            DisplayName = "Company announcements",
        };
        await context.AnnouncementChannels.AddAsync(corpChannel);
        await context.SaveChangesAsync();
    }
}
