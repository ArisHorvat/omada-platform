namespace Omada.Api.Abstractions;

public record ServiceResponse<T>(
    bool IsSuccess,
    string Message,
    T? Data
);

public record ServiceResponse(
    bool IsSuccess,
    string Message
);
