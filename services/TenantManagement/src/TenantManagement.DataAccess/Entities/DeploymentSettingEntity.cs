using System.ComponentModel.DataAnnotations;

namespace SilkRoad.TenantManagement.DataAccess.Entities;

/// <summary>
/// The DeploymentSettingEntity class.
/// </summary>
public class DeploymentSettingEntity {

    /// <summary>
    /// Gets or sets the identifier.
    /// </summary>
    /// <value>The identifier.</value>
    [Required]
    public int Id { get; set; }

    /// <summary>
    /// Gets or sets the type of the setting.
    /// </summary>
    /// <value>The type of the setting.</value>
    [Required]
    [MaxLength(250)]
    public string SettingType { get; set; }

    /// <summary>
    /// Gets or sets the setting value.
    /// </summary>
    /// <value>The setting value.</value>
    [Required]
    [MaxLength(1000)]
    public string SettingValue { get; set; }

    /// <summary>
    /// Gets or sets the timestamp.
    /// </summary>
    /// <value>The timestamp.</value>
    [Required]
    public long Timestamp { get; set; }
}
