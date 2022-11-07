package com.silkroad.db.deploy.Types;

import com.silkroad.db.deploy.Exceptions.ValidationException;

import liquibase.util.StringUtil;

public class RdsHostInfo {

    private String hostname;
    private int port;

    public RdsHostInfo(String hostname, Integer port) throws ValidationException {
        this.hostname = hostname;
        this.port = port;
        this.validate();
    }

    public String getHostname() {
        return hostname;
    }

    public void setHostname(String hostname) {
        this.hostname = hostname;
    }

    public int getPort() {
        return port;
    }

    public void setPort(int port) {
        this.port = port;
    }

    public void validate() throws ValidationException {
        if (StringUtil.isEmpty(this.hostname)) {
            throw new ValidationException("Missing required field: 'hostname'");
        }
        if (port < 1) {
            throw new ValidationException("Missing required field: 'port'");
        }
    }
};