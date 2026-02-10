namespace Omada.Api.DTOs.Chat;


public class CreateMessageRequest 
{ 
    public string Content { get; set; } = ""; 
    public string? UserName { get; set; } 
}