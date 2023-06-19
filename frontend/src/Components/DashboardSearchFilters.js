import * as React from 'react';
import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Select from '@mui/material/Select';
import { FormControl, MenuItem, InputLabel, TextField, 
    Grid, ListItemIcon, ListItemText, Checkbox, Button, Slider} from '@mui/material';


import { API } from "aws-amplify";
import {getFacultyList} from "../graphql/queries";


export default function DashboardSearchFilters({selectedFaculty, handleFacultyChange, selectedYear, handleYearChange}){

    // const faculties = [];
    var [faculties, setFaculties] = useState([]);
    const years = ["2022W", "2021W", "2020W", "2019W"];

    const isAllFacultiesSelected =
    faculties.length > 0 && selectedFaculty.length === faculties.length;

    const isAllYearsSelected =
    years.length > 0 && selectedYear.length === years.length;

    /** DB Interaction **/
    var fetchFacultyList = async () => {
        try{
            const query = await API.graphql({ query: getFacultyList });
            const fac =  JSON.parse(query.data.getFacultyList.result);
            // console.log("fac: ", fac);
            const faculties_i = [];
            
            for(var i in fac){
                faculties_i.push(fac[i].faculty);
            }

            setFaculties(faculties_i);
        } catch (err){
            console.log(err);
        }
    }

    useEffect(() => {
        fetchFacultyList();
    }, []);

    return(
        <Grid sx={{paddingTop:5, paddingBottom:10}} container spacing={1} rowSpacing={3}>
            {/* Creates the faculty filter */}
            <Grid item xs={2} sm={6} md={6} lg={1}>
                    <Typography variant='body'>
                        Select Faculty:
                    </Typography>
                </Grid>
                <Grid item xs={10} sm={6} md={6} lg={4} container justify="left">
                    <FormControl fullwidth size="small">
                        <InputLabel>Faculty</InputLabel>
                        <Select
                            multiple
                            value={selectedFaculty}
                            onChange={handleFacultyChange}
                            style={{ minWidth: '200px', width: 'auto'}} 
                            renderValue={(selectedFaculty) => selectedFaculty.join(", ")}
                            label="Faculty"
                        >
                            <MenuItem
                            value="all"
                            >
                            <ListItemIcon>
                                <Checkbox
                                checked={isAllFacultiesSelected}
                                indeterminate={
                                    selectedFaculty.length > 0 && selectedFaculty.length < faculties.length
                                }
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary="Select All"
                            />
                            </MenuItem>
                            {faculties.map((option) => (
                            <MenuItem key={option} value={option}>
                                <ListItemIcon>
                                <Checkbox checked={selectedFaculty.indexOf(option) > -1} />
                                </ListItemIcon>
                                <ListItemText primary={option} />
                            </MenuItem>
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