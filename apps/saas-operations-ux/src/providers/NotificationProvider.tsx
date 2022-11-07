import React, { useState } from "react";
import { createContext, useContext } from "react";
import { Alert, Snackbar, SnackbarCloseReason } from "@mui/material";
import { Empty } from "../models";

export type NotificationType = "success" | "info" | "warning" | "error";

export type NotificationProviderContext = {
    sendNotification: (type: NotificationType, message: string) => Empty;
};

const Context = createContext({} as NotificationProviderContext);

export const useNotifications = () => useContext(Context);

export type NotificationProviderProps = React.PropsWithChildren<{
    autoHideDuration?: number;
}>;

export const NotificationProvider = (props: NotificationProviderProps): React.ReactElement => {
    const [state, setState] = useState({ isOpen: false, type: "info" as NotificationType, message: "" });

    const notificationProviderContext = {
        sendNotification: (type: NotificationType, message: string) => {
            const newState = { isOpen: true, type: type, message: message };
            setState(newState);
        },
    } as NotificationProviderContext;

    function handleClose(reason?: SnackbarCloseReason) {
        if (reason === "clickaway") {
            // Ignore clickaway, either timeout or explicit close
            return;
        }

        const newState = { ...state };
        newState.isOpen = false;
        newState.message = "";
        setState(newState);
    }

    return (
        <Context.Provider value={notificationProviderContext}>
            <Snackbar
                open={state.isOpen}
                autoHideDuration={props.autoHideDuration ?? 5000}
                onClose={(event, reason) => handleClose(reason)}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}>
                <Alert onClose={() => handleClose()} severity={state.type} sx={{ width: "100%" }}>
                    {state.message}
                </Alert>
            </Snackbar>
            {props.children}
        </Context.Provider>
    );
};
