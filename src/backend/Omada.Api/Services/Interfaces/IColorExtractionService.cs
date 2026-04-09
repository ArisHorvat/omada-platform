using Omada.Api.Abstractions;
using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces;

public interface IColorExtractionService
{
    Task<ServiceResponse<List<string>>> ExtractColorsAsync(Stream imageStream);
}