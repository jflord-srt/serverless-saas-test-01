using System.IdentityModel.Tokens.Jwt;
using System.Net;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using SilkRoad.Libs.Infrastructure.Fundamentals;
using SilkRoad.TenantManagement.Core.Configuration;

namespace SilkRoad.TenantManagement.Api.Infrastructure;

/// <summary>
/// The CognitoJwtBearerOptionsConfigurator class.
/// Implements the <see cref="IConfigureNamedOptions{JwtBearerOptions}" />
/// </summary>
/// <seealso cref="IConfigureNamedOptions{JwtBearerOptions}" />
public class CognitoJwtBearerOptionsConfigurator : IConfigureNamedOptions<JwtBearerOptions> {

    /// <summary>
    /// Initializes a new instance of the <see cref="CognitoJwtBearerOptionsConfigurator"/> class.
    /// </summary>
    /// <param name="httpClientFactory">The HTTP client factory.</param>
    /// <param name="options">The options.</param>
    /// <param name="logger">The logger.</param>
    public CognitoJwtBearerOptionsConfigurator(IHttpClientFactory httpClientFactory, IOptions<AppOptions> options, ILogger<CognitoJwtBearerOptionsConfigurator> logger) {
        ThrowIf.ArgumentIsNull(httpClientFactory, nameof(httpClientFactory));
        ThrowIf.ArgumentIsNull(options, nameof(options));
        ThrowIf.ArgumentIsNull(logger, nameof(logger));

        this.AppOptions = options.Value;
        this.HttpClientFactory = httpClientFactory;
        this.Logger = logger;
    }

    /// <summary>
    /// Gets the HTTP client factory.
    /// </summary>
    /// <value>The HTTP client factory.</value>
    protected IHttpClientFactory HttpClientFactory { get; }

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

    /// <inheritdoc />
    public void Configure(JwtBearerOptions options) {
        // default case: no name was specified
        this.Configure(string.Empty, options);
    }

    /// <inheritdoc />
    public void Configure(string name, JwtBearerOptions options) {
        this.Logger.LogDebug("Configure JwtBearerOptions");
        ThrowIf.ArgumentIsNull(options, nameof(options));

        options.TokenValidationParameters = this.GetCognitoTokenValidationParams();
    }

    /// <summary>
    /// Gets the cognito token validation parameters.
    /// </summary>
    /// <returns>TokenValidationParameters.</returns>
    private TokenValidationParameters GetCognitoTokenValidationParams() {
        this.Logger.LogDebug($"{nameof(CognitoJwtBearerOptionsConfigurator)}.{nameof(this.GetCognitoTokenValidationParams)}");

        var awsOptions = this.AppOptions.Aws;
        var cognitoIssuer = awsOptions.GetCognitoIssuerUrl();

        return new TokenValidationParameters {
            IssuerSigningKeyResolver = this.GetJsonWebKeySet,
            AudienceValidator = this.ValidateAudience,
            ValidateIssuer = true,
            ValidIssuer = cognitoIssuer,
            ValidateAudience = true,
            ValidAudience = awsOptions.AppClientId,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
        };
    }

    /// <summary>
    /// Gets the json web key set.
    /// </summary>
    /// <param name="token">The token.</param>
    /// <param name="securityToken">The security token.</param>
    /// <param name="kid">The kid.</param>
    /// <param name="validationParameters">The validation parameters.</param>
    /// <returns>IList&lt;JsonWebKey&gt;.</returns>
    /// <exception cref="WebException">Invalid response from Cognito Idp, the key set is null or empty</exception>
    /// <exception cref="WebException">Invalid response from Cognito Idp, status code '{response.StatusCode}'</exception>
    private IList<JsonWebKey> GetJsonWebKeySet(string token, SecurityToken securityToken, string kid, TokenValidationParameters validationParameters) {
        this.Logger.LogDebug($"{nameof(CognitoJwtBearerOptionsConfigurator)}.{nameof(this.GetJsonWebKeySet)}");

        IList<JsonWebKey> keys = null;

        var awsOptions = this.AppOptions.Aws;

        var cognitoIssuer = awsOptions.GetCognitoIssuerUrl();
        var keySetUrl = $"{cognitoIssuer}/.well-known/jwks.json";

        this.Logger.LogTrace($"GET: {keySetUrl}");

        try {
            var httpClient = this.HttpClientFactory.CreateClient(nameof(TenantManagement)); // Do not dispose, let the factory handle it.
            using var request = new HttpRequestMessage(HttpMethod.Get, keySetUrl);
            using var response = httpClient.Send(request);

            this.Logger.LogTrace($"Response: {response.StatusCode}");

            if (response.IsSuccessStatusCode) {
                using var reader = new StreamReader(response.Content.ReadAsStream());
                var json = reader.ReadToEnd();
                if (!string.IsNullOrWhiteSpace(json)) {
                    keys = JsonConvert.DeserializeObject<JsonWebKeySet>(json)?.Keys;
                }

                if (keys?.Any() != true) {
                    throw new WebException("Invalid response from Cognito Idp, the key set is null or empty");
                }
            }
            else {
                throw new WebException($"Invalid response from Cognito Idp, status code '{response.StatusCode}'");
            }
        }
        catch (Exception e) {
            this.Logger.LogError(e, e.Message);
            throw;
        }

        return keys;
    }

    /// <summary>
    /// Validates the audience.
    /// </summary>
    /// <param name="audiences">The audiences.</param>
    /// <param name="securityToken">The security token.</param>
    /// <param name="validationParameters">The validation parameters.</param>
    /// <returns><c>true</c> if the audience is valid, <c>false</c> otherwise.</returns>
    private bool ValidateAudience(IEnumerable<string> audiences, SecurityToken securityToken, TokenValidationParameters validationParameters) {
        this.Logger.LogDebug($"{nameof(CognitoJwtBearerOptionsConfigurator)}.{nameof(this.ValidateAudience)}");

        // This is necessary because Cognito tokens don't have the "aud" claim. Instead the audience is set in "client_id"

        var result = false;
        var jwtSecurityToken = securityToken as JwtSecurityToken;

        const string clientIdKey = "client_id";
        if (jwtSecurityToken?.Payload?.ContainsKey(clientIdKey) == true) {
            var clientId = jwtSecurityToken.Payload[clientIdKey]?.ToString() ?? string.Empty;
            if (!string.IsNullOrWhiteSpace(clientId)) {
                result = validationParameters.ValidAudience.Contains(clientId);
            }
        }

        return result;
    }
}
