// <copyright file="ProvisionTenantCommandHandler.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using System.Net;
using System.Security.Cryptography;
using System.Text;
using Amazon.CognitoIdentityProvider;
using Amazon.CognitoIdentityProvider.Model;
using Amazon.Runtime.Internal;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MySqlConnector;
using SilkRoad.Libs.Infrastructure.Fundamentals;
using SilkRoad.Libs.Infrastructure.Fundamentals.Extensions;
using SilkRoad.Libs.Infrastructure.Fundamentals.Naming;
using SilkRoad.TenantManagement.Core.Configuration;
using SilkRoad.TenantManagement.Core.Domain.Tenants;
using SilkRoad.TenantManagement.Core.Infrastructure;
using SilkRoad.TenantManagement.DataAccess.Database;
using SilkRoad.TenantManagement.DataAccess.Entities;

namespace SilkRoad.TenantManagement.Core.Features.Commands;

/// <summary>
/// The ProvisionTenantCommandHandler class.
/// </summary>
public class ProvisionTenantCommandHandler : IRequestHandler<ProvisionTenantCommand, ProvisionTenantResponse> {

    /// <summary>
    /// Initializes a new instance of the <see cref="ProvisionTenantCommandHandler"/> class.
    /// </summary>
    /// <param name="dataContext">The data context.</param>
    /// <param name="cognitoIdentityProviderClient">The cognito identity provider client.</param>
    /// <param name="configurationService">The configuration service.</param>
    /// <param name="logger">The logger.</param>
    public ProvisionTenantCommandHandler(
        DataContext dataContext,
        IAmazonCognitoIdentityProvider cognitoIdentityProviderClient,
        ConfigurationService configurationService,
        ILogger<ProvisionTenantCommandHandler> logger
    ) {
        this.DataContext = dataContext;
        this.CognitoIdentityProviderClient = cognitoIdentityProviderClient;
        this.ConfigurationService = configurationService;
        this.Logger = logger;
    }

    /// <summary>
    /// Gets the cognito identity provider client.
    /// </summary>
    /// <value>The cognito identity provider client.</value>
    protected IAmazonCognitoIdentityProvider CognitoIdentityProviderClient { get; }

    /// <summary>
    /// Gets the configuration service.
    /// </summary>
    /// <value>The configuration service.</value>
    protected ConfigurationService ConfigurationService { get; }

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
    /// Handles the specified command.
    /// </summary>
    /// <param name="command">The command.</param>
    /// <param name="cancellationToken">The cancellation token that can be used by other objects or threads to receive notice of cancellation.</param>
    /// <returns>ProvisionTenantResponse.</returns>
    public async Task<ProvisionTenantResponse> Handle(ProvisionTenantCommand command, CancellationToken cancellationToken) {
        this.Logger.LogDebug($"Invoke: {nameof(ProvisionTenantCommandHandler)}.{nameof(this.Handle)}");

        var request = this.ValidateCommand(command);

        var tenantEntity = new TenantEntity() {
            TenantId = Guid.NewGuid().AsUniqueIdentifier(),
            TenantCode = request.TenantCode.ToUpperInvariant(), // Force upper case
            TenantName = request.TenantName,
            CognitoUserPoolId = TenantDetails.PENDING_TAG,
            CognitoUserPoolDomain = TenantDetails.PENDING_TAG,
            CognitoClientAppId = TenantDetails.PENDING_TAG,
            AdministratorSubject = TenantDetails.PENDING_TAG,
            AdministratorEmail = request.AdministratorEmail,
            Timestamp = DateTime.UtcNow.Ticks,
        };

        try {
            this.DataContext.Tenants.Add(tenantEntity);
            await this.DataContext.SaveChangesAsync(cancellationToken);

            var appUrls = await this.DataContext.DeploymentSettings
                .Where(x => x.SettingType == "ClientAppUrl")
                .Select(x => x.SettingValue)
                .ToListAsync(cancellationToken);

            // Update to include the UserPoolId
            tenantEntity.CognitoUserPoolId = await this.CreateCognitoUserPool(
                tenantEntity.TenantId,
                appUrls,
                cancellationToken
            );

            await this.DataContext.SaveChangesAsync(cancellationToken);

            tenantEntity.CognitoUserPoolDomain = await this.CreateCognitoUserPoolDomainAppAsync(
                tenantEntity.TenantId,
                tenantEntity.CognitoUserPoolId,
                cancellationToken
            );

            await this.DataContext.SaveChangesAsync(cancellationToken);

            tenantEntity.CognitoClientAppId = await this.CreateCognitoUserPoolClientAppAsync(
                tenantEntity.TenantId,
                tenantEntity.CognitoUserPoolId,
                appUrls,
                cancellationToken
            );

            await this.DataContext.SaveChangesAsync(cancellationToken);

            tenantEntity.AdministratorSubject = await this.CreateDefaultAdministratorAsync(
                tenantEntity.CognitoUserPoolId,
                tenantEntity.TenantId,
                tenantEntity.AdministratorEmail,
                cancellationToken
            );

            // Update to include the AdministratorSubject
            await this.DataContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception e1) {
            this.Logger.LogWarning(e1, $"An error has occurred while executing the {nameof(ProvisionTenantCommand)}, attempting to rollback changes...");
            try {
                if (!string.IsNullOrEmpty(tenantEntity.CognitoUserPoolId) && tenantEntity.CognitoUserPoolId != TenantDetails.PENDING_TAG) {
                    var deleteUserPoolRequest = new DeleteUserPoolRequest() {
                        UserPoolId = tenantEntity.CognitoUserPoolId,
                    };
                    this.Logger.LogWarning("Rollback: Delete Tenant UserPool '{tenantDetails.CognitoUserPoolId}'...", tenantEntity.CognitoUserPoolId);
                    await this.CognitoIdentityProviderClient.DeleteUserPoolAsync(deleteUserPoolRequest, cancellationToken);
                }

                this.Logger.LogWarning("Rollback: Delete Tenant '{tenantDetails.TenantId}'...", tenantEntity.TenantId);
                this.DataContext.Tenants.Remove(tenantEntity);
                await this.DataContext.SaveChangesAsync(cancellationToken);
            }
            catch (Exception e2) {
                // Log and swallow the rollback attempt error
                this.Logger.LogError(e2, "An error has occurred while trying to rollback failed ProvisionTenantCommand attempt.");
            }

            // Check if this is a duplicate entity exception
            if (e1.InnerException is MySqlException { Number: 1062 }) {
                /* 1062 - Duplicate Entry */
                throw new OperationCanceledException($"TenantCode '{tenantEntity.TenantCode}' already exists.")
                    .SetErrorCode(ErrorCodes.DuplicateResource);
            }

            throw;
        }

        return new ProvisionTenantResponse() {
            TenantId = tenantEntity.TenantId,
        };
    }

