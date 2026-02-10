using System.Data;
using Omada.Api.Services.Interfaces;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Entities;
using Omada.Api.WebSocketHandlers;
using Omada.Api.DTOs.Organizations;

namespace Omada.Api.Services;

public class OrganizationService : IOrganizationService
{
    private readonly IOrganizationRepository _organizationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IWidgetRepository _widgetRepository;
    private readonly IDbConnection _dbConnection;
    private readonly IWebSocketHandler _webSocketHandler;
    private readonly IEmailService _emailService;
    private readonly ILogger<OrganizationService> _logger;

    public OrganizationService(
        IOrganizationRepository organizationRepository, 
        IUserRepository userRepository, 
        IRoleRepository roleRepository, 
        IWidgetRepository widgetRepository,
        IDbConnection dbConnection,
        IWebSocketHandler webSocketHandler,
        IEmailService emailService,
        ILogger<OrganizationService> logger)
    {
        _organizationRepository = organizationRepository;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _widgetRepository = widgetRepository;
        _dbConnection = dbConnection;
        _webSocketHandler = webSocketHandler;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<Result<Organization>> CreateOrganizationAsync(RegisterOrganizationRequest request)
    {
        _logger.LogInformation("Starting transaction for creating organization: {Name}", request.Name);
        
        if (_dbConnection.State != ConnectionState.Open) _dbConnection.Open();
        using var transaction = _dbConnection.BeginTransaction();
        
        try
        {
            // 1. Create Organization Entity
            var organizationResult = Organization.Create(
                request.Name, request.ShortName, request.EmailDomain, request.LogoUrl,
                request.PrimaryColor, request.SecondaryColor, request.TertiaryColor
            );
            if (organizationResult.IsFailure) return Result<Organization>.Failure(organizationResult.Error!);
            var organization = organizationResult.Value!;

            await _organizationRepository.CreateAsync(organization, transaction);

            // 2. Initialize and Create Roles (MUST happen before adding members)
            // This generates the GUIDs we need for linking.
            var roleNames = InitializeOrganizationRoles(request.OrganizationType, request.Roles);
            var createdRoles = new List<Role>();
            
            foreach (var name in roleNames)
            {
                var role = Role.Create(organization.Id, name);
                createdRoles.Add(role);
            }
            await _roleRepository.AddRangeAsync(createdRoles, transaction);

            // 3. Setup Admin User
            var existingAdmin = await _userRepository.GetByEmailAsync(request.AdminEmail, transaction);
            Guid adminId;

            if (existingAdmin != null)
            {
                adminId = existingAdmin.Id;
            }
            else
            {
                var userResult = User.Create(request.AdminFirstName, request.AdminLastName, request.AdminEmail, request.Password);
                if (userResult.IsFailure) return Result<Organization>.Failure(userResult.Error!);
                adminId = userResult.Value!.Id;
                await _userRepository.CreateAsync(userResult.Value!, transaction);
            }

            // 4. Link Admin to the "Admin" Role GUID
            // We use StringComparison to ensure we find "Admin" even if case differs slightly
            var adminRole = createdRoles.First(r => r.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase));
            await _userRepository.AddMemberAsync(organization.Id, adminId, adminRole.Id, transaction);

            // 5. Global Toggles (Which widgets are active for the whole Org)
            await _widgetRepository.SetEnabledWidgetsAsync(organization.Id, request.Widgets, transaction);

            // 6. Attribute Permissions (The Logic Engine)
            // This handles custom roles, renamed roles, stripped permissions, and defaults.
            await ApplyDefaultAccessLevels(organization.Id, request.OrganizationType, createdRoles, request, transaction);

            // 7. Import Users
            if (request.Users != null && request.Users.Any())
            {
                foreach (var userDto in request.Users)
                {
                    // Find the Role GUID corresponding to the imported string (e.g., "Student")
                    // If the user typed a role that doesn't exist, fallback to the first non-admin role.
                    var targetRole = createdRoles.FirstOrDefault(r => r.Name.Equals(userDto.Role, StringComparison.OrdinalIgnoreCase)) 
                                     ?? createdRoles.First(r => !r.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase));

                    var tempPassword = request.DefaultUserPassword ?? "Welcome123!";
                    var existingUser = await _userRepository.GetByEmailAsync(userDto.Email, transaction);
                    
                    Guid memberUserId;
                    if (existingUser != null)
                    {
                        memberUserId = existingUser.Id;
                        // Determine if we should send an email here? For now, we just link them.
                    }
                    else
                    {
                        var importedUser = User.Create(userDto.FirstName, userDto.LastName, userDto.Email, tempPassword, userDto.CNP, userDto.PhoneNumber, userDto.Address);
                        if (importedUser.IsFailure) continue;

                        var user = importedUser.Value!;
                        var token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
                        user.SetPasswordResetToken(token, DateTime.UtcNow.AddDays(7));
                        
                        await _userRepository.CreateAsync(user, transaction);
                        await _emailService.SendInvitationEmailAsync(user.Email, user.FirstName, organization.Name, token);
                        memberUserId = user.Id;
                    }

                    // Link member using the Role's GUID ID
                    await _userRepository.AddMemberAsync(organization.Id, memberUserId, targetRole.Id, transaction);
                }
            }

            transaction.Commit();
            
            // Broadcast success
            await _webSocketHandler.BroadcastAsync(new { type = "create", data = new { organization.Id, organization.Name } }, organization.Id);

            return Result<Organization>.Success(organization);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create organization {Name}", request.Name);
            transaction.Rollback();
            return Result<Organization>.Failure($"Registration failed: {ex.Message}");
        }
        finally
        {
            if (_dbConnection.State == ConnectionState.Open) _dbConnection.Close();
        }
    }

    public async Task<Result<Organization>> UpdateOrganizationAsync(Guid id, UpdateOrganizationRequest request)
    {
        _logger.LogInformation("Starting transaction for updating organization: {Id}", id);
        
        if (_dbConnection.State != ConnectionState.Open) _dbConnection.Open();
        using var transaction = _dbConnection.BeginTransaction();
        try
        {
            var organization = await _organizationRepository.GetByIdAsync(id, transaction);
            if (organization == null)
            {
                return Result<Organization>.Failure("Organization not found.");
            }

            organization.Update(request.Name, request.EmailDomain, request.PrimaryColor, request.SecondaryColor, request.TertiaryColor);
            await _organizationRepository.UpdateAsync(organization, transaction);

            // NOTE: Updating roles is complex with Foreign Keys.
            // For a robust implementation, you should DIFF the roles (Add new, Rename existing, Delete unused).
            // For now, we will just update the Widgets to keep it safe.
            
            await _widgetRepository.SetEnabledWidgetsAsync(id, request.Widgets, transaction);

            transaction.Commit();
            
            await _webSocketHandler.BroadcastAsync(new { type = "update", id = id }, id);
            return Result<Organization>.Success(organization);
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            _logger.LogError(ex, "Error updating organization");
            return Result<Organization>.Failure("Update failed.");
        }
        finally
        {
            _dbConnection.Close();
        }
    }

    public async Task<Result<bool>> DeleteOrganizationAsync(Guid id)
    {
        _logger.LogInformation("Starting transaction for deleting organization: {Id}", id);
        
        if (_dbConnection.State != ConnectionState.Open) _dbConnection.Open();
        using var transaction = _dbConnection.BeginTransaction();
        try
        {
            var organization = await _organizationRepository.GetByIdAsync(id, transaction);
            if (organization == null) return Result<bool>.Failure("Organization not found.");

            // Cascading delete handles members and roles usually, but we can be explicit
            await _roleRepository.DeleteByOrganizationIdAsync(id, transaction);
            await _userRepository.DeleteByOrganizationIdAsync(id, transaction);
            await _organizationRepository.DeleteAsync(id, transaction);

            transaction.Commit();
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            _logger.LogError(ex, "Error deleting organization");
            return Result<bool>.Failure("Delete failed.");
        }
        finally
        {
            _dbConnection.Close();
        }
    }

    public async Task<Result<IEnumerable<OrganizationDetailsDto>>> GetAllAsync()
    {
        try
        {
            var organizations = await _organizationRepository.GetAllAsync();
            var result = new List<OrganizationDetailsDto>();

            foreach (var org in organizations)
            {
                var roles = await _roleRepository.GetByOrganizationIdAsync(org.Id);
                var widgets = await _widgetRepository.GetEnabledWidgetsAsync(org.Id);

                result.Add(new OrganizationDetailsDto
                {
                    Id = org.Id,
                    Name = org.Name,
                    ShortName = org.ShortName,
                    EmailDomain = org.EmailDomain,
                    LogoUrl = org.LogoUrl,
                    PrimaryColor = org.PrimaryColor,
                    SecondaryColor = org.SecondaryColor,
                    TertiaryColor = org.TertiaryColor,
                    Roles = roles.Select(r => r.Name),
                    Widgets = widgets
                });
            }
            return Result<IEnumerable<OrganizationDetailsDto>>.Success(result);
        }
        catch (Exception ex)
        {
            return Result<IEnumerable<OrganizationDetailsDto>>.Failure(ex.Message);
        }
    }

    public async Task<Result<OrganizationDetailsDto>> GetByIdAsync(Guid id)
    {
        try
        {
            var organization = await _organizationRepository.GetByIdAsync(id, null);
            if (organization == null) 
            {
                return Result<OrganizationDetailsDto>.Failure("Organization not found");
            }

            var roles = await _roleRepository.GetByOrganizationIdAsync(id);
            var widgets = await _widgetRepository.GetEnabledWidgetsAsync(id);
            var mappings = await _roleRepository.GetRoleWidgetAccessAsync(id);

            var mappingDict = mappings
                .GroupBy(m => m.RoleName)
                .ToDictionary(
                    g => g.Key, 
                    g => g.Select(m => m.WidgetKey).ToList()
                );

            var dto = new OrganizationDetailsDto
            {
                Id = organization.Id,
                Name = organization.Name,
                ShortName = organization.ShortName,
                EmailDomain = organization.EmailDomain,
                LogoUrl = organization.LogoUrl,
                PrimaryColor = organization.PrimaryColor,
                SecondaryColor = organization.SecondaryColor,
                TertiaryColor = organization.TertiaryColor,
                Roles = roles.Select(r => r.Name),
                Widgets = widgets,
                RoleWidgetMappings = mappingDict
            };

            return Result<OrganizationDetailsDto>.Success(dto);
        }
        catch (Exception ex)
        {
            return Result<OrganizationDetailsDto>.Failure(ex.Message);
        }
    }

    // --- Helper Methods ---

    private List<string> InitializeOrganizationRoles(string orgType, List<string> customRoles)
    {
        // If user provided custom roles, use them but ensure "Admin" exists.
        if (customRoles != null && customRoles.Any())
        {
            if (!customRoles.Any(r => r.Equals("Admin", StringComparison.OrdinalIgnoreCase)))
            {
                customRoles.Add("Admin");
            }
            return customRoles;
        }

        // Standard templates if no custom roles provided
        return orgType.ToLower() switch
        {
            "university" => new List<string> { "Student", "Professor", "Teaching Assistant", "Dean", "Registrar", "Operations", "Admin" },
            "corporate" => new List<string> { "Employee", "Team Lead", "Project Manager", "Director", "HR Manager", "Operations", "Admin" },
            _ => new List<string> { "Admin", "User" }
        };
    }

    private async Task ApplyDefaultAccessLevels(
        Guid orgId, 
        string orgType, 
        List<Role> createdRoles, 
        RegisterOrganizationRequest request, 
        IDbTransaction transaction)
    {
        // 1. Process User's Custom Selections from the Frontend
        // If they unchecked a widget in the UI, it won't be in mapping.Widgets, effectively stripping it.
        if (request.RoleWidgetMappings != null && request.RoleWidgetMappings.Any())
        {
            foreach (var mapping in request.RoleWidgetMappings)
            {
                var role = createdRoles.FirstOrDefault(r => r.Name.Equals(mapping.RoleName, StringComparison.OrdinalIgnoreCase));
                if (role == null) continue;

                foreach (var widgetKey in mapping.Widgets)
                {
                    // For now, default to 'view'. 
                    // Future improvement: Frontend can send "edit" or "admin" if you add that UI.
                    await _roleRepository.SaveRoleWidgetAccessAsync(role.Id, widgetKey, "view", transaction);
                }
            }
        }

        // 2. Safety Net: Ensure 'Admin' role has critical management permissions
        // We do this regardless of UI selection to prevent lockouts.
        var adminRole = createdRoles.FirstOrDefault(r => r.Name.Equals("Admin", StringComparison.OrdinalIgnoreCase));
        if (adminRole != null)
        {
            await _roleRepository.SaveRoleWidgetAccessAsync(adminRole.Id, "users", "admin", transaction);
            await _roleRepository.SaveRoleWidgetAccessAsync(adminRole.Id, "settings", "admin", transaction);
            await _roleRepository.SaveRoleWidgetAccessAsync(adminRole.Id, "news", "admin", transaction);
            // Admins usually need to see the schedule too
            await _roleRepository.SaveRoleWidgetAccessAsync(adminRole.Id, "schedule", "view", transaction);
        }
    }
}