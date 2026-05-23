namespace Omada.Api.DTOs.Organizations;

public class CreateOrganizationPeriodRequest
{
    public string Name { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCurrent { get; set; }
}
