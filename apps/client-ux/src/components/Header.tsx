import { Divider, Grid, useTheme } from "@mui/material";
import logo from "../resources/images/SilkRoad_Technology_Logo_Color.svg";
import { ProfileMenu } from "./ProfileMenu";

export function Header(): React.ReactElement {
    const theme = useTheme();

    return (
        <>
            <Grid container>
                <Grid item xs={6}>
                    <img src={logo} alt="logo" style={{ width: "200px" }} />
                </Grid>
                <Grid container xs={6} alignItems="center" justifyContent={"flex-end"}>
                    <ProfileMenu />
                </Grid>
            </Grid>
            <Divider light sx={{ marginTop: theme.spacing(1), marginBottom: theme.spacing(2) }} />
        </>
    );
}
