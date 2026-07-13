using Omada.Api.DTOs.Offerings;

namespace Omada.Api.Infrastructure;

/// <summary>
/// Merges scraped timetable rows into one activity per event type with optional schedule blocks.
/// Aligns timetable activities with curriculum package activity definitions when available.
/// </summary>
public static class OfferingSessionPlanConsolidation
{
    private sealed record TimetableSlot(
        string EventTypeKey,
        Guid? EventTypeId,
        string? EventTypeName,
        decimal HoursPerSession,
        string Frequency,
        int? BiweeklyPhase,
        bool IsOptional,
        Guid? HostId,
        string? HostName,
        List<Guid> CoInstructorIds,
        string AudienceScope,
        List<Guid> CohortGroupIds,
        string CohortDelivery,
        int DayOfWeek,
        string StartTimeLocal,
        Guid? RoomId,
        string? RoomName);

    public static List<OfferingWeeklySessionDto> ApplyScrapeImport(
        IReadOnlyList<OfferingWeeklySessionDto> existing,
        IReadOnlyList<OfferingWeeklySessionDto> importedFlat,
        IReadOnlyList<OfferingWeeklySessionDto> packageTemplates,
        bool replaceExisting)
    {
        var slots = replaceExisting
            ? ExpandAll(importedFlat)
            : ExpandAll(existing).Concat(ExpandAll(importedFlat)).ToList();

        return BuildSessionsFromSlots(MergeCompatibleCohortSlots(DeduplicateSlots(slots)), packageTemplates);
    }

    private static List<TimetableSlot> ExpandAll(IReadOnlyList<OfferingWeeklySessionDto> sessions)
    {
        var slots = new List<TimetableSlot>();
        foreach (var session in OfferingSessionPlanJson.Normalize(sessions.ToList()))
            slots.AddRange(ExpandSession(session));
        return slots;
    }

    private static IEnumerable<TimetableSlot> ExpandSession(OfferingWeeklySessionDto session)
    {
        var key = EventTypeKey(session.EventTypeId, session.EventTypeName);
        var coIds = session.AssignedInstructorIds?
            .Where(id => id != Guid.Empty && id != session.HostId)
            .Distinct()
            .ToList() ?? new List<Guid>();

        if (session.CohortAssignments is { Count: > 0 })
        {
            foreach (var block in session.CohortAssignments)
            {
                var cohortIds = block.CohortGroupIds?
                    .Where(id => id != Guid.Empty)
                    .Distinct()
                    .ToList() ?? new List<Guid>();

                yield return new TimetableSlot(
                    key,
                    session.EventTypeId,
                    session.EventTypeName,
                    session.HoursPerSession,
                    OfferingSessionPlanJson.NormalizeFrequency(block.Frequency ?? session.Frequency),
                    OfferingSessionPlanJson.NormalizeBiweeklyPhase(
                        block.Frequency ?? session.Frequency,
                        block.BiweeklyPhase ?? session.BiweeklyPhase),
                    session.IsOptional,
                    block.HostId ?? session.HostId,
                    block.HostName ?? session.HostName,
                    coIds,
                    cohortIds.Count > 0 ? "selected" : session.AudienceScope,
                    cohortIds,
                    session.CohortDelivery,
                    OfferingSessionPlanJson.NormalizeDayOfWeek(block.DayOfWeek ?? session.DayOfWeek),
                    OfferingSessionPlanJson.NormalizeStartTimeLocal(block.StartTimeLocal ?? session.StartTimeLocal),
                    block.RoomId ?? session.RoomId,
                    block.RoomName ?? session.RoomName);
            }

            yield break;
        }

        var flatCohorts = session.CohortGroupIds?
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList() ?? new List<Guid>();

        yield return new TimetableSlot(
            key,
            session.EventTypeId,
            session.EventTypeName,
            session.HoursPerSession,
            session.Frequency,
            session.BiweeklyPhase,
            session.IsOptional,
            session.HostId,
            session.HostName,
            coIds,
            flatCohorts.Count > 0 ? "selected" : session.AudienceScope,
            flatCohorts,
            session.CohortDelivery,
            OfferingSessionPlanJson.NormalizeDayOfWeek(session.DayOfWeek),
            OfferingSessionPlanJson.NormalizeStartTimeLocal(session.StartTimeLocal),
            session.RoomId,
            session.RoomName);
    }

