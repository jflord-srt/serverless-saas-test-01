import _ from "lodash";
import { Alert, Button, Container, Stack, TextField, Typography, useTheme } from "@mui/material";
import { createContext, useState, useId, useEffect, useContext } from "react";
import { Canvas } from "../components/Canvas";
import { TenantConfig } from "../models";
import { useAppConfig } from "./AppConfigProvider";
import { useLoadingOverlay } from "./LoadingOverlayProvider";

export type TenantProviderContext = {
    isInitialized: boolean;
    tenantConfig: TenantConfig;
    clear: () => void;
    update: (tenantConfig: TenantConfig) => void;
};

const Default = { isInitialized: false } as TenantProviderContext;

const Context = createContext(Default);

export const useTenantContext = () => useContext(Context);

export type TenantProviderProps = React.PropsWithChildren<{}>;

export const TenantProvider = (props: TenantProviderProps): JSX.Element | null => {
    let initialTenantProviderContext = readLocalStorageContext();

    const [tenantProviderState, setTenantProviderState] = useState(initialTenantProviderContext);

    if (tenantProviderState) {
        tenantProviderState.clear = () => {
            setTenantProviderState(Default);
            deleteLocalStorageContext();
        };

        tenantProviderState.update = (tenantConfig: TenantConfig) => {
            let updated = { ...tenantProviderState, tenantConfig: tenantConfig };
            setTenantProviderState(updated);
            writeLocalStorageContext(updated);
        };
    }

    if (tenantProviderState?.isInitialized !== true) {
        const initializingCallback = (tenantConfig: TenantConfig) => {
            const newTenantProviderContext = {
                isInitialized: true,
                tenantConfig: tenantConfig,
            } as TenantProviderContext;
            writeLocalStorageContext(newTenantProviderContext);
            setTenantProviderState(newTenantProviderContext);
        };
        return <Initializing initializingCallback={initializingCallback} />;
    } else {
        return <Context.Provider value={tenantProviderState}>{props.children}</Context.Provider>;
    }
};

type InitializingProps = {
    initializingCallback: (tenantConfig: TenantConfig) => void;
};

function Initializing(props: InitializingProps): JSX.Element | null {
    // TODO: Use a tenant hint or domain resolution to avoid getting the user to identify their tenant.
    const queryParams = new URLSearchParams(window.location.search);
    const tenantHint = queryParams.get("tenant-hint");
    console.log("tenantHint: " + tenantHint);
    console.log("hostname: " + window.location.hostname);

    const id = useId();
    const theme = useTheme();
    const appConfig = useAppConfig();
    const { isLoading, setIsLoading } = useLoadingOverlay();
    const [tenantName, setTenantName] = useState(tenantHint);
    const [errorMessage, setErrorMessage] = useState("");
    const [tenantInfo, setTenantInfo] = useState(null as TenantConfig);

    const onNextButtonClick = (e: React.MouseEvent<any>) => {
        if (tenantName) {
            initializeTenant();
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<any>) => {
        if (e.key === "Enter" && tenantName) {
            initializeTenant();
        }
    };

    const initializeTenant = () => {
        const wasLoading = isLoading;
        setIsLoading(true);
        setErrorMessage("");

        const endpoint = `${_.trimEnd(appConfig.adminApiUrl, "/")}/tenants/client-config?tenantName=${tenantName}`;

        fetch(endpoint)
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                if (response.status === 404) {
                    setErrorMessage(`Organization '${tenantName}' was not found.`);
                } else {
                    setErrorMessage(`Status Code: ${response.status}.`);
                }
            })
            .then((data) => {
                if (data) {
                    setTenantInfo(data as TenantConfig);
                }
            })
            .catch((e) => {
                setErrorMessage(`Error: ${e.message}.`);
            })
            .finally(() => {
                setIsLoading(wasLoading);
            });
    };

    useEffect(() => {
        if (tenantInfo && props.initializingCallback) {
            props.initializingCallback(tenantInfo);
        }
    });

    return (
        <Container id={`container${id}`} maxWidth="sm">
            <Canvas id={`canvas${id}`}>
                <Stack id={`stack${id}`} spacing={theme.spacing(2)}>
                    <Typography id={`typography-1${id}`} variant="h4" align="center">
                        Organization
                    </Typography>
                    <Typography id={`typography-2${id}`} align="center">
                        Which organization do you want to sign into?
                    </Typography>
                    <TextField
                        id={`text-field${id}`}
                        label="Organization Name"
                        variant="outlined"
                        size="small"
                        required={true}
                        value={tenantName}
                        onChange={($event) => setTenantName($event.target.value)}
                        onKeyDown={($event) => onKeyDown($event)}
                    />
                    <Button
                        id={`next-button${id}`}
                        variant="contained"
                        onClick={($event) => onNextButtonClick($event)}
                        disabled={!tenantName}>
                        Next
                    </Button>
                    {(errorMessage || "").length > 0 && <Alert severity="error">{errorMessage}</Alert>}
                </Stack>
            </Canvas>
        </Container>
    );
}

function readLocalStorageContext() {
    const payload = localStorage.getItem("TenantProviderContext");
    if (payload) {
        return JSON.parse(payload) as TenantProviderContext;
    } else {
        return null;
    }
}

function writeLocalStorageContext(context: TenantProviderContext) {
    const payload = JSON.stringify(context, undefined, 4);
    localStorage.setItem("TenantProviderContext", payload);
}

function deleteLocalStorageContext() {
    localStorage.removeItem("TenantProviderContext");
}
