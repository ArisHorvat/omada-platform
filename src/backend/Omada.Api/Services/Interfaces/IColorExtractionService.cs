using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces;

public interface IColorExtractionService
{
    Task<Result<List<string>>> ExtractColorsAsync(Stream imageStream);
}