// <copyright file="AppOptions.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using SilkRoad.Libs.Infrastructure.Fundamentals;

namespace SilkRoad.TenantManagement.Core.Configuration;

/// <summary>
/// The AppOptions class.
/// </summary>
public class AppOptions {

    /// <summary>
    /// The section name.
    /// </summary>
    public const string Section = "App";

    /// <summary>
    /// Gets or sets the aws options.
    /// </summary>
    /// <value>The aws options.</value>
    public AwsOptions Aws { get; set; }

    /// <summary>
    /// Gets or sets the data access options.
    /// </summary>
    /// <value>The data access.</value>
    public DataAccessOptions DataAccess { get; set; }

    /// <summary>
    /// Validates this instance.
    /// </summary>
    public void Validate() {
        ThrowIf.ValueIsNull(this.Aws, nameof(this.Aws));
        ThrowIf.ValueIsNull(this.DataAccess, nameof(this.DataAccess));
        this.Aws.Validate();
        this.DataAccess.Validate();
    }
}