    private async Task<string> CreateCognitoUserPool(string tenantId, IEnumerable<string> appUrls, CancellationToken cancellationToken) {
        this.Logger.LogInformation("Creating Cognito User Pool for Tenant '{tenantId}'", tenantId);

        var createUserPoolRequest = new CreateUserPoolRequest() {
            PoolName = $"tenant-user-pool-{tenantId}",
            Schema = new AutoConstructedList<SchemaAttributeType>() {
                new SchemaAttributeType() {
                    Name = "email",
                    Required = true,
                    Mutable = true,
                    AttributeDataType = new AttributeDataType("String"),
                    StringAttributeConstraints = new StringAttributeConstraintsType()
                    {
                        MinLength = "0",
                        MaxLength = "128",
                    },
                },
                new SchemaAttributeType() {
                    Name = "tenant_id",
                    Required = false,
                    Mutable = false,
                    AttributeDataType = new AttributeDataType("String"),
                    DeveloperOnlyAttribute = false,
                    StringAttributeConstraints = new StringAttributeConstraintsType()
                    {
                        MinLength = "0",
                        MaxLength = "64",
                    },
                },
                new SchemaAttributeType() {
                    Name = "user_role",
                    Required = false,
                    Mutable = true,
                    AttributeDataType = new AttributeDataType("String"),
                    StringAttributeConstraints = new StringAttributeConstraintsType()
                    {
                        MinLength = "0",
                        MaxLength = "128",
                    },
                },
            },
            AutoVerifiedAttributes = new List<string>() {
                "email",
            },
            AccountRecoverySetting = new AccountRecoverySettingType() {
                RecoveryMechanisms = new List<RecoveryOptionType>() {
                    new RecoveryOptionType() {
                        Name = "verified_email",
                        Priority = 1,
                    },
                },
            },
            AdminCreateUserConfig = new AdminCreateUserConfigType() {
                InviteMessageTemplate = new MessageTemplateType() {
                    EmailSubject = "Your temporary password for tenant UI application",
                    EmailMessage = $"Login into your application at '{appUrls.FirstOrDefault()}' withe username {{username}} and temporary password {{####}}",
                    SMSMessage = $"Login into your application at '{appUrls.FirstOrDefault()}' withe username {{username}} and temporary password {{####}}",
                },
            },
        };

        var createUserPoolResponse = await this.CognitoIdentityProviderClient.CreateUserPoolAsync(createUserPoolRequest, cancellationToken);

        if (createUserPoolResponse.HttpStatusCode != HttpStatusCode.OK) {
            throw new InvalidOperationException($"An error occurred while attempting to create the Cognito User Pool for Tenant '{tenantId}'. Status Code: {createUserPoolResponse.HttpStatusCode}");
        }

        return createUserPoolResponse.UserPool.Id;
    }

