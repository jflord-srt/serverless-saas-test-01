import { ThemeProvider } from "@emotion/react";
import { createTheme, CssBaseline, responsiveFontSizes } from "@mui/material";
import { useAuth } from "react-oidc-context";
import { Routes, Route, HashRouter } from "react-router-dom";
import { AppConfig } from "./AppConfig";
import { AuthGuard } from "./auth";
import { RouteNotFound } from "./components";
import { HomePage, WelcomePage } from "./pages/";
import { AppConfigProvider } from "./providers/AppConfigProvider";
import { LoadingOverlayProvider } from "./providers/LoadingOverlayProvider";
import { TenantAuthProvider } from "./providers/TenantAuthProvider";
import { TenantProvider } from "./providers/TenantProvider";

let theme = createTheme({
    // TODO: Build Theme
});
theme = responsiveFontSizes(theme);

type AppProps = {
    id: string;
    appConfig: AppConfig;
};

function App(props: AppProps) {
    const { id } = props;

    return (
        <AppConfigProvider appConfig={props.appConfig}>
            <CssBaseline />
            <ThemeProvider theme={theme}>
                <LoadingOverlayProvider>
                    <TenantProvider>
                        <TenantAuthProvider>
                            <HashRouter>
                                <Router id={id} />
                            </HashRouter>
                        </TenantAuthProvider>
                    </TenantProvider>
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
    }

    if (auth.isLoading) {
        return <div id={`${id}-loading`}>Loading...</div>;
    }

    if (auth.error) {
        console.error(auth.error.message);
        return <div id={`${id}-auth-error`}>Oops... {auth.error.message}</div>;
    }

    if (!auth.isAuthenticated) {
        // Not authenticated, render welcome until authenticated
        return <WelcomePage id={`${id}-welcome-page`} />;
    }

    return (
        <Routes>
            <Route
                path="/home"
                element={
                    <AuthGuard isAuthenticated={auth.isAuthenticated}>
                        <HomePage />
                    </AuthGuard>
                }
            />
            <Route
                path="/"
                element={
                    <AuthGuard isAuthenticated={auth.isAuthenticated}>
                        <HomePage />
                    </AuthGuard>
                }
            />
            <Route path="*" element={<RouteNotFound />} />
        </Routes>
    );
}

export default App;
