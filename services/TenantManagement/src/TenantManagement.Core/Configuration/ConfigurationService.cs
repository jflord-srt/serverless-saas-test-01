// <copyright file="ConfigurationService.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;

namespace SilkRoad.TenantManagement.Core.Configuration;

/// <summary>
/// The ConfigurationService class.
/// </summary>
public class ConfigurationService {

    /// <summary>
    /// Initializes a new instance of the <see cref="ConfigurationService" /> class.
    /// </summary>
    /// <param name="environmentInfo">The environment information.</param>
    /// <param name="options">The options.</param>
    public ConfigurationService(EnvironmentInfo environmentInfo, IOptions<AppOptions> options) {
        this.EnvironmentInfo = environmentInfo;
        this.AppOptions = options.Value;
    }

    /// <summary>
    /// Gets the environment information.
    /// </summary>
    /// <value>The environment information.</value>
    public EnvironmentInfo EnvironmentInfo { get; }

    /// <summary>
    /// Gets the application options.
    /// </summary>
    /// <value>The application options.</value>
    public AppOptions AppOptions { get; }
}
