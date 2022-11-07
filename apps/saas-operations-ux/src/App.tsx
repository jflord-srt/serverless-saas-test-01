import React from "react";
import { useAuth } from "react-oidc-context";
import { Routes, Route, Navigate, HashRouter } from "react-router-dom";
import { RouteNotFound } from "./components";
import { LandingPage, HomePage } from "./pages/";
import { TenantDetailsPage, TenantListPage, TenantProvisioningPage } from "./pages/tenants";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { createTheme, CssBaseline, responsiveFontSizes, ThemeProvider } from "@mui/material";
import { AppConfigProvider, AuthConfigProvider, LoadingOverlayProvider } from "./providers";
import { NotificationProvider } from "./providers/NotificationProvider";
import { AppConfig } from "./AppConfig";

let theme = createTheme({
    // TODO: Build Theme
});
theme = responsiveFontSizes(theme);

type AppProps = {
    id: string;
    appConfig: AppConfig;
};

function App(props: AppProps) {
    const { t, i18n } = useTranslation();
    const { id } = props;

    useEffect(() => {
        document.title = t("rs.app_name");
    }, [t, i18n.language]);

    return (
        <AppConfigProvider appConfig={props.appConfig}>
            <CssBaseline />
            <ThemeProvider theme={theme}>
                <LoadingOverlayProvider>
                    <NotificationProvider>
                        <AuthConfigProvider>
                            <HashRouter>
                                <Router id={id} />
                            </HashRouter>
                        </AuthConfigProvider>
                    </NotificationProvider>
                </LoadingOverlayProvider>
            </ThemeProvider>
        </AppConfigProvider>
    );
}

type RouterProps = {
    id: string;
};

function Router(props: RouterProps) {
    const auth = useAuth();
    const { id } = props;

    switch (auth.activeNavigator) {
        case "signoutRedirect":
            return <div>signoutRedirect</div>;
        case "signinPopup":
            return <div>signinPopup</div>;
        case "signinSilent":
            return <div>signinSilent</div>;
        case "signoutPopup":
            return <div>signoutPopup</div>;
    }

    if (auth.isLoading) {
        return <div id={`${id}-loading`}>Loading...</div>;
    }

    if (auth.error) {
        console.error(auth.error.message);
        return <div id={`${id}-auth-error`}>Oops... {auth.error.message}</div>;
    }

    if (!auth.isAuthenticated) {
        // Not authenticated, render LandingPage until authenticated
        return <LandingPage id={`${id}-landing-page`} />;
    }

    return (
        <Routes>
            <Route path="/" element={<HomePage id={`${id}-home-page`} />}>
                <Route path="" element={<Navigate to={"tenants"} />} />
                <Route path="tenants" element={<TenantListPage id={`${id}-tenant-list-page`} />} />
                <Route path="tenants/provision" element={<TenantProvisioningPage />} />
                <Route
                    path="tenants/:tenantId/details"
                    element={<TenantDetailsPage id={`${id}-tenant-details-page`} />}
                />
            </Route>
            {/*<Route path="tenants" element={<TenantListPage />} />*/}
            <Route path="*" element={<RouteNotFound />} />
        </Routes>
    );
}

export default App;
