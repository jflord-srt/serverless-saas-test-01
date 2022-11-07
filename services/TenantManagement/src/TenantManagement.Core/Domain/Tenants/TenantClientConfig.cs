// <copyright file="TenantClientConfig.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

namespace SilkRoad.TenantManagement.Core.Domain.Tenants;

/// <summary>
/// The TenantClientConfig class.
/// </summary>
public class TenantClientConfig {

    /// <summary>
    /// Gets or sets the identifier.
    /// </summary>
    /// <value>The identifier.</value>
    public string TenantId { get; set; }

    /// <summary>
    /// Gets or sets the name.
    /// </summary>
    /// <value>The name.</value>
    public string TenantName { get; set; }

    /// <summary>
    /// Gets or sets the tenant code.
    /// </summary>
    /// <value>The tenant code.</value>
    public string TenantCode { get; set; }

    /// <summary>
    /// Gets or sets the cognito user pool identifier.
    /// </summary>
    /// <value>The cognito user pool identifier.</value>
    public string CognitoUserPoolId { get; set; }

    /// <summary>
    /// Gets or sets the cognito client application identifier.
    /// </summary>
    /// <value>The cognito client application identifier.</value>
    public string CognitoClientAppId { get; set; }
}
