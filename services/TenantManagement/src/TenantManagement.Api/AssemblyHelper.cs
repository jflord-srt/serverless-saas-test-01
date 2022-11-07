// <copyright file="AssemblyHelper.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using System.Net;
using System.Reflection;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using SilkRoad.TenantManagement.Api.Infrastructure;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace SilkRoad.TenantManagement.Api;

/// <summary>
/// The AssemblyHelper class.
/// </summary>
public static class AssemblyHelper {

    /// <summary>
    /// Adds the cognito Bearer authentication scheme.
    /// </summary>
    /// <param name="services">The services.</param>
    /// <param name="configuration">The configuration.</param>
    /// <returns>IServiceCollection.</returns>
    public static IServiceCollection AddCognitoAuthentication(this IServiceCollection services, IConfiguration configuration) {
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(); // Configured via NamedOptions (CognitoJwtBearerOptionsConfigurator)

        // Add the Cognito JwtBearerOptions configurator
        services.AddSingleton<IConfigureOptions<JwtBearerOptions>, CognitoJwtBearerOptionsConfigurator>();

        return services;
    }

    /// <summary>
    /// Adds the API docs.
    /// </summary>
    /// <param name="serviceCollection">The service collection.</param>
    /// <returns>IServiceCollection.</returns>
    public static IServiceCollection AddApiDocs(this IServiceCollection serviceCollection) {
        //---------------------------------------------
        // Swagger generator
        //---------------------------------------------
        serviceCollection.AddSwaggerGen(c => {
            // Set the comments path for the Swagger JSON and UI.
            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            c.IncludeXmlComments(xmlPath);

            // Define the HTTP bearer scheme
            c.AddSecurityDefinition(
                "Authorization",
                new OpenApiSecurityScheme() {
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                });

            // Inject a filter that adds security requirements and 401/403 as expected response codes for secured endpoints
            c.OperationFilter<AuthResponsesOperationFilter>();
        });

        return serviceCollection;
    }

    /// <summary>
    /// The AuthResponsesOperationFilter class. This class cannot be inherited.
    /// Implements the <see cref="IOperationFilter" />
    /// </summary>
    /// <remarks>Filter that lists additional "401" and "403" response codes for all actions that are decorated with the AuthorizeAttribute.</remarks>
    /// <seealso cref="IOperationFilter" />
    private sealed class AuthResponsesOperationFilter : IOperationFilter {

        /// <inheritdoc/>
        public void Apply(OpenApiOperation operation, OperationFilterContext context) {
            if (context?.MethodInfo?.DeclaringType is not null) {
                var authAttributes = context.MethodInfo.DeclaringType.GetCustomAttributes(true)
                    .Union(context.MethodInfo.GetCustomAttributes(true))
                    .OfType<AuthorizeAttribute>();

                var allowAnonymousAttributes = context.MethodInfo.DeclaringType.GetCustomAttributes(true)
                    .Union(context.MethodInfo.GetCustomAttributes(true))
                    .OfType<AllowAnonymousAttribute>();

                if (allowAnonymousAttributes.Any() == false && authAttributes.Any() == true) {
                    operation.Security = new List<OpenApiSecurityRequirement>() {
                        new OpenApiSecurityRequirement {
                            {
                                new OpenApiSecurityScheme {
                                    Reference = new OpenApiReference {
                                        Type = ReferenceType.SecurityScheme,
                                        Id = "Authorization",
                                    },
                                },
                                new List<string>()
                            },
                        },
                    };

                    operation.Responses.Add($"{HttpStatusCode.Unauthorized:d}", new OpenApiResponse { Description = nameof(HttpStatusCode.Unauthorized) });
                    operation.Responses.Add($"{HttpStatusCode.Forbidden:d}", new OpenApiResponse { Description = nameof(HttpStatusCode.Forbidden) });
                }
            }
        }
    }
}
