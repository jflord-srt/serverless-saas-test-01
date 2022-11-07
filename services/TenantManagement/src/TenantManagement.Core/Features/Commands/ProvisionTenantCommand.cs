// <copyright file="ProvisionTenantCommand.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using MediatR;
using SilkRoad.TenantManagement.Core.Domain.Tenants;

namespace SilkRoad.TenantManagement.Core.Features.Commands;

/// <summary>
/// The ProvisionTenantCommand class.
/// </summary>
public class ProvisionTenantCommand : IRequest<ProvisionTenantResponse> {

    /// <summary>
    /// Initializes a new instance of the <see cref="ProvisionTenantCommand"/> class.
    /// </summary>
    /// <param name="request">The request.</param>
    public ProvisionTenantCommand(ProvisionTenantRequest request) {
        this.Request = request;
    }

    /// <summary>
    /// Gets or sets the request.
    /// </summary>
    /// <value>The request.</value>
    public ProvisionTenantRequest Request { get; set; }
}
