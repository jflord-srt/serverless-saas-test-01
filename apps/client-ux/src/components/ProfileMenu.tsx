import { useState } from "react";
import { Avatar, IconButton, ListItemIcon, Menu, MenuItem, Tooltip } from "@mui/material";
import { useAuth } from "react-oidc-context";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";

export function ProfileMenu() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const auth = useAuth();

    const onAvatarClicked = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const onSignOutClicked = (event: React.MouseEvent<HTMLElement>) => {
        auth.removeUser();
    };

    let initials = "";
    const userName = auth?.user?.profile["cognito:username"] as string;
    if (userName?.length > 0) {
        initials = userName[0];
    }

    return (
        <>
            <Tooltip title="Profile">
                <IconButton onClick={onAvatarClicked}>
                    <Avatar sx={{ backgroundColor: stringToColor(auth?.user?.profile?.sub ?? "DEFAULT") }}>
                        {initials ?? <PersonIcon />}
                    </Avatar>
                </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose} onClick={handleClose}>
                <MenuItem onClick={onSignOutClicked}>
                    <ListItemIcon>
                        <LogoutIcon />
                    </ListItemIcon>
                    Sign out
                </MenuItem>
            </Menu>
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
