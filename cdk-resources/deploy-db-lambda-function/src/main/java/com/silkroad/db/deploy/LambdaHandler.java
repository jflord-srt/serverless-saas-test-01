package com.silkroad.db.deploy;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang3.StringUtils;

import com.google.gson.*;
import com.silkroad.db.deploy.Exceptions.*;
import com.silkroad.db.deploy.Types.*;
import com.silkroad.db.deploy.Utils.*;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.events.CloudFormationCustomResourceEvent;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;

public class LambdaHandler {
    Gson gson = new GsonBuilder().setPrettyPrinting().create();

    public Object handleRequest(CloudFormationCustomResourceEvent event, Context context) {
        String eventJson = gson.toJson(event);
        try {
            WrappedLambdaLogger logger = new WrappedLambdaLogger(context.getLogger());
            ResourceProperties properties = new ResourceProperties(event.getResourceProperties());

            Boolean isDebug = properties.getProperty("isDebug", Boolean.class);
            if (isDebug == null) {
                isDebug = false;
            }

            if (isDebug) {
                logger.debug(eventJson);
            }

            switch (event.getRequestType()) {
                case "Create": {
                    return this.create(properties, logger, isDebug);
                }
                case "Update": {
                    return this.update(properties, logger, isDebug);
                }
                case "Delete": {
                    return this.delete(properties, logger, isDebug);
                }
                default: {
                    String message = String.format("Unexpected request type '%s'", event.getRequestType());
                    throw new RuntimeException(message);
                }
            }
        } catch (Exception e) {
            context.getLogger().log(e.toString());

            String errors = String.join(System.lineSeparator() + "  - ", getExceptionMessages(e));
            String message = "Database deployment failed due to the following errors:" + System.lineSeparator()
                    + errors;
            throw new RuntimeException(message);
        }
    }

    private Object create(ResourceProperties properties, ILogger logger, boolean isDebug) {
        try {
            this.migrate(properties, logger, isDebug);
            logger.info("Create resource completed successfully");
            return "Task - OK";
        } catch (Exception e) {
            throw new RuntimeException("An error occurred while processing the resource 'Create' event", e);
        }
    }

    private Object update(ResourceProperties properties, ILogger logger, boolean isDebug) {
        try {
            this.migrate(properties, logger, isDebug);
            logger.info("Update resource completed successfully");
            return "Task - OK";
        } catch (Exception e) {
            throw new RuntimeException("An error occurred while processing the resource 'Update' event", e);
        }
    }

    private Object delete(ResourceProperties properties, ILogger logger, boolean isDebug) {
        // NoOp
        return "Task - NoOp";
    }

    private void migrate(ResourceProperties properties, ILogger logger, boolean isDebug)
            throws AppException, ValidationException {

        logger.info("Running database schema migration...");

        String region = properties.getProperty("region", String.class);
        if (StringUtils.isEmpty(region)) {
            throw new ValidationException("Missing required resource property: 'region'");
        }

        RdsHostInfo rdsHostInfo = properties.getProperty("rdsHost", RdsHostInfo.class);
        if (rdsHostInfo == null) {
            throw new ValidationException("Missing required resource property: 'rdsHost'");
        }
        rdsHostInfo.validate();

        String rdsAdminSecretArn = properties.getProperty("rdsAdminSecretArn", String.class);
        if (StringUtils.isEmpty(rdsAdminSecretArn)) {
            throw new ValidationException("Missing required resource property: 'rdsAdminSecretArn'");
        }

        String rdsAppSecretArn = properties.getProperty("rdsAppSecretArn", String.class);
        if (StringUtils.isEmpty(rdsAppSecretArn)) {
            throw new ValidationException("Missing required resource property: 'rdsAppSecretArn'");
        }

        SecretsManagerClient secretsClient = SecretsManagerClient.builder()
                .region(Region.of(region))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();

        RdsAdminSecret rdsAdminSecret = null;
        RdsAppSecret rdsAppSecret = null;

        try {
            String rdsAdminSecretValue = getSecretValue(secretsClient, rdsAdminSecretArn);
            rdsAdminSecret = gson.fromJson(rdsAdminSecretValue, RdsAdminSecret.class);
            rdsAdminSecret.validate();

            String rdsAppSecretValue = getSecretValue(secretsClient, rdsAppSecretArn);
            rdsAppSecret = gson.fromJson(rdsAppSecretValue, RdsAppSecret.class);
            rdsAppSecret.validate();
        } finally {
            secretsClient.close();
        }

        if (isDebug) {
            logger.debug("rdsAdminSecret: " + rdsAdminSecret);
            logger.debug("rdsAppSecret: " + rdsAppSecret);
        }

        Migrator migrator = new Migrator(rdsHostInfo, rdsAdminSecret, rdsAppSecret, logger, isDebug);

        migrator.runInitializationScript();
        migrator.runMigrationScripts();
    }

    private static String getSecretValue(SecretsManagerClient secretsClient, String secretId) {
        GetSecretValueRequest valueRequest = GetSecretValueRequest.builder()
                .secretId(secretId)
                .build();

        GetSecretValueResponse valueResponse = secretsClient.getSecretValue(valueRequest);

        return valueResponse.secretString();
    }

    private static List<String> getExceptionMessages(Throwable throwable) {
        List<String> result = new ArrayList<String>();
        while (throwable != null) {
            result.add(throwable.getMessage());
            throwable = throwable.getCause();
        }

        String.join(System.lineSeparator(), result);
        return result;
    }
}
