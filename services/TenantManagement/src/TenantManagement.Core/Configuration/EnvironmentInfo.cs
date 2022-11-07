// <copyright file="EnvironmentInfo.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

namespace SilkRoad.TenantManagement.Core.Configuration;

/// <summary>
/// The EnvironmentInfo class.
/// </summary>
public class EnvironmentInfo {

    /// <summary>
    /// Gets or sets the name of the environment.
    /// </summary>
    /// <value>The name of the environment.</value>
    public string EnvironmentName { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether this instance is development.
    /// </summary>
    /// <value><c>true</c> if this instance is development; otherwise, <c>false</c>.</value>
    public bool IsDevelopment { get; set; }
}
