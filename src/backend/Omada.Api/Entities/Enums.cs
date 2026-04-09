namespace Omada.Api.Entities;

public enum AccessLevel : byte { View = 0, Edit = 1, Admin = 2 }

/// <summary>Corporate task urgency (see tasks roadmap).</summary>
public enum TaskPriority : byte
{
    Low = 0,
    Medium = 1,
    High = 2
}
// public enum EventType : byte { Class = 0, Meeting = 1, Exam = 2, Other = 3 }
public enum EntityType : byte { User = 0, Group = 1, Room = 2 }
public enum EventRole : byte { Attendee = 0, Organizer = 1 }

public enum OrganizationType : byte
{
    University = 0,
    Corporate = 1
}

public enum AttendanceStatus : byte
{
    /// <summary>Unset / no row semantics (not persisted as default for existing rows).</summary>
    None = 0,
    Added = 1,
    Declined = 2,
    /// <summary>Enrolled or roster expectation (e.g. university timetable).</summary>
    Expected = 3,
    /// <summary>Corporate RSVP: maybe.</summary>
    Tentative = 4,
    /// <summary>Corporate RSVP: accepted.</summary>
    Accepted = 5
}
public enum NewsType
{
    Announcement,
    Alert,
    Event,
    Info
}

/// <summary>Indoor map / floor plan points of interest.</summary>
public enum PinType : byte
{
    Room = 0,
    Restroom = 1,
    Elevator = 2,
    Exit = 3
}

/// <summary>
/// NLP triage (e.g. Gemini) for scraped or manual news; distinct from <see cref="NewsType"/>.
/// Values 0–3 are stable for existing DB rows; new values extend org-wide (university + corporate).
/// </summary>
public enum NewsCategory
{
    /// <summary>Default / miscellaneous.</summary>
    General = 0,
    /// <summary>Teaching, curricula, exams, grades, faculty (university); learning programs where applicable.</summary>
    Academic = 1,
    /// <summary>Time-sensitive: outages, emergencies, critical deadlines (both).</summary>
    Urgent = 2,
    /// <summary>Buildings, rooms, maintenance, workplace IT, campus or office infrastructure (both).</summary>
    Facilities = 3,
    /// <summary>Hiring, benefits, DEI, wellbeing, culture, internal comms about people (both).</summary>
    PeopleAndCulture = 4,
    /// <summary>Conferences, town halls, campus events, company offsites, workshops (both).</summary>
    EventsAndPrograms = 5,
    /// <summary>Research, labs, grants; R&amp;D, product innovation, patents (uni + corporate).</summary>
    ResearchAndInnovation = 6,
    /// <summary>Student life, clubs, sports; ERGs, volunteering, alumni (uni); employee networks (corporate).</summary>
    CommunityAndEngagement = 7,
    /// <summary>Finance, strategy, procurement, projects, business operations, administration.</summary>
    OperationsAndBusiness = 8,
    /// <summary>Legal, policy, safety, security, compliance, audits (both).</summary>
    ComplianceAndSecurity = 9
}