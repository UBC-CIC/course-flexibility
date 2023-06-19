import React, { Component } from 'react';
import { Typography } from "@material-ui/core";
import { Grid } from '@mui/material';
import Chart from 'react-apexcharts'
import CircularProgress from '@mui/material/CircularProgress';

import { API } from "aws-amplify";
import {getGuidelineCountFaculty} from "../graphql/queries";
const crypto = require('crypto');

class FacultyAnalysisInfo extends Component {

    /** DB Interaction **/
    fetchFacultyGuidelinesCount = async (faculty) => {
        try{
            const query = await API.graphql({ query: getGuidelineCountFaculty, variables: { faculty: faculty} });
            const fac =  JSON.parse(query.data.getGuidelineCountFaculty.result);

            // console.log("face: ", fac);

            let color = [];
            for(var i in fac.arrayGuideline){
              const gl = fac.arrayGuideline[i];
              color.push(this.stringToHexColor(gl));
            }
            
            this.setState({categoriesYear: fac.arrayYear, guideline: fac.arrayGuideline, guideline_data: fac.arrayCount, colors: color});
        } catch (err){
            console.log(err);
        }
    }

    /** Page Render Info **/
    page = {
        heading:{
            campus: "Campus: ",
            faculty: "Faculty: ",
            analysisDate: "Analysis Date: "
        },
        analysis:{
            title: "Analysis Result",
            confScore: "Confident Score:",
            sentenceExtracted: "Sentence Extracted:",
        }
    }
    /** CSS Style **/
    style = {
        box: {
            padding: '3vh', 
            borderRadius: 10, 
            border: '2px solid white', 
            backgroundColor:'white', 
            margin: '0.7vh',
            boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.1)'
        }
    }

    dataParam = this.props.data
    
    state = { 
        categoriesYear:[],
        colors: [],
        guideline: [],
        guideline_data: [],
        loadTable: false
    } 
    // Convert string into hex for coloring
    stringToHexColor = (str) => {
      const hash = crypto.createHash('sha1').update(str).digest('hex');
      return '#' + hash.slice(4, 6) + hash.slice(2, 3) + hash.slice(0, 2) + hash.slice(3, 4);
    }

    /** Invoke during initialation of component **/
    componentDidMount = async() => {
        // console.log("dataParam: ", this.dataParam);
        /** Fetching all the course **/
        await this.fetchFacultyGuidelinesCount(this.dataParam.faculty);

        // console.log("this.state: ", this.state);

        this.setState({loadTable: true});
    }
    render() {
        const chartOptions = {
          colors: this.state.colors,
          xaxis: {
            categories: this.state.categoriesYear, // Add your x-axis labels here
            title: {
              text: "Year",
              offsetY: 5,
              style: {
                fontSize: '14px',
                fontWeight: 500,
              },
            },
          },
          yaxis: {
            title: {
              text: "Yes Percentage (%)",
              offsetX: -5,
              style: {
                fontSize: '14px',
                fontWeight: 500,
              },
            },
          },
          responsive: [
            {
              breakpoint: 0, // Adjust the breakpoint value as needed
              options: {
                chart: {
                  width: '400',
                  height: 'auto',
                },
              },
            },
          ],
          grid: {
            row: {
              colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
              opacity: 0.5
            },
          },
        };
      
        const guidelines = this.state.guideline;
        const data = this.state.guideline_data;

        const seriesData = guidelines.map((guideline, index) => ({
            name: guideline,
            data: data[index], // Replace with your data for each guideline
        }));

        return (
            <div>
            {/* Display analysis result */}
            {!this.state.loadTable && 
            <center>
                <CircularProgress color="success"/>
            </center>
            }
            {this.state.loadTable &&
            <Grid xs={12}>
                <div style={this.style.box}>
                <Typography variant={"h6"}><span style={{fontWeight: 'bold'}}> Percentage of Courses in the {this.dataParam.faculty} With a Result of Yes for Each Guideline Over Time </span></Typography>
                <Chart
                    type="line"
                    width={'100%'}
                    height={500}
                    series={seriesData}
                    options={chartOptions}
                ></Chart>
                </div>
            </Grid>}
            </div>
        );
      }

}

export default FacultyAnalysisInfo;