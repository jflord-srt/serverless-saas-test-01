package com.silkroad.db.deploy.Utils;

import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public class ResourceProperties {
    private Map<String, Object> map;
    private Gson gson;

    public ResourceProperties(final Map<String, Object> map) {
        this.map = map;
        this.gson = new GsonBuilder().create();
    }

    public <T> T getProperty(String key, Class<T> type) {
        Object object = this.map.getOrDefault(key, null);
        if (object != null) {
            String json = gson.toJson(object);
            return gson.fromJson(json, type);
        } else {
            return null;
        }
    }
}
