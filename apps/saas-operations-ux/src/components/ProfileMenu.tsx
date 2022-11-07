import React, { useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    ListItemIcon,
    Menu,
    MenuItem,
    Select,
    SelectChangeEvent,
    Tooltip,
    useTheme,
} from "@mui/material";
import { useAuth } from "react-oidc-context";
import { useTranslation } from "react-i18next";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import TranslateIcon from "@mui/icons-material/Translate";

type ProfileMenuProps = {
    id: string;
};

export function ProfileMenu(props: ProfileMenuProps) {
    const { id } = props;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const auth = useAuth();
    const { t, i18n } = useTranslation();
    const [languagePickerDialogOpen, setLanguagePickerDialogOpen] = useState(false);

    const onAvatarClicked = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const onSignOutClicked = (event: React.MouseEvent<HTMLElement>) => {
        auth.removeUser();
    };

    const onLanguageClicked = (event: React.MouseEvent<HTMLElement>) => {
        //i18n.changeLanguage("fr");
        setLanguagePickerDialogOpen(true);
    };

    return (
        <>
            <Tooltip id={`${id}-button-tooltip`} title={t("rs.profile.tooltip")}>
                <IconButton id={`${id}-button`} onClick={onAvatarClicked}>
                    <Avatar
                        id={`${id}-button-avatar`}
                        sx={{ backgroundColor: stringToColor(auth?.user?.profile?.sub ?? "DEFAULT") }}>
                        <PersonIcon id={`${id}-button-avatar-icon`} />
                    </Avatar>
                </IconButton>
            </Tooltip>
            <Menu id={id} anchorEl={anchorEl} open={open} onClose={handleClose} onClick={handleClose}>
                <MenuItem id={`${id}-logout-menu-item`} onClick={onSignOutClicked}>
                    <ListItemIcon id={`${id}-logout-menu-item-list-item-icon`}>
                        <LogoutIcon id={`${id}-logout-menu-item-logout-icon`} />
                    </ListItemIcon>
                    {t("rs.profile.menu.buttons.sign_out")}
                </MenuItem>
                <MenuItem id={`${id}-language-menu-item`} onClick={onLanguageClicked}>
                    <ListItemIcon id={`${id}-language-menu-item-list-item-icon`}>
                        <TranslateIcon id={`${id}-language-menu-item-translate-icon`} />
                    </ListItemIcon>
                    {t(`rs.languages.${i18n.language}`)}
                </MenuItem>
            </Menu>
            <LanguagePickerDialog
                id={`${id}-language-picker-dialog`}
                isOpen={languagePickerDialogOpen}
                onClose={() => setLanguagePickerDialogOpen(false)}
            />
        </>
    );
}

function stringToColor(string: string) {
    let hash = 0;
    let i;

    for (i = 0; i < string.length; i += 1) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";

    for (i = 0; i < 3; i += 1) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }

    return color;
}

type LanguagePickerDialogProps = {
    id: string;
    isOpen: boolean;
    onClose: () => void;
};

function LanguagePickerDialog(props: LanguagePickerDialogProps) {
    const { id } = props;
    const { t, i18n } = useTranslation();
    const [language, setLanguage] = useState(i18n.language);
    const theme = useTheme();

    const handleChange = (event: SelectChangeEvent) => {
        setLanguage(event.target.value as string);
    };

    const onApply = () => {
        i18n.changeLanguage(language);
        props.onClose();
    };

    return (
        <Dialog id={id} open={props.isOpen} onClose={props.onClose}>
            <DialogTitle id={`${id}-title`}>{t("rs.profile.language_picker_dialog.title")}</DialogTitle>
            <DialogContent id={`${id}-content`}>
                <DialogContentText id={`${id}-content-text`}>
                    {t("rs.profile.language_picker_dialog.description")}
                </DialogContentText>
                <Box
                    id={`${id}-layout-box`}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    sx={{ marginTop: theme.spacing(2) }}>
                    <Select
                        id={`${id}-select`}
                        labelId={`${id}-select-label`}
                        value={language}
                        label="Language"
                        autoWidth
                        onChange={handleChange}>
                        <MenuItem id={`${id}-select-en-menu-item`} value={"en"}>
                            {t("rs.languages.en")}
                        </MenuItem>
                        <MenuItem id={`${id}-select-fr-menu-item`} value={"fr"}>
                            {t("rs.languages.fr")}
                        </MenuItem>
                    </Select>
                </Box>
            </DialogContent>
            <DialogActions id={`${id}-actions`}>
                <Button id={`${id}-close-button`} onClick={props.onClose}>
                    {t("rs.profile.language_picker_dialog.buttons.cancel")}
                </Button>
                <Button id={`${id}-close-button`} onClick={onApply}>
                    {t("rs.profile.language_picker_dialog.buttons.apply")}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
