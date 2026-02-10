namespace Omada.Api.Abstractions;

public record ServiceResponse<T>(
    bool IsSuccess,
    T? Data = default,
    AppError? Error = null
);

public record ServiceResponse(
    bool IsSuccess,
    AppError? Error = null
);