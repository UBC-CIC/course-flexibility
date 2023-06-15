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

function createData(
  courseCode,
  courseNumber,
  session,
  campus,
  faculty,
  FG1,
  FG2,
  FG3,
  FG4
) {
  return { courseCode, courseNumber, session, campus, faculty, FG1, FG2, FG3, FG4 };
}

const rows = [
  createData('CPSC', 100, "2020W1", "UBC Vancouver", "Faculty of Science", 1, 1, 1, 0),
  createData('APSC', 160, "2020W2", "UBC Okanagan", "Faculty of Applied Science", 1, 1, 0, 0),
  createData('LLED', 202, "2019W1", "UBC Vancouver", "Faculty of Education", 1, 0, 1, 0),
  createData('LLED', 201, "2018W2", "UBC Okanagan", "Faculty of Education", 0, 1, 1, 0),
  createData('APSC', 168, "2017W1", "UBC Vancouver", "Faculty of Applied Science", 1, 1, 1, 1),
];


class CourseTable1 extends Component {
    state = {  } 
    render() { 
        return (
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 700 }} aria-label="customized table">
                    <TableHead>
                    <TableRow>
                        <StyledTableCell align="center">Course Code</StyledTableCell>
                        <StyledTableCell align="center">Course Number</StyledTableCell>
                        <StyledTableCell align="center">Session</StyledTableCell>
                        <StyledTableCell align="center">Campus</StyledTableCell>
                        <StyledTableCell align="center">Faculty</StyledTableCell>
                        <StyledTableCell align="center">FG1</StyledTableCell>
                        <StyledTableCell align="center">FG2</StyledTableCell>
                        <StyledTableCell align="center">FG3</StyledTableCell>
                        <StyledTableCell align="center">FG4</StyledTableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {rows.map((row) => (
                        <StyledTableRow key={row.name}>
                        <StyledTableCell align="center">{row.courseCode}</StyledTableCell>
                        <StyledTableCell align="center">{row.courseNumber}</StyledTableCell>
                        <StyledTableCell align="center">{row.session}</StyledTableCell>
                        <StyledTableCell align="center">{row.campus}</StyledTableCell>
                        <StyledTableCell align="center">{row.faculty}</StyledTableCell>
                        <StyledTableCell align="center">{row.FG1 ? "Yes" : "No"}</StyledTableCell>
                        <StyledTableCell align="center">{row.FG2 ? "Yes" : "No"}</StyledTableCell>
                        <StyledTableCell align="center">{row.FG3 ? "Yes" : "No"}</StyledTableCell>
                        <StyledTableCell align="center">{row.FG4 ? "Yes" : "No"}</StyledTableCell>
                        </StyledTableRow>
                    ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }
}
 
export default CourseTable1;

