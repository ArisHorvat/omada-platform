using System.ComponentModel.DataAnnotations;
using Omada.Api.DTOs.Maps;
using Omada.Api.DTOs.Rooms;
using Omada.Api.DTOs.Scraping;

namespace Omada.Api.Tests.Contracts;

/// <summary>
/// Thesis verification: API contract consistency — response DTOs keep required OpenAPI annotations.
/// </summary>
public class ApiContractTests
{
    [Theory]
    [InlineData(typeof(RoomDto), nameof(RoomDto.Id))]
    [InlineData(typeof(RoomDto), nameof(RoomDto.Name))]
    [InlineData(typeof(FloorplanDto), nameof(FloorplanDto.GeoJsonData))]
    [InlineData(typeof(ScrapedEventDto), nameof(ScrapedEventDto.ClassName))]
    public void ResponseDtos_ExposeRequiredPropertiesForNswag(Type dtoType, string propertyName)
    {
        var property = dtoType.GetProperty(propertyName);
        Assert.NotNull(property);
        Assert.Contains(property!.GetCustomAttributes(true), a => a is RequiredAttribute);
    }
}
