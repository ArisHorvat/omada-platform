using Omada.Api.Abstractions;
using Omada.Api.DTOs.Import;

namespace Omada.Api.Services.Interfaces;

public interface IImportService
{
    Task<ServiceResponse<List<UserImportDto>>> ParseUsersAsync(Stream stream, string fileName);
}