using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SilkRoad.TenantManagement.DataAccess.Database;
using SilkRoad.TenantManagement.DataAccess.Entities;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace SilkRoad.TenantManagement.Core.Features.Commands {

    public class UpdateDeploymentSettingsCommandHandler : IRequestHandler<UpdateDeploymentSettingsCommand, Unit> {

        public UpdateDeploymentSettingsCommandHandler(DataContext dataContext, ILogger<UpdateDeploymentSettingsCommandHandler> logger) {
            this.DataContext = dataContext;
            this.Logger = logger;
        }

        protected DataContext DataContext { get; }

        protected ILogger Logger { get; }

        public async Task<Unit> Handle(UpdateDeploymentSettingsCommand command, CancellationToken cancellationToken) {
            this.Logger.LogInformation($"Execute: {nameof(UpdateDeploymentSettingsCommandHandler)}");

            this.Logger.LogInformation(JsonSerializer.Serialize(command));

            var saasOperationsUrl = await this.DataContext.DeploymentSettings
                .Where(x => x.SettingType == "SaasOperationsUrl")
                .FirstOrDefaultAsync(cancellationToken);

            if (saasOperationsUrl == null) {
                this.Logger.LogInformation($"Add: SaasOperationsUrl");
                saasOperationsUrl = new DeploymentSettingEntity() {
                    SettingType = "SaasOperationsUrl",
                    SettingValue = command.SaasOperationsUrl,
                    Timestamp = DateTime.UtcNow.Ticks,
                };

                this.DataContext.DeploymentSettings.Add(saasOperationsUrl);
            }
            else {
                this.Logger.LogInformation($"Update: SaasOperationsUrl");
                saasOperationsUrl.SettingType = "SaasOperationsUrl";
                saasOperationsUrl.SettingValue = command.SaasOperationsUrl;
                saasOperationsUrl.Timestamp = DateTime.UtcNow.Ticks;
            }

            var newClientAppUrls = command.ClientAppUrls;
            var existingClientAppUrls = await this.DataContext.DeploymentSettings
                .Where(x => x.SettingType == "ClientAppUrl")
                .ToListAsync(cancellationToken);

            for (var i = 0; i < newClientAppUrls.Length; i++) {
                if (existingClientAppUrls.Count > i) {
                    // Update
                    this.Logger.LogInformation($"Update: ClientAppUrl[{i}]");
                    existingClientAppUrls[i].SettingType = "ClientAppUrl";
                    existingClientAppUrls[i].SettingValue = newClientAppUrls[i];
                    existingClientAppUrls[i].Timestamp = DateTime.UtcNow.Ticks;
                }
                else {
                    // Add
                    this.Logger.LogInformation($"Add: ClientAppUrl[{i}]");
                    var clientAppUrl = new DeploymentSettingEntity() {
                        SettingType = "ClientAppUrl",
                        SettingValue = newClientAppUrls[i],
                        Timestamp = DateTime.UtcNow.Ticks,
                    };

                    this.DataContext.DeploymentSettings.Add(clientAppUrl);
                }

                if (existingClientAppUrls.Count < i && existingClientAppUrls.Count > newClientAppUrls.Length) {
                    // Delete
                    this.Logger.LogInformation($"Delete: ClientAppUrl[{i}]");
                    this.DataContext.DeploymentSettings.Remove(existingClientAppUrls[i]);
                }
            }

            await this.DataContext.SaveChangesAsync(cancellationToken);

            return Unit.Value;
        }
    }
}
