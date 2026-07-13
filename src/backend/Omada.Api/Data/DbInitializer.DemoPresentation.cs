using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.Infrastructure.Constants;

namespace Omada.Api.Data;

public static partial class DbInitializer
{
    private const string DemoSpiderScheduleUrl =
        "https://www.cs.ubbcluj.ro/files/orar/2025-1/tabelar/index.html";

    private static readonly string[] DemoOnboardingSteps =
    [
        OrganizationOnboardingProgress.StepIds.Widgets,
        OrganizationOnboardingProgress.StepIds.Roles,
        OrganizationOnboardingProgress.StepIds.Branding,
        OrganizationOnboardingProgress.StepIds.Periods,
        OrganizationOnboardingProgress.StepIds.Groups,
        OrganizationOnboardingProgress.StepIds.Floorplan,
        OrganizationOnboardingProgress.StepIds.Spider,
        OrganizationOnboardingProgress.StepIds.Invite,
    ];

    private static string DemoOnboardingJson =>
        OrganizationOnboardingProgress.Serialize(DemoOnboardingSteps) ?? "[]";

    /// <summary>
    /// Grade buckets for CS101 — must run after offerings exist, before <see cref="SeedTasksAsync"/>.
    /// </summary>
    private static async Task SeedDemoGradeCategoriesAsync(ApplicationDbContext context, SeedState s)
    {
        if (s.OfferingProgramming == null)
            return;

        var orgId = s.OrgUni.Id;
        s.CatHomework = new OfferingGradeCategory
        {
            OrganizationId = orgId,
            OfferingId = s.OfferingProgramming.Id,
            Name = "Homework",
            Weight = 0.30m,
            SortOrder = 0,
        };
        s.CatExam = new OfferingGradeCategory
        {
            OrganizationId = orgId,
            OfferingId = s.OfferingProgramming.Id,
            Name = "Midterm exam",
            Weight = 0.40m,
            SortOrder = 1,
        };
        s.CatLab = new OfferingGradeCategory
        {
            OrganizationId = orgId,
            OfferingId = s.OfferingProgramming.Id,
            Name = "Lab work",
            Weight = 0.30m,
            SortOrder = 2,
        };

        await context.OfferingGradeCategories.AddRangeAsync(s.CatHomework, s.CatExam, s.CatLab);
        await context.SaveChangesAsync();
    }

    private static async Task SeedDemoPresentationDataAsync(
        ApplicationDbContext context,
        SeedState s,
        IWebHostEnvironment env,
        DateTime now,
        DateTime scheduleAnchor)
    {
        await SeedDemoFloorplansAsync(context, s);
        await SeedDemoCorporatePeriodAsync(context, s);
        await SeedDemoCorporateDocumentsAsync(context, s, env);
        await SeedDemoWorkTimeEntriesAsync(context, s, now);
        await SeedDemoAttendanceHighlightsAsync(context, s, scheduleAnchor);
        await SeedDemoAnnouncementsExtrasAsync(context, s);
        await SeedDemoRoomBookingsAsync(context, s, scheduleAnchor);
    }

    private static async Task SeedDemoFloorplansAsync(ApplicationDbContext context, SeedState s)
    {
        if (await context.Floorplans.AnyAsync())
            return;

        var uniGeoJson = BuildFloorGeoJson(
            (s.RoomLectureHall.Name, s.RoomLectureHall.CoordinateX ?? 0.32, s.RoomLectureHall.CoordinateY ?? 0.41, 0.10, 0.10),
            (s.RoomSeminar.Name, s.RoomSeminar.CoordinateX ?? 0.55, s.RoomSeminar.CoordinateY ?? 0.38, 0.08, 0.08));

        var corpGeoJson = BuildFloorGeoJson(
            (s.RoomBoard.Name, s.RoomBoard.CoordinateX ?? 0.28, s.RoomBoard.CoordinateY ?? 0.35, 0.10, 0.10),
            (s.RoomHuddle.Name, s.RoomHuddle.CoordinateX ?? 0.72, s.RoomHuddle.CoordinateY ?? 0.60, 0.07, 0.07));

        await context.Floorplans.AddRangeAsync(
            new Floorplan
            {
                FloorId = s.FloorMain1.Id,
                ImageUrl = s.FloorMain1.FloorplanImageUrl ?? "/images/maps/building1_floor1.png",
                GeoJsonData = uniGeoJson,
            },
            new Floorplan
            {
                FloorId = s.FloorHq1.Id,
                ImageUrl = s.FloorHq1.FloorplanImageUrl ?? "/images/maps/building3_floor1.png",
                GeoJsonData = corpGeoJson,
            });
        await context.SaveChangesAsync();
    }

