using System.Collections.Concurrent;
using Amazon.Lambda.Core;
using Microsoft.Extensions.Logging;

namespace SilkRoad.TenantManagement.Messaging.Logging;

internal class CustomLambdaLogProvider : ILoggerProvider {
    private readonly ConcurrentDictionary<string, CustomLambdaLogger> _loggers = new ConcurrentDictionary<string, CustomLambdaLogger>();

    public CustomLambdaLogProvider(ILambdaLogger logger) {
        this.LambdaLogger = logger;
    }

    protected ILambdaLogger LambdaLogger { get; }

    public ILogger CreateLogger(string categoryName) {
        return _loggers.GetOrAdd(categoryName, x => new CustomLambdaLogger(x, this.LambdaLogger));
    }

    public void Dispose() {
        _loggers.Clear();
    }
}
