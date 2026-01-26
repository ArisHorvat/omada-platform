namespace Omada.Api.ViewModels;

public class EndpointGroup
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<EndpointInfo> Endpoints { get; set; } = new();
}

public class EndpointInfo
{
    public string Method { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    
    public string MethodCssClass => Method.ToLower();
}

public class FeatureItem
{
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // Done, In Progress, Planned
    public string CssClass => Status == "Done" ? "done" : (Status == "In Progress" ? "wip" : "todo");
}

public class RoadmapItem
{
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // In Progress, Planned
    public string CssClass => Status == "In Progress" ? "wip" : "todo";
}

public class WorkflowStep
{
    public string Step { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
}

public class EntityInfo
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Relations { get; set; } = string.Empty;
}

public class ArchitectureInfo
{
    public string Description { get; set; } = string.Empty;
    public List<string> Layers { get; set; } = new();
    public List<string> TechStack { get; set; } = new();
}

public class RepoInfo
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class WebSocketInfo
{
    public string Description { get; set; } = string.Empty;
    public List<string> Events { get; set; } = new();
}

public class TutorialStep
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CodeSnippet { get; set; } = string.Empty;
}

public class TutorialSection
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<TutorialStep> Steps { get; set; } = new();
}

public class InfoCard
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}