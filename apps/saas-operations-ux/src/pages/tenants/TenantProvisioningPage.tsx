import React from "react";
import { Button, TextField, Stack, useTheme } from "@mui/material";
import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";
import { useAppConfig, useLoadingOverlay } from "../../providers";
import { useNotifications } from "../../providers/NotificationProvider";
import { api, getApiContext, ProvisionTenantRequest } from "../../services";
import * as EmailValidator from "email-validator";

export function TenantProvisioningPage(): React.ReactElement {
    const id = useId();
    const theme = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const auth = useAuth();
    const loadingOverlay = useLoadingOverlay();
    const notifications = useNotifications();
    const appConfig = useAppConfig();

    const [tenantNameState, setTenantNameState] = useState({ value: "", error: "" });
    const [tenantCodeState, setTenantCodeState] = useState({ value: "", error: "" });
    const [administratorEmailState, setAdministratorEmailState] = useState({ value: "", error: "" });

    // Helper structure used to process fields generically and as a collection
    const fields = {
        tenantName: {
            id: `tenant-name-text-field${id}`,
            label: t("rs.tenants.provision.fields.tenant_name.label"),
            isRequired: true,
            state: tenantNameState,
            setState: setTenantNameState,
            validate: validateText,
        },
        tenantCode: {
            id: `tenant-code-text-field${id}`,
            label: t("rs.tenants.provision.fields.tenant_code.label"),
            isRequired: true,
            state: tenantCodeState,
            setState: setTenantCodeState,
            validate: validateText,
        },
        administratorEmail: {
            id: `administrator-email-field${id}`,
            label: t("rs.tenants.provision.fields.administrator_email.label"),
            isRequired: true,
            state: administratorEmailState,
            setState: setAdministratorEmailState,
            validate: validateEmail,
        },
    };

    function onTextFieldChanged(name: string, value: string) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const field = (fields as any)[name]; // Get the field definition by name

        const state = { ...field.state }; // Shallow copy via spread

        state.value = value;

        if (field.validate) {
            state.error = field.validate(value, field.isRequired);
        } else {
            state.error = "";
        }

        field.setState(state);
    }

    function onCancelButtonClicked() {
        navigateToList();
    }

    function onProvisionButtonClicked() {
        if (validateFields()) {
            const provisionTenantRequest = {
                tenantName: tenantNameState.value,
                tenantCode: tenantCodeState.value,
                administratorEmail: administratorEmailState.value,
            } as ProvisionTenantRequest;

            const apiContext = getApiContext(appConfig, auth);

            loadingOverlay.setIsLoading(true);
            api.provisionTenant(provisionTenantRequest, apiContext)
                .then(() => onProvisionSuccessful())
                .catch((error) => onProvisionFailed(error.message))
                .finally(() => loadingOverlay.setIsLoading(false));
        }
    }

    function onProvisionSuccessful() {
        const interpolation = {
            tenant_name: tenantNameState.value,
        };
        const message = t("rs.tenants.provision.notifications.provision_successful", interpolation);
        notifications.sendNotification("success", message);
        navigateToList();
    }

    function onProvisionFailed(error: string) {
        const interpolation = {
            tenant_name: tenantNameState.value,
            error: error,
        };
        const message = t("rs.tenants.provision.notifications.provision_failed", interpolation);
        notifications.sendNotification("error", message);
        navigateToList();
    }

    function navigateToList() {
        navigate("/tenants");
    }

    function validateFields(): boolean {
        let result = true;
        for (const fieldName in fields) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const field = (fields as any)[fieldName]; // Get the field definition by name
            const state = { ...field.state }; // Shallow copy via spread

            if (field.validate) {
                state.error = field.validate(state.value, field.isRequired);

                if (state.error) {
                    result = false;
                }

                field.setState(state);
            }
        }
        return result;
    }

    function validateText(value: string, isRequired: boolean): string {
        let error = "";
        if (isRequired && !value) {
            error = t("rs.tenants.provision.validation.value_is_required");
        }
        return error || "";
    }

    function validateEmail(value: string, isRequired: boolean): string {
        let error = validateText(value, isRequired);
        if (!error && !EmailValidator.validate(value)) {
            error = t("rs.tenants.provision.validation.invalid_email_address");
        }
        return error || "";
    }

    return (
        <form>
            <Stack
                justifyContent="center"
                alignItems="center"
                spacing={theme.spacing(2)}
                sx={{ padding: theme.spacing(2) }}>
                <TextField
                    id={fields.tenantName.id}
                    required={fields.tenantName.isRequired}
                    label={fields.tenantName.label}
                    variant="standard"
                    value={fields.tenantName.state.value}
                    error={!!fields.tenantName.state.error}
                    helperText={fields.tenantName.state.error}
                    onChange={(x) => onTextFieldChanged("tenantName", x.target.value)}
                    inputProps={{
                        maxLength: 100,
                    }}
                    fullWidth
                />
                <TextField
                    id={fields.tenantCode.id}
                    required={fields.tenantCode.isRequired}
                    label={fields.tenantCode.label}
                    variant="standard"
                    value={fields.tenantCode.state.value}
                    error={!!fields.tenantCode.state.error}
                    helperText={fields.tenantCode.state.error}
                    onChange={(x) => onTextFieldChanged("tenantCode", x.target.value.toUpperCase())}
                    inputProps={{
                        maxLength: 50,
                    }}
                    fullWidth
                />
                <TextField
                    id={fields.administratorEmail.id}
                    required={fields.administratorEmail.isRequired}
                    label={fields.administratorEmail.label}
                    variant="standard"
                    value={fields.administratorEmail.state.value}
                    error={!!fields.administratorEmail.state.error}
                    helperText={fields.administratorEmail.state.error}
                    onChange={(x) => onTextFieldChanged("administratorEmail", x.target.value)}
                    inputProps={{
                        maxLength: 320, //RFC 5322
                    }}
                    fullWidth
                />
                <Stack
                    direction="row"
                    justifyContent="flex-end"
                    alignItems="center"
                    spacing={theme.spacing(1)}
                    sx={{ width: "100%", paddingTop: theme.spacing(2) }}>
                    <Button id={`cancel-button${id}`} variant="outlined" onClick={onCancelButtonClicked}>
                        {t("rs.tenants.provision.buttons.cancel.label")}
                    </Button>
                    <Button id={`provision-button${id}`} variant="contained" onClick={onProvisionButtonClicked}>
                        {t("rs.tenants.provision.buttons.provision.label")}
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
}
