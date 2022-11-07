import React from "react";
import { Button, Container, Divider, Stack, Typography, useTheme } from "@mui/material";
import { useAuth } from "react-oidc-context";
import { Canvas } from "../components";
import logo from "../resources/images/SilkRoad_Technology_Logo_Color.svg";

type LandingPageProps = {
    id: string;
};

export function LandingPage(props: LandingPageProps): React.ReactElement {
    const { id } = props;
    const theme = useTheme();
    const auth = useAuth();

    return (
        <Container id={`${id}-container`} maxWidth="md">
            <Canvas id={`${id}-canvas`}>
                <Stack id={`${id}-stack`} spacing={theme.spacing(2)} justifyContent="center" alignItems="center">
                    <img id={`${id}-logo`} alt="Logo" src={logo} style={{ width: "300px" }} />
                    <Divider id={`${id}-divider`} sx={{ width: "100%" }} />
                    <Typography id={`${id}-title-typography`} variant="h4" align="center">
                        SilkRoad Serverless SaaS on AWS
                    </Typography>
                    <Button id={`${id}-sign-in-button`} variant="contained" onClick={() => auth.signinRedirect()}>
                        Sign In
                    </Button>
                </Stack>
            </Canvas>
        </Container>
    );
}
