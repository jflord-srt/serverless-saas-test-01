using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using SilkRoad.Libs.Infrastructure.Fundamentals;
using SilkRoad.TenantManagement.DataAccess.Entities;

namespace SilkRoad.TenantManagement.DataAccess.Database {

    public class DataContext : DbContext {

        /// <summary>
        /// Initializes a new instance of the <see cref="DataContext"/> class.
        /// </summary>
        /// <param name="options">The options.</param>
        /// <param name="loggerFactory">The logger factory.</param>
        public DataContext(DbContextOptions options, ILoggerFactory loggerFactory)
            : base(options) {
            this.LoggerFactory = loggerFactory ?? NullLoggerFactory.Instance;
        }

        /// <summary>
        /// Gets or sets the logger factory.
        /// </summary>
        /// <value>The logger factory.</value>
        protected ILoggerFactory LoggerFactory { get; set; }

        /// <summary>
        /// Gets or sets the tenants.
        /// </summary>
        /// <value>The tenants.</value>
        public DbSet<TenantEntity> Tenants { get; set; }

        /// <summary>
        /// Gets or sets the deployment settings.
        /// </summary>
        /// <value>The deployment settings.</value>
        public DbSet<DeploymentSettingEntity> DeploymentSettings { get; set; }

        /// <inheritdoc />
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder) {
            ThrowIf.ArgumentIsNull(optionsBuilder, nameof(optionsBuilder));

            base.OnConfiguring(optionsBuilder);

            //#if DEBUG
            optionsBuilder.EnableSensitiveDataLogging();
            //#endif
            if (this.LoggerFactory != null) {
                optionsBuilder.UseLoggerFactory(this.LoggerFactory);
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder) {
            modelBuilder.Entity<TenantEntity>()
                .ToTable("Tenant")
                .HasKey(x => x.TenantId);

            modelBuilder.Entity<TenantEntity>()
                .HasIndex(x => x.TenantCode)
                .IsUnique();

            modelBuilder.Entity<TenantEntity>()
                .Property(c => c.Timestamp)
                .IsRequired()
                .IsConcurrencyToken();

            modelBuilder.Entity<DeploymentSettingEntity>()
                .ToTable("DeploymentSetting")
                .HasKey(x => x.Id);

            modelBuilder.Entity<DeploymentSettingEntity>()
                .Property(c => c.Timestamp)
                .IsRequired()
                .IsConcurrencyToken();
        }
    }
}
