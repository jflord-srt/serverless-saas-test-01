import React, { createContext, useContext } from "react";
import { AppConfig } from "../AppConfig";

const Context = createContext({} as AppConfig);

export const useAppConfig = () => useContext(Context);

export type AppConfigProviderProps = React.PropsWithChildren<{
    appConfig: AppConfig;
}>;

export const AppConfigProvider = (props: AppConfigProviderProps): JSX.Element | null => {
    return <Context.Provider value={props.appConfig}>{props.children}</Context.Provider>;
};
