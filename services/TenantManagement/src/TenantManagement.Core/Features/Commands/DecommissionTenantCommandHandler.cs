// <copyright file="DecommissionTenantCommandHandler.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using System.Net;

using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SilkRoad.Libs.Infrastructure.Fundamentals.Extensions;
using SilkRoad.TenantManagement.Core.Configuration;
using SilkRoad.TenantManagement.Core.Domain.Tenants;
using SilkRoad.TenantManagement.DataAccess.Database;

namespace SilkRoad.TenantManagement.Core.Features.Commands;

/// <summary>
/// The DecommissionTenantCommandHandler class.
/// </summary>
public class DecommissionTenantCommandHandler : IRequestHandler<DecommissionTenantCommand, Unit> {

    /// <summary>
    /// Initializes a new instance of the <see cref="DecommissionTenantCommandHandler"/> class.
    /// </summary>
    /// <param name="dataContext">The data context.</param>
    /// <param name="configurationService">The configuration service.</param>
    /// <param name="cognitoIdentityProviderClient">The cognito identity provider client.</param>
    /// <param name="logger">The logger.</param>
    public DecommissionTenantCommandHandler(
        DataContext dataContext,
        ConfigurationService configurationService,
        IAmazonCognitoIdentityProvider cognitoIdentityProviderClient,
        ILogger<DecommissionTenantCommandHandler> logger
    ) {
        this.DataContext = dataContext;
        this.ConfigurationService = configurationService;
        this.CognitoIdentityProviderClient = cognitoIdentityProviderClient;
        this.Logger = logger;
    }

    /// <summary>
    /// Gets the data context.
    /// </summary>
    /// <value>The data context.</value>
    public DataContext DataContext { get; }

    /// <summary>
    /// Gets the configuration service.
    /// </summary>
    /// <value>The configuration service.</value>
    protected ConfigurationService ConfigurationService { get; }

    /// <summary>
    /// Gets the cognito identity provider client.
    /// </summary>
    /// <value>The cognito identity provider client.</value>
    protected IAmazonCognitoIdentityProvider CognitoIdentityProviderClient { get; }

    /// <summary>
    /// Gets or sets the logger.
    /// </summary>
    /// <value>The logger.</value>
    public ILogger Logger { get; set; }

    /// <summary>
    /// Handles the specified command.
    /// </summary>
    /// <param name="command">The command.</param>
    /// <param name="cancellationToken">The cancellation token that can be used by other objects or threads to receive notice of cancellation.</param>
    /// <returns>MediatR.Unit.</returns>
    public async Task<Unit> Handle(DecommissionTenantCommand command, CancellationToken cancellationToken) {
        this.Logger.LogDebug($"Invoke: {nameof(DecommissionTenantCommandHandler)}.{nameof(this.Handle)}");

        var tenantEntity = await this.DataContext.Tenants
            .FirstOrDefaultAsync(t => t.TenantId == command.TenantId, cancellationToken);

        if (tenantEntity == null) {
            throw new OperationCanceledException($"Tenant '{command.TenantId}' was not found.")
                .SetErrorCode(ErrorCodes.ResourceNotFound);
        }

        var tenantId = tenantEntity.TenantId;

        if (!tenantEntity.CognitoUserPoolDomain.IsNullOrEmpty() && tenantEntity.CognitoUserPoolDomain != TenantDetails.PENDING_TAG) {
            var deleteUserPoolDomainRequest = new DeleteUserPoolDomainRequest() {
                UserPoolId = tenantEntity.CognitoUserPoolId,
                Domain = tenantEntity.CognitoUserPoolDomain,
            };

            var deleteUserPoolDomainResponse = await this.CognitoIdentityProviderClient.DeleteUserPoolDomainAsync(deleteUserPoolDomainRequest, cancellationToken);

            if (deleteUserPoolDomainResponse.HttpStatusCode != HttpStatusCode.OK) {
                throw new InvalidOperationException($"An error occurred while attempting to delete the Cognito User Domain '{tenantEntity.CognitoUserPoolDomain}' for Tenant '{tenantId}'. Status Code: {deleteUserPoolDomainResponse.HttpStatusCode}");
            }
        }
        else {
            this.Logger.LogWarning("Skip deletion of Cognito User Domain, invalid CognitoUserPoolDomain: '{tenantDetails.CognitoUserPoolDomain}'", tenantEntity.CognitoUserPoolDomain);
        }

        if (!tenantEntity.CognitoUserPoolId.IsNullOrEmpty() && tenantEntity.CognitoClientAppId != TenantDetails.PENDING_TAG) {
            var deleteUserPoolRequest = new DeleteUserPoolRequest() {
                UserPoolId = tenantEntity.CognitoUserPoolId,
            };

            var deleteUserPoolResponse = await this.CognitoIdentityProviderClient.DeleteUserPoolAsync(deleteUserPoolRequest, cancellationToken);

            if (deleteUserPoolResponse.HttpStatusCode != HttpStatusCode.OK) {
                throw new InvalidOperationException($"An error occurred while attempting to delete the Cognito User Pool '{tenantEntity.CognitoUserPoolId}' for Tenant '{tenantId}'. Status Code: {deleteUserPoolResponse.HttpStatusCode}");
            }
        }
        else {
            this.Logger.LogWarning("Skip deletion of Cognito User Pool, invalid UserPoolId: '{tenantDetails.CognitoClientAppId}'", tenantEntity.CognitoClientAppId);
        }

        this.DataContext.Tenants.Remove(tenantEntity);
        await this.DataContext.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