    private static string BuildFloorGeoJson(params (string Name, double Cx, double Cy, double HalfW, double HalfH)[] rooms)
    {
        var features = rooms.Select(r => new Dictionary<string, object?>
        {
            ["type"] = "Feature",
            ["properties"] = new Dictionary<string, object?> { ["name"] = r.Name },
            ["geometry"] = new Dictionary<string, object?>
            {
                ["type"] = "Polygon",
                ["coordinates"] = new[]
                {
                    new[]
                    {
                        new[] { r.Cx - r.HalfW, r.Cy - r.HalfH },
                        new[] { r.Cx + r.HalfW, r.Cy - r.HalfH },
                        new[] { r.Cx + r.HalfW, r.Cy + r.HalfH },
                        new[] { r.Cx - r.HalfW, r.Cy + r.HalfH },
                        new[] { r.Cx - r.HalfW, r.Cy - r.HalfH },
                    },
                },
            },
        }).ToList();

        return JsonSerializer.Serialize(new Dictionary<string, object?>
        {
            ["type"] = "FeatureCollection",
            ["features"] = features,
        });
    }

    private static async Task SeedDemoCorporatePeriodAsync(ApplicationDbContext context, SeedState s)
    {
        if (await context.OrganizationPeriods.AnyAsync(p => p.OrganizationId == s.OrgCorp.Id))
            return;

        s.PeriodCorpQ1 = new OrganizationPeriod
        {
            OrganizationId = s.OrgCorp.Id,
            Name = "H1 2026",
            StartDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate = new DateTime(2026, 9, 30, 0, 0, 0, DateTimeKind.Utc),
            IsCurrent = true,
        };
        await context.OrganizationPeriods.AddAsync(s.PeriodCorpQ1);
        await context.SaveChangesAsync();
    }

    private static async Task SeedDemoCorporateDocumentsAsync(
        ApplicationDbContext context,
        SeedState s,
        IWebHostEnvironment env)
    {
        if (await context.OrganizationDocuments.AnyAsync(d => d.OrganizationId == s.OrgCorp.Id))
            return;

        var orgFolder = s.OrgCorp.Id.ToString("N");
        var storageRoot = Path.Combine(env.ContentRootPath, "storage", "org-documents", orgFolder);
        Directory.CreateDirectory(storageRoot);

        var specs = new[]
        {
            (
                Title: "Q1 Town Hall Slides",
                FileName: "q1-town-hall-slides.txt",
                Category: DocumentCategories.General,
                Description: "All-hands deck referenced in company announcements.",
                Content: "Demo document — Q1 town hall talking points and roadmap highlights."
            ),
            (
                Title: "Remote Work Policy",
                FileName: "remote-work-policy.txt",
                Category: DocumentCategories.Policies,
                Description: "Corporate attendance and hybrid work guidelines.",
                Content: "Demo document — hybrid schedule, core hours, and work-time tracking policy."
            ),
            (
                Title: "Onboarding Checklist — Interns",
                FileName: "intern-onboarding.txt",
                Category: DocumentCategories.Hr,
                Description: "Week-one tasks for new interns.",
                Content: "Demo document — accounts, security training, and squad introductions."
            ),
        };

        var documents = new List<OrganizationDocument>();
        foreach (var spec in specs)
        {
            var bytes = Encoding.UTF8.GetBytes(spec.Content);
            var fullPath = Path.Combine(storageRoot, spec.FileName);
            await File.WriteAllBytesAsync(fullPath, bytes);

            documents.Add(new OrganizationDocument
            {
                OrganizationId = s.OrgCorp.Id,
                UploadedByUserId = s.CorpHr.Id,
                Title = spec.Title,
                OriginalFileName = spec.FileName,
                ContentType = "text/plain",
                ByteSize = bytes.Length,
                StorageRelativePath = $"{orgFolder}/{spec.FileName}",
                Category = spec.Category,
                Description = spec.Description,
            });
        }

        await context.OrganizationDocuments.AddRangeAsync(documents);
        await context.SaveChangesAsync();
    }

