// <copyright file="TenantsController.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using System.Net;
using System.Runtime.InteropServices;

using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SilkRoad.Libs.Infrastructure.Fundamentals.Extensions;
using SilkRoad.TenantManagement.Api.Infrastructure;
using SilkRoad.TenantManagement.Core;
using SilkRoad.TenantManagement.Core.Domain.Tenants;
using SilkRoad.TenantManagement.Core.Features.Commands;
using SilkRoad.TenantManagement.Core.Features.Queries;

namespace SilkRoad.TenantManagement.Api.Controllers;

/// <summary>
/// The TenantsController class.
/// Implements the <see cref="ControllerBase" />.
/// </summary>
/// <seealso cref="ControllerBase" />
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
[ResponseCache(NoStore = false, Duration = 0, Location = ResponseCacheLocation.None)]
public class TenantsController : ControllerBase {

    /// <summary>
    /// Initializes a new instance of the <see cref="TenantsController"/> class.
    /// </summary>
    /// <param name="mediator">The mediator.</param>
    /// <param name="logger">The logger.</param>
    public TenantsController(
        IMediator mediator,
        ILogger<TenantsController> logger
     ) {
        this.Mediator = mediator;
        this.Logger = logger;
    }

    /// <summary>
    /// Gets the mediator.
    /// </summary>
    /// <value>The mediator.</value>
    protected IMediator Mediator { get; }

    /// <summary>
    /// Gets the logger.
    /// </summary>
    /// <value>The logger.</value>
    protected ILogger Logger { get; }

    /// <summary>
    /// Gets the list of Tenants.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token that can be used by other objects or threads to receive notice of cancellation.</param>
    /// <remarks>GET api/tenants</remarks>
    /// <returns>A Task&lt;IEnumerable`1&gt; representing the asynchronous operation.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<TenantDetails>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> GetTenantsAsync(CancellationToken cancellationToken) {
        this.Logger.LogDebug($"Invoke: {nameof(this.GetTenantsAsync)}");

