// <copyright file="GetTenantsQueryHandler.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SilkRoad.TenantManagement.Core.Domain.Tenants;
using SilkRoad.TenantManagement.DataAccess.Database;

namespace SilkRoad.TenantManagement.Core.Features.Queries;

/// <summary>
/// The GetTenantsQueryHandler class.
/// </summary>
public class GetTenantsQueryHandler : IRequestHandler<GetTenantsQuery, IEnumerable<TenantDetails>> {

    /// <summary>
    /// Initializes a new instance of the <see cref="GetTenantsQueryHandler"/> class.
    /// </summary>
    /// <param name="dataContext">The data context.</param>
    /// <param name="logger">The logger.</param>
    public GetTenantsQueryHandler(DataContext dataContext, ILogger<GetTenantsQueryHandler> logger) {
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
    /// <returns>IEnumerable&lt;TenantInfo&gt;.</returns>
    public async Task<IEnumerable<TenantDetails>> Handle(GetTenantsQuery query, CancellationToken cancellationToken) {
        this.Logger.LogDebug($"Invoke: {nameof(GetTenantsQueryHandler)}.{nameof(this.Handle)}");

        var entities = await this.DataContext.Tenants
            .AsNoTracking()
            .OrderBy(entity => entity.TenantName)
            .ToListAsync(cancellationToken);

        return entities.Select(TenantDetails.FromTenantEntity);
    }
}
