import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Grid } from '@mui/material';

const MAX_YES = 0.3;
const MIN_NO = 0.7;

function createData(
    courseCode,
    courseNumber,
    session,
    campus,
    faculty,
    FG1,
    FG2,
    FG3,
    FG4,
    analysis
) {
    return { courseCode, courseNumber, session, campus, faculty, FG1, FG2, FG3, FG4, analysis};
}

/**
 * 
 * analysis structure
 * analysis: [
        {header: "Header", dscr: "decsription"},
        {header: "Header", dscr: "decsription"}
    ]
 * 
*/

function FGAnalysis(result){
    var stylingGreen = {
        color: '#4caf50'
    };

    var stylingRed = {
        color: '#ef5350'
    };

    if(result <= MAX_YES){
        return <span style={stylingGreen}> Yes </span>
    } else if (result >= MIN_NO){
        return <span style={stylingRed}> No </span>
    } else {
        return <span> Maybe </span>
    }
}

function Row(props) {
  const { row } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell align="center">{row.courseCode}            </TableCell>
        <TableCell align="center">{row.courseNumber}          </TableCell>
        <TableCell align="center">{row.session}               </TableCell>
        <TableCell align="center">{row.campus}                </TableCell>
        <TableCell align="center">{row.faculty}               </TableCell>
        <TableCell align="center">{FGAnalysis(row.FG1)}  </TableCell>
        <TableCell align="center">{FGAnalysis(row.FG2)}   </TableCell>
        <TableCell align="center">{FGAnalysis(row.FG3)}    </TableCell>
        <TableCell align="center">{FGAnalysis(row.FG4)}    </TableCell>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0}} colSpan={10}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
                <Typography variant="h6" gutterBottom component="div">
                Analysis results:
                </Typography>
                
                {row.analysis.map((item) => (
                    <div>
                        <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1 }}>
                            <Grid item xs={1}/>
                            <Grid item xs={2} sm={2} md={1}>
                                <span>{item.header}: </span>
                            </Grid>
                            <Grid item xs={6}>
                                <span>{item.dsrc}</span>
                            </Grid>
                        </Grid>
                    </div>
                ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

Row.propTypes = {
  row: PropTypes.shape({
           courseCode: PropTypes.string.isRequired,
           courseNumber: PropTypes.number.isRequired,
           session: PropTypes.string.isRequired,
           campus: PropTypes.string.isRequired,
           faculty: PropTypes.string.isRequired,
           FG1: PropTypes.number.isRequired,
           FG2: PropTypes.number.isRequired,
           FG3: PropTypes.number.isRequired,
           FG4: PropTypes.number.isRequired,
           analysis: PropTypes.arrayOf(
            PropTypes.shape({
                header: PropTypes.string.isRequired,
                dscr: PropTypes.string.isRequired
            }),
           ).isRequired,
       }).isRequired,
};

const rows = [
    createData('CPSC', 100, "2020W1", "UBC Vancouver", "Faculty of Science", 1, 1, 0.5, 0, [{header:"FG1", dsrc:"Online available"}, {header:"FG2", dsrc:"Openbook available"}]),
    createData('APSC', 160, "2020W2", "UBC Okanagan", "Faculty of Applied Science", 1, 1, 0, 0, [{header:"FG1", dsrc:"Online available"}, {header:"FG2", dsrc:"Openbook available"}]),
    createData('LLED', 202, "2019W1", "UBC Vancouver", "Faculty of Education", 0.5, 0, 1, 0, [{header:"FG1", dsrc:"Online available"}, {header:"FG2", dsrc:"Openbook available"}]),
    createData('LLED', 201, "2018W2", "UBC Okanagan", "Faculty of Education", 0, 1, 1, 0, [{header:"FG1", dsrc:"Online available"}, {header:"FG2", dsrc:"Openbook available"}]),
    createData('APSC', 168, "2017W1", "UBC Vancouver", "Faculty of Applied Science", 1, 0.5, 1, 1, [{header:"FG1", dsrc:"Online available"}, {header:"FG2", dsrc:"Openbook available"}]),
];
class CourseTable extends Component {
    state = {  } 
    style = {
        backgroundColor: '#91BAD6'
    }

    bold = {
        fontWeight: 1000,
        color: 'black'
    };

    render() {
        return (
            <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
                <TableHead>
                    <TableRow style={this.style}>
                            <TableCell align="center" style={this.bold}>Course Code   </TableCell>
                            <TableCell align="center" style={this.bold}>Course Number </TableCell>
                            <TableCell align="center" style={this.bold}>Session       </TableCell>
                            <TableCell align="center" style={this.bold}>Campus        </TableCell>
                            <TableCell align="center" style={this.bold}>Faculty       </TableCell>
                            <TableCell align="center" style={this.bold}>FG1           </TableCell>
                            <TableCell align="center" style={this.bold}>FG2           </TableCell>
                            <TableCell align="center" style={this.bold}>FG3           </TableCell>
                            <TableCell align="center" style={this.bold}>FG4           </TableCell>
                            <TableCell />
                    </TableRow>
                </TableHead>
                <TableBody>
                {rows.map((row) => (
                    <Row key={row.name} row={row} />
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        );
    }
}
 
export default CourseTable;