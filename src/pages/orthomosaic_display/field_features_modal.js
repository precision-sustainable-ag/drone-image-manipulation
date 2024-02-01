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
  height: 500
};

const FieldFeatureModal = ({setFieldFeatures}) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setFieldFeatures({
        'planting_date': plantingDate,
        'crop_type': cropType,
        'insect_damage': insectDamage,
    });
    console.log('yolo');
    setOpen(false);
  };

//   const [studyMetadata, setStudyMetadata] = useState({});
  const [cropType, setCropType] = useState();
  const [plantingDate, setPlantingDate] = useState();
  const [insectDamage, setInsectDamage] = useState();

//   const handleCropTypeChange = (e) => {
//     setCropType(e.target.value);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setStudyMetadata( (oldData) => ({ ...oldData, name : value }));
//   };

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
            Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
          </Typography>
          <FormControl fullWidth sx={{mt:2}}>
            <InputLabel id='cropTypeLabel'>Crop Type</InputLabel>
            <Select fullWidth
                labelId='cropTypeLabel'
                id='cropTypeSelect'
                value={cropType}
                // label='Crop Type'
                // onChange={handleCropTypeChange}
                onChange={(e) => setCropType(e.target.value)}
                sx={{mb:2}}
            >
                <MenuItem value={'barley'}>Barley</MenuItem>
                <MenuItem value={'wheat'}>Wheat</MenuItem>
            </Select>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                label="Planting Date"
                value={plantingDate}
                onChange={(newValue) => {
                setPlantingDate(newValue.toString());
                }}
                />
            </LocalizationProvider>
            <FormLabel id='insectDamageLabel' sx={{mt:2}}>Did you collect insect damage data?</FormLabel>
            <RadioGroup
                aria-labelledby='insectDamageRadio'
                defaultValue='na'
                name='insectDamageRadio'
                value={insectDamage}
                onChange={(e) => {setInsectDamage(e.target.value)}}
                label='Did you collect insect damage data?'
                // labelId='insectDamageLabel'
                
            >
                <FormControlLabel control={<Radio/>} value='yes' label='Yes' />
                <FormControlLabel control={<Radio/>} value='no' label='No' />
                <FormControlLabel control={<Radio/>} value='na' label='N/A' />
            </RadioGroup>
            
          </FormControl>
        </Box>
      </Modal>
    </div>
  );
};
export default FieldFeatureModal;