import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, FormControl, FormLabel,
     Grid, InputLabel, RadioGroup, Radio,
     Select, TextField, Typography, Modal, MenuItem, FormControlLabel } from '@mui/material';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  height: 500,
  overflow: 'auto'
};

const FieldFeatureModal = ({setFieldFeatures}) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setFieldFeatures({
        'crop_type': cropType,
        'lead_scientist': leadScientist,
        'planting_date': plantingDate,
        'harvest_date': plantingDate,
        'insect_data_collected': insectCollected,
        'insect_data_desc': insectDataDetails,
        'disease_data_collected': diseaseCollected,
        'disease_data_desc': diseaseDataDetails,
        'data_usage_desc': dataUsageDescription,
    });
    console.log('yolo');
    setOpen(false);
  };

//   const [studyMetadata, setStudyMetadata] = useState({});
  const [cropType, setCropType] = useState();
  const [leadScientist, setLeadScientist] = useState();
  
  const [plantingDate, setPlantingDate] = useState();
  const [harvestDate, setHarvestDate] = useState();

  const [insectCollected, setInsectCollected] = useState();
  const [showInsectTextField, setInsectTextField] = useState(false);
  const [insectDataDetails, setInsectDataDetails] = useState();

  const [diseaseCollected, setDiseaseCollected] = useState();
  const [showDiseaseTextField, setDiseaseTextField] = useState(false);
  const [diseaseDataDetails, setDiseaseDataDetails] = useState();

  const [dataUsageDescription, setDataUsageDescription] = useState();

//   const handleCropTypeChange = (e) => {
//     setCropType(e.target.value);
//   };

  const handleInsectRadioChange = (e) => {
    setInsectCollected(e.target.value);
    setInsectTextField(e.target.value==='yes');
  };
  const handleDiseaseRadioChange = (e) => {
    setDiseaseCollected(e.target.value);
    setDiseaseTextField(e.target.value==='yes');
  };

  return (
    <div>
      <Button onClick={handleOpen}>Add field features</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Study Metadata
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            Please add some field metadata that is common across all the plots.
          </Typography>
          <FormControl fullWidth sx={{mt:2}}>
            <TextField
                label='Crop'
                type='text'
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                inputProps={{min:1}}
                // size='small'
                sx={{mb:2}}
                required
              />
            <TextField
                label='Lead Scientist'
                type='text'
                value={leadScientist}
                onChange={(e) => setLeadScientist(e.target.value)}
                inputProps={{min:1}}
                // size='small'
                sx={{mb:2}}
                required
              />
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                label="Planting Date"
                value={plantingDate}
                onChange={(newValue) => {
                setPlantingDate(newValue.toString());
                }}
                sx={{mb:1}}
                />
            </LocalizationProvider>
            <FormLabel id='insectDamageLabel' sx={{mt:2}}>Did you collect insect data?</FormLabel>
            <RadioGroup
                aria-labelledby='insectDamageRadio'
                // defaultValue='na'
                name='insectDamageRadio'
                value={insectCollected}
                onChange={handleInsectRadioChange}
                // labelId='insectDamageLabel'
                
            >
                <FormControlLabel control={<Radio/>} value='yes' label='Yes' />
                <FormControlLabel control={<Radio/>} value='no' label='No' />
                {/* <FormControlLabel control={<Radio/>} value='na' label='N/A' /> */}
            </RadioGroup>
            {showInsectTextField && (
              <TextField
                label="Details about insect data"
                variant="outlined"
                value={insectDataDetails}
                onChange={(e) => setInsectDataDetails(e.target.value)}
                // Additional props for the text field
                sx={{mt:1}}
              />
            )}
            <FormLabel id='diseaseDataLabel' sx={{mt:2}}>Did you collect disease data?</FormLabel>
            <RadioGroup
                aria-labelledby='diseaseDataLabel'
                name='diseaseDataLabel'
                value={diseaseCollected}
                onChange={handleDiseaseRadioChange}
                // onChange={(e) => {setInsectDamage(e.target.value)}}
                // labelId='insectDamageLabel'
                
            >
                <FormControlLabel control={<Radio/>} value='yes' label='Yes' />
                <FormControlLabel control={<Radio/>} value='no' label='No' />
            </RadioGroup>
            {showDiseaseTextField && (
              <TextField
                label="Details about disease data"
                variant="outlined"
                value={diseaseDataDetails}
                onChange={(e) => setDiseaseDataDetails(e.target.value)}
                // Additional props for the text field
                sx={{mt:1}}
              />
            )}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                label="Harvest Date"
                value={harvestDate}
                onChange={(newValue) => {
                setHarvestDate(newValue.toString());
                }}
                sx={{mt:2}}
                />
            </LocalizationProvider>
            <TextField
              label="Short description of how you will use this data"
              multiline
              maxRows={4}
              value={dataUsageDescription}
              onChange={(e) => setDataUsageDescription(e.target.value)}
              sx={{mt:2}}
            />
          </FormControl>
        </Box>
      </Modal>
    </div>
  );
};
export default FieldFeatureModal;