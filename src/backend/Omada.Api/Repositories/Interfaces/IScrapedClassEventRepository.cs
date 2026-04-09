using Omada.Api.Entities;

namespace Omada.Api.Repositories.Interfaces;

/// <summary>
/// Data access for <see cref="ScrapedClassEvent"/> (timetable spider / thesis pipeline).
/// </summary>
public interface IScrapedClassEventRepository : IGenericRepository<ScrapedClassEvent>
{
}
