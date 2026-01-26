namespace Omada.Api.Services.Interfaces;

public interface IColorExtractionService
{
    Task<List<string>> ExtractColorsAsync(Stream imageStream);
}
