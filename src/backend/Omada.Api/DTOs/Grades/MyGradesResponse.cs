using System.ComponentModel.DataAnnotations;

namespace Omada.Api.DTOs.Grades;

public class MyGradesResponse
{
    [Required]
    public required IReadOnlyList<GradeDto> Grades { get; set; }

    /// <summary>Weighted GPA on a 4.0 scale for courses with credits &gt; 0.</summary>
    [Required]
    public required decimal CurrentGpa { get; set; }

    /// <summary>Sum of credit hours included in the GPA calculation.</summary>
    [Required]
    public required decimal TotalCredits { get; set; }
}
