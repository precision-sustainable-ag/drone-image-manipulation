import { Box } from "@mui/material";
import React from "react";
import { PSAFigmaButton } from "shared-react-components/src";
import NextIcon from "@mui/icons-material/ArrowForwardRounded";
import PrevIcon from "@mui/icons-material/ArrowBack";

const Footer = ({ prevFunc, prevDisabled, nextFunc, nextDisabled }) => {
  return (
    <Box
      component="footer"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "#E6F5DD",
        py: 2,
        display: "flex",
        justifyContent: "space-between",
        px: 2,
      }}
    >
      {prevFunc ? (
        <PSAFigmaButton
          icon={<PrevIcon sx={{ color: "white" }} />}
          leftIcon
          text="Prev"
          variant="standard"
          buttonSx={
            !prevDisabled
              ? { backgroundColor: "#516B42" }
              : { backgroundColor: "#959595" }
          }
          textSx={{ color: "white" }}
          onClick={prevFunc}
        />
      ) : (
        <Box />
      )}

      {nextFunc ? (
        <PSAFigmaButton
          icon={<NextIcon sx={{ color: "white" }} />}
          rightIcon
          text="Next"
          variant="standard"
          buttonSx={
            !nextDisabled
              ? { backgroundColor: "#516B42" }
              : { backgroundColor: "#959595" }
          }
          textSx={{ color: "white" }}
          onClick={nextFunc}
        />
      ) : (
        <Box />
      )}
    </Box>
  );
};

export default Footer;
