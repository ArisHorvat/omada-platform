namespace Omada.Api.ViewModels;

public class OverviewViewModel
{
    public string DatabaseStatus { get; set; } = "Unknown";
    public string DatabaseLatency { get; set; } = "-";
    public List<FeatureItem> Features { get; set; } = new();
    public List<RoadmapItem> Roadmap { get; set; } = new();
}