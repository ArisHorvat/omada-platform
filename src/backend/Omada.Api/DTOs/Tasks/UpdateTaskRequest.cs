namespace Omada.Api.DTOs.Tasks;

public class UpdateTaskRequest 
{ 
    public string Title { get; set; } = ""; 
    public bool IsCompleted { get; set; } 
    public DateTime? DueDate { get; set; } 
}