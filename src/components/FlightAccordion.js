import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { PSAAccordion } from "shared-react-components/src";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DateRangeOutlinedIcon from "@mui/icons-material/DateRangeOutlined";
import PhotoCameraBackOutlinedIcon from "@mui/icons-material/PhotoCameraBackOutlined";

const FlightAccordion = ({ flightDetails, onClick }) => {
  const [expanded, setExpanded] = useState(false);
  const formattedDate = flightDetails?.mission_start_time
    ? new Date(flightDetails.mission_start_time).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    : null;

  const handleAccordionChange = () => {
    setExpanded((prev) => !prev);
  };

  const DataContainer = ({ icon: Icon, label, value, iconSize = 20 }) => {
    return (
      <Box
        display="flex"
        alignItems="center"
        sx={{ width: "150px", paddingRight: "8px" }}
      >
        <Icon sx={{ fontSize: iconSize, color: "#595959" }} />

        <Typography
          variant="body6"
          color="text.secondary"
          sx={{ paddingLeft: "4px" }}
        >
          {label}
        </Typography>
        <Typography variant="body6" sx={{ paddingLeft: "8px" }}>
          {value}
        </Typography>
      </Box>
    );
  };

  return (
    <PSAAccordion
      expanded={expanded}
      onChange={handleAccordionChange}
      detailsContent={
        <Button
          key={flightDetails?.flight_id}
          id={flightDetails?.flight_id}
          onClick={onClick}
        >
          {"View"}
        </Button>
      }
      summaryContent={
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
        >
          <DataContainer
            icon={DateRangeOutlinedIcon}
            label={"Date"}
            value={formattedDate}
          />

          <DataContainer
            icon={PhotoCameraBackOutlinedIcon}
            label={"Type"}
            value={
              flightDetails?.file_type === "JPEG" ? "RGB" : "Multispectral"
            }
          />
        </Box>
      }
      summaryProps={{
        expandIcon: expanded ? (
          <KeyboardArrowUpIcon />
        ) : (
          <KeyboardArrowDownIcon />
        ),
        sx: {
          height: "55px",
        },
      }}
      testId="custom-accordion"
    />
  );
};

export default FlightAccordion;
