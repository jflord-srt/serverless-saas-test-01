import React from "react";
import { Alert, AlertTitle } from "@mui/material";
import { User, Log } from "oidc-client-ts";
import { useEffect, useState } from "react";
import { AuthProvider, AuthProviderProps } from "react-oidc-context";
import { AppConfig } from "../AppConfig";
import { ClientAuthSettings, Empty } from "../models";
import { api } from "../services";
import { useAppConfig } from "./AppConfigProvider";
import { useLoadingOverlay } from "./LoadingOverlayProvider";

export type AuthConfigProviderProps = React.PropsWithChildren<Empty>;

export const AuthConfigProvider = (props: AuthConfigProviderProps) => {
    const [clientAuthSettings, setClientAuthSettings] = useState(null as ClientAuthSettings | null);
    const [authProviderProps, setAuthProviderProps] = useState(null as AuthProviderProps | null);
    const [error, setError] = useState(null as string | null);
    const loadingOverlay = useLoadingOverlay();

    const appConfig = useAppConfig();

    if (appConfig.isDebug) {
        Log.setLogger(console);
    }

    useEffect(() => {
        loadingOverlay.setIsLoading(true);
        api.getAuthSettings(appConfig.apiUrl)
            .then((clientAuthSettings) => setClientAuthSettings(clientAuthSettings))
            .catch((error) => {
                setError(error.message);
            })
            .finally(() => loadingOverlay.setIsLoading(false));
    }, []);

    if (error) {
        return (
            <Alert severity="error">
                <AlertTitle>Error - AuthConfigProvider</AlertTitle>
                {error}
            </Alert>
        );
    }

    if (clientAuthSettings && !authProviderProps) {
        // we received the clientAuthSettings, get the AuthProviderProps
        const temp = getAuthProviderProps(appConfig, clientAuthSettings);
        setAuthProviderProps(temp);
    }

    if (authProviderProps) {
        return <AuthProvider {...authProviderProps}>{props.children}</AuthProvider>;
    } else {
        return <></>;
    }
};

function getAuthProviderProps(appConfig: AppConfig, clientAuthSettings: ClientAuthSettings) {
    const { appUrl, isDebug } = appConfig;
    const { cognitoUrl, cognitoUserPoolId, cognitoAppClientId } = clientAuthSettings;

    return {
        authority: `${cognitoUrl}/${cognitoUserPoolId}`,
        client_id: cognitoAppClientId,
        redirect_uri: appUrl,
        revokeTokensOnSignout: true,
        onSigninCallback: (user: User) => onSigninCallback(user, isDebug),
        onRemoveUser: () => onRemoveUser(cognitoUrl, cognitoUserPoolId, cognitoAppClientId, appUrl, isDebug),
    } as AuthProviderProps;
}

function onSigninCallback(user: User, isDebug: boolean): void {
    if (isDebug) {
        console.info("authProviderProps.onSigninCallback");
    }

    const searchParams = new URLSearchParams(window.location.search);
    // Cleanup auth callback
    searchParams.delete("code");
    searchParams.delete("state");

    if (user) {
        // Restore any qs parameters stored in the state object
        const incomingState = ((user || {}) as User).state as Record<string, string>;
        if (incomingState) {
            const incomingQS = incomingState["qs"] as string;
            if (incomingQS) {
                console.log("Restore query string from incoming state: " + incomingQS.toString());
                new URLSearchParams(incomingQS).forEach((v, k) => {
                    searchParams.append(k, v);
                });
            }
        }
    }

    let appUrl = window.location.pathname;
    const qs = searchParams.toString();
    if (qs) {
        // Replace the location and use the derived query string parameters
        appUrl = `${appUrl}?${qs}`;
    }

    window.history.replaceState({}, "", appUrl);
}

function onRemoveUser(
    cognitoUrl: string,
    cognitoUserPoolId: string,
    cognitoClientId: string,
    appUrl: string,
    isDebug: boolean,
): void {
    // We need to sign-out of cognito explicitly to remove all cookies and fully sign-out.
    const authority = `${cognitoUrl}/${cognitoUserPoolId}`;
    const authorityConfigurationUrl = `${authority}/.well-known/openid-configuration`;

    if (isDebug) {
        console.log(`authProviderProps.onRemoveUser: authorityConfigurationUrl= ${authorityConfigurationUrl}`);
    }

    fetch(authorityConfigurationUrl)
        .then((response) => {
            if (response.ok) {
                return response.json() as Promise<{
                    authorization_endpoint: string;
                }>;
            } else {
                throw new Error(response.statusText);
            }
        })
        .then((openIdConfigParams) => {
            const url = openIdConfigParams["authorization_endpoint"].replace("oauth2/authorize", "");
            window.location.href = url + `logout?client_id=${cognitoClientId}&logout_uri=${appUrl}`;
        });
}
