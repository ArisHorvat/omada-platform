namespace Omada.Api.Infrastructure.Options;

/// <summary>
/// Maps legacy <c>ROBOFLOW_*</c> environment variables (from <c>.env</c>) onto <see cref="RoboflowFloorplanOptions"/>.
/// <c>appsettings.json</c> / <c>Roboflow__*</c> values take precedence when already set.
/// </summary>
public static class RoboflowFloorplanEnvFallbacks
{
    public static void Apply(RoboflowFloorplanOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.ApiKey))
            options.ApiKey = Env("ROBOFLOW_API_KEY");

        var modelId = Env("ROBOFLOW_MODEL_ID");
        if (!string.IsNullOrWhiteSpace(modelId))
            options.ModelId = modelId;

        var elementsModelId = Env("ROBOFLOW_ELEMENTS_MODEL_ID");
        if (!string.IsNullOrWhiteSpace(elementsModelId))
        {
            options.ElementsModelId = elementsModelId;
            var elementsFlag = Env("ROBOFLOW_ELEMENTS_MODEL_ENABLED");
            if (string.IsNullOrWhiteSpace(elementsFlag))
                options.ElementsModelEnabled = true;
            else
                options.ElementsModelEnabled = IsTruthy(elementsFlag);
        }
        else
        {
            var elementsFlag = Env("ROBOFLOW_ELEMENTS_MODEL_ENABLED");
            if (!string.IsNullOrWhiteSpace(elementsFlag))
                options.ElementsModelEnabled = IsTruthy(elementsFlag);
        }

        var includeDww = Env("AI_FLOORPLAN_INCLUDE_DOOR_WINDOW_WALL_POLYGONS");
        if (!string.IsNullOrWhiteSpace(includeDww))
            options.IncludeDoorWindowWallPolygons = IsTruthy(includeDww);

        var apiUrl = Env("ROBOFLOW_API_URL");
        if (!string.IsNullOrWhiteSpace(apiUrl))
            options.ApiUrl = apiUrl.TrimEnd('/');
    }

    private static string? Env(string name) =>
        Environment.GetEnvironmentVariable(name)?.Trim();

    private static bool IsTruthy(string? value) =>
        !string.IsNullOrWhiteSpace(value)
        && value.Trim().ToLowerInvariant() is "1" or "true" or "yes" or "on";
}
