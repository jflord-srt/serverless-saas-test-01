import React from "react";
import { Grid, SxProps, Theme } from "@mui/material";
import { ReactNode } from "react";

export interface SplitContainerProps extends React.HTMLAttributes<HTMLElement> {
    id: string;
    left: ReactNode;
    right: ReactNode;
    sx?: SxProps<Theme>;
}

export function SplitContainer(props: SplitContainerProps): React.ReactElement {
    const { id, left, right, sx, ...rest } = props;
    return (
        <Grid id={id} container alignItems="center" sx={sx} {...rest}>
            <Grid id={`${id}-left`} item>
                {left}
            </Grid>
            <Grid id={`${id}-right`} item sx={{ marginLeft: "auto" }}>
                {right}
            </Grid>
        </Grid>
    );
}
