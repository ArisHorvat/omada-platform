using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Entities;

namespace Omada.Api.Data;

public class ApplicationDbContext : DbContext
{
    /// <summary>
    /// Captured when the context is created (scoped per HTTP request). When null (no JWT org claim),
    /// organization filters are not applied—only soft-delete filters—so seeding and design-time work.
    /// Authenticated API requests should always resolve a tenant via <see cref="ITenantAccessor"/>.
    /// </summary>
    private readonly Guid? _currentOrganizationId;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ITenantAccessor tenantAccessor)
        : base(options)
    {
        _currentOrganizationId = tenantAccessor.CurrentOrganizationId;
    }

    // DbSets (Tables)
    public DbSet<Organization> Organizations { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<OrganizationMember> OrganizationMembers { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Group> Groups { get; set; }
    public DbSet<GroupMember> GroupMembers { get; set; }
    public DbSet<Event> Events { get; set; }
    public DbSet<EventOverride> EventOverrides { get; set; }
    public DbSet<EventAssociation> EventAssociations { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<TaskItem> Tasks { get; set; }
    public DbSet<NewsItem> News { get; set; }
    public DbSet<UserNewsRead> UserNewsReads { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Building> Buildings { get; set; }
    public DbSet<Floor> Floors { get; set; }
    public DbSet<MapPin> MapPins { get; set; }
    public DbSet<Floorplan> Floorplans { get; set; }
    public DbSet<RoomBooking> RoomBookings { get; set; }
    public DbSet<EventType> EventTypes { get; set; }
    public DbSet<ScrapedClassEvent> ScrapedClassEvents { get; set; }
    public DbSet<Grade> Grades { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        ApplyOrganizationScopedQueryFilters(modelBuilder);
    }

    /// <summary>
    /// Tenant + soft-delete filters for org-owned data. Intentionally excludes <see cref="Organization"/>,
    /// <see cref="User"/>, <see cref="OrganizationMember"/> (cross-org membership), and <see cref="RefreshToken"/>.
    /// </summary>
    private void ApplyOrganizationScopedQueryFilters(ModelBuilder modelBuilder)
    {
        // Direct OrganizationId on entity
        modelBuilder.Entity<NewsItem>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentOrganizationId == null || e.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<Group>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentOrganizationId == null || e.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<Role>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentOrganizationId == null || e.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<Event>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentOrganizationId == null || e.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<EventType>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentOrganizationId == null || e.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<TaskItem>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentOrganizationId == null || e.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<Grade>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentOrganizationId == null || e.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<Message>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentOrganizationId == null || e.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<Building>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentOrganizationId == null || e.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<Floor>().HasQueryFilter(f =>
            !f.IsDeleted &&
            (_currentOrganizationId == null || f.Building.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<MapPin>().HasQueryFilter(p =>
            !p.IsDeleted &&
            (_currentOrganizationId == null || p.Floor.Building.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<Floorplan>().HasQueryFilter(p =>
            !p.IsDeleted &&
            (_currentOrganizationId == null || p.Floor.Building.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<RoomBooking>().HasQueryFilter(b =>
            !b.IsDeleted && (_currentOrganizationId == null || b.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<Room>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentOrganizationId == null || e.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<ScrapedClassEvent>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentOrganizationId == null || e.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<UserNewsRead>().HasQueryFilter(e =>
            !e.IsDeleted && (_currentOrganizationId == null || e.NewsItem.OrganizationId == _currentOrganizationId));

        // Scoped via parent Event
        modelBuilder.Entity<EventAssociation>().HasQueryFilter(ea =>
            !ea.IsDeleted &&
            (_currentOrganizationId == null || ea.Event.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<EventOverride>().HasQueryFilter(eo =>
            !eo.IsDeleted &&
            (_currentOrganizationId == null || eo.Event.OrganizationId == _currentOrganizationId));

        modelBuilder.Entity<EventAttendance>().HasQueryFilter(ea =>
            !ea.IsDeleted &&
            (_currentOrganizationId == null || ea.Event.OrganizationId == _currentOrganizationId));
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
