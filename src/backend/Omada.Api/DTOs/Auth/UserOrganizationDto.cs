namespace Omada.Api.DTOs.Auth;

public record UserOrganizationDto(Guid OrganizationId, string OrganizationName, string Role, string? LogoUrl);