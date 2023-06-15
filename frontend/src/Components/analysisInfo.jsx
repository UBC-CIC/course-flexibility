import React, { Component } from 'react';
import { Grid } from '@mui/material';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@mui/material/CircularProgress';


import { API } from "aws-amplify";
import {getSyllabusAnalysis, getAllGuidelines} from "../graphql/queries";

class AnalysisInfo extends Component {
    /** DB Interaction **/
    /**
     * 
     * Fetch guideline from remote database 
     */
    fetchGuideline = async () => {
        try{
            const query = await API.graphql({ query: getAllGuidelines });
            const guidelines = JSON.parse(query.data.getAllGuidelines.result);

            /** Load queried data into guidelineCode **/
            if(query.data.getAllGuidelines.statusCode === 200){
                for(var gl in guidelines){
                    this.guidlineCode[guidelines[gl].guideline_id] = {
                        guideline: guidelines[gl].guideline,
                        code: guidelines[gl].code
                    }
                }
            }
        } catch (err){
            console.log(err);
        }
    }

    fetchSyllabusAnalysis = async (id) => {
        try{
            const query = await API.graphql({ query: getSyllabusAnalysis, variables: { syllabusID: id } });
            const ans =  JSON.parse(query.data.getSyllabusAnalysis.result);

            // Load data to local caches
            for(var i in ans){
                const an = ans[i];

                this.analysisFetched[an.guideline_id] = {
                    extractedSen: an.output_extracted_sentences
                };
            }
        } catch (err){
            console.log(err);
        }
    }

    /** Page Render Info **/
    page = {
        result:{
            yes: "Yes,",
            no: "No,",
            maybe: "Maybe"
        },
        heading:{
            academicSession: "Year: ",
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

    /** Data variables **/
    data = this.props.data;
    analysisFetched = {};
    guidlineCode = {};

    /**
     * 
     * @param item confident score from machine learning
     * @returns Typeography to what score interpreted into text
     */
    FGAnalysis = (item) => {
        const MAX_CONF_SOCRE = 60;

        if(item.result_txt === "yes" && item.confScore >= MAX_CONF_SOCRE){
            return <Typography variant={"h6"} style={{ color: '#4caf50' }} display="inline">{this.page.result.yes}</Typography>
        } else if(item.result_txt === "no" && item.confScore >= MAX_CONF_SOCRE){
            return <Typography variant={"h6"} style={{ color: '#ef5350' }} display="inline">{this.page.result.no}</Typography>
        } else{
            return <Typography variant={"h6"} style={{ color: '#ff9800' }} display="inline">{this.page.result.maybe} {item.result_txt}, </Typography>
        }


        // if(item <= MAX_YES){
        //     return <Typography variant={"h6"} style={{ color: '#4caf50' }} display="inline">{this.page.result.yes}</Typography>
        // } else if (item >= MIN_NO){
        //     return <Typography variant={"h6"} style={{ color: '#ef5350' }} display="inline">{this.page.result.no}</Typography>
        // } else {
        //     return <Typography variant={"h6"} style={{ color: '#ff9800' }} display="inline">{this.page.result.maybe}</Typography>
        // }
    }

    /** Invoke during initialation of component **/
    componentDidMount = async() => {
        /** Fetching all the guidelines **/
        await this.fetchGuideline();
        
        /** Fetching all the course **/
        await this.fetchSyllabusAnalysis(this.data.id);

        this.setState({loadDisplay: true});
    }

    state = { 
        loadDisplay: false
     } 
    render() { 
        return (
        <div>
            {!this.state.loadDisplay && 
            <center>
                <CircularProgress color="success"/>
            </center>
            }
            {this.state.loadDisplay && 
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1 }}>
                {/* General info on the course */}
                <Grid xs={12} style={this.style.box}>
                    <Typography variant={"h6"}>{this.page.heading.academicSession} <span style={{fontWeight: 'normal'}}>{this.data.session}</span></Typography>
                    <Typography variant={"h6"}>{this.page.heading.campus} <span style={{fontWeight: 'normal'}}>{this.data.campus}</span></Typography>
                    <Typography variant={"h6"}>{this.page.heading.faculty} <span style={{fontWeight: 'normal'}}>{this.data.faculty}</span></Typography>
                    {/* <Typography variant={"h6"}>{this.page.heading.analysisDate} <span style={{fontWeight: 'normal'}}>{this.data.result[0].dateValid}</span></Typography> */}
                </Grid>

                {/* Display analysis result */}
                <Grid xs={12}>

                    {this.data.result.map((item)=>{
                        return (
                            <div style={this.style.box}>
                                <Typography variant={"h6"}>{this.FGAnalysis(item)} <span style={{fontWeight: 'normal', textTransform: 'lowercase'}}>{this.guidlineCode[item.guideline_id].guideline}</span> ({this.guidlineCode[item.guideline_id].code})</Typography>
                                <ul>
                                    <li><Typography variant={"subtitle1"}><span style={{fontWeight:'bold'}}>{this.page.analysis.confScore} </span> {item.confScore}%</Typography></li>
                                    <li><Typography variant={"subtitle1"}><span style={{fontWeight:'bold'}}>{this.page.analysis.sentenceExtracted}</span></Typography></li>
                                    <ul>
                                        {this.analysisFetched[item.guideline_id].extractedSen.map((sentence)=>{
                                            return(<li><Typography variant={"subtitle1"}>"{sentence}"</Typography></li>);
                                        })}
                                    </ul>
                                </ul>
                            </div>
                        );
                    })}
                </Grid>
            </Grid>}
        </div>);
    }
}
 
export default AnalysisInfo;
