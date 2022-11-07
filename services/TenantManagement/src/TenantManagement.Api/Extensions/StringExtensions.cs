// <copyright file="StringExtensions.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using System.Text;

namespace SilkRoad.TenantManagement.Api.Extensions;

/// <summary>
/// The StringExtensions class.
/// </summary>
public static class StringExtensions {

    /// <summary>
    /// Pascals to kebab case.
    /// </summary>
    /// <param name="source">The source.</param>
    /// <returns>System.String.</returns>
    /// <remarks>Ref: https://stackoverflow.com/questions/37301287/how-do-i-convert-pascalcase-to-kebab-case-with-c</remarks>
    public static string PascalToKebabCase(this string source) {
        if (source is null) {
            return null;
        }

        if (source.Length == 0) {
            return string.Empty;
        }

        var builder = new StringBuilder();

        for (var i = 0; i < source.Length; i++) {
            if (char.IsLower(source[i])) {
                // if current char is already lowercase
                builder.Append(source[i]);
            }
            else if (i == 0) {
                // if current char is the first char
                builder.Append(char.ToLower(source[i]));
            }
            else if (char.IsDigit(source[i]) && !char.IsDigit(source[i - 1])) {
                // if current char is a number and the previous is not
                builder.Append('-');
                builder.Append(source[i]);
            }
            else if (char.IsDigit(source[i])) {
                // if current char is a number and previous is
                builder.Append(source[i]);
            }
            else if (char.IsLower(source[i - 1])) {
                // if current char is upper and previous char is lower
                builder.Append('-');
                builder.Append(char.ToLower(source[i]));
            }
            else if (i + 1 == source.Length || char.IsUpper(source[i + 1])) {
                // if current char is upper and next char doesn't exist or is upper
                builder.Append(char.ToLower(source[i]));
            }
#pragma warning disable S1871 // Two branches in a conditional structure should not have exactly the same implementation
            else {
                // if current char is upper and next char is lower
                builder.Append('-');
                builder.Append(char.ToLower(source[i]));
            }
#pragma warning restore S1871 // Two branches in a conditional structure should not have exactly the same implementation
        }

        return builder.ToString();
    }
}
