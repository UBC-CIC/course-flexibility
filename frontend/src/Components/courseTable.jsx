import React, { Component } from 'react';

// Material UI
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import { TableFooter, TablePagination, Chip, Popover, Typography, Snackbar, Alert, Button} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';


import { API } from "aws-amplify";
import {getSyllabusAnalysis, getAllSyllabusMetadata, getAllGuidelines} from "../graphql/queries";

const MAX_CONF_SCORE = 60;

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#024959',
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    // maxWidth: 400,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));




class CourseTable extends Component {
    /** Class Data Variables **/
    guidlineCode = {}; // Associate array where id is the index.
    rows = [];  // All table rows

    /* true if confScores of guidelines within range of slider filters, false if not within range */
    FGFilters = Array(this.rows.length).fill(true);


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

    fetchCourseInfo = async (offset) => {
        try{
            this.setState({loadTable: false});
            const query = await API.graphql({ query: getAllSyllabusMetadata, variables: { offset: offset } });
            const syllabi =  JSON.parse(query.data.getAllSyllabusMetadata.result);
            // console.log("syllabi: ", syllabi[0]);
            console.log("query: ", query);

            this.rows.push(...syllabi);
            
            if(syllabi.length === 0){
                this.setState({loadTable: true, moreEntries: false});
            } else {
                this.setState({loadTable: true, moreEntries: true});
            }
        } catch (err){
            console.log(err);
        }
    }

    /** CSS Styling **/
    margineSpace = {
        margin: 0.25,
        borderRadius: 1.5,
    }
    
    /** Handler and Status Function **/
    handlerAnalysisMoreInfo = (param, event) =>{
        // console.log("param: ",  param, "event: ", event)
        const indexFound = this.rows.findIndex(e => e.id === param);

        console.log("Output: ", this.rows[indexFound]);

        window.open(
            '/result?row='+ JSON.stringify(this.rows[indexFound]),
            '_blank'
          );
    }

    handleClickSnackBar = (item, event) => {
        const label = item.result_txt + ", " + "at " + item.confScore + "%, " +  "(" + this.guidlineCode[item.guideline_id].code + ") " + this.guidlineCode[item.guideline_id].guideline.toLowerCase();
        this.setState({snackbarOn: true, snackbarMsg: label })

    };

    handleClickSnackBarClose = (event, reason) => {
        if(reason === 'timeout')
            this.setState({snackbarOn: false})
    };

    loadMoreEntry = () => {
        this.fetchCourseInfo(this.rows.length);
    }

    FGAnalysis = (glList) => {

        return (
            <div>
                {
                    glList.map((itm, index)=>{
                            // if(item.confScore >= this.props.MAX_YES){
                            //     return <Chip label={item.guidline + ": Yes"} color="success" onClick={this.handleClickSnackBar} sx={this.margineSpace} variant="outlined"/>;
                            // } else if (item.confScore <= this.props.MIN_NO){
                            //     return <Chip label={item.guidline + ": No"} color="error" onClick={this.handleClickSnackBar} sx={this.margineSpace} variant="outlined"/>;
                            // } else {
                            //     return <Chip label={item.guidline + ": Maybe"} color="warning" onClick={this.handleClickSnackBar} sx={this.margineSpace} variant="outlined"/>;
                            // }

                            const item = {
                                result_txt: itm.result_txt,
                                guideline_id: itm.guideline_id,
                                confScore: itm.confScore
                            }

                            if(item.result_txt === "yes" && item.confScore >= MAX_CONF_SCORE){
                                item.result_txt = "Yes";
                                return <Chip key={item.guideline_id} label={this.guidlineCode[item.guideline_id].code + ": Yes(" + item.confScore + "%)"} color="success" onClick={this.handleClickSnackBar.bind(this,item)} sx={this.margineSpace} variant="outlined"/>;
                            } else if (item.result_txt === "no" && item.confScore >= MAX_CONF_SCORE){
                                item.result_txt = "No";
                                return <Chip key={item.guideline_id} label={this.guidlineCode[item.guideline_id].code + ": No (" + item.confScore + "%)"} color="error" onClick={this.handleClickSnackBar.bind(this,item)} sx={this.margineSpace} variant="outlined"/>;
                            } else {
                                item.result_txt = "Maybe " + item.result_txt;
                                return <Chip key={item.guideline_id} label={this.guidlineCode[item.guideline_id].code + ": "+ item.result_txt + " (" + item.confScore + "%)"} color="warning" onClick={this.handleClickSnackBar.bind(this,item)} sx={this.margineSpace} variant="outlined"/>;
                            }
                    })
                }
            </div>
        );
    }

