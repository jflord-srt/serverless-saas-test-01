import { Button, Container, Stack, Typography, useTheme } from "@mui/material";
import { useAuth } from "react-oidc-context";
import { Canvas } from "../components";
import { useTenantContext } from "../providers/TenantProvider";

type WelcomePageProps = {
    id: string;
};

export function WelcomePage(props: WelcomePageProps): React.ReactElement {
    const { id } = props;
    const theme = useTheme();
    const auth = useAuth();
    const tenantContext = useTenantContext();

    return (
        <Container id={`${id}-container`} maxWidth="md">
            <Canvas id={`${id}-canvas`}>
                <Stack id={`${id}-stack`} spacing={theme.spacing(2)}>
                    <Typography id={`${id}-typography-1`} variant="h4" align="center">
                        SilkRoad Serverless SaaS on AWS
                    </Typography>
                    <Typography id={`${id}-typography-2`} variant="h6" align="center">
                        Organization: {tenantContext?.tenantConfig?.tenantName}
                    </Typography>

                    <Button
                        id={`${id}-sign-in-button`}
                        variant="contained"
                        color="primary"
                        onClick={() => void auth.signinRedirect({ state: { qs: window.location.search } })}>
                        Sign-in
                    </Button>
                    <Button
                        id={`${id}-change-organization-button`}
                        variant="contained"
                        color="secondary"
                        onClick={() => tenantContext?.clear()}>
                        Change Organization
                    </Button>
                    <Typography id={`${id}-typography-3`} variant="caption" align="center">
                        TenantId: {tenantContext?.tenantConfig?.tenantId}
                    </Typography>
                </Stack>
            </Canvas>
        </Container>
    );
}
