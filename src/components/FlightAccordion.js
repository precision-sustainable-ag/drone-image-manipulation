import { Box, Typography } from "@mui/material";
import { PSAAccordion } from "shared-react-components/src";
import ArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CalendarIcon from "@mui/icons-material/DateRangeOutlined";
import PhotoCameraIcon from "@mui/icons-material/PhotoCameraBackOutlined";
import CloudIcon from '@mui/icons-material/CloudOutlined';
import PersonIcon from '@mui/icons-material/PersonOutlineOutlined';
import CameraIcon from '@mui/icons-material/PhotoCameraOutlined';
import ResearchStationIcon from '@mui/icons-material/CorporateFareOutlined';
import CommentIcon from '@mui/icons-material/ChatOutlined';

const FlightAccordion = ({ flightDetails, expanded, onClick }) => {
  const formattedDate = flightDetails?.mission_start_time
    ? new Date(flightDetails.mission_start_time).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      })
    : null;

  const DataContainer = ({ icon: Icon, label, value, iconSize = 20, sx = {} }) => {
    return (
      <Box
        display="flex"
        alignItems="center"
        sx={{minWidth: "150px", ...sx }}
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
      onChange={onClick}
      detailsContent={
        <Box display="flex" flexDirection="column" gap={1} width="100%">
          <DataContainer
            icon={ResearchStationIcon}
            label={"Research Station"}
            value={flightDetails?.research_station}
          />

          <DataContainer
            icon={CloudIcon}
            label={"Cloudiness"}
            value={flightDetails?.cloudiness}
          />

          <DataContainer
            icon={CameraIcon}
            label={"Camera Details"}
            value={`${flightDetails?.camera_make} - ${flightDetails?.camera_model}`}
          />

          <DataContainer
            icon={PersonIcon}
            label={"Pilot Name"}
            value={flightDetails?.pilot_name}
          />

          <DataContainer
            icon={CommentIcon}
            label={"Comments"}
            value={flightDetails?.comment}
          />
        </Box>
      }
      
      summaryContent={
        <Box
          display="flex"
          alignItems="center"
          width="100%"
        >
          <DataContainer
            icon={CalendarIcon}
            label={"Date"}
            value={formattedDate}
            sx={{ paddingRight: 1.5 }}
          />

          <DataContainer
            icon={PhotoCameraIcon}
            label={"Type"}
            value={
              flightDetails?.file_type === "JPEG" ? "RGB" : "Multispectral"
            }
          />
        </Box>
      }
      summaryProps={{
        expandIcon: <ArrowDownIcon />,
        sx: {
          height: "55px",
          ".MuiAccordionSummary-content": {
            overflow: "hidden",
          },
        },
      }}
      accordionProps={{
        sx: {
          fontFamily: "IBM PLex Sans",
          fontSize: "0.9rem",
          "&.MuiAccordion-root": {
            borderRadius: "1.6875rem",
          },
        },
      }}
      testId="custom-accordion"
    />
  );
};

export default FlightAccordion;
