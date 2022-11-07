package com.silkroad.db.deploy.Types;

import com.silkroad.db.deploy.Exceptions.ValidationException;

import liquibase.util.StringUtil;

public class RdsAdminSecret {

    private String host;
    private int port;
    private String username;
    private String password;

    public RdsAdminSecret() {
    }

    public RdsAdminSecret(String host, int port, String username, String password)
            throws ValidationException {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
        this.validate();
    }

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
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
        if (StringUtil.isEmpty(this.host)) {
            throw new ValidationException("Missing required field: 'host'");
        }
        if (port < 1) {
            throw new ValidationException("Missing required field: 'port'");
        }
        if (StringUtil.isEmpty(this.username)) {
            throw new ValidationException("Missing required field: 'username'");
        }
        if (StringUtil.isEmpty(this.password)) {
            throw new ValidationException("Missing required field: 'password'");
        }
    }
};