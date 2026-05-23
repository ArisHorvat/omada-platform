using System.ComponentModel.DataAnnotations;
using Omada.Api.Entities;

namespace Omada.Api.DTOs.Scraping;

public class SpiderSyncRunDto
{
    [Required]
    public required Guid Id { get; set; }

    [Required]
    public SpiderSyncKind Kind { get; set; }

    [Required]
    public SpiderSyncStatus Status { get; set; }

    [Required]
    public DateTime StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
    public string? ErrorMessage { get; set; }
    public int ItemsProcessed { get; set; }
    public int ItemsCreated { get; set; }
    public int ItemsUpdated { get; set; }
    public int ItemsRemoved { get; set; }
    public int ItemsSkipped { get; set; }
    public string? HangfireJobId { get; set; }
}
