namespace Omada.Api.ViewModels;

public class ServicesViewModel
{
    public List<WorkflowStep> AuthWorkflow { get; set; } = new();
    public List<WorkflowStep> CustomDataWorkflow { get; set; } = new();
    public List<WorkflowStep> FilesWorkflow { get; set; } = new();
    public List<WorkflowStep> OrganizationsWorkflow { get; set; } = new();
    public List<WorkflowStep> ToolsWorkflow { get; set; } = new();
    public List<WorkflowStep> UsersWorkflow { get; set; } = new();
}