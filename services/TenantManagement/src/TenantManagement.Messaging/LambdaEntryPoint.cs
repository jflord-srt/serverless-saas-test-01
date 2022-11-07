using System.Text.Json;
using Amazon.Lambda.Core;
using Amazon.Lambda.SNSEvents;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SilkRoad.TenantManagement.Core.Features.Commands;
using SilkRoad.TenantManagement.Messaging.Logging;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace SilkRoad.TenantManagement.Messaging {

    /// <summary>
    /// The LambdaEntryPoint class.
    /// </summary>
    public class LambdaEntryPoint {

        /// <summary>
        /// Initializes a new instance of the <see cref="LambdaEntryPoint"/> class.
        /// </summary>
        public LambdaEntryPoint() {
        }

        /// <summary>
        /// The Lambda function handler
        /// </summary>
        /// <param name="event">The evnt.</param>
        /// <param name="context">The context.</param>
        /// <returns>A Task representing the asynchronous operation.</returns>
        public async Task FunctionHandlerAsync(SNSEvent @event, ILambdaContext context) {
            var configurationBuilder = new ConfigurationBuilder();

            configurationBuilder.Sources.Clear();

            configurationBuilder.AddEnvironmentVariables();

            var configuration = configurationBuilder.Build();

            var serviceCollection = new ServiceCollection();

            serviceCollection.AddSingleton(configuration);
            serviceCollection.AddLogging(builder => builder.AddProvider(new CustomLambdaLogProvider(context.Logger)));

            var startup = new Startup(configuration);
            startup.ConfigureServices(serviceCollection);

            var serviceProvider = serviceCollection.BuildServiceProvider();

            using (var scope = serviceProvider.CreateScope()) {
                foreach (var record in @event.Records) {
                    await this.ProcessRecordAsync(record, context, scope.ServiceProvider);
                }
            }
        }

        private async Task ProcessRecordAsync(SNSEvent.SNSRecord record, ILambdaContext context, IServiceProvider serviceProvider) {
            var logger = serviceProvider.GetRequiredService<ILogger<LambdaEntryPoint>>();
            var jsonSerializerOptions = serviceProvider.GetRequiredService<JsonSerializerOptions>();
            logger.LogInformation($"Processing event ({record.Sns.Subject}): {record.Sns.Message}");

            var subject = record.Sns.Subject;
            var message = record.Sns.Message;

            var mediator = serviceProvider.GetRequiredService<IMediator>();
            IBaseRequest request = null;
            if (string.Equals(subject, "StackDeployed", StringComparison.OrdinalIgnoreCase)) {
                request = JsonSerializer.Deserialize<UpdateDeploymentSettingsCommand>(message, jsonSerializerOptions) ?? throw new InvalidOperationException($"Invalid 'StackDeployed' message [{Environment.NewLine}{message}{Environment.NewLine}]");
            }
            else {
                logger.LogWarning("Discard unknown subject '{subject}'", subject);
            }

            if (request != null) {
                await mediator.Send(request);
            }
        }
    }
}
