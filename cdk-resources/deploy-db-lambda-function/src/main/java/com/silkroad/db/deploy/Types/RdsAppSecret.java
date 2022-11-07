package com.silkroad.db.deploy.Types;

import com.silkroad.db.deploy.Exceptions.ValidationException;

import liquibase.util.StringUtil;

public class RdsAppSecret {

    private String databaseName;
    private String username;
    private String password;

    public RdsAppSecret() {
    }

    public RdsAppSecret(String databaseName, String username, String password) throws ValidationException {
        this.databaseName = databaseName;
        this.username = username;
        this.password = password;
        this.validate();
    }

    public String getDatabaseName() {
        return databaseName;
    }

    public void setDatabaseName(String databaseName) {
        this.databaseName = databaseName;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void validate() throws ValidationException {
        if (StringUtil.isEmpty(this.databaseName)) {
            throw new ValidationException("Missing required field: 'databaseName'");
        }
        if (StringUtil.isEmpty(this.username)) {
            throw new ValidationException("Missing required field: 'username'");
        }
        if (StringUtil.isEmpty(this.password)) {
            throw new ValidationException("Missing required field: 'password'");
        }
    }
};