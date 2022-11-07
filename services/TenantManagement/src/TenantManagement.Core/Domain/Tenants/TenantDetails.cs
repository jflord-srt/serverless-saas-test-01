// <copyright file="TenantDetails.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using SilkRoad.TenantManagement.DataAccess.Entities;

namespace SilkRoad.TenantManagement.Core.Domain.Tenants;

/// <summary>
/// The TenantDetails class.
/// </summary>
public class TenantDetails {

    /// <summary>
    /// The pending tag
    /// </summary>
    public const string PENDING_TAG = "!!!PENDING!!!";

    /// <summary>
    /// Gets or sets the identifier.
    /// </summary>
    /// <value>The identifier.</value>
    public string TenantId { get; set; }

    /// <summary>
    /// Gets or sets the name.
    /// </summary>
    /// <value>The name.</value>
    public string TenantName { get; set; }

    /// <summary>
    /// Gets or sets the tenant code.
    /// </summary>
    /// <value>The tenant code.</value>
    public string TenantCode { get; set; }

    /// <summary>
    /// Gets or sets the administrator subject.
    /// </summary>
    /// <remarks>The sub claim: https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims</remarks>
    /// <value>The administrator subject.</value>
    public string AdministratorSubject { get; set; }

    /// <summary>
    /// Gets or sets the administrator email.
    /// </summary>
    /// <value>The administrator email.</value>
    public string AdministratorEmail { get; set; }

    /// <summary>
    /// Gets or sets the cognito user pool identifier.
    /// </summary>
    /// <value>The cognito user pool identifier.</value>
    public string CognitoUserPoolId { get; set; }

    /// <summary>
    /// Gets or sets the cognito user pool domain.
    /// </summary>
    /// <value>The cognito user pool domain.</value>
    public string CognitoUserPoolDomain { get; set; }

    /// <summary>
    /// Gets or sets the cognito client application identifier.
    /// </summary>
    /// <value>The cognito client application identifier.</value>
    public string CognitoClientAppId { get; set; }

    /// <summary>
    /// Gets or sets the timestamp.
    /// </summary>
    /// <value>The timestamp.</value>
    public long Timestamp { get; set; }

    public TenantEntity ToTenantEntity() {
        return TenantDetails.ToTenantEntity(this);
    }

    public static TenantDetails FromTenantEntity(TenantEntity tenantEntity) {
        return new TenantDetails() {
            TenantId = tenantEntity.TenantId,
            TenantCode = tenantEntity.TenantCode,
            TenantName = tenantEntity.TenantName,
            CognitoUserPoolId = tenantEntity.CognitoUserPoolId,
            CognitoUserPoolDomain = tenantEntity.CognitoUserPoolDomain,
            CognitoClientAppId = tenantEntity.CognitoClientAppId,
            AdministratorEmail = tenantEntity.AdministratorEmail,
            AdministratorSubject = tenantEntity.AdministratorSubject,
            Timestamp = tenantEntity.Timestamp,
        };
    }

    public static TenantEntity ToTenantEntity(TenantDetails tenantDetails) {
        return new TenantEntity() {
            TenantId = tenantDetails.TenantId,
            TenantCode = tenantDetails.TenantCode,
            TenantName = tenantDetails.TenantName,
            CognitoUserPoolId = tenantDetails.CognitoUserPoolId,
            CognitoUserPoolDomain = tenantDetails.CognitoUserPoolDomain,
            CognitoClientAppId = tenantDetails.CognitoClientAppId,
            AdministratorEmail = tenantDetails.AdministratorEmail,
            AdministratorSubject = tenantDetails.AdministratorSubject,
            Timestamp = tenantDetails.Timestamp,
        };
    }
}
