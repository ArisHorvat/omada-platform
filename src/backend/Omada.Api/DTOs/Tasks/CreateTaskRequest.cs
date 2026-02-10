namespace Omada.Api.DTOs.Tasks;

public class CreateTaskRequest 
{ 
    public string Title { get; set; } = ""; 
    public DateTime? DueDate { get; set; } 
}
