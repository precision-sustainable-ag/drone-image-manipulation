import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import FileSaver from "file-saver";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Divider,
  Typography,
  TextField,
} from "@mui/material";
import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { PSAFigmaButton } from "shared-react-components/src";
import FlightAccordion from "../../components/FlightAccordion";

const PlotTable = ({ state, plotMapRef }) => {
  const [editingRowId, setEditingRowId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [rows, setRows] = useState(
    [...state.features.features].sort(
      (a, b) => a.properties.plot_num - b.properties.plot_num
    )
  );
  const [openDialog, setOpenDialog] = useState(false);
  const [responseData, setResponseData] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const open = Boolean(anchorEl);

  const handleEditClick = (id, currentValue) => {
    setEditingRowId(id);
    setEditValue(currentValue);
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSaveClick = () => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === editingRowId
          ? { ...row, properties: { ...row.properties, name: editValue } }
          : row
      )
    );
    setEditingRowId(null);
    setEditValue("");
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
    setEditValue("");
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const allColumns = useMemo(
    () => [
      {
        field: "plot_num",
        headerName: "Plot #",
        headerAlign: "center",
        align: "center",
        valueGetter: (params) => params.row.properties.plot_num,
      },
      {
        field: "plot_name",
        headerName: "Plot Name",
        headerAlign: "center",
        align: "center",
        valueGetter: (params) => params.row.properties.name,
        flex: 1,
        renderCell: (params) => {
          const isEditing = params.row.id === editingRowId;
          return isEditing ? (
            <div
              style={{
                position: "absolute",
                zIndex: 100000,
                backgroundColor: "white",
                padding: "8px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                borderRadius: "4px",
                display: "flex",
                flexDirection: "row",
                gap: "8px",
                minWidth: "200px",
              }}
            >
              <TextField
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                size="small"
                onKeyDown={(e) => {
                  if (
                    [
                      "Space",
                      "ArrowUp",
                      "ArrowDown",
                      "ArrowLeft",
                      "ArrowRight",
                    ].includes(e.key)
                  ) {
                    e.stopPropagation();
                  }
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "8px",
                }}
              >
                <GridActionsCellItem
                  icon={<SaveIcon />}
                  label="Save"
                  onClick={handleSaveClick}
                  color="primary"
                />
                <GridActionsCellItem
                  icon={<CancelIcon />}
                  label="Cancel"
                  onClick={handleCancelClick}
                  color="inherit"
                />
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <span>{params.value}</span>
              <GridActionsCellItem
                icon={<EditIcon />}
                label="Edit"
                onClick={() =>
                  handleEditClick(params.row.id, params.row.properties.name)
                }
                color="inherit"
              />
            </div>
          );
        },
      },
      {
        field: "ndvi",
        headerName: "NDVI",
        headerAlign: "center",
        align: "center",
        valueGetter: (params) => params.row.properties.ndvi,
        flex: 1,
      },
      {
        field: "lai",
        headerName: "LAI",
        headerAlign: "center",
        align: "center",
        valueGetter: (params) => params.row.properties.lai,
        flex: 1,
      },
      {
        field: "gli",
        headerName: "GLI",
        headerAlign: "center",
        align: "center",
        valueGetter: (params) => params.row.properties.gli,
        flex: 1,
      },
      {
        field: "vari",
        headerName: "VARI",
        headerAlign: "center",
        align: "center",
        valueGetter: (params) => params.row.properties.vari,
        flex: 1,
      },
    ],
    [editingRowId, editValue]
  );

  const getFilteredColumns = (rows, allCols) => {
    return allCols.filter((column) => {
      if (["plot_num", "plot_name", "actions"].includes(column.field)) {
        return true;
      }
      return rows.some((row) => {
        const value = column.valueGetter
          ? column.valueGetter({ row })
          : row.properties[column.field];
        return value !== null && value !== undefined && value !== "";
      });
    });
  };

  const columns = useMemo(
    () => getFilteredColumns(rows, allColumns),
    [rows, allColumns]
  );

  const exportData = () => {
    const body = [
      {
        studyName: `${state.field_features.lead_scientist}_${state.field_features.crop_type}`,
        additionalInfo: {
          features: state.features.features,
          flight_id: state.flight_details.flight_id,
          mission_start_time: state.flight_details.mission_start_time,
        },
        commonCropName: state.field_features.crop_type,
        contacts: [{ name: state.field_features.lead_scientist }],
      },
    ];

    const curlRequest = `curl "https://<your-brapi-instance>/brapi/v2/studies" -H "Content-Type: application/json" -H "Authorization: Bearer <login_token>" -H "Cookie: sgn_session_id=<login_token>; user_prefs=" -d '${JSON.stringify(
      body
    )}'`;
    setResponseData(curlRequest);
  };

  const exportTableAsCSV = () => {
    const columnsToExport = columns.filter((col) => col.field !== "actions");
    const headers = columnsToExport.map((col) => col.headerName).join(",");
    const csvRows = rows.map((row) =>
      columnsToExport
        .map((col) => {
          const value = col.valueGetter
            ? col.valueGetter({ row })
            : row[col.field];
          return value !== undefined ? value : "";
        })
        .join(",")
    );
    const csvContent = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    FileSaver.saveAs(blob, "plot_table.csv");
    handleClose();
  };

  const exportMetadataAsCSV = () => {
    const fieldFeatures = Object.entries(state.field_features);
    const csvRows = fieldFeatures.map(([key, val]) => `${key},${val}`);
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    FileSaver.saveAs(blob, "field_metadata.csv");
    handleClose();
  };

  const exportAll = () => {
    handleDownloadBrAPIRequest();
    exportTableAsCSV();
    exportMetadataAsCSV();
    plotMapRef.current.exportPlotImages();
  };

  const handleDownloadBrAPIRequest = () => {
    FileSaver.saveAs(
      new Blob([responseData], { type: "text/plain;charset=utf-8" }),
      "response.txt"
    );
  };

  useEffect(() => {
    exportData();
  }, []);

  return (
    <Box
      sx={{
        p: 2,
        overflowY: "auto", // enable vertical scrolling if the table's content exceeds the container
        maxHeight: "100%", // ensures the table container doesn't exceed its parent height
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Your Plot
          </Typography>
          <Typography variant="body1" gutterBottom>
            Your plot is now ready. You can see the map data here, and export a
            full data set with the button below.
          </Typography>
        </Box>
        <PSAFigmaButton
          text="Export Map and Data"
          buttonType="LightButton"
          buttonSx={{ backgroundColor: "#516B42" }}
          textSx={{ color: "white" }}
          onClick={handleClick}
          icon={<ExpandMoreIcon sx={{ color: "white" }} />}
          rightIcon={true}
        />
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{ "aria-labelledby": "basic-button" }}
          slotProps={{
            paper: {
              sx: {
                width: anchorEl ? `${anchorEl.offsetWidth}px` : "auto",
                backgroundColor: "rgba(240,247,235)",
              },
            },
          }}
        >
          <MenuItem onClick={() => setOpenDialog(true)}>
            EXPORT TABLE AS BRAPI REQUEST
          </MenuItem>
          <MenuItem onClick={exportTableAsCSV}>EXPORT TABLE AS CSV</MenuItem>
          <MenuItem onClick={exportMetadataAsCSV}>
            EXPORT METADATA AS CSV
          </MenuItem>
          <MenuItem onClick={() => plotMapRef.current.exportPlotImages()}>
            EXPORT PLOT IMAGES
          </MenuItem>
          <Divider />
          <MenuItem onClick={exportAll}>EXPORT ALL</MenuItem>
        </Menu>
        <Box>
          <Typography variant="body1" gutterBottom>
            Selected Mission
          </Typography>
          <FlightAccordion flightDetails={state.flight_details} />
        </Box>
        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight={true}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50]}
          disableSelectionOnClick
          hideFooterSelectedRowCount
        />
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Export BrAPI Request</DialogTitle>
          <DialogContent dividers>
            <pre>
              <code>{responseData}</code>
            </pre>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDownloadBrAPIRequest} color="primary">
              Download
            </Button>
            <Button onClick={handleCloseDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default PlotTable;
