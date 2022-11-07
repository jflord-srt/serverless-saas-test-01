import React from "react";
import { Divider, useTheme } from "@mui/material";
import { ProfileMenu } from "./ProfileMenu";
import { SplitContainer } from "./SplitContainer";
import logo from "../resources/images/SilkRoad_Technology_Logo_Color.svg";

type HeaderProps = {
    id: string;
};

export function Header(props: HeaderProps): React.ReactElement {
    const { id } = props;
    const theme = useTheme();

    return (
        <div id={`${id}`}>
            <SplitContainer
                id={`${id}-container`}
                left={<img id={`${id}-container-left-logo`} alt="logo" src={logo} style={{ width: "200px" }} />}
                right={<ProfileMenu id={`${id}-container-right-profile-menu`} />}
            />
            <Divider
                id={`${id}-divider`}
                light
                sx={{
                    marginTop: theme.spacing(1),
                    marginBottom: theme.spacing(2),
                }}
            />
        </div>
    );
}
