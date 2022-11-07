// <copyright file="AssemblyHelper.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using Amazon;
using Amazon.CognitoIdentityProvider;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SilkRoad.TenantManagement.Core.Configuration;
using SilkRoad.TenantManagement.DataAccess.Database;

namespace SilkRoad.TenantManagement.Core;

/// <summary>
/// The AssemblyHelper class.
/// </summary>
public static class AssemblyHelper {

    private static readonly HashSet<string> _iamAuthDiscriminator = new(StringComparer.OrdinalIgnoreCase) {
        string.Empty,
        "IAM",
    };

    /// <summary>
    /// Adds the tenant management core.
    /// </summary>
    /// <param name="services">The services.</param>
    /// <param name="configuration">The configuration.</param>
    /// <returns>IServiceCollection.</returns>
    public static IServiceCollection AddTenantManagementCore(this IServiceCollection services, IConfiguration configuration) {
        services.AddSingleton<EnvironmentInfo>();

        var appOptionsSection = configuration.GetSection(AppOptions.Section);
        services.Configure<AppOptions>(appOptionsSection);

        // Add logging if not already added
        if (services.All(descriptor => descriptor.ServiceType != typeof(ILoggerFactory))) {
            services.AddLogging();
        }

        services.AddScoped<ConfigurationService>();

        services.AddDbContext<DataContext>(
            (serviceProvider, optionsBuilder) => {
                var appOptions = serviceProvider.GetRequiredService<IOptions<AppOptions>>().Value;

                appOptions.Validate();
                var dataContextOptions = appOptions.DataAccess.DataContext;

                var password = dataContextOptions.Password;
                if (_iamAuthDiscriminator.Contains(password)) {
                    password = Amazon.RDS.Util.RDSAuthTokenGenerator.GenerateAuthToken(
                        RegionEndpoint.GetBySystemName(appOptions.Aws.Region),
                        dataContextOptions.Host,
                        dataContextOptions.Port,
                        dataContextOptions.User
                    );
                }

                var connectionString = $"server={dataContextOptions.Host};database={dataContextOptions.Database};user={dataContextOptions.User};password={password};port={dataContextOptions.Port};";

                var serverVersion = new MySqlServerVersion(new Version(8, 0, 23));
                optionsBuilder.UseMySql(connectionString, serverVersion);
            }
        );

        // Register all implementations of MediatR.IRequest in this assembly, i.e the assembly that contains AssemblyHelper.
        services.AddMediatR(typeof(AssemblyHelper));

        var awsOptions = configuration.GetAWSOptions();
        services.AddDefaultAWSOptions(awsOptions);
        services.AddAWSService<IAmazonCognitoIdentityProvider>();

        return services;
    }
}
