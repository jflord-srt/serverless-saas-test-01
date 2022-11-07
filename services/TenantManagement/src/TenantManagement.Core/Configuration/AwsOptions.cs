using SilkRoad.Libs.Infrastructure.Fundamentals;

namespace SilkRoad.TenantManagement.Core.Configuration;

/// <summary>
/// The AwsOptions class.
/// </summary>
public class AwsOptions {

    /// <summary>
    /// Gets or sets the region.
    /// </summary>
    /// <value>The region.</value>
    public string Region { get; set; }

    /// <summary>
    /// Gets or sets the user pool identifier.
    /// </summary>
    /// <value>The user pool identifier.</value>
    public string UserPoolId { get; set; }

    /// <summary>
    /// Gets or sets the application client identifier.
    /// </summary>
    /// <value>The application client identifier.</value>
    public string AppClientId { get; set; }

    /// <summary>
    /// Gets the cognito URL.
    /// </summary>
    /// <returns>System.String.</returns>
    public string GetCognitoUrl() => GetCognitoUrl(this.Region);

    /// <summary>
    /// Gets the cognito issuer URL.
    /// </summary>
    /// <returns>System.String.</returns>
    public string GetCognitoIssuerUrl() => GetCognitoIssuerUrl(this.Region, this.UserPoolId);

    /// <summary>
    /// Gets the cognito URL.
    /// </summary>
    /// <param name="region">The region.</param>
    /// <returns>System.String.</returns>
    public static string GetCognitoUrl(string region) => $"https://cognito-idp.{region}.amazonaws.com";

    /// <summary>
    /// Gets the cognito issuer URL.
    /// </summary>
    /// <param name="region">The region.</param>
    /// <param name="userPoolId">The user pool identifier.</param>
    /// <returns>System.String.</returns>
    public static string GetCognitoIssuerUrl(string region, string userPoolId) => $"{GetCognitoUrl(region)}/{userPoolId}";

    /// <summary>
    /// Validates this instance.
    /// </summary>
    public void Validate() {
        ThrowIf.ArgumentIsNullish(this.Region, nameof(this.Region));
        ThrowIf.ArgumentIsNullish(this.UserPoolId, nameof(this.UserPoolId));
        ThrowIf.ArgumentIsNullish(this.AppClientId, nameof(this.AppClientId));
    }
}
