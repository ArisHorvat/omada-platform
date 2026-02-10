using Omada.Api.DTOs.Import;
using Omada.Api.Entities;

namespace Omada.Api.Services.Interfaces;

public interface IImportService
{
    Task<Result<List<UserImportDto>>> ParseUsersAsync(Stream stream, string fileName);
}