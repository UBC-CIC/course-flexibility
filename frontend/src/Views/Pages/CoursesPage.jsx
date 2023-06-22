import React from 'react';
import { useState, useEffect } from 'react';
import { Grid } from '@mui/material';
import CourseTable from '../../Components/courseTable';
import SearchFilters from '../../Components/SearchFilters';

import { API } from "aws-amplify";
import {getFacultyList, getAllGuidelines} from "../../graphql/queries";

function CoursePage(){

    const faculties = [];

    /* Array of flexibility guidelines */
    // const flexibilityGuidelines = ['FG1: Online recordings of lectures can be accessed', 
    //                                 'FG2: Questions can be posted anonymously', 
    //                                 'FG3: Late assignments or deliverables are not accepted',
    //                                  'FG4: Make-up midterms are offered', 
    //                                  'FG5: The lowest assessment grades will not count towards your total grade', 
    //                                  'FG6: Your top M out of N scores will count towards your final grade',
    //                                 'FG7: There are multiple attempts for assignments'];

    const [courseNumber, setCourseNumber] = useState("");
    const [campus, setCampus] = useState("");
    const [courseSubject, setCourseSubject] = useState("");
    const [selectedFaculty, setSelectedFaculty] = useState([]);
    const [flexibilityGuidelines, setFlexibilityGuidelines] = useState([]);
    const [flexibilityGuidelineRanges, setFlexibilityGuidelineRanges] = useState([]);
    // var [faculties, setFaculties] = useState([]);

    /** DB Interaction **/
    // var fetchFacultyList = async () => {
    //     try{
    //         const query = await API.graphql({ query: getFacultyList });
    //         const fac =  JSON.parse(query.data.getFacultyList.result);
    //         console.log("fac: ", fac);
    //         const faculties_i = [];
            
    //         for(var i in fac){
    //             faculties_i.push(fac[i].faculty);
    //         }

    //         setFaculties(faculties_i);
    //     } catch (err){
    //         console.log(err);
    //     }
    // }

    /**
     * 
     * Fetch guideline from remote database and update the this.state to re-render DOM 
     */
    var fetchGuideline = async () => {
        try{
            const query = await API.graphql({ query: getAllGuidelines });
            // console.log("data 2: ", query);
            const guidelines =  JSON.parse(query.data.getAllGuidelines.result);

            /** Load queried data into page **/
            if(query.data.getAllGuidelines.statusCode === 200){
                var selected_update = [];
                var setRange = [];
                for(var gl in guidelines){
                    selected_update.push(guidelines[gl].guideline);
                    setRange.push("All");
                    
                }

                setFlexibilityGuidelines(selected_update);
                setFlexibilityGuidelineRanges(setRange);
            }
        } catch (err){
            console.log(err);
            throw new Error("There are some problems with getting guidelines.");
        }
    }

    useEffect(() => {
        fetchGuideline();
    }, []);

    /* Changes courseNumber value to the entered text value */
    const handleCourseNumberChange = (event) => {
        setCourseNumber(event.target.value);
    };

    /* Changes campus value to the selected drop down choice */
    const handleCampusChange = (event) => {
        setCampus(event.target.value);
    };

    /* Changes courseSubject value to the entered text value */
    const handleCourseSubjectChange = (event) => {
        setCourseSubject(event.target.value);
    };

    /* Changes faculty value to the selected drop down choices */
    const handleFacultyChange = (event) => {
        const value = event.target.value;
        if (value[value.length - 1] === "all") {
            setSelectedFaculty(selectedFaculty.length === faculties.length ? [] : faculties);
            return;
        }
        setSelectedFaculty(value);
        };

    /* Changes selected drop down options based on user input*/
    const handleFlexibilityGuidelineChange = (event, index) => {
        setFlexibilityGuidelineRanges((prevState) => ({
            ...prevState,
            [index]: event.target.value,
          }));
        };

    return (
        <div>
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1 }}>
                <Grid xs={0} sm={2}/>
                <Grid xs={12} sm={8}>
                <SearchFilters 
                /* States and event handlers are passed down to be used in the SearchFilter child component */
                courseNumber = {courseNumber} 
                handleCourseNumberChange={handleCourseNumberChange}
                campus = {campus} 
                handleCampusChange={handleCampusChange}
                courseSubject = {courseSubject} 
                handleCourseSubjectChange={handleCourseSubjectChange}
                selectedFaculty = {selectedFaculty}
                handleFacultyChange={handleFacultyChange}
                flexibilityGuidelineRanges={flexibilityGuidelineRanges}
                handleFlexibilityGuidelineChange={handleFlexibilityGuidelineChange}
                flexibilityGuidelines={flexibilityGuidelines}/>
                <CourseTable 
                /* States are passed down to be used in the CourseTable child component */
                courseNumber={courseNumber} 
                campus={campus} 
                courseSubject={courseSubject} 
                selectedFaculty={selectedFaculty}
                flexibilityGuidelineRanges={flexibilityGuidelineRanges}
                flexibilityGuidelines={flexibilityGuidelines}/>
                </Grid>
            </Grid>
        </div>);
}
 
export default CoursePage;