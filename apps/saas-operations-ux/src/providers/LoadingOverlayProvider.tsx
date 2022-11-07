import React, { useId, useState } from "react";
import { createContext, useContext } from "react";
import { Backdrop, CircularProgress, useTheme } from "@mui/material";
import { Empty } from "../models";

export type LoadingOverlayContext = {
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => Empty;
};

const Context = createContext({} as LoadingOverlayContext);

export const useLoadingOverlay = () => useContext(Context);

export type LoadingOverlayContextProps = React.PropsWithChildren<Empty>;

export const LoadingOverlayProvider = (props: LoadingOverlayContextProps): JSX.Element | null => {
    const [isLoading, setIsLoading] = useState(false);

    const loadingOverlayContext = {
        isLoading: isLoading,
        setIsLoading: (isLoading: boolean) => setIsLoading(isLoading),
    } as LoadingOverlayContext;

    return (
        <Context.Provider value={loadingOverlayContext}>
            <Overlay></Overlay>
            {props.children}
        </Context.Provider>
    );
};

function Overlay() {
    const { isLoading } = useLoadingOverlay();
    const id = useId();
    const theme = useTheme();

    return (
        <Backdrop
            id={`loading-Backdrop-${id}`}
            open={isLoading}
            sx={{ color: theme.palette.grey[500], zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <CircularProgress id={`circular-progress-${id}`} color="inherit" />
        </Backdrop>
    );
}
