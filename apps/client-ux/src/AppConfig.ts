import _ from "lodash";

export type AppConfig = {
    isDebug: boolean;
    cognitoUrl: string;
    appUrl: string;
    adminApiUrl: string;
};

export const loadAppConfig = async (): Promise<AppConfig> => {
    const origin = _.trimEnd(window.location.origin, "/"); // Get origin without a trailing "/""
    const path = _.trim(window.location.pathname.slice(0, window.location.pathname.lastIndexOf("/")), "/"); // Get the path without the filename (index.html) or trailing "/"
    const fileName = "appConfig.json";

    // Build the url
    const appConfigUrl = [origin, path, fileName] // Parts
        .filter((value) => value) // Filter out empty entries
        .join("/"); // Join results with path separator

    console.log("appConfigUrl: " + appConfigUrl);

    return await fetch(appConfigUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        })
        .then((appConfig) => {
            validateAppConfig(appConfig as AppConfig);
            return Promise.resolve(appConfig as AppConfig);
        });
};

export const setAppConfig = (appConfig: AppConfig): AppConfig => {
    (window as any).SRT = (window as any)?.SRT || {};
    (window as any).SRT.ClientApp = (window as any).SRT?.ClientApp || {};

    (window as any).SRT.ClientApp.AppConfig = appConfig;

    return (window as any).SRT.ClientApp.AppConfig;
};

export const getAppConfig = (): AppConfig => {
    if (!(window as any)?.SRT?.ClientApp?.AppConfig) {
        throw new Error("Missing configuration: window.SRT.ClientApp.AppConfig");
    }

    const result = (window as any).SRT.ClientApp.AppConfig as AppConfig;

    return result;
};

function validateAppConfig(appConfig: AppConfig) {
    if (!appConfig) {
        throw new Error("Missing AppConfig");
    }

    if (!appConfig?.cognitoUrl) {
        throw new Error("Missing required configuration value 'cognitoUrl'");
    }

    if (!appConfig?.appUrl) {
        throw new Error("Missing required configuration value 'appUrl'");
    }

    if (!appConfig?.adminApiUrl) {
        throw new Error("Missing required configuration value 'adminApiUrl'");
    }
}
