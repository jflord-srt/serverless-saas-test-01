// <copyright file="DecommissionTenantCommand.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using MediatR;

namespace SilkRoad.TenantManagement.Core.Features.Commands;

/// <summary>
/// The DecommissionTenantCommand class.
/// Implements the <see cref="IRequest" />
/// </summary>
/// <seealso cref="IRequest" />
public class DecommissionTenantCommand : IRequest {

    /// <summary>
    /// Initializes a new instance of the <see cref="DecommissionTenantCommand" /> class.
    /// </summary>
    /// <param name="tenantId">The tenant identifier.</param>
    public DecommissionTenantCommand(string tenantId) {
        this.TenantId = tenantId;
    }

    /// <summary>
    /// Gets or sets the tenant identifier.
    /// </summary>
    /// <value>The tenant identifier.</value>
    public string TenantId { get; set; }
}
