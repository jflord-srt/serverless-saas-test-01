import { Alert, AlertTitle } from "@mui/material";
import { User, Log } from "oidc-client-ts";
import { AuthProvider, AuthProviderProps } from "react-oidc-context";
import { useAppConfig } from "./AppConfigProvider";
import { useTenantContext } from "./TenantProvider";

export type TenantAuthProviderProps = React.PropsWithChildren<{}>;

export const TenantAuthProvider = (props: TenantAuthProviderProps) => {
    const { cognitoUrl = "", appUrl = "", isDebug = false } = useAppConfig();
    const { tenantConfig } = useTenantContext();
    const { cognitoUserPoolId = "", cognitoClientAppId = "" } = { ...tenantConfig };

    if (isDebug) {
        Log.setLogger(console);
    }

    const validationErrors = validateInputs(cognitoUrl, cognitoUserPoolId, cognitoClientAppId, appUrl);
    if (validationErrors) {
        return validationErrors;
    }

    const authProviderProps = {
        authority: `${cognitoUrl}/${cognitoUserPoolId}`,
        client_id: cognitoClientAppId,
        redirect_uri: appUrl,
        revokeTokensOnSignout: true,
        onSigninCallback: (user: User) => onSigninCallback(user, isDebug),
        onRemoveUser: () => onRemoveUser(cognitoUrl, cognitoUserPoolId, cognitoClientAppId, appUrl, isDebug),
    } as AuthProviderProps;

    return <AuthProvider {...authProviderProps}>{props.children}</AuthProvider>;
};

function validateInputs(
    cognitoUrl: string,
    cognitoUserPoolId: string,
    cognitoClientAppId: string,
    appUrl: string
): React.ReactElement | null {
    const validationErrors = new Array<string>();
    if (!cognitoUrl) {
        validationErrors.push("Missing cognitoUrl");
    }
    if (!appUrl) {
        validationErrors.push("Missing appUrl");
    }
    if (!cognitoUserPoolId) {
        validationErrors.push("Missing cognitoUserPoolId");
    }
    if (!cognitoClientAppId) {
        validationErrors.push("Missing cognitoClientAppId");
    }

    if (validationErrors.length > 0) {
        const elements = new Array<JSX.Element>();
        validationErrors.map((x, i) => {
            console.error(x);
            elements.push(<li key={i}>{x}</li>);
            return elements;
        });
        return (
            <Alert severity="error">
                <AlertTitle>Invalid Configuration</AlertTitle>
                <strong>Please contact your system administrator</strong>
                <ul>{elements}</ul>
            </Alert>
        );
    }

    return null;
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
        const incomingState = ((user || {}) as User).state as any;
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
    userPoolId: string,
    clientId: string,
    appUrl: string,
    isDebug: boolean
): void {
    // We need to sign-out of cognito explicitly to remove all cookies and fully sign-out.
    const authority = `${cognitoUrl}/${userPoolId}`;
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
            window.location.href = url + `logout?client_id=${clientId}&logout_uri=${appUrl}`;
        });
}
