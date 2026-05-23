# Omada Backend

ASP.NET Core **.NET 8** API (`Omada.Api`) — authentication, multi-tenant data, widgets, organization admin, platform admin, universal search, real-time chat, map/floorplans, web spider, and Hangfire jobs.

**Full structure guide:** [`../../docs/Backend.md`](../../docs/Backend.md)  
**Configuration:** [`../../docs/Configuration.md`](../../docs/Configuration.md)

## Run locally

```bash
cd Omada.Api
copy .env.example .env
dotnet run
```

Swagger: `http://localhost:5069/swagger`

## Solution

| Project | Role |
|---------|------|
| **Omada.Api** | Main API (see `Omada.sln`) |
| **Omada.Web** | Optional Razor template — not in main solution |

## Related docs

- [`../../docs/Backend.md`](../../docs/Backend.md) — folders, controllers, services, features  
- [`../../docs/Configuration.md`](../../docs/Configuration.md) — `.env` and appsettings  
- [`../../docs/WebSpider.md`](../../docs/WebSpider.md) — web spider  
- [`../../docs/Frontend.md`](../../docs/Frontend.md) — mobile client  
