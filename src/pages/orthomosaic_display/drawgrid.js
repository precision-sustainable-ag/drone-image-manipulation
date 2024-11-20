import { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/App.css";
import GeoTIFFMap from "./geotiffmap";
import Header from "../Header/header";
import {
  Box,
  Button,
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

function DrawGrid() {
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
      console.log("response", response);
      let responseData = response.data;
      // responseData = JSON.parse(response.data.replace(/\bNaN\b/g, "null"));

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
      <Box
        component="header"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <Header />
      </Box>

      {/* MAIN */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: "37px",
          mb: "65px",
          display: "flex",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            width: "30%",
            backgroundColor: "rgba(240,247,235,.5)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            height: "calc(100vh - 102px)",
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            align="center"
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              py: 1,
            }}
          >
            Create your grid
          </Typography>
          <Box
            sx={{
              overflowY: "auto",
              flexGrow: 1,
              px: 1,
            }}
          >
            <Box sx={{ px: 2 }}>
              <TextField
                label="Cols"
                type="number"
                value={gridCols}
                onChange={handleGridColsChange}
                inputProps={{ min: 1 }}
                size="small"
                sx={{ mb: 2 }}
              />
              <TextField
                label="Rows"
                type="number"
                value={gridRows}
                onChange={handleGridRowsChange}
                inputProps={{ min: 1 }}
                size="small"
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="walkPatternLabel">
                  What is your data collection method?
                </InputLabel>
                <Select
                  fullWidth
                  labelId="walkPatternLabel"
                  id="walkPatternSelect"
                  value={walkPattern}
                  onChange={(e) => setWalkPattern(e.target.value)}
                >
                  <MenuItem value={"dh"}>Deadheaded</MenuItem>
                  <MenuItem value={"st"}>Serpentine</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="walkStartLabel">
                  Where did you start collecting data from?
                </InputLabel>
                <Select
                  fullWidth
                  labelId="walkStartLabel"
                  id="walkStartSelect"
                  value={walkStartLocation}
                  onChange={(e) => setWalkStartLocation(e.target.value)}
                >
                  <MenuItem value={"tl"}>Top left corner</MenuItem>
                  <MenuItem value={"tr"}>Top right corner</MenuItem>
                  <MenuItem value={"bl"}>Bottom left corner</MenuItem>
                  <MenuItem value={"br"}>Bottom right corner</MenuItem>
                </Select>
              </FormControl>
              <Grid
                item
                xs={6}
                sm={6}
                md={6}
                lg={6}
                align="left"
                sx={{ mb: 1 }}
              >
                <FieldFeatureModal
                  setFieldFeatures={handleFieldFeaturesUpdate}
                ></FieldFeatureModal>
              </Grid>
            </Box>
          </Box>
        </Box>

        {/* right side -  map */}
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
          justifyContent: "flex-end",
          px: 2,
        }}
      >
        <Button variant="contained" color="primary" onClick={sendGrid}>
          NEXT
        </Button>

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
    </Box>
  );
}

export default DrawGrid;
