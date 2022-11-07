using MediatR;

namespace SilkRoad.TenantManagement.Core.Features.Commands {

    public class UpdateDeploymentSettingsCommand : IRequest<Unit> {
        public string SaasOperationsUrl { get; set; }

        public string[] ClientAppUrls { get; set; }
    }
}
