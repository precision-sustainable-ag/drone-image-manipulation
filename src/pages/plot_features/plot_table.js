import { Button, Box, Grid, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { DataGrid, GridRowsProp, GridColDef, GridRowEditStopReasons, GridRowModes, GridActionsCellItem } from '@mui/x-data-grid';
import { DefaultUniform } from 'ol/webgl/Helper';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PlotMap from './plot_map';

const PlotTable = () => {
    // let rows;
    // let columns;
    const { state } = useLocation();
    console.log(state);
    
    const initalRows = state.grids;
    const initalRowsCopy = [...initalRows];
    // console.log('intial rows ', initalRows);
    initalRowsCopy.sort((a,b) => {
        if (a['plot_num'] < b['plot_num']) {return -1;}
        else if (a['plot_num'] > b['plot_num']) {return 1;}
        else return 0;
    });
    // const columns = [
    //     {
    //         field: 'plot_num',
    //         headerName: 'Plot Number',
    //         headerAlign: 'center',
    //         align: 'center',
    //         // editable: true,
    //         width: 100
    //     },
    //     {
    //         field: 'plot_name',
    //         headerName: 'Plot Name',
    //         headerAlign: 'center',
    //         align: 'center',
    //         editable: true,
    //         width: 120
    //     },
    //     {
    //         field: 'height',
    //         headerName: 'Height (cm)',
    //         headerAlign: 'center',
    //         align: 'center',
    //         type: 'number',
    //         width: 100,
    //         editable: true
    //     },
    //     {
    //         field: 'color',
    //         headerName: 'Color',
    //         headerAlign: 'center',
    //         align: 'center',
    //         type: 'singleSelect',
    //         valueOptions: ['Red', 'Orange', 'Green'],
    //         width: 150,
    //         editable: true
    //     },
    //     {
    //         field: 'lodging',
    //         headerName: 'Lodging (%)',
    //         headerAlign: 'center',
    //         align: 'center',
    //         type: 'number',
    //         width: 100,
    //         editable: true
    //     },
    //     {
    //         field: 'flowering',
    //         headerName: 'Flowering Date',
    //         headerAlign: 'center',
    //         align: 'center',
    //         type: 'date',
    //         width: 160,
    //         editable: true,
    //         valueGetter: ({value}) => value && new Date(value),
    //     },
    //     {
    //         field: 'insect_damage',
    //         headerName: 'Insect Damage',
    //         headerAlign: 'center',
    //         type: 'boolean',
    //         width: 120,
    //         editable: true
    //     },
    //     {
    //         field: 'actions',
    //         type: 'actions',
    //         headerName: 'Actions',
    //         width: 100,
    //         cellClassName: 'actions',
    //         getActions: ({id}) => {
    //             const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
    //             if (isInEditMode) {
    //                 return [
    //                     <GridActionsCellItem
    //                         icon={<SaveIcon/>}
    //                         label='Save'
    //                         sx={{
    //                             color: 'primary.main',
    //                         }}
    //                         onClick={handleSaveClick(id)}
    //                     />,
    //                     <GridActionsCellItem
    //                         icon={<CancelIcon/>}
    //                         label='Cancel'
    //                         className='textPrimary'
    //                         onClick={handleCancelClick(id)}
    //                         color='inherit'
    //                     />,
    //                 ];
    //             }
    //             return [
    //                 <GridActionsCellItem
    //                     icon={<EditIcon/>}
    //                     label='Edit'
    //                     className='textPrimary'
    //                     onClick={handleEditClick(id)}
    //                     color='inherit'
    //                 />,
    //             ];
    //         }
            
    //     }
    // ]

    const columns = [
        {
            field: 'plot_num',
            headerName: 'Plot Number',
            headerAlign: 'center',
            align: 'center',
            // editable: true,
            // width: 100,
            flex:1
        },
        {
            field: 'plot_name',
            headerName: 'Plot Name',
            headerAlign: 'center',
            align: 'center',
            editable: true,
            // width: 120
            flex:1
        },
        {
            field: 'gli',
            headerName: 'Green Leaf Index',
            headerAlign: 'center',
            align: 'center',
            // editable: true,
            // width: 150
            flex:1
        },
        {
            field: 'vari',
            headerName: 'VARI',
            headerAlign: 'center',
            align: 'center',
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



    // const [editedRows, setEditedRows] = useState([]);
    // const handleCellEdit = (newRow) => {
    //     setEditedRows((prevRows) => [...prevRows.filter(row => row.id!== newRow.id), newRow]);
    // };

    const sendToAPI = () => {
        console.log(rows);
    };


    useEffect(() => {
        
        return () => {
          
        };
      }, []);

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
            <Grid container spacing={2}>
                <Grid item xs={12} md={12} lg={12}
                style={{
                backgroundColor: 'rgba(240,247,235,.5)',
                position: 'relative',
                width: '100%',
                }} mt={3}>
                    <Typography variant="h5" gutterBottom align="center">
                        Plot Details
                    </Typography>
                    <Typography variant="h6" gutterBottom align="center">
                        {state.flight_details.display_name}
                    </Typography>

                </Grid>
            </Grid>

            <Grid container spacing = {2} mt={1}>
                <PlotMap apiOutput={state}/>
                <Grid item xs={12} md={12} lg={12}
                style={{
                backgroundColor: 'rgba(240,247,235,.5)',
                position: 'relative',
                width: '100%',
                padding: '10px'
                }} mt={2}>
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
                    <Button variant='outlined' onClick={sendToAPI}>DONE</Button>
                </Grid>
                
            </Grid>
        </Box>
    );
};
export default PlotTable;