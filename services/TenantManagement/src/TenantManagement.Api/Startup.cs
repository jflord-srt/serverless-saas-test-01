// <copyright file="Startup.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

using Microsoft.AspNetCore.Mvc.ApplicationModels;
using SilkRoad.TenantManagement.Api.Extensions;
using SilkRoad.TenantManagement.Core;
using SilkRoad.TenantManagement.Core.Configuration;

namespace SilkRoad.TenantManagement.Api;

/// <summary>
/// The Startup class.
/// </summary>
public class Startup {

    /// <summary>
    /// Initializes a new instance of the <see cref="Startup"/> class.
    /// </summary>
    /// <param name="configuration">The configuration.</param>
    public Startup(IConfiguration configuration) {
        this.Configuration = configuration;
    }

    /// <summary>
    /// Gets the configuration.
    /// </summary>
    /// <value>The configuration.</value>
    public IConfiguration Configuration { get; }

    /// <summary>
    /// Configures the services.
    /// </summary>
    /// <remarks>
    /// This method gets called by the runtime. Use this method to add services to the container.
    /// </remarks>
    /// <param name="services">The services.</param>
    public void ConfigureServices(IServiceCollection services) {
        services.AddHttpClient(nameof(TenantManagement), client => {
            // We need a short timeout to help diagnose issues, we want to timeout before the Lambda execution times out so we can log issues.
            client.Timeout = TimeSpan.FromSeconds(15);
        });

        services.AddCognitoAuthentication(this.Configuration);

        services.AddTenantManagementCore(this.Configuration);

        var mvcBuilder = services.AddControllers(options => {
            options.Conventions.Add(new RouteTokenTransformerConvention(new LowerKebabCaseParameterTransformer()));
        });

        mvcBuilder.AddJsonOptions(options => {
            options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        });

        services.AddApiDocs();
    }

    /// <summary>
    /// Configures the specified application.
    /// </summary>
    /// <param name="app">The application.</param>
    /// <param name="env">The env.</param>
    /// <remarks>
    /// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
    /// </remarks>
    public void Configure(IApplicationBuilder app, IWebHostEnvironment env) {
        if (env.IsDevelopment()) {
            app.UseDeveloperExceptionPage();
        }

        app.ConfigureExceptionHandler();

        // Gather and store environmental values in the services collection as the EnvironmentInfo singleton.
        var environmentInfo = app.ApplicationServices.GetRequiredService<EnvironmentInfo>();
        environmentInfo.EnvironmentName = env.EnvironmentName;
        environmentInfo.IsDevelopment = env.IsDevelopment();

        app.UseSwagger(c => {
            c.RouteTemplate = "api/docs/swagger/{documentname}/swagger.json";
        });
        app.UseSwaggerUI(options => {
            options.SwaggerEndpoint("/api/docs/swagger/v1/swagger.json", "v1");
            options.RoutePrefix = "api/docs";
        });

        app.UseHttpsRedirection();

        // CORS is handled by the API Gateway, but we still need to respond to OPTIONS requests for that to work. The origin settings are replaced by the ApiGateway.
        app.UseCors(builder =>
            builder.WithOrigins("http://*", "https://*")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials());

        app.UseRouting();

        app.UseAuthentication();
        app.UseAuthorization();

        app.UseEndpoints(endpoints => {
            // Redirect the root "/" to the api docs. We don't host the docs on the root because under CloudFront, the root is used by the app UI
            endpoints.MapGet("/", async context => {
                await Task.CompletedTask;
                context.Response.Redirect("api/docs/index.html");
            });
            endpoints.MapGet("/index.html", async context => {
                await Task.CompletedTask;
                context.Response.Redirect("api/docs/index.html");
            });
            endpoints.MapControllers();
        });
    }
}