    private static List<TimetableSlot> DeduplicateSlots(IReadOnlyList<TimetableSlot> slots)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var result = new List<TimetableSlot>();

        foreach (var slot in slots)
        {
            var cohortKey = string.Join(",", slot.CohortGroupIds.OrderBy(id => id));
            var fingerprint =
                $"{slot.EventTypeKey}|{slot.DayOfWeek}|{slot.StartTimeLocal}|{slot.Frequency}|{slot.BiweeklyPhase}|{cohortKey}|{slot.HostId}|{slot.RoomId}";
            if (!seen.Add(fingerprint))
                continue;

            result.Add(slot);
        }

        return result;
    }

    /// <summary>
    /// When multiple groups share the same activity, instructor, room, day, time, and frequency,
    /// keep one slot with combined cohort delivery (one schedule event at publish).
    /// </summary>
    private static List<TimetableSlot> MergeCompatibleCohortSlots(IReadOnlyList<TimetableSlot> slots)
    {
        var result = new List<TimetableSlot>();

        foreach (var group in slots.GroupBy(ScheduleFingerprint, StringComparer.Ordinal))
        {
            var list = group.ToList();
            var first = list[0];
            var cohorts = list.SelectMany(s => s.CohortGroupIds).Where(id => id != Guid.Empty).Distinct().ToList();
            var audience = list.Any(s => s.AudienceScope == "selected") || cohorts.Count > 0
                ? "selected"
                : first.AudienceScope;

            result.Add(new TimetableSlot(
                first.EventTypeKey,
                first.EventTypeId,
                first.EventTypeName,
                list.Max(s => s.HoursPerSession),
                first.Frequency,
                first.BiweeklyPhase,
                first.IsOptional,
                first.HostId,
                first.HostName,
                first.CoInstructorIds,
                audience,
                cohorts,
                cohorts.Count > 1 ? "combined" : first.CohortDelivery,
                first.DayOfWeek,
                first.StartTimeLocal,
                first.RoomId,
                first.RoomName));
        }

        return result;
    }

    private static string ScheduleFingerprint(TimetableSlot slot) =>
        $"{slot.EventTypeKey}|{slot.DayOfWeek}|{slot.StartTimeLocal}|{slot.Frequency}|{slot.BiweeklyPhase}|{slot.HostId}|{slot.RoomId}|{NormalizeName(slot.HostName)}";

    private static List<OfferingWeeklySessionDto> BuildSessionsFromSlots(
        IReadOnlyList<TimetableSlot> slots,
        IReadOnlyList<OfferingWeeklySessionDto> packageTemplates)
    {
        var templates = OfferingSessionPlanJson.NormalizePackageActivities(packageTemplates.ToList());
        var remaining = slots.ToList();
        var result = new List<OfferingWeeklySessionDto>();
        var sort = 0;

        foreach (var template in templates.OrderBy(t => t.SortOrder))
        {
            var matching = remaining.Where(s => MatchesTemplate(s, template)).ToList();
            foreach (var match in matching)
                remaining.Remove(match);

            if (matching.Count > 0)
                result.Add(BuildSession(matching, template, sort++));
            else
                result.Add(ClonePackageActivity(template, sort++));
        }

        foreach (var group in remaining.GroupBy(s => EventTypeKey(s.EventTypeId, s.EventTypeName), StringComparer.Ordinal))
            result.Add(BuildSession(group.ToList(), template: null, sort++));

        return OfferingSessionPlanJson.Normalize(result);
    }

    private static bool MatchesTemplate(TimetableSlot slot, OfferingWeeklySessionDto template)
    {
        if (template.EventTypeId is { } templateId
            && templateId != Guid.Empty
            && slot.EventTypeId is { } slotId
            && slotId != Guid.Empty
            && templateId == slotId)
        {
            return true;
        }

        var slotName = NormalizeName(slot.EventTypeName);
        var templateName = NormalizeName(template.EventTypeName);
        return !string.IsNullOrEmpty(slotName)
               && !string.IsNullOrEmpty(templateName)
               && slotName == templateName;
    }

    private static OfferingWeeklySessionDto ClonePackageActivity(OfferingWeeklySessionDto template, int sortOrder) =>
        new()
        {
            EventTypeId = template.EventTypeId,
            EventTypeName = template.EventTypeName,
            HoursPerSession = template.HoursPerSession,
            Frequency = template.Frequency,
            IsOptional = template.IsOptional,
            SortOrder = sortOrder,
            RequiredAttendancePercent = template.RequiredAttendancePercent,
            AssignedInstructorIds = template.AssignedInstructorIds?
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList(),
            AudienceScope = "all",
            CohortDelivery = "split",
        };

    private static OfferingWeeklySessionDto BuildSession(
        IReadOnlyList<TimetableSlot> slots,
        OfferingWeeklySessionDto? template,
        int sortOrder)
    {
        var first = slots[0];
        var slotDriven = slots.Any(s => !string.IsNullOrWhiteSpace(s.StartTimeLocal));
        var scrapedHours = slots.Max(s => s.HoursPerSession);

        var hours = slotDriven && scrapedHours > 0
            ? scrapedHours
            : template?.HoursPerSession > 0
                ? template.HoursPerSession
                : scrapedHours;

        var frequency = ResolveUnifiedFrequency(slots, template, slotDriven, first);
        var biweeklyPhase = ResolveUnifiedBiweeklyPhase(slots, template, slotDriven, first);

        var assigned = new HashSet<Guid>();
        if (template?.AssignedInstructorIds != null)
        {
            foreach (var id in template.AssignedInstructorIds.Where(id => id != Guid.Empty))
                assigned.Add(id);
        }

        foreach (var slot in slots)
        {
            if (slot.HostId is { } hostId && hostId != Guid.Empty)
                assigned.Add(hostId);
            foreach (var co in slot.CoInstructorIds)
                assigned.Add(co);
        }

        var hasSelectedAudience = slots.Any(s =>
            s.AudienceScope == "selected" && s.CohortGroupIds.Count > 0);

        if (slots.Count == 1 && !hasSelectedAudience)
        {
            var slot = slots[0];
            return new OfferingWeeklySessionDto
            {
                EventTypeId = slot.EventTypeId ?? template?.EventTypeId,
                EventTypeName = slot.EventTypeName ?? template?.EventTypeName,
                HoursPerSession = hours,
                Frequency = frequency,
                BiweeklyPhase = biweeklyPhase,
                IsOptional = template?.IsOptional ?? slot.IsOptional,
                SortOrder = sortOrder,
                DayOfWeek = slot.DayOfWeek,
                StartTimeLocal = slot.StartTimeLocal,
                HostId = slot.HostId,
                HostName = slot.HostName,
                RoomId = slot.RoomId,
                RoomName = slot.RoomName,
                RequiredAttendancePercent = template?.RequiredAttendancePercent,
                AssignedInstructorIds = assigned.Count > 0 ? assigned.ToList() : null,
                AudienceScope = "all",
                CohortDelivery = "split",
            };
        }

        if (slots.Count == 1 && hasSelectedAudience)
        {
            var slot = slots[0];
            return new OfferingWeeklySessionDto
            {
                EventTypeId = slot.EventTypeId ?? template?.EventTypeId,
                EventTypeName = slot.EventTypeName ?? template?.EventTypeName,
                HoursPerSession = hours,
                Frequency = frequency,
                BiweeklyPhase = biweeklyPhase,
                IsOptional = template?.IsOptional ?? slot.IsOptional,
                SortOrder = sortOrder,
                DayOfWeek = slot.DayOfWeek,
                StartTimeLocal = slot.StartTimeLocal,
                HostId = slot.HostId,
                HostName = slot.HostName,
                RoomId = slot.RoomId,
                RoomName = slot.RoomName,
                RequiredAttendancePercent = template?.RequiredAttendancePercent,
                AssignedInstructorIds = assigned.Count > 0 ? assigned.ToList() : null,
                AudienceScope = "selected",
                CohortGroupIds = slot.CohortGroupIds,
                CohortDelivery = slot.CohortGroupIds.Count > 1 ? "combined" : slot.CohortDelivery,
            };
        }

        var blocks = MergeCompatibleCohortBlocks(slots.Select(slot => new OfferingSessionCohortAssignmentDto
        {
            HostId = slot.HostId,
            HostName = slot.HostName,
            CohortGroupIds = slot.CohortGroupIds,
            DayOfWeek = slot.DayOfWeek,
            StartTimeLocal = slot.StartTimeLocal,
            RoomId = slot.RoomId,
            RoomName = slot.RoomName,
            Frequency = OfferingSessionPlanJson.NormalizeFrequency(slot.Frequency),
            BiweeklyPhase = OfferingSessionPlanJson.NormalizeBiweeklyPhase(slot.Frequency, slot.BiweeklyPhase),
        }).ToList());

        var unionCohorts = blocks
            .SelectMany(b => b.CohortGroupIds ?? [])
            .Distinct()
            .ToList();

        return new OfferingWeeklySessionDto
        {
            EventTypeId = first.EventTypeId ?? template?.EventTypeId,
            EventTypeName = first.EventTypeName ?? template?.EventTypeName,
            HoursPerSession = hours,
            Frequency = frequency,
            BiweeklyPhase = biweeklyPhase,
            IsOptional = template?.IsOptional ?? first.IsOptional,
            SortOrder = sortOrder,
            HostId = first.HostId,
            HostName = first.HostName,
            RequiredAttendancePercent = template?.RequiredAttendancePercent,
            AssignedInstructorIds = assigned.Count > 0 ? assigned.ToList() : null,
            AudienceScope = hasSelectedAudience ? "selected" : "all",
            CohortGroupIds = unionCohorts.Count > 0 ? unionCohorts : null,
            CohortDelivery = blocks.Count == 1 && unionCohorts.Count > 1 ? "combined" : "split",
            CohortAssignments = blocks.Count > 1 ? blocks : null,
        };
    }

    private static List<OfferingSessionCohortAssignmentDto> MergeCompatibleCohortBlocks(
        IEnumerable<OfferingSessionCohortAssignmentDto> blocks)
    {
        return blocks
            .GroupBy(b =>
                $"{b.DayOfWeek}|{b.StartTimeLocal}|{b.Frequency}|{b.BiweeklyPhase}|{b.HostId}|{b.RoomId}|{b.HostName ?? ""}",
                StringComparer.Ordinal)
            .Select(g =>
            {
                var first = g.First();
                var cohortIds = g.SelectMany(b => b.CohortGroupIds ?? []).Where(id => id != Guid.Empty).Distinct().ToList();
                return new OfferingSessionCohortAssignmentDto
                {
                    HostId = first.HostId,
                    HostName = first.HostName,
                    CohortGroupIds = cohortIds,
                    DayOfWeek = first.DayOfWeek,
                    StartTimeLocal = first.StartTimeLocal,
                    RoomId = first.RoomId,
                    RoomName = first.RoomName,
                    Frequency = first.Frequency,
                    BiweeklyPhase = first.BiweeklyPhase,
                };
            })
            .ToList();
    }

    private static string ResolveUnifiedFrequency(
        IReadOnlyList<TimetableSlot> slots,
        OfferingWeeklySessionDto? template,
        bool slotDriven,
        TimetableSlot first)
    {
        if (!slotDriven)
        {
            return !string.IsNullOrWhiteSpace(template?.Frequency)
                ? template.Frequency
                : first.Frequency;
        }

        var normalized = slots
            .Select(s => OfferingSessionPlanJson.NormalizeFrequency(s.Frequency))
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (normalized.Count == 1)
            return normalized[0];

        return normalized.Contains("biweekly", StringComparer.Ordinal) ? "biweekly" : first.Frequency;
    }

    private static int? ResolveUnifiedBiweeklyPhase(
        IReadOnlyList<TimetableSlot> slots,
        OfferingWeeklySessionDto? template,
        bool slotDriven,
        TimetableSlot first)
    {
        if (!slotDriven)
            return template?.BiweeklyPhase ?? first.BiweeklyPhase;

        var phases = slots
            .Select(s => OfferingSessionPlanJson.NormalizeBiweeklyPhase(
                OfferingSessionPlanJson.NormalizeFrequency(s.Frequency),
                s.BiweeklyPhase))
            .Where(p => p.HasValue)
            .Select(p => p!.Value)
            .Distinct()
            .ToList();

        return phases.Count == 1 ? phases[0] : null;
    }

    private static string EventTypeKey(Guid? eventTypeId, string? eventTypeName)
    {
        if (eventTypeId is { } id && id != Guid.Empty)
            return $"id:{id:D}";

        var name = NormalizeName(eventTypeName);
        return string.IsNullOrEmpty(name) ? "unknown" : $"name:{name}";
    }

    private static string NormalizeName(string? value) =>
        string.Join(' ', (value ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries))
            .Trim()
            .ToLowerInvariant();
}
