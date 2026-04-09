using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Schedule;

public class CreateEventTypeRequest
{
    public string Name { get; set; } = string.Empty;

    public string ColorHex { get; set; } = "#3b82f6";
}