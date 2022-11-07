using System.ComponentModel.DataAnnotations;

namespace SilkRoad.TenantManagement.DataAccess.Entities;

/// <summary>
/// The TenantEntity class.
/// </summary>
public class TenantEntity {

    /// <summary>
    /// Gets or sets the tenant identifier.
    /// </summary>
    /// <value>The tenant identifier.</value>
    [Required]
    [MaxLength(100)]
    public string TenantId { get; set; }

    /// <summary>
    /// Gets or sets the tenant code.
    /// </summary>
    /// <value>The tenant code.</value>
    [Required]
    [MaxLength(50)]
    public string TenantCode { get; set; }

    /// <summary>
    /// Gets or sets the name of the tenant.
    /// </summary>
    /// <value>The name of the tenant.</value>
    [Required]
    [MaxLength(250)]
    public string TenantName { get; set; }

    /// <summary>
    /// Gets or sets the administrator email.
    /// </summary>
    /// <value>The administrator email.</value>
    [Required]
    [MaxLength(250)]
    public string AdministratorEmail { get; set; }

    /// <summary>
    /// Gets or sets the administrator subject.
    /// </summary>
    /// <value>The administrator subject.</value>
    [Required]
    [MaxLength(250)]
    public string AdministratorSubject { get; set; }

    /// <summary>
    /// Gets or sets the cognito user pool identifier.
    /// </summary>
    /// <value>The cognito user pool identifier.</value>
    [Required]
    [MaxLength(50)]
    public string CognitoUserPoolId { get; set; }

    /// <summary>
    /// Gets or sets the cognito client application identifier.
    /// </summary>
    /// <value>The cognito client application identifier.</value>
    [Required]
    [MaxLength(50)]
    public string CognitoClientAppId { get; set; }

    /// <summary>
    /// Gets or sets the cognito user pool domain.
    /// </summary>
    /// <value>The cognito user pool domain.</value>
    [Required]
    [MaxLength(250)]
    public string CognitoUserPoolDomain { get; set; }

    /// <summary>
    /// Gets or sets the timestamp.
    /// </summary>
    /// <value>The timestamp.</value>
    [Required]
    public long Timestamp { get; set; }
}
