import React from "react";
import { Alert, AlertTitle } from "@mui/material";

export function RouteNotFound(): React.ReactElement {
    return (
        <Alert severity="error">
            <AlertTitle>Route Not Found</AlertTitle>
            {window.location.pathname}
        </Alert>
    );
}
