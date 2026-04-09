using Omada.Api.Services.Interfaces;
using Omada.Api.Abstractions;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace Omada.Api.Services;

public class ColorExtractionService : IColorExtractionService
{
    public async Task<ServiceResponse<List<string>>> ExtractColorsAsync(Stream imageStream)
    {
        if (imageStream.CanSeek) imageStream.Position = 0;

        using var image = await Image.LoadAsync<Rgba32>(imageStream);
        image.Mutate(x => x.Resize(100, 100));

        var colorCounts = new Dictionary<Rgba32, int>();

        for (int y = 0; y < image.Height; y++)
        {
            for (int x = 0; x < image.Width; x++)
            {
                var pixel = image[x, y];
                if (pixel.A < 128) continue; 
                if (pixel.R > 240 && pixel.G > 240 && pixel.B > 240) continue; 

                pixel.R = (byte)(Math.Round(pixel.R / 10.0) * 10);
                pixel.G = (byte)(Math.Round(pixel.G / 10.0) * 10);
                pixel.B = (byte)(Math.Round(pixel.B / 10.0) * 10);

                if (!colorCounts.ContainsKey(pixel))
                    colorCounts[pixel] = 0;
                colorCounts[pixel]++;
            }
        }

        var sortedColors = colorCounts.OrderByDescending(c => c.Value)
                                        .Select(c => ToHex(c.Key))
                                        .Distinct()
                                        .Take(6)
                                        .ToList();

        if (!sortedColors.Any())
        {
            return new ServiceResponse<List<string>>(true, new List<string> { "#3b82f6", "#64748b", "#eab308" });
        }

        return new ServiceResponse<List<string>>(true, sortedColors);
    }

    private string ToHex(Rgba32 c) => $"#{c.R:X2}{c.G:X2}{c.B:X2}".ToLower();
}