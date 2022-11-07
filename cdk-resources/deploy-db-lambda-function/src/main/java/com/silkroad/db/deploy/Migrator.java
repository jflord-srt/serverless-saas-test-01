package com.silkroad.db.deploy;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

import com.silkroad.db.deploy.Exceptions.*;
import com.silkroad.db.deploy.Types.*;
import com.silkroad.db.deploy.Utils.*;

import liquibase.Contexts;
import liquibase.Liquibase;
import liquibase.database.Database;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.exception.LiquibaseException;
import liquibase.resource.ClassLoaderResourceAccessor;

public class Migrator {

    private RdsHostInfo rdsHostInfo;
    private RdsAdminSecret rdsAdminSecret;
    private RdsAppSecret rdsAppSecret;
    private ILogger logger;
    private Boolean isDebug;

    public Migrator(RdsHostInfo rdsHostInfo, RdsAdminSecret rdsAdminSecret, RdsAppSecret rdsAppSecret, ILogger logger,
            Boolean isDebug) throws ValidationException {
        this.rdsHostInfo = rdsHostInfo;
        this.rdsAdminSecret = rdsAdminSecret;
        this.rdsAppSecret = rdsAppSecret;
        this.logger = logger;
        this.isDebug = isDebug;

        if (this.rdsHostInfo == null) {
            throw new ValidationException("Missing required argument: 'rdsHostInfo'");
        } else {
            this.rdsHostInfo.validate();
        }

        if (this.rdsAdminSecret == null) {
            throw new ValidationException("Missing required argument: 'rdsAdminSecret'");
        } else {
            this.rdsAdminSecret.validate();
        }

        if (this.rdsAppSecret == null) {
            throw new ValidationException("Missing required argument: 'rdsAppSecret'");
        } else {
            this.rdsAppSecret.validate();
        }
    }

    public void runInitializationScript() throws AppException {
        try {
            this.runInitializationScriptCore();
        } catch (Exception e) {
            throw new AppException(
                    "An error occurred while trying to execute the database initialization script, see 'Caused by' for details",
                    e);
        }
    }

    private void runInitializationScriptCore() throws SQLException, LiquibaseException, AppException, IOException {
        logger.info("Running initialization script...");
        String initDbTemplate = null;
        InputStream is = getClass().getClassLoader().getResourceAsStream("db/initialize-db.sql.template");
        try {
            byte[] bytes = is.readAllBytes();
            initDbTemplate = new String(bytes, StandardCharsets.UTF_8);
        } finally {
            is.close();
        }

        String initDbSql = initDbTemplate;
        initDbSql = initDbSql.replace("{{dbname}}", this.rdsAppSecret.getDatabaseName());
        initDbSql = initDbSql.replace("{{dbusername}}", this.rdsAppSecret.getUsername());
        initDbSql = initDbSql.replace("{{dbpassword}}", this.rdsAppSecret.getPassword());

        if (this.isDebug) {
            logger.debug(initDbSql);
        }

        // allowMultiQueries=true : Enable multi statement execute commands
        String endpoint = String.format(
                "jdbc:mysql://%s:%s?allowMultiQueries=true",
                this.rdsHostInfo.getHostname(),
                this.rdsHostInfo.getPort());

        java.sql.Connection connection = DriverManager.getConnection(
                endpoint,
                rdsAdminSecret.getUsername(),
                rdsAdminSecret.getPassword());

        if (connection == null) {
            throw new AppException("Failed to open connection");
        }

        try {
            Statement statement = connection.createStatement();
            statement.execute(initDbSql);
        } finally {
            connection.close();
        }
    }

    public void runMigrationScripts() throws AppException {
        try {
            this.runMigrationScriptsCore();
        } catch (Exception e) {
            throw new AppException(
                    "An error occurred while trying to execute the migration scripts, see 'Caused by' for details", e);
        }
    }

    private void runMigrationScriptsCore() throws SQLException, LiquibaseException, AppException {
        logger.info("Running migration scripts...");
        String endpoint = String.format(
                "jdbc:mysql://%s:%s/%s",
                this.rdsHostInfo.getHostname(),
                this.rdsHostInfo.getPort(),
                this.rdsAppSecret.getDatabaseName());

        java.sql.Connection connection = DriverManager.getConnection(
                endpoint,
                rdsAdminSecret.getUsername(),
                rdsAdminSecret.getPassword());

        try {
            JdbcConnection jdbcConnection = new JdbcConnection(connection);
            Database database = DatabaseFactory
                    .getInstance()
                    .findCorrectDatabaseImplementation(jdbcConnection);

            Liquibase liquibase = new Liquibase(
                    "db/changelog-root.xml",
                    new ClassLoaderResourceAccessor(),
                    database);

            liquibase.update(new Contexts());
        } catch (Exception e) {
            if (connection != null && connection.isClosed() == false) {
                connection.rollback();
            }
            throw e;
        } finally {
            if (connection != null && connection.isClosed() == false) {
                connection.close();
            }
        }
    }
}
