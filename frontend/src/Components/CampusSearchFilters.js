import * as React from 'react';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import { FormControl, MenuItem, InputLabel, Grid} from '@mui/material';

export default function CampusSearchFilters({campus, handleCampusChange}){
    const campuses = ["UBCV", "UBCO"]

    return(
        <Grid sx={{paddingTop:5, paddingBottom:10}} container spacing={1} rowSpacing={3}>
                {/* Creates the campus select filter */}
                <Grid item xs={6} sm={3} md={1}>
                    <Typography variant='body'>
                        Select Campus:
                    </Typography>
                </Grid>
                <Grid item xs={6} sm={3} md={2} container justify="left">
                    <FormControl fullwidth size="small">
                            <InputLabel>Campus</InputLabel>
                            {/* Creates the drop down menu */}
                            <Select 
                            value = {campus} 
                            onChange={handleCampusChange} 
                            align = 'left' 
                            style={{ width: '100px' }} 
                            size='small' 
                            label="Campus">
                                <MenuItem value={''}>All</MenuItem>
                                {campuses.map((currentCampus) => (
                                    <MenuItem value={currentCampus}>{currentCampus}</MenuItem>
                                    ))}
                            </Select>
                    </FormControl>
                </Grid>
        </Grid>
    );
}