    private async Task<string> CreateCognitoUserPoolDomainAppAsync(string tenantId, string userPoolId, CancellationToken cancellationToken) {
        var createUserPoolDomainRequest = new CreateUserPoolDomainRequest() {
            UserPoolId = userPoolId,
            Domain = $"tenant-{tenantId}".ToLower(),
        };

        var createUserPoolDomainResponse = await this.CognitoIdentityProviderClient.CreateUserPoolDomainAsync(createUserPoolDomainRequest, cancellationToken);

        if (createUserPoolDomainResponse.HttpStatusCode != HttpStatusCode.OK) {
            throw new InvalidOperationException($"An error occurred while attempting to create the Cognito User Pool Domain for Tenant '{tenantId}'. Status Code: {createUserPoolDomainResponse.HttpStatusCode}");
        }

        return createUserPoolDomainRequest.Domain;
    }

    private async Task<string> CreateCognitoUserPoolClientAppAsync(string tenantId, string userPoolId, IEnumerable<string> appUrls, CancellationToken cancellationToken) {
        var createUserPoolClientRequest = new CreateUserPoolClientRequest() {
            UserPoolId = userPoolId,
            ClientName = "client-app-cognito-client",
            GenerateSecret = false,
            CallbackURLs = appUrls?.ToList(),
            LogoutURLs = appUrls?.ToList(),
            SupportedIdentityProviders = new List<string>() {
                "COGNITO",
            },
            AllowedOAuthFlowsUserPoolClient = true,
            AllowedOAuthFlows = new List<string>()
            {
                "code", "implicit",
            },
            AllowedOAuthScopes = new List<string>() {
                "email", "openid", "profile",
            },
        };

        var createUserPoolClientResponse = await this.CognitoIdentityProviderClient.CreateUserPoolClientAsync(createUserPoolClientRequest, cancellationToken);

        if (createUserPoolClientResponse.HttpStatusCode != HttpStatusCode.OK) {
            throw new InvalidOperationException($"An error occurred while attempting to create the Cognito User Pool Client for Tenant '{tenantId}'. Status Code: {createUserPoolClientResponse.HttpStatusCode}");
        }

        return createUserPoolClientResponse.UserPoolClient.ClientId;
    }

    private async Task<string> CreateDefaultAdministratorAsync(string userPoolId, string tenantId, string administratorEmail, CancellationToken cancellationToken) {
        this.Logger.LogInformation("Creating Administrator '{administratorEmail}' for Tenant '{tenantId}' in User Pool '{userPoolId}'", administratorEmail, tenantId, userPoolId);

        var userName = "Administrator";
        var groupName = "Administrators";

        await this.CreateCognitoUserGroupAsync(userPoolId, groupName, cancellationToken);

        var adminCreateUserRequest = new AdminCreateUserRequest() {
            UserPoolId = userPoolId,
            Username = userName,
            TemporaryPassword = GeneratePassword(8),
            UserAttributes = {
                new AttributeType()
                {
                    Name = "email",
                    Value = administratorEmail,
                },
                new AttributeType()
                {
                    Name = "custom:user_role",
                    Value = "Administrator",
                },
                new AttributeType()
                {
                    Name = "custom:tenant_id",
                    Value = tenantId,
                },
            },
            DesiredDeliveryMediums = new List<string>() {
                "EMAIL",
            },
        };

        var adminCreateUserResponse = await this.CognitoIdentityProviderClient.AdminCreateUserAsync(adminCreateUserRequest, cancellationToken);

        if (adminCreateUserResponse.HttpStatusCode != HttpStatusCode.OK) {
            throw new InvalidOperationException($"An error occurred while attempting to create User '{userName}' for Tenant '{tenantId}' in UserPool '{userPoolId}'. Status Code: {adminCreateUserResponse.HttpStatusCode}");
        }

        var adminAddUserToGroupRequest = new AdminAddUserToGroupRequest() {
            UserPoolId = userPoolId,
            GroupName = groupName,
            Username = userName,
        };

        var adminAddUserToGroupResponse = await this.CognitoIdentityProviderClient.AdminAddUserToGroupAsync(adminAddUserToGroupRequest, cancellationToken);

        if (adminAddUserToGroupResponse.HttpStatusCode != HttpStatusCode.OK) {
            throw new InvalidOperationException($"An error occurred while attempting to add User '{userName}' to Group '{groupName}' for Tenant '{tenantId}' in UserPool '{userPoolId}'. Status Code: {adminAddUserToGroupResponse.HttpStatusCode}");
        }

        var sub = adminCreateUserResponse.User?.Attributes?
            .Where(x => x.Name == "sub")
            .Select(x => x.Value)
            .FirstOrDefault();

        return sub;
    }