    FGFiltering = (result, rowIndex) => {
        this.FGFilters[rowIndex] = true;
        return(
            <>
                {
                    result.map((item, index) =>{
                        if(this.props.flexibilityGuidelineRanges[index] === "Yes"){
                                this.FGFilters[rowIndex] = false;
                        }
                        else if(this.props.flexibilityGuidelineRanges[index] === "No"){
                                this.FGFilters[rowIndex] = false;
                        }
                        else if(this.props.flexibilityGuidelineRanges[index] === "Maybe"){
                                this.FGFilters[rowIndex] = false;
                        }
                    })                 
                }
            </>
        )
    }

    state = { 
        snackbarOn: false,
        snackbarMsg: null,
        moreEntries: true,
        loadTable: false
    }

    /** Invoke during initialation of component **/
    componentDidMount = async() => {
        /** Fetching all the guidelines **/
        await this.fetchGuideline();
        
        /** Fetching all the course **/
        await this.fetchCourseInfo(0);

        console.log("this.rows: ", this.rows);

        this.setState({loadTable: true});
    }

    render() { 
        return (
            <div>
            {!this.state.loadTable && 
            <center>
                <CircularProgress color="success"/>
            </center>
            }
            {this.state.loadTable && 
            <div>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 700 }} aria-label="customized table">
                    <TableHead>
                    <TableRow>
                        <StyledTableCell align="center">Course Code</StyledTableCell>
                        <StyledTableCell align="center">Course Number</StyledTableCell>
                        <StyledTableCell align="center">Year</StyledTableCell>
                        <StyledTableCell align="center">Campus</StyledTableCell>
                        <StyledTableCell align="center">Faculty</StyledTableCell>
                        <StyledTableCell align="center">Analysis Result</StyledTableCell>
                        <StyledTableCell align="center" />
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {/* Filters the table this.rows based on search filter inputs */}
                    {this.rows
                    .filter(row => row.courseNumber.toString().includes(this.props.courseNumber))
                    .filter(row => row.campus.toString().includes(this.props.campus))
                    .filter(row => row.courseCode.toString().includes(this.props.courseSubject.toUpperCase()))
                    .filter(row => this.props.selectedFaculty.includes(row.faculty) || 
                            row.faculty.includes(this.props.selectedFaculty))
                    .filter((row, index) => {
                        this.FGFiltering(row.result, index);
                        return this.FGFilters[index] === true;
                    })
                    .map((row) => (
                        <StyledTableRow key={row.name}>
                        <StyledTableCell align="center">{row.courseCode}</StyledTableCell>
                        <StyledTableCell align="center">{row.courseNumber}</StyledTableCell>
                        <StyledTableCell align="center">{row.session}</StyledTableCell>
                        <StyledTableCell align="center">{row.campus}</StyledTableCell>
                        <StyledTableCell align="center">{row.faculty}</StyledTableCell>
                        <StyledTableCell align="left">{this.FGAnalysis(row.result)}</StyledTableCell>
                        <StyledTableCell>
                            <IconButton
                                aria-label="expand row"
                                size="small"
                                onClick={this.handlerAnalysisMoreInfo.bind(null, row.id)}
                                >
                                <ArrowForwardIosRoundedIcon />
                            </IconButton>
                        </StyledTableCell>
                        </StyledTableRow>
                    ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {
                // Load more data button
                this.state.moreEntries &&
                <center>
                    <Button style={{margin: 15}} variant="outlined" color="primary" onClick={this.loadMoreEntry}> Load More </Button>
                </center>
            }
            </div>}

            <Snackbar open={this.state.snackbarOn} autoHideDuration={6000} onClose={this.handleClickSnackBarClose} anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}>
            <Alert onClose={this.handleClickSnackBarClose} severity="info" sx={{ width: '100%' }}>
                {this.state.snackbarMsg}
            </Alert>
            </Snackbar>
            </div>
            
        );
    }
}
 
export default CourseTable;

