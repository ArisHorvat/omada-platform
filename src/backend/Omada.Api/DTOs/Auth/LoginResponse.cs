namespace Omada.Api.DTOs.Auth;

public record LoginResponse(string Token, IEnumerable<UserOrganizationDto> Organizations);