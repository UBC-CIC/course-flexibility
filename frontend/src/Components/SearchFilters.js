import * as React from 'react';
import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Select from '@mui/material/Select';
import { FormControl, MenuItem, InputLabel, TextField, 
    Grid, ListItemIcon, ListItemText, Checkbox, Button, Slider} from '@mui/material';
    
import { API } from "aws-amplify";
import {getFacultyList} from "../graphql/queries";

function AdvancedFilters({flexibilityGuidelineRanges, handleFlexibilityGuidelineChange, flexibilityGuidelines}){
    const results = ["Yes", "Maybe", "No"];

    return(
        <Grid  paddingLeft={3}>
            <center>
                <Typography variant={"h6"} paddingTop={3} paddingBottom={2}>Select Results for Flexibility Guidelines</Typography>
            </center>
            
            {flexibilityGuidelines.map((flexibilityGuideline, index) => (
                <Grid>
                    <Typography variant={"subtitle1 "} paddingTop={3} paddingBottom={2}>{flexibilityGuideline}</Typography>
                    <FormControl fullwidth size="small">
                        <InputLabel paddingTop={5}>{flexibilityGuideline}</InputLabel>
                        <Select
                            value={flexibilityGuidelineRanges[index]}
                            onChange={(event) => handleFlexibilityGuidelineChange(event, index)}
                            align = 'left' 
                            style={{ width: '100px' }} 
                            size='small' 
                            label="Result">
                            <MenuItem value={'All'}>All</MenuItem>
                            {results.map((result) => (
                                <MenuItem value={result}>{result}</MenuItem>
                                ))}
                        </Select>
                    </FormControl>
                </Grid>
            ))}   
        </Grid>     
    );
}

export default function SearchFilters({courseNumber, handleCourseNumberChange, 
                                        campus, handleCampusChange,
                                        courseSubject, handleCourseSubjectChange,
                                        selectedFaculty, handleFacultyChange,
                                        flexibilityGuidelineRanges, handleFlexibilityGuidelineChange, 
                                        flexibilityGuidelines}){

    var [faculties, setFaculties] = useState([]);
    const campuses = ["UBCV", "UBCO"]

    const isAllSelected =
    faculties.length > 0 && selectedFaculty.length === faculties.length;

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    /** DB Interaction **/
    var fetchFacultyList = async () => {
        try{
            const query = await API.graphql({ query: getFacultyList });
            const fac =  JSON.parse(query.data.getFacultyList.result);
            console.log("fac: ", fac);
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
        <Container maxWidth={false} disableGutters={false}>
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

                {/* Creates the course subject filter */}
                <Grid item xs={6} sm={3} md={1}>
                            <Typography variant='body' align='right'>
                                Enter Course Subject:
                            </Typography>
                </Grid>
                <Grid item xs={6} sm={3} md={2} container justify="left">
                    <TextField 
                        id="course-subject" 
                        label="Course Subject" 
                        variant="outlined"  
                        style = {{width: 150}}
                        size="small"
                        value={courseSubject}
                        onChange={handleCourseSubjectChange}/>
                </Grid>

                {/* Creates the course number filter */}
                <Grid item xs={6} sm={3} md={1}>
                    <Typography variant='body' align='right'>
                        Enter Course Number:
                    </Typography>
                </Grid>
                <Grid item xs={6} sm={3} md={2} container justify="left">
                    <TextField 
                        id="course-number" 
                        label="Course Number" 
                        type="number"
                        variant="outlined"
                        style = {{width: 150}}
                        size="small" 
                        value={courseNumber}
                        onChange={handleCourseNumberChange}/>
                </Grid>

                {/* Creates the faculty filter */}
                <Grid item xs={6} sm={3} md={1}>
                    <Typography variant='body'>
                        Select Faculty:
                    </Typography>
                </Grid>
                <Grid item xs={6} sm={3} md={2} container justify="left">
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
                                checked={isAllSelected}
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
                <Grid paddingTop={7} container justifyContent="flex-end">
                    {/* Button to show/hide advanced filters */}
                    <Button 
                    variant='outlined'
                    onClick={() => setShowAdvancedFilters(prev => !prev)}>
                        {showAdvancedFilters ? "Hide Advanced Filters" : "Advanced Filters"}
                    </Button>
                </Grid>
                <Grid>
                    {showAdvancedFilters && 
                    <AdvancedFilters
                    flexibilityGuidelineRanges={flexibilityGuidelineRanges}
                    handleFlexibilityGuidelineChange={handleFlexibilityGuidelineChange}
                    flexibilityGuidelines={flexibilityGuidelines}/>}
                </Grid>
            </Grid>
        </Container>
    );
}