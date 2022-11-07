import React from "react";
import {
    Button,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useLoadingOverlay } from "../../providers/LoadingOverlayProvider";
import { useAppConfig } from "../../providers/AppConfigProvider";
import { TenantInfo } from "../../models";
import { SplitContainer } from "../../components/";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "../../providers/NotificationProvider";
import { DeleteTenantConfirmationDialog } from "./DeleteTenantConfirmationDialog";
import { getApiContext, api } from "../../services/dataAccess";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import { useTranslation } from "react-i18next";

type TenantListPageProps = {
    id: string;
};

export function TenantListPage(props: TenantListPageProps) {
    const { id } = props;
    const auth = useAuth();
    const appConfig = useAppConfig();
    const navigate = useNavigate();
    const theme = useTheme();
    const loadingOverlay = useLoadingOverlay();
    const notifications = useNotifications();
    const [tenants, setTenants] = useState([] as TenantInfo[]);
    const [tenantDeletionConfirmationState, setTenantDeletionConfirmationState] = useState({} as TenantInfo);
    const { t } = useTranslation();

    useEffect(() => {
        loadTenants();
    }, []);

    function loadTenants() {
        const apiContext = getApiContext(appConfig, auth);

        loadingOverlay.setIsLoading(true);
        api.getTenants(apiContext)
            .then((data) => setTenants(data as TenantInfo[]))
            .catch((error) => notifications.sendNotification("error", error.message))
            .finally(() => loadingOverlay.setIsLoading(false));
    }

    function onRefreshClicked() {
        loadTenants();
    }

    function onAddTenantClicked() {
        navigate("provision");
    }

    function onDeleteTenantCancelled() {
        // Close the dialog
        setTenantDeletionConfirmationState({} as TenantInfo);
    }

    function onDeleteTenant(tenantInfo: TenantInfo) {
        if (tenantInfo) {
            setTenantDeletionConfirmationState({
                tenantId: tenantInfo.tenantId,
                tenantName: tenantInfo.tenantName,
                tenantCode: tenantInfo.tenantCode,
            });
        }
    }

    function onDeleteTenantConfirmed(tenantInfo: TenantInfo) {
        // Close the dialog
        setTenantDeletionConfirmationState({} as TenantInfo);

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
        notifications.sendNotification("success", "Tenant deleted successfully");
        loadTenants();
    }

    function onDeleteTenantFailed(error: string) {
        notifications.sendNotification("error", `Failed to delete tenant. ${error}`);
        loadTenants();
    }

    function onTenantDetails(tenantId: string) {
        navigate(`${tenantId}/details`);
    }

    return (
        <>
            <SplitContainer
                id={id}
                sx={{ marginBottom: theme.spacing(2) }}
                left={
                    <Typography id={`${id}-title`} variant="h4">
                        {t("rs.tenants.list.title")}
                    </Typography>
                }
                right={
                    <Stack id={`${id}-controls`} direction="row" spacing={theme.spacing(1)}>
                        <Button
                            id={`${id}-refresh-button`}
                            variant="outlined"
                            startIcon={<RefreshIcon id={`${id}-refresh-button-icon`} />}
                            onClick={() => onRefreshClicked()}>
                            {t("rs.tenants.list.buttons.refresh")}
                        </Button>
                        <Button
                            id={`${id}-provision-tenant-button`}
                            variant="contained"
                            startIcon={<AddIcon id={`${id}-provision-tenant-button-icon`} />}
                            onClick={() => onAddTenantClicked()}>
                            {t("rs.tenants.list.buttons.provision")}
                        </Button>
                    </Stack>
                }
            />
            <TenantListing
                id={`${id}-content`}
                tenants={tenants}
                onDeleteTenant={onDeleteTenant}
                onTenantDetails={onTenantDetails}
            />
            <DeleteTenantConfirmationDialog
                id={`${id}-delete-confirmation-dialog`}
                tenantInfo={tenantDeletionConfirmationState}
                onDeleteTenantConfirmed={onDeleteTenantConfirmed}
                onDeleteTenantCancelled={onDeleteTenantCancelled}
            />
        </>
    );
}

type TenantListingProps = {
    id: string;
    tenants: TenantInfo[];
    onDeleteTenant: (tenantInfo: TenantInfo) => void;
    onTenantDetails: (tenantId: string) => void;
};

function TenantListing(props: TenantListingProps): React.ReactElement {
    let element = <></>;
    const { id, tenants, onDeleteTenant, onTenantDetails } = props;
    const { t } = useTranslation();

    function onDeleteTenantClicked(tenantInfo: TenantInfo) {
        if (tenantInfo) {
            onDeleteTenant(tenantInfo);
        }
    }

    function onTenantDetailsClicked(tenantId?: string) {
        if (tenantId) {
            onTenantDetails(tenantId);
        }
    }

    element = (
        <TableContainer id={id} component={Paper}>
            <Table id={`${id}-table`} aria-label="table">
                <TableHead id={`${id}-table-header`}>
                    <TableRow id={`${id}-table-header-row`}>
                        <TableCell id={`${id}-table-header-tenant-id-cell`}>
                            <strong>{t("rs.tenants.list.table.tenant_id_column_name")}</strong>
                        </TableCell>
                        <TableCell id={`${id}-table-header-tenant-name-cell`} align="right">
                            <strong>{t("rs.tenants.list.table.tenant_name_column_name")}</strong>
                        </TableCell>
                        <TableCell id={`${id}-table-header-tenant-code-cell`} align="right">
                            <strong>{t("rs.tenants.list.table.tenant_code_column_name")}</strong>
                        </TableCell>
                        <TableCell id={`${id}-table-header-actions-cell`} align="right">
                            <strong>{t("rs.tenants.list.table.actions_column_name")}</strong>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody id={`${id}-table-body`}>
                    {(tenants ?? []).map((tenant, index) => (
                        <TableRow id={`${id}-table-row-${index}`} key={tenant?.tenantId}>
                            <TableCell id={`${id}-table-row-${index}-tenant-id-cell`}>
                                <Link to={`${tenant?.tenantId}/details`}>{tenant?.tenantId}</Link>
                            </TableCell>
                            <TableCell id={`${id}-table-row-${index}-cell-tenant-name`} align="right">
                                {tenant?.tenantName}
                            </TableCell>
                            <TableCell id={`${id}-table-row-${index}-cell-tenant-code`} align="right">
                                {tenant?.tenantCode}
                            </TableCell>
                            <TableCell id={`${id}-table-row-${index}-cell-actions`} align="right">
                                <Tooltip
                                    id={`${id}-table-row-${index}-details-button-tooltip`}
                                    title={t("rs.tenants.list.buttons.details.tooltip")}>
                                    <IconButton
                                        id={`${id}-table-row-${index}-details-button`}
                                        aria-label={t("rs.tenants.list.buttons.details.tooltip")}
                                        onClick={() => onTenantDetailsClicked(tenant?.tenantId)}>
                                        <SettingsIcon id={`${id}-table-row-${index}-details-button-icon`} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip
                                    id={`${id}-table-row-${index}-delete-button-tooltip`}
                                    title={t("rs.tenants.list.buttons.delete.tooltip")}>
                                    <IconButton
                                        id={`${id}-table-row-${index}-delete-button`}
                                        aria-label={t("rs.tenants.list.buttons.delete.tooltip")}
                                        onClick={() => onDeleteTenantClicked(tenant)}>
                                        <DeleteIcon id={`${id}-table-row-${index}-delete-button-icon`} />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return element;
}
