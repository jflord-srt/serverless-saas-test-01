// <copyright file="RegexUtilities.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using System.Globalization;
using System.Text.RegularExpressions;

namespace SilkRoad.TenantManagement.Core.Infrastructure;

/// <summary>
/// The RegexUtilities class.
/// </summary>
internal static class RegexUtilities {

    /// <summary>
    /// Determines whether [is valid email] [the specified email].
    /// </summary>
    /// <param name="email">The email.</param>
    /// <remarks>Ref: https://docs.microsoft.com/en-us/dotnet/standard/base-types/how-to-verify-that-strings-are-in-valid-email-format</remarks>
    /// <returns><c>true</c> if [is valid email] [the specified email]; otherwise, <c>false</c>.</returns>
    public static bool IsValidEmail(string email) {
        if (string.IsNullOrWhiteSpace(email)) {
            return false;
        }

        try {
            // Normalize the domain
            email = Regex.Replace(
                email,
                "(@)(.+)$",
                DomainMapper,
                RegexOptions.None,
                TimeSpan.FromMilliseconds(200)
            );

            // Examines the domain part of the email and normalizes it.
            static string DomainMapper(Match match) {
                // Use IdnMapping class to convert Unicode domain names.
                var idn = new IdnMapping();

                // Pull out and process domain name (throws ArgumentException on invalid)
                var domainName = idn.GetAscii(match.Groups[2].Value);

                return match.Groups[1].Value + domainName;
            }
        }
        catch (RegexMatchTimeoutException) {
            return false;
        }
        catch (ArgumentException) {
            return false;
        }

        try {
            return Regex.IsMatch(
                email,
                @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
                RegexOptions.IgnoreCase,
                TimeSpan.FromMilliseconds(250)
            );
        }
        catch (RegexMatchTimeoutException) {
            return false;
        }
    }
}
