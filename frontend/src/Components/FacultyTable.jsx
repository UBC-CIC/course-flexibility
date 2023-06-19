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
import { TableFooter, TablePagination, Chip, Popover, Typography, Snackbar, Alert} from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';

import { API } from "aws-amplify";
import {getFacultyResult} from "../graphql/queries";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#024959',
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
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

class FacultyTable extends Component {
    /** Class Data Variables **/
    rows = [];  // All table rows

    /* true if confScores of guidelines within range of slider filters, false if not within range */
    FGFilters = Array(this.rows.length).fill(true);

    /** DB Interaction **/
    fetchFacultyInfo = async () => {
        try{
            const query = await API.graphql({ query: getFacultyResult });
            const fac =  JSON.parse(query.data.getFacultyResult.result);
            // console.log("syllabi: ", syllabi[0]);
            
            for(var i in fac){
                fac[i].id = i;
            }
            // console.log("query: ", fac);
            
            this.rows = fac;
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
        const indexFound = this.rows.findIndex(e => e.id === Number(param));

        // console.log("Output: ", this.rows[Number(param)]);

        window.open(
            '/faculty?row='+ JSON.stringify(this.rows[Number(param)]),
            '_blank'
          );
    }

    FGAnalysis = (result) => {
        const handleClickNo = (event) => {
            // console.log(event.target.outerText)
        };

        const handleClickMaybe = (event) => {
            // console.log(event.target.outerText)
        };

        return (
            <div>
                {
                    result.map((item, index)=>{
                            if(item.confScore >= this.props.MAX_YES){
                                return <Chip label={item.guidline + ": " + item.confScore*100 + "%"} color="success" onClick={this.handleClickSnackBar} sx={this.margineSpace} variant="outlined"/>;
                            } else if (item.confScore <= this.props.MIN_NO){
                                return <Chip label={item.guidline + ": " + item.confScore*100 + "%"} color="error" onClick={this.handleClickSnackBar} sx={this.margineSpace} variant="outlined"/>;
                            } else {
                                return <Chip label={item.guidline + ": " + item.confScore*100 + "%"} color="warning" onClick={this.handleClickSnackBar} sx={this.margineSpace} variant="outlined"/>;
                            }
                    })
                }
            </div>
        );
    }

    state = { 
        snackbarOn: false,
        loadTable: false,
        snackbarMsg: null
    } 

    /** Invoke during initialation of component **/
    componentDidMount = async() => {
        /** Fetching all the course **/
        await this.fetchFacultyInfo();

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
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 700 }} aria-label="customized table">
                    <TableHead>
                    <TableRow>
                        <StyledTableCell align="center">Faculty</StyledTableCell>
                        <StyledTableCell align="center">Year</StyledTableCell>
                        <StyledTableCell align="center">Campus</StyledTableCell>
                        <StyledTableCell align="center">Number of Courses (Analyzed)</StyledTableCell>
                        <StyledTableCell align="center" />
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {/* Filters the table this.rows based on search filter inputs */}
                    {this.rows
                    .filter(row => this.props.selectedFaculty.includes(row.faculty) 
                    /* Makes table display every row when nothing is selected */
                    || row.faculty.includes(this.props.selectedFaculty)) 
                    .map((row) => (
                        <StyledTableRow key={row.id}>
                            <StyledTableCell align="center">{row.faculty}</StyledTableCell>
                            <StyledTableCell align="center">
                                <span>
                                    {row.date_uploaded.map((d) => (
                                        d + " "
                                    ))}
                                </span>
                            </StyledTableCell>
                            <StyledTableCell align="center">{row.campus}</StyledTableCell>
                            <StyledTableCell align="center">{row.course_count}</StyledTableCell>
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
            </TableContainer>}
            </div>
            
        );
    }
}
 
export default FacultyTable;

