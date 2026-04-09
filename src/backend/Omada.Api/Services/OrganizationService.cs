using Omada.Api.Services.Interfaces;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;
using Omada.Api.DTOs.Organizations;
using Omada.Api.Abstractions;
using Microsoft.AspNetCore.SignalR;
using Omada.Api.Hubs;
using Omada.Api.DTOs.Common;
using Omada.Api.DTOs.Import;

namespace Omada.Api.Services;

public class OrganizationService : IOrganizationService
{
    private readonly IUnitOfWork _uow;
    private readonly IHubContext<AppHub> _hubContext;
    private readonly IEmailService _emailService;
    private readonly ILogger<OrganizationService> _logger;
    private readonly IPublicMediaUrlResolver _mediaUrls;

    public OrganizationService(
        IUnitOfWork uow,
        IHubContext<AppHub> hubContext,
        IEmailService emailService,
        ILogger<OrganizationService> logger,
        IPublicMediaUrlResolver mediaUrls)
    {
        _uow = uow;
        _hubContext = hubContext;
        _emailService = emailService;
        _logger = logger;
        _mediaUrls = mediaUrls;
    }

    public async Task<ServiceResponse<OrganizationDetailsDto>> CreateOrganizationAsync(RegisterOrganizationRequest request)
    {
        _logger.LogInformation("Starting transaction to create organization: {Name}", request.Name);

        // 1. Build Base Entity & Roles
        var org = BuildBaseOrganization(request);
        
        var validationError = ValidateImportedRoles(org, request.Users);
        if (validationError != null) return validationError;

        // 2. Performance Fix: Fetch all relevant users in ONE database query
        var existingUsersDict = await FetchExistingUsersBulkAsync(request);

        // 3. Process Admin & Users (In-Memory)
        ProcessAdminUser(org, request, existingUsersDict);
        ApplyRolePermissions(org, request.RoleWidgetMappings);
        var usersToEmail = ProcessUserImports(org, request, existingUsersDict);

        // 4. Save Everything Atomically
        await _uow.Repository<Organization>().AddAsync(org);
        await _uow.CompleteAsync(); // If this fails, no emails are sent.

        // 5. Post-Save: Safe to send emails now
        foreach (var (user, token) in usersToEmail)
        {
            _ = _emailService.SendInvitationEmailAsync(user.Email, user.FirstName, org.Name, token);
        }

        // 6. Map Response & Broadcast
        var detailsDto = MapToOrganizationDetailsDto(org);
        
        await _hubContext.Clients.All.SendAsync("OrganizationCreated", new { id = org.Id, name = org.Name });

        return new ServiceResponse<OrganizationDetailsDto>(true, detailsDto);
    }

    public async Task<ServiceResponse<Organization>> UpdateOrganizationAsync(Guid id, UpdateOrganizationRequest request)
    {
        var org = await _uow.Repository<Organization>().GetByIdAsync(id);
        if (org == null)
            return new ServiceResponse<Organization>(false, null, new AppError(ErrorCodes.NotFound, "Organization not found."));

        org.Name = request.Name;
        org.EmailDomain = request.EmailDomain;
        org.PrimaryColor = request.PrimaryColor;
        org.SecondaryColor = request.SecondaryColor;
        org.TertiaryColor = request.TertiaryColor;

        _uow.Repository<Organization>().Update(org);
        await _uow.CompleteAsync();
        
        await _hubContext.Clients.Group(id.ToString()).SendAsync("UpdateOrganization", new { id });
        
        return new ServiceResponse<Organization>(true, org);
    }

    public async Task<ServiceResponse<bool>> DeleteOrganizationAsync(Guid id)
    {
        var org = await _uow.Repository<Organization>().GetByIdAsync(id);
        if (org == null) 
            return new ServiceResponse<bool>(false, false, new AppError(ErrorCodes.NotFound, "Organization not found."));

        _uow.Repository<Organization>().Remove(org);
        await _uow.CompleteAsync();

        return new ServiceResponse<bool>(true, true);
    }

    public async Task<ServiceResponse<PagedResponse<OrganizationDetailsDto>>> GetAllAsync(PagedRequest request)
    {
        var pagedOrganizations = await _uow.Repository<Organization>().GetPagedAsync(request.Page, request.PageSize);
        
        var orgIdsOnPage = pagedOrganizations.Items.Select(o => o.Id).ToList();
        var roles = await _uow.Repository<Role>().FindAsync(r => orgIdsOnPage.Contains(r.OrganizationId));
        
        var mappedItems = pagedOrganizations.Items.Select(org => new OrganizationDetailsDto
        {
            Id = org.Id,
            OrganizationType = org.OrganizationType,
            Name = org.Name,
            ShortName = org.ShortName ?? "",
            EmailDomain = org.EmailDomain,
            LogoUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(org.LogoUrl) ? null : org.LogoUrl),
            PrimaryColor = org.PrimaryColor,
            SecondaryColor = org.SecondaryColor,
            TertiaryColor = org.TertiaryColor,
            Roles = roles.Where(r => r.OrganizationId == org.Id).Select(r => r.Name),
            Widgets = new List<string>(), 
            RoleWidgetMappings = new Dictionary<string, List<string>>()
        }).ToList();

