using Omada.Api.Abstractions;
using Omada.Api.DTOs.Search;

namespace Omada.Api.Services.Interfaces;

public interface ISearchService
{
    Task<ServiceResponse<UniversalSearchResponse>> SearchAsync(UniversalSearchRequest request);
}
