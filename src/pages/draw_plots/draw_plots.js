import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/App.css";
import GeoTIFFMap from "./geotiffmap";
import Header from "../../components/Header";
import {
  Box,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import FieldFeatureModal from "./field_features_modal";
import Footer from "../../components/Footer";
import FlightAccordion from "../../components/FlightAccordion";

function DrawPlots() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [gridCols, setGridCols] = useState(2);
  const [gridRows, setGridRows] = useState(2);
  const [walkPattern, setWalkPattern] = useState("dh");
  const [walkStartLocation, setWalkStartLocation] = useState("tl");
  const [fieldFeatures, setFieldFeatures] = useState({
    planting_date: null,
    insect_damage: null,
    crop_type: null,
  });
  const [coordinateFeatures, setCoordinateFeatures] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [respData, setRespData] = useState(null);

  const handleGridColsChange = (event) => {
    const newCols = parseInt(event.target.value, 10);
    setGridCols(newCols);
  };

  const handleGridRowsChange = (event) => {
    const newRows = parseInt(event.target.value, 10);
    setGridRows(newRows);
  };

  const handleFieldFeaturesUpdate = (newData) => {
    setFieldFeatures(newData);
  };

  const handleCoordinateFeaturesUpdate = (newData) => {
    setCoordinateFeatures(newData);
  };

  const forceLoad = (d) => {
    let x = 0;

    const iterate = (data) => {
      for (const [key, value] of Object.entries(data)) {
        if (key && value) {
          if (typeof value === "object" && value !== null) {
            iterate(value);
          } else {
            x += 1;
          }
        }
      }
    };
    iterate(d);
    return x;
  };

  const sendGrid = async () => {
    // TODO: error handling, loading modal
    // TODO: sending field features
    if (
      [null, undefined, ""].includes(fieldFeatures["crop_type"]) ||
      [null, undefined, ""].includes(fieldFeatures["lead_scientist"])
    ) {
      alert('Please add required details by clicking "Add Field Features"');
      return;
    }
    const requestData = {
      flight_id: coordinateFeatures["flight_id"],
      coordinate_features: coordinateFeatures,
      data_collection_method: {
        start_point: walkStartLocation,
        pattern: walkPattern,
      },
      field_features: fieldFeatures,
    };
    try {
      setLoading(true);
      const response = await axios.post(
        process.env.REACT_APP_API_URL + "/set-grid",
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setIsSubmitted(true);
      let responseData = response.data;
      if (typeof responseData === "string") {
        try {
          responseData = responseData.replace(/\bNaN\b/g, "null");
          responseData = JSON.parse(responseData);
        } catch (parseError) {
          console.error("Error parsing response data:", parseError);
          throw new Error("Could not parse response data");
        }
      }

      if (forceLoad(responseData) > 0) {
        setRespData(responseData);
        console.log("forceloaded");
        setIsSubmitted(true);
      } else {
        throw new Error("Improper response data");
      }
    } catch (error) {
      console.error("Error in sending grid", error);
      alert("Could not process. Please try again later");
      setIsSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      isSubmitted &&
      respData &&
      respData["features"] &&
      respData["flight_details"]
    ) {
      console.log("navigate");
      setIsSubmitted(false);
      navigate("/plot-features", {
        state: { ...respData, rotation: coordinateFeatures.rotation },
      });
    } else {
      console.log("couldnt navigate");
    }
  }, [isSubmitted, respData, navigate]);

  return (
    <Box
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}
      <Header />

      {/* MAIN */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: "52px",
          mb: "59px",
          display: "flex",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* LEFT COLUMN - CREATE GRID */}
        <Box
          sx={{
            width: "30%",
            backgroundColor: "rgba(240,247,235,.5)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "calc(100vh - 127px)", // (top and bottom margin + top and bottom padding = 52+59+16+0 = 143px (py:2 -> py:16px))
            px: 2,
            pt: 2,
            overflowY: "auto",
          }}
        >
          <Typography variant="h5" gutterBottom align="left">
            Create your grid
          </Typography>
          <Typography variant="body1" gutterBottom align="left">
            First, set your grid dimensions, and data collection method. Next,
            hit “Draw” and click and drag on the map to place your grid.
          </Typography>
          <Typography variant="body1" align="left">
            Rotate the map view using one of these methods:
          </Typography>
          <Box component="ul" sx={{ pl: 2, margin: 0 }}>
            <Typography component="li" variant="body1">
              Click the rotation buttons in the top-left corner of the map to
              rotate in 5-degree increments.
            </Typography>
            <Typography component="li" variant="body1">
              Hold Shift + drag with your mouse for precise rotation control.
            </Typography>
          </Box>

          {/* Selected mission */}
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom align="left">
              Selected Mission
            </Typography>
            <FlightAccordion flightDetails={state.flightDetails} />
          </Box>

          {/* Grid settings */}
          <Box sx={{ pt: 2, width: "80%" }}>
            <Typography variant="h6" align="left">
              Grid Settings & Data
            </Typography>
            <Typography variant="body1" align="left">
              What are your grid dimensions?
            </Typography>

            {/* Grid dimensions */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                py: 2,
                alignItems: "center",
              }}
            >
              <TextField
                label="Rows"
                type="number"
                value={gridRows}
                onChange={handleGridRowsChange}
                inputProps={{ min: 1 }}
                size="small"
              />
              <Typography variant="body1" sx={{ px: 3 }}>
                X
              </Typography>
              <TextField
                label="Cols"
                type="number"
                value={gridCols}
                onChange={handleGridColsChange}
                inputProps={{ min: 1 }}
                size="small"
              />
            </Box>

            <Typography variant="body1" align="left">
              What is your data collection method?
            </Typography>

            {/* Data collections method */}
            <Box sx={{ py: 1 }}>
              <FormControl fullWidth variant="outlined" sx={{ my: 1 }}>
                <InputLabel id="walkPatternLabel">Collection Method</InputLabel>
                <Select
                  fullWidth
                  labelId="walkPatternLabel"
                  id="walkPatternSelect"
                  value={walkPattern}
                  onChange={(e) => setWalkPattern(e.target.value)}
                  label="Collection Method"
                >
                  <MenuItem value={"dh"}>Deadheaded</MenuItem>
                  <MenuItem value={"st"}>Serpentine</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth variant="outlined" sx={{ my: 1 }}>
                <InputLabel id="walkStartLabel">Collection Start</InputLabel>
                <Select
                  fullWidth
                  labelId="walkStartLabel"
                  id="walkStartSelect"
                  value={walkStartLocation}
                  onChange={(e) => setWalkStartLocation(e.target.value)}
                  label="Collection Start"
                >
                  <MenuItem value={"tl"}>Top left corner</MenuItem>
                  <MenuItem value={"tr"}>Top right corner</MenuItem>
                  <MenuItem value={"bl"}>Bottom left corner</MenuItem>
                  <MenuItem value={"br"}>Bottom right corner</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Grid item xs={6} sm={6} md={6} lg={6} align="left" sx={{ mb: 1 }}>
              <FieldFeatureModal
                setFieldFeatures={handleFieldFeaturesUpdate}
              ></FieldFeatureModal>
            </Grid>
          </Box>
        </Box>

        {/* RIGHT COLUMN - MAP */}
        <Box
          sx={{
            width: "70%",
            backgroundColor: "rgba(240,247,235,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <GeoTIFFMap
            gridCols={gridCols}
            gridRows={gridRows}
            flightDetails={state.flightDetails}
            setCoordinateFeatures={handleCoordinateFeaturesUpdate}
          />
        </Box>
      </Box>

      {/* FOOTER */}
      <Footer
        prevFunc={() => {
          navigate("/explore", { state: state.flightList });
        }}
        nextFunc={sendGrid}
        nextDisabled={
          [null, undefined, ""].includes(fieldFeatures["crop_type"]) ||
          [null, undefined, ""].includes(fieldFeatures["lead_scientist"]) ||
          !coordinateFeatures.box ||
          coordinateFeatures.box.length === 0
        }
      />

      <Modal open={loading}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "50%",
            height: "50%",
            backgroundColor: "white",
            boxShadow: 24,
            p: 4,
            borderRadius: "8px",
            textAlign: "center",
            maxHeight: "100px",
          }}
        >
          <CircularProgress />
          <Typography>Calculating vegetation indices</Typography>
        </Box>
      </Modal>
    </Box>
  );
}

export default DrawPlots;
