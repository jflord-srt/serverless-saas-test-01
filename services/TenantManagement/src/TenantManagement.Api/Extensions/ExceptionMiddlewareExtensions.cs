// <copyright file="ExceptionMiddlewareExtensions.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using System.Net;
using System.Text.Json;

using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SilkRoad.TenantManagement.Api.Infrastructure;
using SilkRoad.TenantManagement.Core.Configuration;

namespace SilkRoad.TenantManagement.Api.Extensions;

/// <summary>
/// The ExceptionMiddlewareExtensions class.
/// </summary>
public static class ExceptionMiddlewareExtensions {

    /// <summary>
    /// Configures the exception handler.
    /// </summary>
    /// <param name="app">The application.</param>
    public static void ConfigureExceptionHandler(this IApplicationBuilder app) {
        app.UseExceptionHandler(builder => {
            builder.Run(async context => {
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                context.Response.ContentType = "application/json";
                var contextFeature = context.Features.Get<IExceptionHandlerFeature>();
                var exception = contextFeature?.Error;
                if (exception is not null) {
                    var loggerFactory = context.RequestServices.GetRequiredService<ILoggerFactory>();
                    var logger = loggerFactory.CreateLogger(nameof(ExceptionMiddlewareExtensions));
                    var environmentInfo = context.RequestServices.GetRequiredService<EnvironmentInfo>();
                    var jsonOptions = context.RequestServices.GetService<IOptions<JsonOptions>>();

                    logger.LogError("Unhandled exception: {0}", exception.ToString());

                    var apiError = ApiError.FromException(exception, "Unhandled exception", environmentInfo.IsDevelopment);

                    // Serialize using the settings provided
                    var json = JsonSerializer.Serialize(apiError, jsonOptions?.Value.JsonSerializerOptions);

                    await context.Response.WriteAsync(json);
                }
            });
        });
    }
}
