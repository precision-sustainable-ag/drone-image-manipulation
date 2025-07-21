import React, { useState } from "react";
import { Button, Box, Typography, Modal, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import spatialQueryVideo from "../assets/videos/spatial_query_eg.mp4";

const Header = ({ showHelp = false }) => {
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  const feedBackButton = () => navigate("/feedback");
  const homeButton = () => navigate("/");

  return (
    <>
      <Box
        component="header"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: "#E6F5DD",
          py: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img
            src="/ncsu-logo.png"
            alt="NC State Logo"
            style={{ width: "120px", height: "35px" }}
          />
          <img
            src="/usda-logo.png"
            alt="USDA Logo"
            style={{ width: "36px", height: "25px" }}
          />
          <Typography variant="h6" sx={{ color: "#516B42", marginLeft: 2 }}>
            Automated Intelligence for Research Stations
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {showHelp && (
            <Button onClick={() => setHelpOpen(true)} sx={{ color: "#516B42" }}>
              Help
            </Button>
          )}
          <Button onClick={homeButton} sx={{ color: "#516B42" }}>
            Restart
          </Button>
          <Button onClick={feedBackButton} sx={{ color: "#516B42" }}>
            Feedback
          </Button>
        </Box>
      </Box>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: "500px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              p: 2,
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                position: "relative",
              }}
            >
              <Typography variant="h4" align="center" sx={{ flex: 1 }}>
                Find Missions
              </Typography>
              <IconButton
                onClick={() => setHelpOpen(false)}
                sx={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Typography variant="body1" align="center">
              Click the polygon icon in the top right to begin drawing a box. Then click on any 2 points to create a rectangle. 
              If you want to delete your box, click into it and then click the trash can icon.
            </Typography>

            <Box sx={{ width: "100%" }}>
              <video
                src={spatialQueryVideo}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
                muted
                loop
                autoPlay
              />
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default Header;
