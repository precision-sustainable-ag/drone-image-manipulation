import { Button, Box, Grid, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Menu, MenuItem, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { DataGrid, GridRowsProp, GridColDef, GridRowEditStopReasons, GridRowModes, GridActionsCellItem } from '@mui/x-data-grid';
import { DefaultUniform } from 'ol/webgl/Helper';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import FileSaver from 'file-saver';

const PlotTable = ({state, plotMapRef}) => {
    // let rows;
    // let columns;
    // const { state } = useLocation();
    console.log(state);

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
    console.log(initalRowsCopy);
    // console.log('intial rows ', initalRows);
    initalRowsCopy.sort((a,b) => {
        if (a['properties']['plot_num'] < b['properties']['plot_num']) {return -1;}
        else if (a['properties']['plot_num'] > b['properties']['plot_num']) {return 1;}
        else return 0;
    });

    const columns = [
        {
            field: 'plot_num',
            headerName: 'Plot Number',
            headerAlign: 'center',
            align: 'center',
            valueGetter: params => params.row.properties.plot_num,
            // editable: true,
            // width: 100,
            flex:1,
            // valueGetter: (params) => {console.log(params)},
            
        },
        {
            field: 'plot_name',
            headerName: 'Plot Name',
            headerAlign: 'center',
            align: 'center',
            editable: true,
            valueGetter: (params) => params.row.properties.name,
            // width: 120
            flex:1
        },
        {
            field: 'ndvi',
            headerName: 'NDVI',
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params.row.properties.ndvi,
            // editable: true,
            // width: 150
            flex:1
        },
        {
            field: 'lai',
            headerName: 'LAI',
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params.row.properties.lai,
            // editable: true,
            // width: 120
            flex:1
        },
        {
            field: 'gli',
            headerName: 'GLI',
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params.row.properties.gli,
            // editable: true,
            // width: 120
            flex:1
        },
        {
            field: 'vari',
            headerName: 'VARI',
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params.row.properties.vari,
            // editable: true,
            // width: 120
            flex:1
        },
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            // width: 100,
            flex:1,
            cellClassName: 'actions',
            getActions: ({id}) => {
                const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
                if (isInEditMode) {
                    return [
                        <GridActionsCellItem
                            icon={<SaveIcon/>}
                            label='Save'
                            sx={{
                                color: 'primary.main',
                            }}
                            onClick={handleSaveClick(id)}
                        />,
                        <GridActionsCellItem
                            icon={<CancelIcon/>}
                            label='Cancel'
                            className='textPrimary'
                            onClick={handleCancelClick(id)}
                            color='inherit'
                        />,
                    ];
                }
                return [
                    <GridActionsCellItem
                        icon={<EditIcon/>}
                        label='Edit'
                        className='textPrimary'
                        onClick={handleEditClick(id)}
                        color='inherit'
                    />,
                ];
            }
            
        }
        
    ]
    // const [rows, setRows] = useState(initalRows);
    const [rows, setRows] = useState(initalRowsCopy);
    const [rowModesModel, setRowModesModel] = useState({});
    const [openDialog, setOpenDialog] = useState(false);
    const [responseData, setResponseData] = useState("");

    const handleRowModesModelChange = (newRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };

    const handleRowEditStop = (params,event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };
    const handleEditClick = (id) => () => {
        setRowModesModel({...rowModesModel, [id]:{mode: GridRowModes.Edit}});
    };
    const handleSaveClick = (id) => () => {
        setRowModesModel({...rowModesModel, [id]:{mode: GridRowModes.View}});
    };
    const handleCancelClick = (id) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: {mode: GridRowModes.View, ignoreModifications:true},
        });
        const editedRow = rows.find((row) => row.id === id);
        if (editedRow.isNew) {
            setRows(rows.filter((row) => row.id !== id));
        }
    };

    const processRowUpdate = (newRow) => {
        const updatedRow = {...newRow, isNew: false};
        setRows(rows.map((row) => (row.id === newRow.id ? updatedRow: row)));
        return updatedRow;
    }

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleDownload = () => {
        const blob = new Blob([responseData], { type: "text/plain;charset=utf-8" });
        FileSaver.saveAs(blob, "response.txt");
    };

    // const [editedRows, setEditedRows] = useState([]);
    // const handleCellEdit = (newRow) => {
    //     setEditedRows((prevRows) => [...prevRows.filter(row => row.id!== newRow.id), newRow]);
    // };

    const sendToAPI = () => {
        // console.log(rows);
    };

    const exportData = () => {

        var body = [{"studyName": state.field_features["lead_scientist"] + "_" + state.field_features["crop_type"],
                 "additionalInfo": {"features": state.features.features,
                                    "flight_id": state.flight_details["flight_id"],
                                    "mission_start_time": state.flight_details["mission_start_time"]},
                 "commonCropName": state.field_features["crop_type"],
                 "contacts": [{"name": state.field_features["lead_scientist"],}],
                 }]

        const curlRequest = `curl "https://<your-brapi-instance>/brapi/v2/studies" -H "Content-Type: application/json" -H "Authorization: Bearer <login_token>" -H "Cookie: sgn_session_id=<login_token>; user_prefs="  -d "${JSON.stringify(
          body,
          null,
          0
        )}"`;

        setResponseData(curlRequest);
    }

    const exportTableAsCSV = () => {
        const columnsToExport = columns.filter(col => col.field !== 'actions');
        const headers = columnsToExport.map(col => col.headerName).join(',');
        const csvRows = rows.map(row => {
            return columnsToExport.map(col => {
                const value = col.valueGetter ? col.valueGetter({ row }) : row[col.field];
                return value !== undefined ? value : '';
            }).join(',');
        });

        const csvContent = [headers, ...csvRows].join('\n');
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        FileSaver.saveAs(blob, "plot_table.csv");
        handleClose();
    }

    const exportMetadataAsCSV = () => {
        const fieldFeatures = Object.entries(state.field_features);
        const csvRows = fieldFeatures.map(([key, val]) => `${key},${val}`);
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
        FileSaver.saveAs(blob, "field_metadata.csv");
        handleClose();
    }

    const exportAll = () => {
        handleDownload();
        exportTableAsCSV();
        exportMetadataAsCSV();
        plotMapRef.current.exportPlotImages();
    };

    useEffect(() => {
        exportData()
      });

    return (
        <Box
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100px'
            }}
            margin={5}
        >

            <Grid container spacing = {2} mt={1}>
                <Grid item xs={12} md={12} lg={12}
                style={{
                backgroundColor: 'rgba(240,247,235,.5)',
                position: 'relative',
                width: '100%',
                padding: '10px'
                }}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        editMode="row"
                        rowModesModel={rowModesModel}
                        onRowModesModelChange={handleRowModesModelChange}
                        onRowEditStop={handleRowEditStop}
                        processRowUpdate={processRowUpdate}
                        slotProps={{
                        toolbar: { setRows, setRowModesModel },
                        }} mr={2}
                    />
                    {/* <DataGrid editMode='row' rows={initalRows} columns={columns} /> */}
                </Grid>
                <Grid item xs={12} md={12} lg={12} align='right'>
                    <Button variant='outlined' id="basic-button" onClick={handleClick} style={{ marginRight: '10px' }}>EXPORT
                    </Button>
                    <Menu
                        id="basic-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        MenuListProps={{
                        'aria-labelledby': 'basic-button',
                        }}
                    >
                        <MenuItem onClick={() => setOpenDialog(true)}>EXPORT TABLE AS BRAPI REQUEST</MenuItem>
                        <MenuItem onClick={exportTableAsCSV}>EXPORT TABLE AS CSV</MenuItem>
                        <MenuItem onClick={exportMetadataAsCSV}>EXPORT METADATA AS CSV</MenuItem>
                        <MenuItem onClick={() => plotMapRef.current.exportPlotImages()}>EXPORT PLOT IMAGES</MenuItem>
                        <Divider />
                        <MenuItem onClick={exportAll}>EXPORT ALL</MenuItem>
                    </Menu>
                    <Button variant='outlined' onClick={sendToAPI}>DONE</Button>
                </Grid>
                
            </Grid>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Export BrAPI Request</DialogTitle>
                <DialogContent dividers>
                    <pre>
                        <code>
                            {responseData}
                        </code>
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

        </Box>
    );
};
export default PlotTable;