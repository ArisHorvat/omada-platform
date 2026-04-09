using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Omada.Api.Abstractions;

namespace Omada.Api.Infrastructure.Filters;

public class ValidationFilterAttribute : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        // Loop through all objects sent in the HTTP request (e.g., the JSON body)
        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument == null) continue;

            // Look for a registered validator for this specific object type
            var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
            var validator = context.HttpContext.RequestServices.GetService(validatorType) as IValidator;

            if (validator != null)
            {
                var validationContext = new ValidationContext<object>(argument);
                var validationResult = await validator.ValidateAsync(validationContext);

                if (!validationResult.IsValid)
                {
                    // Format errors: "Email is required. | Password is too short."
                    var errorMessage = string.Join(" | ", validationResult.Errors.Select(e => e.ErrorMessage));
                    
                    // Return your standardized AppError!
                    var errorResponse = new ServiceResponse(false, new AppError(ErrorCodes.InvalidInput, errorMessage));
                    context.Result = new BadRequestObjectResult(errorResponse);
                    return; // Short-circuit the request (Controller never gets hit)
                }
            }
        }

        // Data is valid, proceed to the Controller
        await next();
    }
}