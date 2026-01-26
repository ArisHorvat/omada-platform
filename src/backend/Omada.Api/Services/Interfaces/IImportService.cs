using Omada.Api.DTOs.Import;
using Omada.Api.Services;

namespace Omada.Api.Services.Interfaces;

public interface IImportService
{
    Task<List<UserImportDto>> ParseUsersAsync(Stream stream, string fileName);
}