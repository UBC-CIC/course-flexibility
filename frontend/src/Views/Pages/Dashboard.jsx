import React, { useState } from 'react';
import { Grid, ToggleButton, ToggleButtonGroup } from "@mui/material";
import FacultyTable from '../../Components/FacultyTable';
import DashboardSearchFilters from '../../Components/DashboardSearchFilters';
import CampusSearchFilters from '../../Components/CampusSearchFilters';
import CampusTable from '../../Components/CampusTable';

export default function Dashboard(){
    const MAX_YES = 0.7;
    const MIN_NO = 0.3;

    const faculties = ['Faculty of Science', 'Faculty of Arts', "Faculty of Medicine",
    'Faculty of Education', 'Faculty of Applied Science'];
    const years = ["2022W", "2021W", "2020W", "2019W"];

    const [campus, setCampus] = useState("");
    const [toggleValue, setToggleValue] = useState("faculty");
    const [selectedFaculty, setSelectedFaculty] = useState([]);
    const [selectedYear, setSelectedYear] = useState([]);

    /* Changes toggle value */
    const handleToggleChange = (event, newToggleValue) => {
        if (newToggleValue !== null) {
            setToggleValue(newToggleValue);
        }
    };

    {/* Changes campus value to the selected drop down choice */}
    const handleCampusChange = (event) => {
        setCampus(event.target.value);
    };

    {/* Changes faculty value to the selected drop down choices */}
    const handleFacultyChange = (event) => {
        const value = event.target.value;
        if (value[value.length - 1] === "all") {
            setSelectedFaculty(selectedFaculty.length === faculties.length ? [] : faculties);
            return;
        }
        setSelectedFaculty(value);
        };

    {/* Changes year value to the selected drop down choices */}
    const handleYearChange = (event) => {
        const value = event.target.value;
        if (value[value.length - 1] === "all") {
            setSelectedYear(selectedYear.length === years.length ? [] : years);
            return;
        }
        setSelectedYear(value);
        };

    return(
        <div>
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1 }}>
                <Grid xs={0} sm={2}/>
                <Grid xs={12} sm={8}>
                <ToggleButtonGroup
                    color="primary"
                    value={toggleValue}
                    exclusive
                    onChange={handleToggleChange}
                    aria-label="Platform"
                    >
                    <ToggleButton value="faculty">Faculty</ToggleButton>
                    <ToggleButton value="campus">Campus</ToggleButton>
                </ToggleButtonGroup>
                {(() => {
                    if (toggleValue === "campus") {
                    return (
                        <div>
                            <CampusSearchFilters 
                            campus = {campus} 
                            handleCampusChange={handleCampusChange}
                            selectedYear = {selectedYear}
                            handleYearChange={handleYearChange}/>
                            <CampusTable 
                            MAX_YES={MAX_YES}
                            MIN_NO={MIN_NO}
                            campus={campus} 
                            selectedFaculty = {selectedFaculty}
                            selectedYear = {selectedYear}/>
                        </div>
                    )
                    } else if (toggleValue === "faculty") {
                    return (
                        <div>
                            <DashboardSearchFilters 
                            selectedFaculty = {selectedFaculty}
                            handleFacultyChange={handleFacultyChange}
                            selectedYear = {selectedYear}
                            handleYearChange={handleYearChange}/>
                            <FacultyTable 
                            MAX_YES={MAX_YES}
                            MIN_NO={MIN_NO}
                            selectedFaculty = {selectedFaculty}
                            handleFacultyChange={handleFacultyChange}
                            selectedYear = {selectedYear}
                            handleYearChange={handleYearChange}/>
                        </div>
                    )
                    } 
                })()}
                </Grid>
            </Grid>
        </div>
    );
}