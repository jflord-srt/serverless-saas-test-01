// <copyright file="GetTenantQuery.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using MediatR;
using SilkRoad.TenantManagement.Core.Domain.Tenants;

namespace SilkRoad.TenantManagement.Core.Features.Queries;

/// <summary>
/// The GetTenantQuery class.
/// </summary>
public class GetTenantQuery : IRequest<TenantDetails> {

    /// <summary>
    /// Initializes a new instance of the <see cref="GetTenantQuery"/> class.
    /// </summary>
    /// <param name="tenantId">The tenant identifier.</param>
    public GetTenantQuery(string tenantId) {
        this.TenantId = tenantId;
    }

    /// <summary>
    /// Gets or sets the tenant identifier.
    /// </summary>
    /// <value>The tenant identifier.</value>
    public string TenantId { get; set; }
}
