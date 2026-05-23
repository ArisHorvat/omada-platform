using DotNetEnv;

namespace Omada.Api.Infrastructure.Configuration;

/// <summary>
/// Loads <c>.env</c> / <c>.env.local</c> into process environment variables before configuration binding.
/// </summary>
public static class DotEnvBootstrap
{
    private static readonly LoadOptions LoadOptions = new(
        setEnvVars: true,
        clobberExistingVars: false,
        onlyExactPath: false);

    /// <summary>
    /// Loads env files from the working directory and (when provided) the ASP.NET content root.
    /// Later files do not override variables already set (e.g. machine env, CI secrets).
    /// </summary>
    public static void LoadForOmadaApi(string? contentRootPath = null)
    {
        LoadFromDirectory(Directory.GetCurrentDirectory());

        if (!string.IsNullOrWhiteSpace(contentRootPath))
        {
            var normalized = Path.GetFullPath(contentRootPath);
            var cwd = Path.GetFullPath(Directory.GetCurrentDirectory());
            if (!string.Equals(normalized, cwd, StringComparison.OrdinalIgnoreCase))
                LoadFromDirectory(normalized);
        }
    }

    private static void LoadFromDirectory(string directory)
    {
        foreach (var fileName in new[] { ".env", ".env.local" })
        {
            var path = Path.Combine(directory, fileName);
            if (!File.Exists(path))
                continue;

            Env.Load(path, LoadOptions);
        }
    }
}
