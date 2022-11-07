import _ from "lodash";
import { AuthContextProps } from "react-oidc-context";
import { AppConfig } from "../AppConfig";
import { ClientAuthSettings, TenantDetails } from "../models";
import { ProvisionTenantRequest } from "./ProvisionTenantRequest";

export type ApiContext = {
    apiRootUrl: string;
    bearerToken?: string;
};

function getApiEndpoint(rootUrl: string, path: string) {
    return `${_.trimEnd(rootUrl, "/")}/${_.trimStart(path, "/")}`;
}

function validateApiContext(apiContext: ApiContext) {
    if (!apiContext?.apiRootUrl || !apiContext?.bearerToken) {
        throw new Error("Invalid api context");
    }
}

export function getApiContext(appConfig: AppConfig, authContext?: AuthContextProps): ApiContext {
    return {
        apiRootUrl: appConfig.apiUrl,
        bearerToken: authContext?.user?.access_token,
    } as ApiContext;
}

export const api = {
    async getAuthSettings(apiRootUrl: string): Promise<ClientAuthSettings> {
        const requestInit = {
            method: "GET",
        } as RequestInit;

        const endpointUrl = getApiEndpoint(apiRootUrl, "/config/auth-settings");
        return fetch(endpointUrl, requestInit).then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`Invalid response, status: ${response.status} - ${response.statusText}`);
            }
        });
    },

    async getTenants(apiContext: ApiContext): Promise<TenantDetails[]> {
        validateApiContext(apiContext);

        const { apiRootUrl, bearerToken } = apiContext;

        const requestInit = {
            method: "GET",
            headers: {
                Authorization: "Bearer " + bearerToken,
            },
        } as RequestInit;

        const endpointUrl = getApiEndpoint(apiRootUrl, "/tenants");
        return fetch(endpointUrl, requestInit).then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`Invalid response, status: ${response.status} - ${response.statusText}`);
            }
        });
    },

    async getTenant(tenantId: string, apiContext: ApiContext): Promise<TenantDetails> {
        if (!tenantId) {
            throw new Error("Invalid tenant id");
        }
        validateApiContext(apiContext);

        const { apiRootUrl, bearerToken } = apiContext;

        const requestInit = {
            method: "GET",
            headers: {
                Authorization: "Bearer " + bearerToken,
            },
        } as RequestInit;

        const endpointUrl = getApiEndpoint(apiRootUrl, `/tenants/${tenantId}`);
        return fetch(endpointUrl, requestInit).then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`Invalid response, status: ${response.status} - ${response.statusText}`);
            }
        });
    },

    async provisionTenant(provisionTenantRequest: ProvisionTenantRequest, apiContext: ApiContext): Promise<void> {
        if (!provisionTenantRequest) {
            throw new Error("Invalid provision tenant request");
        }
        validateApiContext(apiContext);

        const { apiRootUrl, bearerToken } = apiContext;

        const requestInit = {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + bearerToken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(provisionTenantRequest),
        } as RequestInit;

        const endpointUrl = getApiEndpoint(apiRootUrl, "/tenants");
        return fetch(endpointUrl, requestInit).then((response) => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error(`Invalid response, status: ${response.status} - ${response.statusText}`);
            }
        });
    },

    async deleteTenant(tenantId: string, apiContext: ApiContext): Promise<void> {
        if (!tenantId) {
            throw new Error("Invalid tenant id");
        }
        validateApiContext(apiContext);

        const { apiRootUrl, bearerToken } = apiContext;

        const requestInit = {
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + bearerToken,
            },
        } as RequestInit;

        const endpointUrl = getApiEndpoint(apiRootUrl, `/tenants/${tenantId}`);
        const response = await fetch(endpointUrl, requestInit);
        if (response.ok) {
            return;
        } else {
            throw new Error(`Invalid response, status: ${response.status} - ${response.statusText}`);
        }
    },
};
