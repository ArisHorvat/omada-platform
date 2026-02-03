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

    public OrganizationService(IOrganizationRepository organizationRepository, 
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
        // Before starting a transaction, do checks that don't require one.
        // Domain check removed as we allow generic domains or duplicates for testing/BYOE

        _logger.LogInformation("Starting transaction for creating organization: {Name}", request.Name);
        _dbConnection.Open();
        using var transaction = _dbConnection.BeginTransaction();
        try
        {
            // 1. Use the Domain entity's factory to create a valid object
            var organizationResult = Organization.Create(
                request.Name, request.ShortName, request.EmailDomain, request.LogoUrl,
                request.PrimaryColor, request.SecondaryColor, request.TertiaryColor
            );
            if (organizationResult.IsFailure) return Result<Organization>.Failure(organizationResult.Error!);
            var organization = organizationResult.Value!;

            // 2. Persist the new organization
            await _organizationRepository.CreateAsync(organization, transaction);

            // 3. Create the admin user associated with this organization.
            // Check if user exists globally first
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
            await _userRepository.AddMemberAsync(organization.Id, adminId, "Admin", transaction);

            // 4. Create Roles based on Template (University vs Corporate)
            // If custom roles are provided in request, use them, otherwise use template
            var rolesToCreate = InitializeOrganizationRoles(request.OrganizationType, request.Roles);
            var createdRoles = new List<Role>();
            
            foreach (var roleName in rolesToCreate)
            {
                var role = Role.Create(organization.Id, roleName);
                createdRoles.Add(role);
            }
            await _roleRepository.AddRangeAsync(createdRoles, transaction);

            // 5. Save the selected widgets
            // Efficiently save just the keys (strings)
            await _widgetRepository.SetEnabledWidgetsAsync(organization.Id, request.Widgets, transaction);

            // 6. Apply Default Access Levels based on Template
            await ApplyDefaultAccessLevels(organization.Id, request.OrganizationType, createdRoles, transaction);

            // 7. Create Users from Excel/Import list
            if (request.Users != null && request.Users.Any())
            {
                foreach (var userDto in request.Users)
                {
                    // Generate a random temporary password that the user won't know.
                    // They must use the invitation link to set it.
                    // var tempPassword = Guid.NewGuid().ToString();

                    var tempPassword = request.DefaultUserPassword ?? "Welcome123!";

                    var existingUser = await _userRepository.GetByEmailAsync(userDto.Email, transaction);
                    if (existingUser != null)
                    {
                        // User exists, just link them
                        await _userRepository.AddMemberAsync(organization.Id, existingUser.Id, userDto.Role, transaction);
                        // Optionally send "You've been added" email
                    }
                    else
                    {
                        // Create new user
                        var importedUser = User.Create(
                            userDto.FirstName, userDto.LastName, userDto.Email, tempPassword, 
                            userDto.CNP, userDto.PhoneNumber, userDto.Address
                        );
                        
                        if (importedUser.IsFailure) continue;

                        var user = importedUser.Value!;
                        // Generate invitation token
                        var token = Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
                        user.SetPasswordResetToken(token, DateTime.UtcNow.AddDays(7)); // 7 day expiry for invites
                        
                        await _userRepository.CreateAsync(user, transaction);
                        await _userRepository.AddMemberAsync(organization.Id, user.Id, userDto.Role, transaction);
                        
                        await _emailService.SendInvitationEmailAsync(user.Email, user.FirstName, organization.Name, token);
                    }
                }
            }

            // If all operations succeed, commit the transaction
            transaction.Commit();
            _logger.LogInformation("Organization created successfully: {Id}", organization.Id);

            var broadcastData = new
            {
                organization.Id,
                organization.Name,
                organization.ShortName,
                organization.EmailDomain,
                organization.LogoUrl,
                organization.PrimaryColor,
                organization.SecondaryColor,
                organization.TertiaryColor,
                Roles = request.Roles,
                Widgets = request.Widgets
            };
            await _webSocketHandler.BroadcastAsync(new { type = "create", data = broadcastData }, organization.Id);
            return Result<Organization>.Success(organization);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating organization");
            // If any operation fails, roll back all changes
            transaction.Rollback();
            // Return a generic failure message to avoid leaking implementation details.
            return Result<Organization>.Failure($"An unexpected error occurred during registration: {ex.Message}");
        }
        finally
        {
            if (_dbConnection.State == ConnectionState.Open)
            {
                _dbConnection.Close();
            }
        }
    }

    public async Task<Result<Organization>> UpdateOrganizationAsync(Guid id, UpdateOrganizationRequest request)
    {
        _logger.LogInformation("Starting transaction for updating organization: {Id}", id);
        _dbConnection.Open();
        using var transaction = _dbConnection.BeginTransaction();
        try
        {
            var organization = await _organizationRepository.GetByIdAsync(id, transaction);
            if (organization == null)
            {
                _logger.LogWarning("Organization not found for update: {Id}", id);
                return Result<Organization>.Failure("Organization not found.");
            }

            organization.Update(request.Name, request.EmailDomain, request.PrimaryColor, request.SecondaryColor, request.TertiaryColor);
            await _organizationRepository.UpdateAsync(organization, transaction);

            // Update Roles: Delete existing and add new ones
            await _roleRepository.DeleteByOrganizationIdAsync(id, transaction);
            var roles = request.Roles.Select(roleName => Role.Create(id, roleName));
            await _roleRepository.AddRangeAsync(roles, transaction);

            // Update Widgets: Delete existing and add new ones
            // Efficiently update keys
            await _widgetRepository.SetEnabledWidgetsAsync(id, request.Widgets, transaction);

            transaction.Commit();
            _logger.LogInformation("Organization updated successfully: {Id}", id);

            var broadcastData = new
            {
                organization.Id,
                organization.Name,
                organization.ShortName,
                organization.EmailDomain,
                organization.LogoUrl,
                organization.PrimaryColor,
                organization.SecondaryColor,
                organization.TertiaryColor,
                Roles = request.Roles,
                Widgets = request.Widgets
            };
            await _webSocketHandler.BroadcastAsync(new { type = "update", data = broadcastData }, id);
            return Result<Organization>.Success(organization);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating organization: {Id}", id);
            transaction.Rollback();
            return Result<Organization>.Failure("An unexpected error occurred while updating the organization.");
        }
        finally
        {
            if (_dbConnection.State == ConnectionState.Open)
            {
                _dbConnection.Close();
            }
        }
    }

    public async Task<Result<bool>> DeleteOrganizationAsync(Guid id)
    {
        _logger.LogInformation("Starting transaction for deleting organization: {Id}", id);
        _dbConnection.Open();
        using var transaction = _dbConnection.BeginTransaction();
        try
        {
            var organization = await _organizationRepository.GetByIdAsync(id, transaction);
            if (organization == null)
            {
                _logger.LogWarning("Organization not found for deletion: {Id}", id);
                return Result<bool>.Failure("Organization not found.");
            }

            await _roleRepository.DeleteByOrganizationIdAsync(id, transaction);
            // Widget keys in OrganizationEnabledWidgets cascade delete automatically via FK on OrganizationId
            await _userRepository.DeleteByOrganizationIdAsync(id, transaction);

            await _organizationRepository.DeleteAsync(id, transaction);

            transaction.Commit();
            _logger.LogInformation("Organization deleted successfully: {Id}", id);
            await _webSocketHandler.BroadcastAsync(new { type = "delete", id = id }, id);
            return Result<bool>.Success(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting organization: {Id}", id);
            transaction.Rollback();
            return Result<bool>.Failure("An unexpected error occurred while deleting the organization.");
        }
        finally
        {
            if (_dbConnection.State == ConnectionState.Open)
            {
                _dbConnection.Close();
            }
        }
    }

    public async Task<IEnumerable<OrganizationDetailsDto>> GetAllAsync()
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

        return result;
    }

    public async Task<OrganizationDetailsDto?> GetByIdAsync(Guid id)
    {
        var organization = await _organizationRepository.GetByIdAsync(id, null);
        if (organization == null) return null;

        var roles = await _roleRepository.GetByOrganizationIdAsync(id);
        var widgets = await _widgetRepository.GetEnabledWidgetsAsync(id);
        var mappings = await _roleRepository.GetRoleWidgetAccessAsync(id);

        var mappingDict = mappings
            .GroupBy(m => m.RoleName)
            .ToDictionary(
                g => g.Key, 
                g => g.Select(m => m.WidgetKey).ToList() // Just return the list of widgets they have access to for now
            );

        return new OrganizationDetailsDto
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
    }

    // --- Helper Methods for Templates ---

    private List<string> InitializeOrganizationRoles(string orgType, List<string> customRoles)
    {
        if (customRoles != null && customRoles.Any()) return customRoles;

        return orgType.ToLower() switch
        {
            "university" => new List<string> { "Student", "Professor", "Teaching Assistant", "Dean", "Registrar", "Operations", "Admin" },
            "corporate" => new List<string> { "Employee", "Team Lead", "Project Manager", "Director", "HR Manager", "Operations", "Admin" },
            _ => new List<string> { "Admin", "User" }
        };
    }

    private async Task ApplyDefaultAccessLevels(Guid orgId, string orgType, List<Role> roles, IDbTransaction transaction)
    {
        // Define defaults: (RoleName, WidgetKey, AccessLevel)
        var defaults = new List<(string Role, string WidgetKey, string Access)>();

        // --- 1. CORE WIDGETS (Standard access for everyone) ---
        // We iterate through all created roles to give them base access
        foreach (var role in roles)
        {
            defaults.Add((role.Name, "schedule", "view"));
            defaults.Add((role.Name, "chat", "view"));
            defaults.Add((role.Name, "news", "view"));
            defaults.Add((role.Name, "profile", "view"));
            defaults.Add((role.Name, "dashboard", "view"));
        }

        if (orgType.ToLower() == "university")
        {
            // --- STUDENT ---
            defaults.Add(("Student", "grades", "view_own"));
            defaults.Add(("Student", "assignments", "view_own"));
            defaults.Add(("Student", "attendance", "view_own"));
            defaults.Add(("Student", "documents", "view_own")); // Transcripts
            defaults.Add(("Student", "transport", "view"));
            defaults.Add(("Student", "map", "view"));
            defaults.Add(("Student", "events", "view"));
            defaults.Add(("Student", "rooms", "view")); // Library pods

            // --- PROFESSOR ---
            defaults.Add(("Professor", "attendance", "edit"));
            defaults.Add(("Professor", "grades", "edit"));
            defaults.Add(("Professor", "assignments", "edit"));
            defaults.Add(("Professor", "users", "view")); // Directory
            defaults.Add(("Professor", "transport", "view"));

            // --- TEACHING ASSISTANT ---
            defaults.Add(("Teaching Assistant", "attendance", "edit"));
            defaults.Add(("Teaching Assistant", "grades", "edit"));
            defaults.Add(("Teaching Assistant", "assignments", "edit"));

            // --- DEAN ---
            defaults.Add(("Dean", "news", "editor")); // Can post announcements
            defaults.Add(("Dean", "users", "view"));
            defaults.Add(("Dean", "map", "view"));

            // --- REGISTRAR ---
            defaults.Add(("Registrar", "grades", "admin")); // Manage all grades
            defaults.Add(("Registrar", "attendance", "admin"));
            defaults.Add(("Registrar", "documents", "admin")); // Manage Transcripts/Diplomas
            defaults.Add(("Registrar", "users", "edit")); // Manage Student Records

            // --- OPERATIONS (Uni) ---
            defaults.Add(("Operations", "map", "admin"));
            defaults.Add(("Operations", "transport", "admin")); // Manage Shuttles
            defaults.Add(("Operations", "rooms", "admin"));
        }
        else // CORPORATE
        {
            // --- EMPLOYEE ---
            defaults.Add(("Employee", "tasks", "view_own"));
            defaults.Add(("Employee", "documents", "view_own")); // Contracts/Payslips
            defaults.Add(("Employee", "finance", "view_own")); // Expenses
            defaults.Add(("Employee", "map", "view"));
            defaults.Add(("Employee", "rooms", "view"));

            // --- TEAM LEAD ---
            defaults.Add(("Team Lead", "tasks", "edit")); // Manage team tasks
            defaults.Add(("Team Lead", "users", "view"));
            defaults.Add(("Team Lead", "rooms", "edit"));

            // --- PROJECT MANAGER ---
            defaults.Add(("Project Manager", "tasks", "admin"));
            defaults.Add(("Project Manager", "documents", "edit")); // Project specs
            defaults.Add(("Project Manager", "finance", "view_team")); // Project Budget

            // --- DIRECTOR ---
            defaults.Add(("Director", "news", "editor"));
            defaults.Add(("Director", "finance", "view_all")); // Dept Budget

            // --- HR MANAGER ---
            defaults.Add(("HR Manager", "news", "editor"));
            defaults.Add(("HR Manager", "users", "admin")); // Hiring/Firing
            defaults.Add(("HR Manager", "documents", "admin")); // Contracts
            defaults.Add(("HR Manager", "finance", "admin")); // Payroll

            // --- OPERATIONS (Corp) ---
            defaults.Add(("Operations", "map", "admin"));
            defaults.Add(("Operations", "transport", "admin"));
            defaults.Add(("Operations", "rooms", "admin"));
        }

        // --- ADMIN (SuperUser) ---
        defaults.Add(("Admin", "news", "admin"));
        defaults.Add(("Admin", "users", "admin"));
        defaults.Add(("Admin", "settings", "admin"));

        // Apply to Database
        foreach (var def in defaults)
        {
            // Find the role in the list we created earlier
            var role = roles.FirstOrDefault(r => r.Name.Equals(def.Role, StringComparison.OrdinalIgnoreCase));
            if (role != null)
            {
                await _roleRepository.SaveRoleWidgetAccessAsync(role.Id, def.WidgetKey, def.Access, transaction);
            }
        }
    }
}
