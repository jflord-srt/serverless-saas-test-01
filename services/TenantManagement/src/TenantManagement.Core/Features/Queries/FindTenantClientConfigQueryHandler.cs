using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SilkRoad.Libs.Infrastructure.Fundamentals.Extensions;
using SilkRoad.TenantManagement.Core.Domain.Tenants;
using SilkRoad.TenantManagement.DataAccess.Database;

namespace SilkRoad.TenantManagement.Core.Features.Queries;

/// <summary>
/// The FindTenantClientConfigQueryHandler class.
/// Implements the <see cref="IRequestHandler{FindTenantClientConfigQuery, TenantClientConfig}" />
/// </summary>
/// <seealso cref="IRequestHandler{FindTenantClientConfigQuery, TenantClientConfig}" />
public class FindTenantClientConfigQueryHandler : IRequestHandler<FindTenantClientConfigQuery, TenantClientConfig> {

    /// <summary>
    /// Initializes a new instance of the <see cref="FindTenantClientConfigQueryHandler"/> class.
    /// </summary>
    /// <param name="dataContext">The data context.</param>
    /// <param name="logger">The logger.</param>
    public FindTenantClientConfigQueryHandler(DataContext dataContext, ILogger<FindTenantClientConfigQueryHandler> logger) {
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
    /// <returns>Task&lt;TenantClientConfig&gt;.</returns>
    public async Task<TenantClientConfig> Handle(FindTenantClientConfigQuery query, CancellationToken cancellationToken) {
        this.Logger.LogDebug($"Invoke: {nameof(FindTenantClientConfigQueryHandler)}.{nameof(this.Handle)}");
        TenantClientConfig result = null;

        var wasFiltered = false;
        var q = this.DataContext.Tenants.AsQueryable();

        if (!query.TenantId.IsNullOrEmpty()) {
            q = q.Where(x => x.TenantId == query.TenantId);
            wasFiltered = true;
        }

        if (!query.TenantCode.IsNullOrEmpty()) {
            q = q.Where(x => EF.Functions.Collate(x.TenantCode, "utf8mb4_0900_ai_ci") == query.TenantCode); // MySQL is case insensitive by default, including Collate to be explicit.
            wasFiltered = true;
        }

        if (!query.TenantName.IsNullOrEmpty()) {
            q = q.Where(x => EF.Functions.Collate(x.TenantName, "utf8mb4_0900_ai_ci") == query.TenantName); // MySQL is case insensitive by default, including Collate to be explicit.
            wasFiltered = true;
        }

        if (wasFiltered) {
            var tenantEntity = await q.FirstOrDefaultAsync(cancellationToken);
            if (tenantEntity is not null) {
                result = new TenantClientConfig() {
                    TenantId = tenantEntity.TenantId,
                    TenantCode = tenantEntity.TenantCode,
                    TenantName = tenantEntity.TenantName,
                    CognitoUserPoolId = tenantEntity.CognitoUserPoolId,
                    CognitoClientAppId = tenantEntity.CognitoClientAppId,
                };
            }
        }

        return result;
    }
}
