import React, { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PlotMap from "./plot_map";
import PlotTable from "./plot_table";
import { Box } from "@mui/material";
import Header from "../Header/header";
import Footer from "../../components/Footer";

const PlotPage = () => {
  const location = useLocation();
  const { state } = location;
  const plotMapRef = useRef(null);
  const navigate = useNavigate();
  console.log("plot page", state);
  console.log("plot page", state["features"]);
  console.log("plot page", state["flight_details"]);

  if (!state || !state.features || !state.flight_details) {
    return <div>Loading...</div>;
  }

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        justifyContent: "space-between",
      }}
    >
      <Header />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: "52px",
          mb: "59px",
          display: "flex",
          overflow: "auto",
          minHeight: 0,
          height: "calc(100vh - 104px)",
          backgroundColor: "rgba(240,247,235,.5)",
        }}
      >
        <Box
          sx={{
            width: {
              md: "50%",
              lg: "30%",
            },
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
            maxHeight: "calc(100vh - 111px)",
          }}
        >
          <PlotTable state={state} plotMapRef={plotMapRef} />
        </Box>

        <Box
          sx={{
            width: {
              md: "50%",
              lg: "70%",
            },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <PlotMap apiOutput={state} ref={plotMapRef} />
        </Box>
      </Box>

      <Footer
        prevFunc={() => {
          navigate(-1);
        }}
      />
    </Box>
  );
};
export default PlotPage;
