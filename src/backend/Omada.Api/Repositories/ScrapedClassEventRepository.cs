using Omada.Api.Data;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;

namespace Omada.Api.Repositories;

public class ScrapedClassEventRepository : GenericRepository<ScrapedClassEvent>, IScrapedClassEventRepository
{
    public ScrapedClassEventRepository(ApplicationDbContext context)
        : base(context)
    {
    }
}
