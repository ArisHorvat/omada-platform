using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Omada.Api.Abstractions;

namespace Omada.Api.Infrastructure.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // Proceed to the next middleware/controller
            await _next(context);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access attempt: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex, HttpStatusCode.Unauthorized, ErrorCodes.Unauthorized);
        }
        catch (Exception ex)
        {
            // Catch EVERYTHING else
            _logger.LogError(ex, "An unhandled exception occurred during the request.");
            await HandleExceptionAsync(context, ex, HttpStatusCode.InternalServerError, ErrorCodes.InternalError);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception, HttpStatusCode statusCode, string errorCode)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var env = context.RequestServices.GetService<IWebHostEnvironment>();
        var detail = env?.IsDevelopment() == true ? BuildDevelopmentDetail(exception) : null;

        var response = new ServiceResponse(false, new AppError(errorCode, exception.Message, detail));

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        return context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }

    /// <summary>Rich context for mobile/web while developing; never sent in Production.</summary>
    private static string BuildDevelopmentDetail(Exception ex)
    {
        var sb = new StringBuilder();
        var depth = 0;
        for (var cur = ex; cur != null && depth < 8; cur = cur.InnerException, depth++)
        {
            if (sb.Length > 0)
                sb.AppendLine().AppendLine("---").AppendLine();
            sb.Append(cur.GetType().FullName).Append(": ").Append(cur.Message);
        }

        if (!string.IsNullOrEmpty(ex.StackTrace))
        {
            sb.AppendLine().AppendLine("---").AppendLine("Stack trace:").AppendLine(ex.StackTrace);
        }

        const int maxLen = 8000;
        var s = sb.ToString();
        return s.Length <= maxLen ? s : s[..maxLen] + "…";
    }
}