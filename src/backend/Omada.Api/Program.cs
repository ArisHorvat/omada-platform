using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Builder;
using Omada.Api.Services.Interfaces;
using Omada.Api.Services;
using Omada.Api.Repositories.Interfaces;
using Omada.Api.Repositories;
using Omada.Api.WebSocketHandlers;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin();
    });
});

builder.Services.AddSingleton<IWebSocketHandler, WebSocketHandler>();

builder.Services.AddScoped<IOrganizationService, OrganizationService>();
builder.Services.AddScoped<IOrganizationRepository, OrganizationRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<IWidgetRepository, WidgetRepository>();

// Register your database connection
builder.Services.AddScoped<IDbConnection>(sp =>
    new SqlConnection(builder.Configuration.GetConnectionString("DefaultConnection"))
);


builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

// Enable static file serving from the wwwroot folder
app.UseStaticFiles();

//app.UseHttpsRedirection();

app.UseWebSockets();

app.MapControllers();

app.Run();
