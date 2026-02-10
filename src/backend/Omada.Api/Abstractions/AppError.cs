namespace Omada.Api.Abstractions;

public record AppError(string Code, string Message);

public static class ErrorCodes
{
    public const string Unauthorized = "AUTH_001";
    public const string Forbidden = "AUTH_002";
    public const string NotFound = "DATA_404";
    public const string InternalError = "SYS_500";
    public const string InvalidInput = "REQ_400";
    public const string OperationFailed = "OPS_001";
}