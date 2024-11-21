import { Box, Button } from "@mui/material";

const Footer = ({ prevFunc, nextFunc }) => {
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
        py: 1,
        display: "flex",
        justifyContent: "space-between",
        px: 2,
      }}
    >
      {prevFunc ? (
        <Button variant="contained" color="primary" onClick={prevFunc}>
          BACK
        </Button>
      ) : (
        <Box />
      )}

      {nextFunc ? (
        <Button variant="contained" color="primary" onClick={nextFunc}>
          NEXT
        </Button>
      ) : (
        <Box />
      )}
    </Box>
  );
};

export default Footer;
