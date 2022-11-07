import React from "react";
import { Button, Stack, TextField, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { useNavigate, useParams } from "react-router-dom";
import { TenantInfo } from "../../models";
import { TenantDetails } from "../../models/TenantDetails";
import { useAppConfig, useLoadingOverlay } from "../../providers";
import { useNotifications } from "../../providers/NotificationProvider";
import { getApiContext, api } from "../../services/dataAccess";
import { DeleteTenantConfirmationDialog } from "./DeleteTenantConfirmationDialog";

type TenantDetailsPageProps = {
    id: string;
};

export function TenantDetailsPage(props: TenantDetailsPageProps) {
    const { id } = props;
    const appConfig = useAppConfig();
    const { tenantId } = useParams();
    const theme = useTheme();
    const { t } = useTranslation();
    const auth = useAuth();
    const navigate = useNavigate();
    const loadingOverlay = useLoadingOverlay();
    const notifications = useNotifications();
    const [tenantDetails, setTenantDetails] = useState({} as TenantDetails);
    const [tenantDeletionConfirmationState, setTenantDeletionConfirmationState] = useState({} as TenantInfo);

    useEffect(() => {
        if (tenantId) {
            loadTenant(tenantId);
        }
    }, []);

    function loadTenant(tenantId: string) {
        if (tenantId) {
            const apiContext = getApiContext(appConfig, auth);

            loadingOverlay.setIsLoading(true);
            api.getTenant(tenantId, apiContext)
                .then((tenantDetails) => setTenantDetails(tenantDetails))
                .catch((error) => notifications.sendNotification("error", error.message))
                .finally(() => loadingOverlay.setIsLoading(false));
        }
    }

    function onCloseButtonClicked() {
        navigateToList();
    }

    function onDeleteTenant() {
        if (tenantDetails) {
            setTenantDeletionConfirmationState({
                tenantId: tenantDetails.tenantId,
                tenantName: tenantDetails.tenantName,
                tenantCode: tenantDetails.tenantCode,
            });
        }
    }

    function onDeleteTenantConfirmed(tenantInfo: TenantInfo) {
        if (tenantInfo?.tenantId) {
            const apiContext = getApiContext(appConfig, auth);

            loadingOverlay.setIsLoading(true);
            api.deleteTenant(tenantInfo.tenantId, apiContext)
                .then(() => onDeleteTenantSuccessful())
                .catch((error) => onDeleteTenantFailed(error.message))
                .finally(() => loadingOverlay.setIsLoading(false));
        }
    }

    function onDeleteTenantSuccessful() {
        const message = t("rs.tenants.details.notifications.delete_tenant_successful");
        notifications.sendNotification("success", message);
        navigateToList();
    }

    function onDeleteTenantFailed(error: string) {
        const interpolation = {
            error: error,
        };
        const message = t("rs.tenants.details.notifications.delete_tenant_failed", interpolation);
        notifications.sendNotification("error", message);
    }

    function onDeleteTenantCancelled() {
        // Close the dialog
        setTenantDeletionConfirmationState({} as TenantInfo);
    }

    function navigateToList() {
        navigate("/tenants");
    }

    if (!tenantDetails.tenantId) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <Stack
                id={id}
                justifyContent="center"
                alignItems="center"
                spacing={theme.spacing(2)}
                sx={{ padding: theme.spacing(2) }}>
                <TextField
                    disabled
                    id={`${id}-tenant-id-field`}
                    label={t("rs.tenants.details.fields.tenant_id.label")}
                    variant="standard"
                    value={tenantDetails.tenantId}
                    fullWidth
                />
                <TextField
                    disabled
                    id={`${id}-tenant-name-field`}
                    label={t("rs.tenants.details.fields.tenant_name.label")}
                    variant="standard"
                    value={tenantDetails.tenantName}
                    fullWidth
                />
                <TextField
                    disabled
                    id={`${id}-tenant-code-field`}
                    label={t("rs.tenants.details.fields.tenant_code.label")}
                    variant="standard"
                    value={tenantDetails.tenantCode}
                    fullWidth
                />
                <TextField
                    disabled
                    id={`${id}-administrator-email-field`}
                    label={t("rs.tenants.details.fields.administrator_email.label")}
                    variant="standard"
                    value={tenantDetails.administratorEmail}
                    fullWidth
                />
                <TextField
                    disabled
                    id={`${id}-administrator-id-field`}
                    label={t("rs.tenants.details.fields.administrator_id.label")}
                    variant="standard"
                    value={tenantDetails.administratorSubject}
                    fullWidth
                />
                <TextField
                    disabled
                    id={`${id}-cognito-user-pool-id-field`}
                    label={t("rs.tenants.details.fields.cognito_user_pool_id.label")}
                    variant="standard"
                    value={tenantDetails.cognitoUserPoolId}
                    fullWidth
                />
                <TextField
                    disabled
                    id={`${id}-cognito-user-pool-domain-field`}
                    label={t("rs.tenants.details.fields.cognito_user_pool_domain.label")}
                    variant="standard"
                    value={tenantDetails.cognitoUserPoolDomain}
                    fullWidth
                />
                <TextField
                    disabled
                    id={`${id}-cognito-client-app-id-field`}
                    label={t("rs.tenants.details.fields.cognito_client_app_id.label")}
                    variant="standard"
                    value={tenantDetails.cognitoClientAppId}
                    fullWidth
                />
                <Stack
                    id={`${id}-actions`}
                    direction="row"
                    justifyContent="flex-end"
                    alignItems="center"
                    spacing={theme.spacing(1)}
                    sx={{ width: "100%", paddingTop: theme.spacing(2) }}>
                    <Button id={`${id}-delete-button`} variant="outlined" onClick={onDeleteTenant}>
                        {t("rs.tenants.details.buttons.delete.label")}
                    </Button>
                    <Button id={`${id}-close-button`} variant="contained" onClick={onCloseButtonClicked}>
                        {t("rs.tenants.details.buttons.close.label")}
                    </Button>
                </Stack>
            </Stack>
            <DeleteTenantConfirmationDialog
                id={`${id}-delete-confirmation-dialog`}
                tenantInfo={tenantDeletionConfirmationState}
                onDeleteTenantConfirmed={onDeleteTenantConfirmed}
                onDeleteTenantCancelled={onDeleteTenantCancelled}
            />
        </>
    );
}
