// <copyright file="GetTenantsQuery.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using MediatR;
using SilkRoad.TenantManagement.Core.Domain.Tenants;

namespace SilkRoad.TenantManagement.Core.Features.Queries;

/// <summary>
/// The GetTenantsQuery class.
/// </summary>
public class GetTenantsQuery : IRequest<IEnumerable<TenantDetails>> {

    /// <summary>
    /// Initializes a new instance of the <see cref="GetTenantsQuery"/> class.
    /// </summary>
    public GetTenantsQuery() {
    }
}
