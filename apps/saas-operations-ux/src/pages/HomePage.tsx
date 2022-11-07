import React from "react";
import { Container } from "@mui/material";
import { Outlet } from "react-router-dom";
import { Canvas, Header } from "../components";

type HomePageProps = {
    id: string;
};

export function HomePage(props: HomePageProps): React.ReactElement {
    const { id } = props;

    return (
        <Container id={`${id}-container`} maxWidth="md">
            <Canvas id={`${id}-canvas`}>
                <Header id={`${id}-header`} />
                <Outlet />
            </Canvas>
        </Container>
    );
}
