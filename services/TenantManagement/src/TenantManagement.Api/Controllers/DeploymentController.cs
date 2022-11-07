using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SilkRoad.TenantManagement.DataAccess.Database;

namespace SilkRoad.TenantManagement.Api.Controllers {

    public class DeploymentController : Controller {

        public DeploymentController(DataContext dataContext) {
            this.DataContext = dataContext;
        }

        protected DataContext DataContext { get; }

        [HttpPost("migrate-database")]
        public async Task<IActionResult> MigrateDatabaseAsync(CancellationToken cancellationToken) {
            await this.DataContext.Database.MigrateAsync(cancellationToken);

            return this.NoContent();
        }
    }
}
