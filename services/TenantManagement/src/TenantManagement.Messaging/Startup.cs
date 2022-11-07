using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SilkRoad.TenantManagement.Core;

namespace SilkRoad.TenantManagement.Messaging {

    public class Startup {

        public Startup(IConfiguration configuration) {
            this.Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection serviceCollection) {
            serviceCollection.AddSingleton(new JsonSerializerOptions {
                PropertyNameCaseInsensitive = true
            });
            serviceCollection.AddTenantManagementCore(this.Configuration);
        }
    }
}
