import {
  Button,
  Box,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Divider,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import {
  DataGrid,
  GridRowEditStopReasons,
  GridRowModes,
  GridActionsCellItem,
} from "@mui/x-data-grid";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FileSaver from "file-saver";
import { PSAFigmaButton } from "shared-react-components/src";
import FlightAccordion from "../../components/FlightAccordion";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
const PlotTable = ({ state, plotMapRef }) => {
  // let rows;
  // let columns;
  // const { state } = useLocation();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  // const initalRows = state.grids;
  // const initalRowsCopy = [...initalRows];
  // // console.log('intial rows ', initalRows);
  // initalRowsCopy.sort((a,b) => {
  //     if (a['plot_num'] < b['plot_num']) {return -1;}
  //     else if (a['plot_num'] > b['plot_num']) {return 1;}
  //     else return 0;
  // });
  const initalRows = state.features.features;
  const initalRowsCopy = [...initalRows];

  initalRowsCopy.sort((a, b) => {
    if (a["properties"]["plot_num"] < b["properties"]["plot_num"]) {
      return -1;
    } else if (a["properties"]["plot_num"] > b["properties"]["plot_num"]) {
      return 1;
    } else return 0;
  });

  const allColumns = [
    {
      field: "plot_num",
      headerName: "Plot #",
      headerAlign: "center",
      align: "center",
      valueGetter: (params) => params.row.properties.plot_num,
      // editable: true,
      // width: 100,
      flex: 1,
      // valueGetter: (params) => {console.log(params)},
    },
    {
      field: "plot_name",
      headerName: "Plot Name",
      headerAlign: "center",
      align: "center",
      editable: true,
      valueGetter: (params) => params.row.properties.name,
      // width: 120
      flex: 1,
    },
    {
      field: "ndvi",
      headerName: "NDVI",
      headerAlign: "center",
      align: "center",
      valueGetter: (params) => params.row.properties.ndvi,
      // editable: true,
      // width: 150
      flex: 1,
    },
    {
      field: "lai",
      headerName: "LAI",
      headerAlign: "center",
      align: "center",
      valueGetter: (params) => params.row.properties.lai,
      // editable: true,
      // width: 120
      flex: 1,
    },
    {
      field: "gli",
      headerName: "GLI",
      headerAlign: "center",
      align: "center",
      valueGetter: (params) => params.row.properties.gli,
      // editable: true,
      // width: 120
      flex: 1,
    },
    {
      field: "vari",
      headerName: "VARI",
      headerAlign: "center",
      align: "center",
      valueGetter: (params) => params.row.properties.vari,
      // editable: true,
      // width: 120
      flex: 1,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      // width: 100,
      flex: 1,
      cellClassName: "actions",
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              sx={{
                color: "primary.main",
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }
        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  const getFilteredColumns = (rows, allCols) => {
    return allCols.filter((column) => {
      // Keep plot_num, plot_name and actions columns
      if (
        column.field === "plot_num" ||
        column.field === "plot_name" ||
        column.field === "actions"
      ) {
        return true;
      }

      // If the column has any non-null, non-undefined, non-empty values, include that column
      return rows.some((row) => {
        const value = column.valueGetter
          ? column.valueGetter({ row })
          : row.properties[column.field];
        return value !== null && value !== undefined && value !== "";
      });
    });
  };

  const [columns, setColumns] = useState(
    getFilteredColumns(initalRowsCopy, allColumns)
  );
  const [rows, setRows] = useState(initalRowsCopy);
  const [rowModesModel, setRowModesModel] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [responseData, setResponseData] = useState("");
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });
    const editedRow = rows.find((row) => row.id === id);
    if (editedRow.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate = (newRow) => {
    const updatedRow = { ...newRow, isNew: false };
    setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
    return updatedRow;
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDownload = () => {
    const blob = new Blob([responseData], { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, "response.txt");
  };

  const exportData = () => {
    var body = [
      {
        studyName:
          state.field_features["lead_scientist"] +
          "_" +
          state.field_features["crop_type"],
        additionalInfo: {
          features: state.features.features,
          flight_id: state.flight_details["flight_id"],
          mission_start_time: state.flight_details["mission_start_time"],
        },
        commonCropName: state.field_features["crop_type"],
        contacts: [{ name: state.field_features["lead_scientist"] }],
      },
    ];

    const curlRequest = `curl "https://<your-brapi-instance>/brapi/v2/studies" -H "Content-Type: application/json" -H "Authorization: Bearer <login_token>" -H "Cookie: sgn_session_id=<login_token>; user_prefs="  -d "${JSON.stringify(
      body,
      null,
      0
    )}"`;

    setResponseData(curlRequest);
  };

  const exportTableAsCSV = () => {
    const columnsToExport = columns.filter((col) => col.field !== "actions");
    const headers = columnsToExport.map((col) => col.headerName).join(",");
    const csvRows = rows.map((row) => {
      return columnsToExport
        .map((col) => {
          const value = col.valueGetter
            ? col.valueGetter({ row })
            : row[col.field];
          return value !== undefined ? value : "";
        })
        .join(",");
    });

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
    handleDownload();
    exportTableAsCSV();
    exportMetadataAsCSV();
    plotMapRef.current.exportPlotImages();
  };

  useEffect(() => {
    exportData();
  });

  return (
    <>
      <Typography variant="h4">Your Plot</Typography>
      <Typography variant="body1" gutterBottom>
        Your plot is now ready. You can see the map data here, and export a full
        data set with the button below.
      </Typography>

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
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        slotProps={{
          paper: {
            sx: {
              width: anchorEl ? `${anchorEl.offsetWidth}px` : "auto", // Match button width
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

      <Typography variant="body1" gutterBottom>
        Selected Mission
      </Typography>
      <FlightAccordion flightDetails={state["flight_details"]} />
      <DataGrid
        rows={rows}
        columns={columns}
        editMode="row"
        rowMode
        sModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        slotProps={{
          toolbar: { setRows, setRowModesModel },
        }}
        autoHeight
        compact
      />
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Export BrAPI Request</DialogTitle>
        <DialogContent dividers>
          <pre>
            <code>{responseData}</code>
          </pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDownload} color="primary">
            Download
          </Button>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>

    // </Box>
  );
};
export default PlotTable;
