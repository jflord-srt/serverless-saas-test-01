// <copyright file="ErrorCodes.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using System.Net;

namespace SilkRoad.TenantManagement.Core;

/// <summary>
/// The ErrorCodes class.
/// </summary>
public static class ErrorCodes {

    /// <summary>
    /// The unknown error code.
    /// </summary>
    public const string Unknown = "Unknown";

    /// <summary>
    /// The resource not found error code.
    /// </summary>
    public const string ResourceNotFound = "RESOURCE_NOT_FOUND";

    /// <summary>
    /// The duplicate tenant
    /// </summary>
    public const string DuplicateResource = "DUPLICATE_RESOURCE";

    /// <summary>
    /// The invalid argument
    /// </summary>
    public const string InvalidArgument = "INVALID_ARGUMENT";

    /// <summary>
    /// Approximates the HTTP status code.
    /// </summary>
    /// <param name="errorCode">The error code.</param>
    /// <returns>HttpStatusCode.</returns>
    public static HttpStatusCode ApproximateHttpStatusCode(string errorCode) {
        if (errorCode == ResourceNotFound) {
            return HttpStatusCode.NotFound;
        }

        if (errorCode == InvalidArgument) {
            return HttpStatusCode.BadRequest;
        }

        if (errorCode == DuplicateResource) {
            return HttpStatusCode.Conflict;
        }

        return HttpStatusCode.InternalServerError;
    }
}
