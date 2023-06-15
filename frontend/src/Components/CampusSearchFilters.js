import * as React from 'react';
import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Select from '@mui/material/Select';
import { FormControl, MenuItem, InputLabel,
    Grid, ListItemIcon, ListItemText, Checkbox} from '@mui/material';

export default function CampusSearchFilters({selectedYear, handleYearChange, campus, handleCampusChange}){
    const years = ["2022W", "2021W", "2020W", "2019W"];
    const campuses = ["UBCV", "UBCO"]

    const isAllYearsSelected =
    years.length > 0 && selectedYear.length === years.length;

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

                {/* Creates the academic year filter */}
                {/* <Grid item xs={2} sm={6} md={6} lg={1}>
                        <Typography variant='body'>
                            Select Year:
                        </Typography>
                </Grid>
                <Grid item xs={10} sm={6} md={6} lg={4} container justify="left">
                    <FormControl fullwidth size="small">
                        <InputLabel>Year</InputLabel>
                        <Select
                            multiple
                            value={selectedYear}
                            onChange={handleYearChange}
                            style={{ minWidth: '200px', width: 'auto'}} 
                            renderValue={(selectedYear) => selectedYear.join(", ")}
                            label="Year"
                        >
                            <MenuItem
                            value="all"
                            >
                            <ListItemIcon>
                                <Checkbox
                                checked={isAllYearsSelected}
                                indeterminate={
                                    selectedYear.length > 0 && selectedYear.length < years.length
                                }
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary="Select All"
                            />
                            </MenuItem>
                            {years.map((option) => (
                            <MenuItem key={option} value={option}>
                                <ListItemIcon>
                                <Checkbox checked={selectedYear.indexOf(option) > -1} />
                                </ListItemIcon>
                                <ListItemText primary={option} />
                            </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid> */}
        </Grid>
    );
}