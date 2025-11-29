using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces
{
    public record CreateOrganizationRequest(
        string Name,
        string? ShortName,
        string EmailDomain,
        string AdminName,
        string AdminEmail,
        string Password,
        string? LogoUrl, // Assuming the frontend will upload the logo and pass the URL
        string PrimaryColor,
        string SecondaryColor,
        string AccentColor,
        List<string> Roles,
        List<string> Widgets);

    public record UpdateOrganizationRequest(
        string Name,
        string EmailDomain,
        string PrimaryColor,
        string SecondaryColor,
        string AccentColor,
        List<string> Roles,
        List<string> Widgets);


    public class OrganizationDetailsDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ShortName { get; set; }
        public string EmailDomain { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string PrimaryColor { get; set; } = string.Empty;
        public string SecondaryColor { get; set; } = string.Empty;
        public string AccentColor { get; set; } = string.Empty;
        public IEnumerable<string> Roles { get; set; } = new List<string>();
        public IEnumerable<string> Widgets { get; set; } = new List<string>();
    }

    public interface IOrganizationService
    {
        Task<Result<Organization>> CreateOrganizationAsync(CreateOrganizationRequest request);
        Task<IEnumerable<OrganizationDetailsDto>> GetAllAsync();
        Task<OrganizationDetailsDto?> GetByIdAsync(Guid id);
        Task<Result<Organization>> UpdateOrganizationAsync(Guid id, UpdateOrganizationRequest request);
        Task<Result<bool>> DeleteOrganizationAsync(Guid id);
    }
}