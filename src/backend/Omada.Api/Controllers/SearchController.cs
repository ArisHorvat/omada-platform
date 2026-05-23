using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Search;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    /// <summary>Universal org-scoped search across permitted widgets (people, rooms, news, tasks, schedule, groups, grades).</summary>
    [HttpGet]
    public async Task<ActionResult<ServiceResponse<UniversalSearchResponse>>> Search([FromQuery] UniversalSearchRequest request)
    {
        var response = await _searchService.SearchAsync(request);
        return response.IsSuccess ? Ok(response) : BadRequest(response);
    }
}
