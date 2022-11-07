// <copyright file="ApiError.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using SilkRoad.Libs.Infrastructure.Fundamentals.Extensions;
using SilkRoad.TenantManagement.Core;

namespace SilkRoad.TenantManagement.Api.Infrastructure;

/// <summary>
/// The ApiError class. ProblemDetails (RFC7807)
/// </summary>
/// <remarks>
/// https://datatracker.ietf.org/doc/html/rfc7807#section-3
/// </remarks>
public class ApiError : ProblemDetails {

    /// <summary>
    /// Initializes a new instance of the <see cref="ApiError"/> class.
    /// </summary>
    /// <param name="title">The title.</param>
    /// <param name="errorCode">The error code.</param>
    public ApiError(string title, string errorCode) {
        this.Type = GetProblemType(errorCode);
        this.Title = title;
        this.Extensions["errorCode"] = errorCode;
    }

    private static string GetProblemType(string discriminator) => $"https://silkroad.com/rfc7807/{discriminator}".ToLowerInvariant();

    /// <summary>
    /// Creates and ApiError from the given exception.
    /// </summary>
    /// <param name="e">The e.</param>
    /// <param name="title">The title.</param>
    /// <param name="includeDetails">if set to <c>true</c> [include exception details].</param>
    /// <returns>ApiError.</returns>
    public static ApiError FromException(Exception e, string title, bool includeDetails) {
        var errorCode = e.GetErrorCode() ?? ErrorCodes.Unknown;
        var status = (int)ErrorCodes.ApproximateHttpStatusCode(errorCode);

        var apiError = new ApiError(title, errorCode) {
            Status = status,
        };

        if (includeDetails) {
            apiError.Extensions["exception"] = $"{e.GetType().Name}: {e.Message}";
            apiError.Extensions["stackTrace"] = e.StackTrace;

            var innerExceptions = e.FlattenExceptions();

            if (innerExceptions.Any()) {
                var index = 0;
                foreach (var innerException in innerExceptions) {
                    apiError.Extensions[$"error_{index:d2}"] = innerException.Message;
                    index++;
                }
            }
        }

        return apiError;
    }
}
