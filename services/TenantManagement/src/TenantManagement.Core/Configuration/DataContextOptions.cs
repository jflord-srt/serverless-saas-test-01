// <copyright file="DataContextOptions.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using SilkRoad.Libs.Infrastructure.Fundamentals;

namespace SilkRoad.TenantManagement.Core.Configuration;

/// <summary>
/// The DataContextOptions class.
/// </summary>
public class DataContextOptions {

    /// <summary>
    /// Gets or sets the host.
    /// </summary>
    /// <value>The host.</value>
    public string Host { get; set; }

    /// <summary>
    /// Gets or sets the database.
    /// </summary>
    /// <value>The database.</value>
    public string Database { get; set; }

    /// <summary>
    /// Gets or sets the user.
    /// </summary>
    /// <value>The user.</value>
    public string User { get; set; }

    /// <summary>
    /// Gets or sets the password. When using IAM authentication, use "IAM" or "" as a password.
    /// </summary>
    /// <value>The password.</value>
    public string Password { get; set; }

    /// <summary>
    /// Gets or sets the port.
    /// </summary>
    /// <value>The port.</value>
    public int Port { get; set; }

    /// <summary>
    /// Validates this instance.
    /// </summary>
    public void Validate() {
        ThrowIf.ValueIsNullish(this.Host, nameof(this.Host));
        ThrowIf.ValueIsNullish(this.Database, nameof(this.Database));
        ThrowIf.ValueIsNullish(this.User, nameof(this.User));
    }
}
