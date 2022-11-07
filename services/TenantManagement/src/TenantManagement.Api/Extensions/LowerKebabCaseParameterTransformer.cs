// <copyright file="LowerKebabCaseParameterTransformer.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

namespace SilkRoad.TenantManagement.Api.Extensions;

/// <summary>
/// The LowerKebabCaseParameterTransformer class.
/// Implements the <see cref="IOutboundParameterTransformer" />
/// </summary>
/// <seealso cref="IOutboundParameterTransformer" />
public class LowerKebabCaseParameterTransformer : IOutboundParameterTransformer {

    /// <inheritdoc />
    public string TransformOutbound(object value) {
        var target = string.Empty;
        if (value is string s) {
            target = s;
        }
        else if (value is not null) {
            target = value.ToString();
        }

        return target.PascalToKebabCase();
    }
}
