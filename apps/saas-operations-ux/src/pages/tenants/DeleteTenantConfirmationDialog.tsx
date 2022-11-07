import React from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    useTheme,
} from "@mui/material";
import { useState } from "react";
import { TenantInfo } from "../../models";
import { Trans, useTranslation } from "react-i18next";

type DeleteTenantConfirmationDialogProps = {
    id: string;
    tenantInfo: TenantInfo;
    onDeleteTenantConfirmed: (tenantInfo: TenantInfo) => void;
    onDeleteTenantCancelled: () => void;
};

export function DeleteTenantConfirmationDialog(props: DeleteTenantConfirmationDialogProps) {
    const { id, tenantInfo } = props;
    const [confirmationId, setConfirmationId] = useState("");
    const [isConfirmed, setIsConfirmed] = useState(false);
    const theme = useTheme();
    const { t } = useTranslation();

    const onDelete = () => {
        if (confirmationId === tenantInfo?.tenantId) {
            props.onDeleteTenantConfirmed(tenantInfo);
        }
        setConfirmationId("");
    };

    const onCancel = () => {
        props.onDeleteTenantCancelled();
        setConfirmationId("");
    };

    const onConfirmationIdChanged = (value: string) => {
        setConfirmationId(value);
        setIsConfirmed(value === tenantInfo?.tenantId);
    };

    return (
        <Dialog id={id} open={!!tenantInfo?.tenantId} onClose={onCancel}>
            <DialogTitle id={`${id}-title`}>{t("rs.tenants.delete_tenant_confirmation_dialog.title")}</DialogTitle>
            <DialogContent id={`${id}-description`} dividers>
                <DialogContentText id={`${id}-description-text`}>
                    <Trans t={t}>rs.tenants.delete_tenant_confirmation_dialog.description</Trans>
                </DialogContentText>
            </DialogContent>
            <DialogContent id={`${id}-fields`}>
                <DialogContentText id={`${id}-fields-tenant-name-text`} sx={{ paddingLeft: theme.spacing(1) }}>
                    {t("rs.tenants.delete_tenant_confirmation_dialog.fields.tenant_name")}: {tenantInfo?.tenantName}
                </DialogContentText>
                <DialogContentText id={`${id}-fields-tenant-code-text`} sx={{ paddingLeft: theme.spacing(1) }}>
                    {t("rs.tenants.delete_tenant_confirmation_dialog.fields.tenant_code")}: {tenantInfo?.tenantCode}
                </DialogContentText>
                <DialogContentText id={`${id}-fields-tenant-id-text`} sx={{ paddingLeft: theme.spacing(1) }}>
                    {t("rs.tenants.delete_tenant_confirmation_dialog.fields.tenant_id")}: {tenantInfo?.tenantId}
                </DialogContentText>
                <TextField
                    id={`${id}-fields-confirm-tenant-id-text-field`}
                    label={t("rs.tenants.delete_tenant_confirmation_dialog.fields.confirm_tenant_id")}
                    placeholder={tenantInfo?.tenantId}
                    value={confirmationId}
                    variant="standard"
                    margin="dense"
                    autoFocus
                    fullWidth
                    onChange={(x) => onConfirmationIdChanged(x.target.value)}
                />
            </DialogContent>
            <DialogActions id={`${id}-actions`}>
                <Button id={`${id}-cancel-button`} onClick={onCancel}>
                    {t("rs.tenants.delete_tenant_confirmation_dialog.buttons.cancel.label")}
                </Button>
                <Button id={`${id}-delete-button`} onClick={onDelete} disabled={!isConfirmed}>
                    {t("rs.tenants.delete_tenant_confirmation_dialog.buttons.delete.label")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
