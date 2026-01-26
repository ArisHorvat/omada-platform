namespace Omada.Api.ViewModels;

public class HomeViewModel
{
    public OverviewViewModel Overview { get; set; } = new();
    public ArchitectureViewModel Architecture { get; set; } = new();
    public ControllersViewModel Controllers { get; set; } = new();
    public ServicesViewModel Services { get; set; } = new();
    public RepositoriesViewModel Repositories { get; set; } = new();
    public EntitiesViewModel Entities { get; set; } = new();
    public WebSocketsViewModel WebSockets { get; set; } = new();
    public TutorialViewModel Tutorial { get; set; } = new();
}
