using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Organizations;

public class UpdateOrganizationEnabledWidgetsRequest
{
    [Required]
    public required List<string> EnabledWidgetKeys { get; set; }
}
