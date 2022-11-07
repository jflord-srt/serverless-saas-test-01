// <copyright file="FindTenantClientConfigQuery.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using MediatR;
using SilkRoad.TenantManagement.Core.Domain.Tenants;

namespace SilkRoad.TenantManagement.Core.Features.Queries;

/// <summary>
/// The FindTenantClientConfigQuery class.
/// Implements the <see cref="IRequest{TenantClientConfig}" />
/// </summary>
/// <seealso cref="IRequest{TenantClientConfig}" />
public class FindTenantClientConfigQuery : IRequest<TenantClientConfig> {

    /// <summary>
    /// Initializes a new instance of the <see cref="FindTenantClientConfigQuery"/> class.
    /// </summary>
    /// <param name="tenantId">The tenant identifier.</param>
    /// <param name="tenantCode">The tenant code.</param>
    /// <param name="tenantName">Name of the tenant.</param>
    public FindTenantClientConfigQuery(string tenantId = null, string tenantCode = null, string tenantName = null) {
        this.TenantId = tenantId;
        this.TenantCode = tenantCode;
        this.TenantName = tenantName;
    }

    /// <summary>
    /// Gets or sets the tenant identifier.
    /// </summary>
    /// <value>The tenant identifier.</value>
    public string TenantId { get; set; }

    /// <summary>
    /// Gets the tenant code.
    /// </summary>
    /// <value>The tenant code.</value>
    public string TenantCode { get; }

    /// <summary>
    /// Gets the name of the tenant.
    /// </summary>
    /// <value>The name of the tenant.</value>
    public string TenantName { get; }
}
