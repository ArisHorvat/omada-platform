using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.Data;
using Omada.Api.DTOs.Rooms;
using Omada.Api.Entities;
using Omada.Api.Infrastructure;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BuildingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    // Note: Inject IUserContext here to filter by OrgId if needed

    public BuildingsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [HasPermission(WidgetKeys.Map, nameof(AccessLevel.View))]
    public async Task<ActionResult<ServiceResponse<IEnumerable<BuildingDto>>>> GetAll()
    {
        // 🚀 Quick implementation: Get all buildings
        var buildings = await _context.Set<Building>()
            .AsNoTracking()
            .Where(b => !b.IsDeleted) // Add OrgId check here
            .OrderBy(b => b.Name)
            .Select(b => new BuildingDto 
            { 
                Id = b.Id, 
                Name = b.Name, 
                ShortCode = b.ShortCode,
                Latitude = b.Latitude,
                Longitude = b.Longitude
            })
            .ToListAsync();

        return Ok(new ServiceResponse<IEnumerable<BuildingDto>>(true, buildings));
    }
}