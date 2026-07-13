namespace Omada.Api.DTOs.Search;

/// <summary>Result bucket keys returned by universal search (align with mobile routing).</summary>
public static class SearchTypes
{
    public const string Users = "users";
    public const string Rooms = "rooms";
    public const string News = "news";
    public const string Tasks = "tasks";
    public const string Schedule = "schedule";
    public const string Groups = "groups";
    public const string Grades = "grades";
    public const string Documents = "documents";

    public static readonly IReadOnlyList<string> All =
    [
        Users, Rooms, News, Tasks, Schedule, Groups, Grades, Documents
    ];
}