        return new ServiceResponse<PagedResponse<OrganizationDetailsDto>>(true, new PagedResponse<OrganizationDetailsDto>
        {
            Items = mappedItems,
            TotalCount = pagedOrganizations.TotalCount,
            Page = pagedOrganizations.Page,
            PageSize = pagedOrganizations.PageSize
        });
    }

    public async Task<ServiceResponse<OrganizationDetailsDto>> GetByIdAsync(Guid id)
    {
        var org = await _uow.Repository<Organization>().GetByIdAsync(id);
        if (org == null) 
            return new ServiceResponse<OrganizationDetailsDto>(false, null, new AppError(ErrorCodes.NotFound, "Organization not found"));

        var roles = (await _uow.Repository<Role>().FindAsync(r => r.OrganizationId == id)).ToList();
        var roleIds = roles.Select(r => r.Id).ToList();
        var permissions = await _uow.Repository<RolePermission>().FindAsync(rp => roleIds.Contains(rp.RoleId));

        var mappingDict = roles.ToDictionary(
            r => r.Name, 
            r => permissions.Where(p => p.RoleId == r.Id).Select(p => p.WidgetKey).ToList()
        );

        var dto = new OrganizationDetailsDto
        {
            Id = org.Id,
            OrganizationType = org.OrganizationType,
            Name = org.Name,
            ShortName = org.ShortName ?? "",
            EmailDomain = org.EmailDomain,
            LogoUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(org.LogoUrl) ? null : org.LogoUrl),
            PrimaryColor = org.PrimaryColor,
            SecondaryColor = org.SecondaryColor,
            TertiaryColor = org.TertiaryColor,
            Roles = roles.Select(r => r.Name),
            Widgets = permissions.Select(p => p.WidgetKey).Distinct(),
            RoleWidgetMappings = mappingDict
        };

        return new ServiceResponse<OrganizationDetailsDto>(true, dto);
    }

    // --- Private Helper Methods ---

    private static OrganizationType ParseOrganizationType(string? value) =>
        string.Equals(value, "university", StringComparison.OrdinalIgnoreCase)
            ? OrganizationType.University
            : OrganizationType.Corporate;

    private Organization BuildBaseOrganization(RegisterOrganizationRequest request)
    {
        var org = new Organization
        {
            Name = request.Name,
            OrganizationType = ParseOrganizationType(request.OrganizationType),
            ShortName = request.ShortName,
            EmailDomain = request.EmailDomain,
            LogoUrl = request.LogoUrl,
            PrimaryColor = request.PrimaryColor,
            SecondaryColor = request.SecondaryColor,
            TertiaryColor = request.TertiaryColor
        };

        var roleNames = request.Roles ?? new List<string>();

        // THE SAFEGUARD: Never trust the frontend completely. 
        // Always ensure 'Admin' exists so the DB relationships don't break.
        if (!roleNames.Any(r => r.Equals("Admin", StringComparison.OrdinalIgnoreCase)))
        {
            roleNames.Add("Admin");
        }

        foreach (var name in roleNames)
        {
            org.Roles.Add(new Role { Name = name, Organization = org });
        }

        return org;
    }

    private ServiceResponse<OrganizationDetailsDto>? ValidateImportedRoles(Organization org, IEnumerable<UserImportDto>? importedUsers)
    {
        if (importedUsers == null || !importedUsers.Any()) return null;

        var validRoleNames = org.Roles.Select(r => r.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var invalidRoles = importedUsers.Select(u => u.Role)
                                        .Where(r => !validRoleNames.Contains(r))
                                        .Distinct()
                                        .ToList();

        if (invalidRoles.Any())
        {
            var errorMessage = $"Import failed. The following roles in the CSV do not exist: {string.Join(", ", invalidRoles)}";
            return new ServiceResponse<OrganizationDetailsDto>(false, null, new AppError(ErrorCodes.InvalidInput, errorMessage));
        }

        return null;
    }

    private async Task<Dictionary<string, User>> FetchExistingUsersBulkAsync(RegisterOrganizationRequest request)
    {
        var allEmailsToFetch = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { request.AdminEmail };
        
        if (request.Users != null)
        {
            allEmailsToFetch.UnionWith(request.Users.Select(u => u.Email));
        }

        var existingUsers = await _uow.Repository<User>().FindAsync(u => allEmailsToFetch.Contains(u.Email));
        return existingUsers.ToDictionary(u => u.Email, StringComparer.OrdinalIgnoreCase);
    }

    private void ProcessAdminUser(Organization org, RegisterOrganizationRequest request, Dictionary<string, User> existingUsers)
    {
        if (!existingUsers.TryGetValue(request.AdminEmail, out var adminUser))
        {
            adminUser = new User
            {
                FirstName = request.AdminFirstName,
                LastName = request.AdminLastName,
                Email = request.AdminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                IsTwoFactorEnabled = false
            };
        }

        var adminRole = org.Roles.First(r => r.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase));
        org.Members.Add(new OrganizationMember { User = adminUser, Role = adminRole, Organization = org });
    }

    private void ApplyRolePermissions(Organization org, IEnumerable<RoleWidgetMappingDto>? mappings)
    {
        if (mappings != null && mappings.Any())
        {
            foreach (var mapping in mappings)
            {
                var role = org.Roles.FirstOrDefault(r => r.Name.Equals(mapping.RoleName, StringComparison.OrdinalIgnoreCase));
                if (role == null || !Enum.TryParse<AccessLevel>(mapping.AccessLevel, true, out var level)) continue;

                var existingPermission = role.Permissions.FirstOrDefault(p => p.WidgetKey.Equals(mapping.WidgetKey, StringComparison.OrdinalIgnoreCase));
                
                if (existingPermission != null) existingPermission.AccessLevel = level;
                else role.Permissions.Add(new RolePermission { WidgetKey = mapping.WidgetKey, AccessLevel = level });
            }
        }

        // Safety Net: Ensure 'Admin' ALWAYS has critical access
        var adminRole = org.Roles.FirstOrDefault(r => r.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase));
        if (adminRole != null)
        {
            var criticalPermissions = new Dictionary<string, AccessLevel>
            {
                { "users", AccessLevel.Admin }, { "settings", AccessLevel.Admin },
                { "news", AccessLevel.Admin }, { "schedule", AccessLevel.View }
            };

            foreach (var cp in criticalPermissions)
            {
                var existing = adminRole.Permissions.FirstOrDefault(p => p.WidgetKey.Equals(cp.Key, StringComparison.OrdinalIgnoreCase));
                if (existing == null) adminRole.Permissions.Add(new RolePermission { WidgetKey = cp.Key, AccessLevel = cp.Value });
                else if (existing.AccessLevel < cp.Value) existing.AccessLevel = cp.Value;
            }
        }
    }

    private List<(User User, string Token)> ProcessUserImports(Organization org, RegisterOrganizationRequest request, Dictionary<string, User> existingUsersDict)
    {
        var usersNeedingEmails = new List<(User, string)>();
        if (request.Users == null || !request.Users.Any()) return usersNeedingEmails;

        foreach (var userDto in request.Users)
        {
            var targetRole = org.Roles.First(r => r.Name.Equals(userDto.Role, StringComparison.OrdinalIgnoreCase));

            if (!existingUsersDict.TryGetValue(userDto.Email, out var importedUser))
            {
                var tempPassword = request.DefaultUserPassword ?? "Welcome123!";
                var token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));

                importedUser = new User
                {
                    FirstName = userDto.FirstName,
                    LastName = userDto.LastName,
                    Email = userDto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(tempPassword),
                    PhoneNumber = userDto.PhoneNumber,
                    CNP = userDto.CNP,
                    Address = userDto.Address,
                    PasswordResetToken = token,
                    PasswordResetTokenExpires = DateTime.UtcNow.AddDays(7)
                };
                
                // Track this new user so we can email them after DB save
                usersNeedingEmails.Add((importedUser, token));
            }

            org.Members.Add(new OrganizationMember { User = importedUser, Role = targetRole, Organization = org });
        }

        return usersNeedingEmails;
    }

    private OrganizationDetailsDto MapToOrganizationDetailsDto(Organization org)
    {
        var rolesWithPermissions = org.Roles.ToDictionary(
            r => r.Name, 
            r => r.Permissions.Select(p => p.WidgetKey).ToList()
        );

        return new OrganizationDetailsDto
        {
            Id = org.Id,
            Name = org.Name,
            ShortName = org.ShortName ?? "",
            EmailDomain = org.EmailDomain,
            PrimaryColor = org.PrimaryColor,
            SecondaryColor = org.SecondaryColor,
            TertiaryColor = org.TertiaryColor,
            LogoUrl = _mediaUrls.ToPublicUrl(string.IsNullOrEmpty(org.LogoUrl) ? null : org.LogoUrl),
            Roles = org.Roles.Select(r => r.Name).ToList(),
            Widgets = org.Roles.SelectMany(r => r.Permissions).Select(p => p.WidgetKey).Distinct().ToList(),
            RoleWidgetMappings = rolesWithPermissions
        };
    }
}