        try {
            var query = new GetTenantsQuery();
            var result = await this.Mediator.Send(query, cancellationToken);
            return this.Ok(result);
        }
        catch (Exception e) {
            var result = this.HandleException(e);
            if (result is not null) {
                return result;
            }

            throw;
        }
    }

    /// <summary>
    /// Gets the Tenant associated to the given tenantId.
    /// </summary>
    /// <param name="tenantId">The identifier.</param>
    /// <param name="cancellationToken">The cancellation token that can be used by other objects or threads to receive notice of cancellation.</param>
    /// <remarks>GET api/tenants/5</remarks>
    /// <returns>A Task&lt;IActionResult&gt; representing the asynchronous operation.</returns>
    [HttpGet("{tenantId}")]
    [ProducesResponseType(typeof(TenantDetails), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> GetTenantAsync(string tenantId, CancellationToken cancellationToken) {
        this.Logger.LogDebug($"Invoke: {nameof(this.GetTenantAsync)}");

        try {
            var query = new GetTenantQuery(tenantId);
            var tenantInfo = await this.Mediator.Send(query, cancellationToken);

            if (tenantInfo is not null) {
                return this.Ok(tenantInfo);
            }

            return this.NotFound();
        }
        catch (Exception e) {
            var result = this.HandleException(e);
            if (result is not null) {
                return result;
            }

            throw;
        }
    }

    /// <summary>
    /// Find the tenant client configuration as an asynchronous operation.
    /// </summary>
    /// <param name="tenantId">The optional tenantId predicate. Order of precedence: tenantId, tenantCode, tenantName.</param>
    /// <param name="tenantCode">The optional tenantCode predicate. Order of precedence: tenantId, tenantCode, tenantName.</param>
    /// <param name="tenantName">The optional tenantName predicate. Order of precedence: tenantId, tenantCode, tenantName.</param>
    /// <param name="cancellationToken">The cancellation token that can be used by other objects or threads to receive notice of cancellation.</param>
    /// <returns>A Task&lt;IActionResult&gt; representing the asynchronous operation.</returns>
    [AllowAnonymous]
    [HttpGet("client-config")]
    [ProducesResponseType(typeof(TenantClientConfig), (int)HttpStatusCode.OK)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> FindTenantClientConfigAsync([Optional] string tenantId, [Optional] string tenantCode, [Optional] string tenantName, CancellationToken cancellationToken) {
        this.Logger.LogDebug($"Invoke: {nameof(this.FindTenantClientConfigAsync)}");

        try {
            var query = new FindTenantClientConfigQuery(tenantId?.Trim(), tenantCode?.Trim(), tenantName?.Trim());
            var tenantClientConfig = await this.Mediator.Send(query, cancellationToken);

            if (tenantClientConfig is not null) {
                return this.Ok(tenantClientConfig);
            }

            return this.NotFound();
        }
        catch (Exception e) {
            var result = this.HandleException(e);
            if (result is not null) {
                return result;
            }

            throw;
        }
    }

    /// <summary>
    /// Provisions a new Tenant.
    /// </summary>
    /// <param name="request">The request.</param>
    /// <param name="cancellationToken">The cancellation token that can be used by other objects or threads to receive notice of cancellation.</param>
    /// <remarks>POST api/tenants</remarks>
    /// <returns>A Task&lt;IActionResult&gt; representing the asynchronous operation.</returns>
    /// <exception cref="System.ArgumentNullException">request - Invalid ${nameof(ProvisionTenantRequest)} payload.</exception>
    [HttpPost]
    [ProducesResponseType(typeof(ProvisionTenantResponse), (int)HttpStatusCode.Accepted)]
    [ProducesResponseType(typeof(ApiError), (int)HttpStatusCode.Conflict)]
    public async Task<IActionResult> ProvisionTenantAsync([FromBody] ProvisionTenantRequest request, CancellationToken cancellationToken) {
        this.Logger.LogDebug($"Invoke: {nameof(this.ProvisionTenantAsync)}");

        try {
            if (request is null) {
                throw new ArgumentNullException(nameof(request), $"Invalid ${nameof(ProvisionTenantRequest)} payload.")
                    .SetErrorCode(ErrorCodes.InvalidArgument);
            }

            var provisionTenantCommand = new ProvisionTenantCommand(request);
            var result = await this.Mediator.Send(provisionTenantCommand, cancellationToken);
            return this.Accepted(result);
        }
        catch (Exception e) {
            var result = this.HandleException(e);
            if (result is not null) {
                return result;
            }

            throw;
        }
    }

    /// <summary>
    /// Deprovisions the Tenant associated to the given tenantId.
    /// </summary>
    /// <param name="tenantId">The tenant identifier.</param>
    /// <param name="cancellationToken">The cancellation token that can be used by other objects or threads to receive notice of cancellation.</param>
    /// <remarks>DELETE api/tenants/5</remarks>
    /// <returns>IActionResult.</returns>
    [HttpDelete("{tenantId}")]
    [ProducesResponseType((int)HttpStatusCode.NoContent)]
    [ProducesResponseType((int)HttpStatusCode.NotFound)]
    public async Task<IActionResult> DeprovisionTenantAsync(string tenantId, CancellationToken cancellationToken) {
        this.Logger.LogDebug($"Invoke: {nameof(this.DeprovisionTenantAsync)}");

        try {
            var command = new DecommissionTenantCommand(tenantId);
            await this.Mediator.Send(command, cancellationToken);
        }
        catch (Exception e) {
            if (e.GetErrorCode() == ErrorCodes.ResourceNotFound) {
                var apiError = new ApiError(e.GetErrorCode(), e.Message);
                return this.NotFound(apiError);
            }

            throw;
        }

        return this.NoContent();
    }

    /// <summary>
    /// Handles the exception.
    /// </summary>
    /// <param name="exception">The exception.</param>
    /// <returns>IActionResult.</returns>
    private IActionResult HandleException(Exception exception) {
        if (exception.GetErrorCode() == ErrorCodes.DuplicateResource) {
            var apiError = new ApiError(exception.Message, exception.GetErrorCode());
            return this.Conflict(apiError);
        }

        if (exception is ArgumentException || exception.GetErrorCode() == ErrorCodes.InvalidArgument) {
            var apiError = new ApiError(exception.Message, exception.GetErrorCode());
            return this.BadRequest(apiError);
        }

        return null;
    }
}