    private async Task CreateCognitoUserGroupAsync(string userPoolId, string groupName, CancellationToken cancellationToken) {
        var createGroupRequest = new CreateGroupRequest() {
            UserPoolId = userPoolId,
            GroupName = groupName,
            Precedence = 0,
        };
        var createGroupResponse = await this.CognitoIdentityProviderClient.CreateGroupAsync(createGroupRequest, cancellationToken);

        if (createGroupResponse.HttpStatusCode != HttpStatusCode.OK) {
            throw new InvalidOperationException($"An error occurred while attempting to create Group '{groupName}' in UserPool '{userPoolId}'. Status Code: {createGroupResponse.HttpStatusCode}");
        }
    }

    /// <summary>
    /// Validates the command.
    /// </summary>
    /// <param name="command">The command.</param>
    /// <returns>ProvisionTenantRequest.</returns>
    /// <exception cref="System.ArgumentException">Invalid email format</exception>
    private ProvisionTenantRequest ValidateCommand(ProvisionTenantCommand command) {
        var nameOfMember = NameOfMember.ForType<ProvisionTenantCommand>()
            .UseCamelCase()
            .Build();

        ThrowIf.ArgumentIsNull(command, nameof(command), errorCode: ErrorCodes.InvalidArgument);
        ThrowIf.ArgumentIsNull(command.Request, nameOfMember.GetPath(x => x.Request), errorCode: ErrorCodes.InvalidArgument);
        ThrowIf.ArgumentIsNullish(command.Request.TenantName, nameOfMember.GetPath(x => x.Request.TenantName), errorCode: ErrorCodes.InvalidArgument);
        ThrowIf.ArgumentIsNullish(command.Request.TenantCode, nameOfMember.GetPath(x => x.Request.TenantCode), errorCode: ErrorCodes.InvalidArgument);
        ThrowIf.ArgumentIsNullish(command.Request.AdministratorEmail, nameOfMember.GetPath(x => x.Request.AdministratorEmail), errorCode: ErrorCodes.InvalidArgument);

        if (!RegexUtilities.IsValidEmail(command.Request.AdministratorEmail)) {
            throw new ArgumentException(
                "Invalid email format",
                nameOfMember.GetPath(x => x.Request.AdministratorEmail)
            ).SetErrorCode(ErrorCodes.InvalidArgument);
        }

        return command.Request;
    }

    private static readonly string[] _passwordChars = new[] {
        "ABCDEFGHJKLMNOPQRSTUVWXYZ", // uppercase
        "abcdefghijkmnopqrstuvwxyz", // lowercase
        "0123456789",                // digits
        "!@#$%^&*-=_+",              // non-alphanumeric
    };

    private static string GeneratePassword(int length = 8) {
        length = Math.Max(length, 8);

        // Generate a cryptographically random set of characters
        using var rng = RandomNumberGenerator.Create();
        var tokenBuffer = new byte[length];
        rng.GetBytes(tokenBuffer);

        var model = Convert.ToBase64String(tokenBuffer);
        if (model.Length > length) {
            model = model[..length];
        }

        // Add the requirements
        var r = new Random(Guid.NewGuid().GetHashCode());
        var password = new StringBuilder(model) {
            [0] = _passwordChars[0][r.Next(0, _passwordChars[0].Length)], // uppercase
            [1] = _passwordChars[1][r.Next(0, _passwordChars[1].Length)], // uppercase
            [2] = _passwordChars[2][r.Next(0, _passwordChars[2].Length)], // digits
            [3] = _passwordChars[3][r.Next(0, _passwordChars[3].Length)], // non-alphanumeric
        };

        // Shuffle the results
        var shuffle = password.ToString().OrderBy(_ => r.NextDouble()).ToArray();
        return new string(shuffle);
    }
}
