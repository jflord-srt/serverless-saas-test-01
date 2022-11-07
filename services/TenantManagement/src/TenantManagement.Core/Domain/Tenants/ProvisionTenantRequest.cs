// <copyright file="ProvisionTenantRequest.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

namespace SilkRoad.TenantManagement.Core.Domain.Tenants;

/// <summary>
/// The ProvisionTenantRequest class.
/// </summary>
public class ProvisionTenantRequest {

    /// <summary>
    /// Gets or sets the name of the tenant.
    /// </summary>
    /// <value>The name of the tenant.</value>
    public string TenantName { get; set; }

    /// <summary>
    /// Gets or sets the tenant code.
    /// </summary>
    /// <value>The tenant code.</value>
    public string TenantCode { get; set; }

    /// <summary>
    /// Gets or sets the administrator email.
    /// </summary>
    /// <value>The administrator email.</value>
    public string AdministratorEmail { get; set; }
}
