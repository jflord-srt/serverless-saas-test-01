// <copyright file="GetTenantQueryHandler.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SilkRoad.TenantManagement.Core.Domain.Tenants;
using SilkRoad.TenantManagement.DataAccess.Database;

namespace SilkRoad.TenantManagement.Core.Features.Queries;

/// <summary>
/// The GetTenantQueryHandler class.
/// </summary>
public class GetTenantQueryHandler : IRequestHandler<GetTenantQuery, TenantDetails> {

    /// <summary>
    /// Initializes a new instance of the <see cref="GetTenantQueryHandler"/> class.
    /// </summary>
    /// <param name="dataContext">The data context.</param>
    /// <param name="logger">The logger.</param>
    public GetTenantQueryHandler(DataContext dataContext, ILogger<GetTenantsQueryHandler> logger) {
        this.DataContext = dataContext;
        this.Logger = logger;
    }

    /// <summary>
    /// Gets the data context.
    /// </summary>
    /// <value>The data context.</value>
    protected DataContext DataContext { get; }

    /// <summary>
    /// Gets the logger.
    /// </summary>
    /// <value>The logger.</value>
    protected ILogger Logger { get; }

    /// <summary>
    /// Handles the specified query.
    /// </summary>
    /// <param name="query">The query.</param>
    /// <param name="cancellationToken">The cancellation token that can be used by other objects or threads to receive notice of cancellation.</param>
    /// <returns>TenantInfo.</returns>
    public async Task<TenantDetails> Handle(GetTenantQuery query, CancellationToken cancellationToken) {
        this.Logger.LogDebug($"Invoke: {nameof(GetTenantQueryHandler)}.{nameof(this.Handle)}");

        var tenantEntity = await this.DataContext.Tenants
            .FirstOrDefaultAsync(x => x.TenantId == query.TenantId, cancellationToken);

        return TenantDetails.FromTenantEntity(tenantEntity);
    }
}
