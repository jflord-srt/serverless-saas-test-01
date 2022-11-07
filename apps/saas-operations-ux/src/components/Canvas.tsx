import { Paper } from "@mui/material";
import { styled } from "@mui/material/styles";

export const Canvas = styled(Paper)(({ theme }) => ({
    margin: theme.spacing(2),
    padding: theme.spacing(2),
}));
