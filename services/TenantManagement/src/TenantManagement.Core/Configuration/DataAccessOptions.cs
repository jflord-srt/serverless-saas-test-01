// <copyright file="DataAccessOptions.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using SilkRoad.Libs.Infrastructure.Fundamentals;

namespace SilkRoad.TenantManagement.Core.Configuration;

/// <summary>
/// The DataAccessOptions class.
/// </summary>
public class DataAccessOptions {

    /// <summary>
    /// Gets or sets the data context.
    /// </summary>
    /// <value>The data context.</value>
    public DataContextOptions DataContext { get; set; }

    /// <summary>
    /// Validates this instance.
    /// </summary>
    public void Validate() {
        ThrowIf.ValueIsNull(this.DataContext, nameof(this.DataContext));
        this.DataContext.Validate();
    }
}
