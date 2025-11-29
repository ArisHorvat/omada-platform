using System.Data;
using Omada.Api.Services.Interfaces;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Entities;
using Omada.Api.WebSocketHandlers;

namespace Omada.Api.Services;

public class OrganizationService : IOrganizationService
{
    private readonly IOrganizationRepository _organizationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IWidgetRepository _widgetRepository;
    private readonly IDbConnection _dbConnection;
    private readonly IWebSocketHandler _webSocketHandler;
    private readonly ILogger<OrganizationService> _logger;

    public OrganizationService(IOrganizationRepository organizationRepository, 
        IUserRepository userRepository, 
        IRoleRepository roleRepository, 
        IWidgetRepository widgetRepository,
        IDbConnection dbConnection,
        IWebSocketHandler webSocketHandler,
        ILogger<OrganizationService> logger)
    {
        _organizationRepository = organizationRepository;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _widgetRepository = widgetRepository;
        _dbConnection = dbConnection;
        _webSocketHandler = webSocketHandler;
        _logger = logger;
    }

    public async Task<Result<Organization>> CreateOrganizationAsync(CreateOrganizationRequest request)
    {
        // Before starting a transaction, do checks that don't require one.
        if (await _organizationRepository.ExistsByDomainAsync(request.EmailDomain))
        {
            _logger.LogWarning("Attempted to create organization with existing domain: {Domain}", request.EmailDomain);
            return Result<Organization>.Failure("An organization with this email domain already exists.");
        }

        _logger.LogInformation("Starting transaction for creating organization: {Name}", request.Name);
        _dbConnection.Open();
        using var transaction = _dbConnection.BeginTransaction();
        try
        {
            // 1. Use the Domain entity's factory to create a valid object
            var organizationResult = Organization.Create(
                request.Name, request.ShortName, request.EmailDomain, request.LogoUrl,
                request.PrimaryColor, request.SecondaryColor, request.AccentColor
            );
            if (organizationResult.IsFailure) return Result<Organization>.Failure(organizationResult.Error!);
            var organization = organizationResult.Value!;

            // 2. Persist the new organization
            await _organizationRepository.CreateAsync(organization, transaction);

            // 3. Create the admin user associated with this organization.
            var userResult = User.Create(organization.Id, request.AdminName, request.AdminEmail, request.Password, organization.EmailDomain);
            if (userResult.IsFailure)
            {
                // This will trigger the catch block and roll back the transaction
                // We return a failure result which will be caught and handled.
                return Result<Organization>.Failure(userResult.Error!);
            }
            await _userRepository.CreateAsync(userResult.Value!, transaction);

            // 4. Create the custom roles
            var roles = request.Roles.Select(roleName => Role.Create(organization.Id, roleName));
            await _roleRepository.AddRangeAsync(roles, transaction);

            // 5. Save the selected widgets
            var widgets = request.Widgets.Select(widgetName => Widget.Create(organization.Id, widgetName));
            await _widgetRepository.AddRangeAsync(widgets, transaction);

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
                organization.AccentColor,
                Roles = request.Roles,
                Widgets = request.Widgets
            };
            await _webSocketHandler.BroadcastAsync(new { type = "create", data = broadcastData });
            return Result<Organization>.Success(organization);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating organization");
            // If any operation fails, roll back all changes
            transaction.Rollback();
            // Return a generic failure message to avoid leaking implementation details.
            return Result<Organization>.Failure("An unexpected error occurred during registration. Please try again.");
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

            organization.Update(request.Name, request.EmailDomain, request.PrimaryColor, request.SecondaryColor, request.AccentColor);
            await _organizationRepository.UpdateAsync(organization, transaction);

            // Update Roles: Delete existing and add new ones
            await _roleRepository.DeleteByOrganizationIdAsync(id, transaction);
            var roles = request.Roles.Select(roleName => Role.Create(id, roleName));
            await _roleRepository.AddRangeAsync(roles, transaction);

            // Update Widgets: Delete existing and add new ones
            await _widgetRepository.DeleteByOrganizationIdAsync(id, transaction);
            var widgets = request.Widgets.Select(widgetName => Widget.Create(id, widgetName));
            await _widgetRepository.AddRangeAsync(widgets, transaction);

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
                organization.AccentColor,
                Roles = request.Roles,
                Widgets = request.Widgets
            };
            await _webSocketHandler.BroadcastAsync(new { type = "update", data = broadcastData });
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
            await _widgetRepository.DeleteByOrganizationIdAsync(id, transaction);
            // Note: Users should also be deleted here if cascading delete is not enabled in the database.
            // await _userRepository.DeleteByOrganizationIdAsync(id, transaction);

            await _organizationRepository.DeleteAsync(id, transaction);

            transaction.Commit();
            _logger.LogInformation("Organization deleted successfully: {Id}", id);
            await _webSocketHandler.BroadcastAsync(new { type = "delete", id = id });
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
            var widgets = await _widgetRepository.GetByOrganizationIdAsync(org.Id);

            result.Add(new OrganizationDetailsDto
            {
                Id = org.Id,
                Name = org.Name,
                ShortName = org.ShortName,
                EmailDomain = org.EmailDomain,
                LogoUrl = org.LogoUrl,
                PrimaryColor = org.PrimaryColor,
                SecondaryColor = org.SecondaryColor,
                AccentColor = org.AccentColor,
                Roles = roles.Select(r => r.Name),
                Widgets = widgets.Select(w => w.Name)
            });
        }

        return result;
    }

    public async Task<OrganizationDetailsDto?> GetByIdAsync(Guid id)
    {
        var organization = await _organizationRepository.GetByIdAsync(id, null);
        if (organization == null) return null;

        var roles = await _roleRepository.GetByOrganizationIdAsync(id);
        var widgets = await _widgetRepository.GetByOrganizationIdAsync(id);

        return new OrganizationDetailsDto
        {
            Id = organization.Id,
            Name = organization.Name,
            ShortName = organization.ShortName,
            EmailDomain = organization.EmailDomain,
            LogoUrl = organization.LogoUrl,
            PrimaryColor = organization.PrimaryColor,
            SecondaryColor = organization.SecondaryColor,
            AccentColor = organization.AccentColor,
            Roles = roles.Select(r => r.Name),
            Widgets = widgets.Select(w => w.Name)
        };
    }
}
