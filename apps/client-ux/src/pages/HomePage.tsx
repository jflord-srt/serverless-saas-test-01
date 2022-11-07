import { Container, Stack, TextField, Typography, useTheme } from "@mui/material";
import { useId } from "react";
import { useAuth } from "react-oidc-context";
import { Canvas, Header } from "../components";
import { useTenantContext } from "../providers/TenantProvider";

export function HomePage(): React.ReactElement {
    const id = useId();
    const auth = useAuth();
    const theme = useTheme();
    const tenantContext = useTenantContext();

    return (
        <Container id={`container${id}`} maxWidth="md">
            <Canvas id={`canvas${id}`}>
                <Header />
                <Stack
                    justifyContent="center"
                    alignItems="center"
                    spacing={theme.spacing(2)}
                    sx={{ padding: theme.spacing(2) }}>
                    <Typography id={`tenant-context-title${id}`} variant="h3" sx={{ width: "100%" }}>
                        Tenant Context
                    </Typography>
                    <TextField
                        disabled
                        id={`tenant-id-field${id}`}
                        label={"Tenant Id"}
                        variant="standard"
                        value={tenantContext.tenantConfig?.tenantId}
                        fullWidth
                    />
                    <TextField
                        disabled
                        id={`tenant-name-field${id}`}
                        label={"Tenant Name"}
                        variant="standard"
                        value={tenantContext.tenantConfig?.tenantName}
                        fullWidth
                    />
                    <TextField
                        disabled
                        id={`tenant-code-field${id}`}
                        label={"Tenant Code"}
                        variant="standard"
                        value={tenantContext.tenantConfig?.tenantCode}
                        fullWidth
                    />
                    <TextField
                        disabled
                        id={`cognito-user-pool-id-field${id}`}
                        label={"Cognito User Pool Id"}
                        variant="standard"
                        value={tenantContext.tenantConfig?.cognitoUserPoolId}
                        fullWidth
                    />
                    <TextField
                        disabled
                        id={`cognito-client-app-id-field${id}`}
                        label={"Cognito Client App Id"}
                        variant="standard"
                        value={tenantContext.tenantConfig?.cognitoClientAppId}
                        fullWidth
                    />
                    <Typography id={`user-context-title${id}`} variant="h3" sx={{ width: "100%" }}>
                        User OIDC Context
                    </Typography>
                    <TextField
                        disabled
                        id={`user-sub-field${id}`}
                        label={"User sub"}
                        variant="standard"
                        value={auth.user?.profile?.sub}
                        fullWidth
                    />
                    <TextField
                        disabled
                        id={`user-email-field${id}`}
                        label={"User Email"}
                        variant="standard"
                        value={auth.user?.profile?.email}
                        fullWidth
                    />
                    <TextField
                        disabled
                        id={`username-field${id}`}
                        label={"User Name"}
                        variant="standard"
                        value={auth.user?.profile["cognito:username"]}
                        fullWidth
                    />
                </Stack>
            </Canvas>
        </Container>
    );
}
