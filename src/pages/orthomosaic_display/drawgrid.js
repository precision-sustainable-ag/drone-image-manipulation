import { useState } from "react";
import "../../styles/App.css";
import GeoTIFFMap from "./geotiffmap";
import Header from "../Header/header";
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import FieldFeatureModal from "./field_features_modal";

function DrawGrid() {
  const { state } = useLocation();

  const [gridCols, setGridCols] = useState(2);
  const [gridRows, setGridRows] = useState(2);
  const [walkPattern, setWalkPattern] = useState("dh");
  const [walkStartLocation, setWalkStartLocation] = useState("tl");
  const [fieldFeatures, setFieldFeatures] = useState({
    planting_date: null,
    insect_damage: null,
    crop_type: null,
  });

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

  return (
    <Box
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: "100px",
      }}
      margin={5}
    >
      <Grid container spacing={2}>
        {/* left column */}
        <Header />
        <Grid
          item
          xs={12}
          md={3}
          lg={2}
          style={{
            backgroundColor: "rgba(240,247,235,.5)",
            position: "relative",
            width: "100%",
            height: "657px",
            display: "flex",
            flexDirection: "column",
          }}
          mt={3}
        >
          <Grid>
            <Typography variant="h5" gutterBottom align="center">
              Create your grid
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
            marginBottom={"15px"}
            align="center"
          >
            <TextField
              label="Cols"
              type="number"
              value={gridCols}
              onChange={handleGridColsChange}
              inputProps={{ min: 1 }}
              size="small"
              style={{ marginLeft: "5px", marginRight: "5px" }}
            />
            <TextField
              label="Rows"
              type="number"
              value={gridRows}
              onChange={handleGridRowsChange}
              inputProps={{ min: 1 }}
              size="small"
              style={{ marginLeft: "5px", marginRight: "5px" }}
            />
            <FormControl
              fullWidth
              style={{ display: "flex", flexDirection: "row" }}
            >
              <InputLabel id="walkPatternLabel">
                What is your data collection method?
              </InputLabel>
              <Select
                fullWidth
                labelId="walkPatternLabel"
                id="walkPatternSelect"
                value={walkPattern}
                onChange={(e) => setWalkPattern(e.target.value)}
                sx={{ mb: 2, ml: 1 }}
              >
                <MenuItem value={"dh"}>Deadheaded</MenuItem>
                <MenuItem value={"st"}>Serpentine</MenuItem>
              </Select>
            </FormControl>
            <FormControl
              fullWidth
              style={{ display: "flex", flexDirection: "row" }}
            >
              <InputLabel id="walkStartLabel">
                Where did you start collecting data from?
              </InputLabel>
              <Select
                fullWidth
                labelId="walkStartLabel"
                id="walkStartSelect"
                value={walkStartLocation}
                // label='Crop Type'
                // onChange={handleCropTypeChange}
                onChange={(e) => setWalkStartLocation(e.target.value)}
                sx={{ mb: 2, mr: 1 }}
              >
                <MenuItem value={"tl"}>Top left corner</MenuItem>
                <MenuItem value={"tr"}>Top right corner</MenuItem>
                <MenuItem value={"bl"}>Bottom left corner</MenuItem>
                <MenuItem value={"br"}>Bottom right corner</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} sm={6} md={6} lg={6} align="left" sx={{ mb: 1 }}>
            <FieldFeatureModal
              setFieldFeatures={handleFieldFeaturesUpdate}
            ></FieldFeatureModal>
          </Grid>
        </Grid>

        {/* right side - header, rows/cols, map, etc */}
        <Grid item xs={12} md={9} lg={10}>
          <Grid
            style={{
              backgroundColor: "rgba(240,247,235,.5)",
              position: "relative",
              width: "100%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
            mt={1}
          ></Grid>
          <Grid
            style={{
              backgroundColor: "rgba(240,247,235,.5)",
              position: "relative",
              width: "100%",
              left: "50%",
              transform: "translateX(-50%)",
            }}
            mt={1}
          >
            <GeoTIFFMap
              gridCols={gridCols}
              gridRows={gridRows}
              flightDetails={state.flightDetails}
              walkPattern={walkPattern}
              walkStartLocation={walkStartLocation}
              fieldFeatures={fieldFeatures}
            />
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

export default DrawGrid;
