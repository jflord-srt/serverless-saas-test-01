using Amazon.Lambda.Core;
using Microsoft.Extensions.Logging;
using LogLevel = Microsoft.Extensions.Logging.LogLevel;

namespace SilkRoad.TenantManagement.Messaging.Logging;

internal class CustomLambdaLogger : ILogger {

    public CustomLambdaLogger(string categoryName, ILambdaLogger lambdaLogger) {
        this.CategoryName = categoryName;
        this.LambdaLogger = lambdaLogger;
    }

    protected string CategoryName { get; }

    protected ILambdaLogger LambdaLogger { get; }

    /// <inheritdoc/>
    public IDisposable BeginScope<TState>(TState state) {
        return null;
    }

    /// <inheritdoc/>
    public bool IsEnabled(LogLevel logLevel) {
        return true;
    }

    /// <inheritdoc/>
    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception exception, Func<TState, Exception, string> formatter) {
        if (!this.IsEnabled(logLevel)) {
            return;
        }

        this.LambdaLogger.LogLine($"{logLevel}: [{this.CategoryName}]{Environment.NewLine}{formatter(state, exception)}");
    }
}
