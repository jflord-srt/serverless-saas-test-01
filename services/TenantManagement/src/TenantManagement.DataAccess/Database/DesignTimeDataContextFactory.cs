// <copyright file="DesignTimeDataContextFactory.cs" company="SilkRoad Technology">
// Copyright (c) SilkRoad Technology. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Logging.Abstractions;

namespace SilkRoad.TenantManagement.DataAccess.Database {

    /// <inheritdoc/>
    public class DesignTimeDataContextFactory : IDesignTimeDbContextFactory<DataContext> {
        private const string MockConnectionString = "Server=localhost;Database=NullDatabase;User Id=NullUser;Password=NullPassword";

        /// <inheritdoc/>
        public DataContext CreateDbContext(string[] args) {
            var builder = new DbContextOptionsBuilder<DataContext>();

            var serverVersion = new MySqlServerVersion(new Version(8, 0, 23));
            builder.UseMySql(MockConnectionString, serverVersion);

            return new DataContext(builder.Options, NullLoggerFactory.Instance);
        }
    }
}
