namespace Omada.Api.ViewModels;

public class TutorialViewModel
{
    public TutorialSection NewFeatureFlow { get; set; } = new();
    public TutorialSection ExistingFeatureFlow { get; set; } = new();
    public List<InfoCard> ProTips { get; set; } = new();
}