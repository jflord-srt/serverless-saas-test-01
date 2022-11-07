package com.silkroad.db.deploy.Utils;

import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.silkroad.db.deploy.Exceptions.ValidationException;

public class WrappedLambdaLogger implements ILogger {

    private LambdaLogger lambdaLogger;

    public WrappedLambdaLogger(LambdaLogger lambdaLogger) throws ValidationException {
        this.lambdaLogger = lambdaLogger;
        if (this.lambdaLogger == null) {
            throw new ValidationException("Missing require argument: 'lambdaLogger'");
        }
    }

    @Override
    public void debug(String message) {
        this.lambdaLogger.log("DEBUG: " + message);
    }

    @Override
    public void info(String message) {
        this.lambdaLogger.log("INFO: " + message);
    }

    @Override
    public void error(String message) {
        this.lambdaLogger.log("ERROR: " + message);
    }
}