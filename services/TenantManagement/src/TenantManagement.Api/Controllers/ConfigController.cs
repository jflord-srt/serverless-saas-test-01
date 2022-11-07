// <copyright file="ConfigController.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using System.Net;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SilkRoad.TenantManagement.Core.Configuration;

namespace SilkRoad.TenantManagement.Api.Controllers;

/// <summary>
/// The AuthController class.
/// Implements the <see cref="ControllerBase" />
/// </summary>
/// <seealso cref="ControllerBase" />
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
[ResponseCache(NoStore = false, Duration = 0, Location = ResponseCacheLocation.None)]
public class ConfigController : ControllerBase {

    /// <summary>
    /// Initializes a new instance of the <see cref="ConfigController"/> class.
    /// </summary>
    /// <param name="appOptions">The application options.</param>
    /// <param name="logger">The logger.</param>
    public ConfigController(IOptions<AppOptions> appOptions, ILogger<ConfigController> logger) {
        this.AppOptions = appOptions.Value;
        this.Logger = logger;
    }

    /// <summary>
    /// Gets or sets the application options.
    /// </summary>
    /// <value>The application options.</value>
    protected AppOptions AppOptions { get; set; }

    /// <summary>
    /// Gets the logger.
    /// </summary>
    /// <value>The logger.</value>
    protected ILogger Logger { get; }

    /// <summary>
    /// Gets the client authentication configuration.
    /// </summary>
    /// <returns>IActionResult.</returns>
    [AllowAnonymous]
    [HttpGet("auth-settings")]
    [ProducesResponseType(typeof(ClientAuthSettings), (int)HttpStatusCode.OK)]
    public IActionResult GetClientAuthSettings() {
        this.Logger.LogDebug($"Invoke: {nameof(this.GetClientAuthSettings)}");

        var aws = this.AppOptions.Aws;

        var clientAuthConfig = new ClientAuthSettings() {
            AwsRegion = aws.Region,
            CognitoUrl = aws.GetCognitoUrl(),
            CognitoUserPoolId = aws.UserPoolId,
            CognitoAppClientId = aws.AppClientId,
        };

        return this.Ok(clientAuthConfig);
    }

    /// <summary>
    /// The ClientAuthSettings class.
    /// </summary>
    public class ClientAuthSettings {

        /// <summary>
        /// Gets or sets the AWS region.
        /// </summary>
        /// <value>The AWS region.</value>
        public string AwsRegion { get; set; }

        /// <summary>
        /// Gets or sets the cognito URL.
        /// </summary>
        /// <value>The cognito URL.</value>
        public string CognitoUrl { get; set; }

        /// <summary>
        /// Gets or sets the cognito user pool identifier.
        /// </summary>
        /// <value>The cognito user pool identifier.</value>
        public string CognitoUserPoolId { get; set; }

        /// <summary>
        /// Gets or sets the cognito application client identifier.
        /// </summary>
        /// <value>The cognito application client identifier.</value>
        public string CognitoAppClientId { get; set; }
    }
}
