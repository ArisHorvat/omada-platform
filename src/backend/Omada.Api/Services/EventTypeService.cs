using Microsoft.EntityFrameworkCore;
using Omada.Api.Abstractions;
using Omada.Api.DTOs.Schedule;
using Omada.Api.Entities;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Services.Interfaces;

namespace Omada.Api.Services;

public class EventTypeService : IEventTypeService
{
    private readonly IUnitOfWork _uow;
    private readonly IUserContext _userContext;

    public EventTypeService(IUnitOfWork uow, IUserContext userContext)
    {
        _uow = uow;
        _userContext = userContext;
    }

    public async Task<ServiceResponse<IEnumerable<EventTypeDto>>> GetAllAsync()
    {
        var orgId = _userContext.OrganizationId;
        var types = await _uow.Repository<EventType>()
            .GetQueryable()
            .AsNoTracking()
            .Where(x => x.OrganizationId == orgId)
            .OrderBy(x => x.Name)
            .Select(x => new EventTypeDto { Id = x.Id, Name = x.Name, Color = x.ColorHex })
            .ToListAsync();

        return new ServiceResponse<IEnumerable<EventTypeDto>>(true, types);
    }

    public async Task<ServiceResponse<EventTypeDto>> CreateAsync(CreateEventTypeRequest request)
    {
        var orgId = _userContext.OrganizationId;

        // Optional: Check for duplicates
        var exists = await _uow.Repository<EventType>()
            .GetQueryable()
            .AnyAsync(x => x.OrganizationId == orgId && x.Name == request.Name);
        
        if (exists) return new ServiceResponse<EventTypeDto>(false, null, new AppError("DUPLICATE", "Event type already exists."));

        var entity = new EventType
        {
            OrganizationId = orgId,
            Name = request.Name,
            ColorHex = request.ColorHex
        };

        await _uow.Repository<EventType>().AddAsync(entity);
        await _uow.CompleteAsync();

        return new ServiceResponse<EventTypeDto>(true, new EventTypeDto { Id = entity.Id, Name = entity.Name, Color = entity.ColorHex });
    }

    public async Task<ServiceResponse<EventTypeDto>> UpdateAsync(Guid id, CreateEventTypeRequest request)
    {
        var orgId = _userContext.OrganizationId;
        var entity = await _uow.Repository<EventType>().GetByIdAsync(id);

        if (entity == null || entity.OrganizationId != orgId)
            return new ServiceResponse<EventTypeDto>(false, null, new AppError("NOT_FOUND", "Event type not found."));

        entity.Name = request.Name;
        entity.ColorHex = request.ColorHex;

        _uow.Repository<EventType>().Update(entity);
        await _uow.CompleteAsync();

        return new ServiceResponse<EventTypeDto>(true, new EventTypeDto { Id = entity.Id, Name = entity.Name, Color = entity.ColorHex });
    }

    public async Task<ServiceResponse<bool>> DeleteAsync(Guid id)
    {
        var orgId = _userContext.OrganizationId;
        var entity = await _uow.Repository<EventType>().GetByIdAsync(id);

        if (entity == null || entity.OrganizationId != orgId)
            return new ServiceResponse<bool>(false, false, new AppError("NOT_FOUND", "Event type not found."));

        // Note: Because we set OnDelete(Restrict), this will fail if Events exist.
        // You might want to try/catch here or check for usage first.
        try 
        {
            _uow.Repository<EventType>().Remove(entity);
            await _uow.CompleteAsync();
            return new ServiceResponse<bool>(true, true);
        }
        catch
        {
             return new ServiceResponse<bool>(false, false, new AppError("IN_USE", "Cannot delete this type because it is used by events or rooms."));
        }
    }
}