package com.silkroad.db.deploy.Utils;

public class ConsoleLogger implements ILogger {
    public ConsoleLogger() {
    }

    @Override
    public void debug(String message) {
        System.out.println("DEBUG: " + message);
    }

    @Override
    public void info(String message) {
        System.out.println("INFO: " + message);
    }

    @Override
    public void error(String message) {
        System.err.println("ERROR: " + message);
    }

}