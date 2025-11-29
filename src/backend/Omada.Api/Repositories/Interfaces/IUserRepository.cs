using Omada.Api.Entities;
using System.Data;

namespace Omada.Api.Repositories.Interfaces;

public interface IUserRepository
{
    Task CreateAsync(User user, IDbTransaction transaction);
    Task<User?> GetByEmailAsync(string email);
}