    private static async Task SeedDemoWorkTimeEntriesAsync(
        ApplicationDbContext context,
        SeedState s,
        DateTime now)
    {
        if (await context.WorkTimeEntries.AnyAsync(w => w.OrganizationId == s.OrgCorp.Id))
            return;

        var today = now.Date;
        var yesterday = today.AddDays(-1);

        static DateTime AtUtc(DateTime day, int hour, int minute) =>
            DateTime.SpecifyKind(day.AddHours(hour).AddMinutes(minute), DateTimeKind.Utc);

        await context.WorkTimeEntries.AddRangeAsync(
            new WorkTimeEntry
            {
                OrganizationId = s.OrgCorp.Id,
                UserId = s.CorpDev.Id,
                WorkDate = yesterday,
                ClockInUtc = AtUtc(yesterday, 8, 30),
                ClockOutUtc = AtUtc(yesterday, 17, 15),
                BreakMinutes = 45,
            },
            new WorkTimeEntry
            {
                OrganizationId = s.OrgCorp.Id,
                UserId = s.CorpDev.Id,
                WorkDate = today,
                ClockInUtc = AtUtc(today, 9, 5),
                ClockOutUtc = null,
                BreakMinutes = 0,
            },
            new WorkTimeEntry
            {
                OrganizationId = s.OrgCorp.Id,
                UserId = s.DualUser.Id,
                WorkDate = yesterday,
                ClockInUtc = AtUtc(yesterday, 10, 0),
                ClockOutUtc = AtUtc(yesterday, 16, 30),
                BreakMinutes = 30,
            },
            new WorkTimeEntry
            {
                OrganizationId = s.OrgCorp.Id,
                UserId = s.DualUser.Id,
                WorkDate = today,
                ClockInUtc = AtUtc(today, 9, 30),
                ClockOutUtc = null,
                BreakMinutes = 15,
            });
        await context.SaveChangesAsync();
    }

    private static async Task SeedDemoAttendanceHighlightsAsync(
        ApplicationDbContext context,
        SeedState s,
        DateTime scheduleAnchor)
    {
        if (s.EventCs101 == null)
            return;

        var instance = scheduleAnchor.Date.AddDays(-7).Add(s.EventCs101.StartTime.TimeOfDay);
        if (await context.Set<EventAttendance>().AnyAsync(a =>
                a.EventId == s.EventCs101.Id &&
                a.UserId == s.UniStudent1.Id &&
                a.Status == AttendanceStatus.Added))
            return;

        await context.Set<EventAttendance>().AddRangeAsync(
            new EventAttendance
            {
                EventId = s.EventCs101.Id,
                UserId = s.UniStudent1.Id,
                InstanceDate = instance,
                Status = AttendanceStatus.Added,
            },
            new EventAttendance
            {
                EventId = s.EventCs101.Id,
                UserId = s.UniStudent2.Id,
                InstanceDate = instance,
                Status = AttendanceStatus.Added,
            });
        await context.SaveChangesAsync();
    }

    private static async Task SeedDemoAnnouncementsExtrasAsync(ApplicationDbContext context, SeedState s)
    {
        if (s.AnnouncementChannelCourse == null)
            return;

        if (await context.AnnouncementPosts.AnyAsync(p =>
                p.ChannelId == s.AnnouncementChannelCourse.Id &&
                p.Title == "Homework 4 posted"))
            return;

        var coursePost = new AnnouncementPost
        {
            OrganizationId = s.OrgUni.Id,
            ChannelId = s.AnnouncementChannelCourse.Id,
            AuthorId = s.UniProf.Id,
            Title = "Homework 4 posted",
            Content = "Graph algorithms assignment is live in Tasks. Due next week — check the grade breakdown in My grades.",
        };
        await context.AnnouncementPosts.AddAsync(coursePost);
        await context.SaveChangesAsync();

        await context.AnnouncementComments.AddAsync(new AnnouncementComment
        {
            OrganizationId = s.OrgUni.Id,
            PostId = coursePost.Id,
            AuthorId = s.DualUser.Id,
            Content = "Will office hours on Friday cover the Dijkstra proof?",
        });
        await context.SaveChangesAsync();
    }

    private static async Task SeedDemoRoomBookingsAsync(
        ApplicationDbContext context,
        SeedState s,
        DateTime scheduleAnchor)
    {
        if (await context.RoomBookings.AnyAsync(b => b.OrganizationId == s.OrgCorp.Id))
            return;

        var start = scheduleAnchor.Date.AddDays(3).AddHours(15);
        await context.RoomBookings.AddAsync(new RoomBooking
        {
            OrganizationId = s.OrgCorp.Id,
            RoomId = s.RoomHuddle.Id,
            BookedByUserId = s.CorpPm.Id,
            StartUtc = start,
            EndUtc = start.AddHours(1),
            Notes = "Sprint planning — API squad",
        });
        await context.SaveChangesAsync();
    }
}
