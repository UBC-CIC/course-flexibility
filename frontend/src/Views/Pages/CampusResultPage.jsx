import React, { Component } from 'react';
import { Grid } from '@mui/material';
import AnalysisInfo from '../../Components/analysisInfo'
import Typography from '@material-ui/core/Typography';
import Error404 from '../../Components/error404';

// Import the styles
import CampusAnalysisInfo from '../../Components/CampusAnalysisInfo';

class CampusResultPage extends Component {
    /** Page Render Info **/
    page = {
        title: "Analysis Result",
        description: "More details of faculty and the analysis",
        pdf: "Syllabus",
    }

    state = {  } 
    render() {
        const style= {
            /** CSS Styling **/
            gridFlex: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 5,
                paddingBottom: 5
            },

            divBody: {
                marginTop:0,
                marginBottom: 0,
            },
        
            paper: {
                // backgroundColor: 'white',
                paddingTop: 5,
                paddingBottom: 7,
                // boxShadow: 5,
                borderRadius: 1.5,
            },

            box: {
                padding: '3vh', 
                borderRadius: 10, 
                border: '2px solid white', 
                backgroundColor:'white', 
                margin: '0 0.7vh 0 0.7vh',
                boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.1)'
            }
        }

        // Retrieve parameters from URL
        var paramURL= null
        var row = null;
        var url = null;
        try{
            paramURL = new URLSearchParams(window.location.search);
            row = JSON.parse(paramURL.get('row'));
            url = process.env.PUBLIC_URL + row.syllURL;

            console.log("Valid page");
        } catch (e){
            // When catch error, print error page
            console.log("errror!!", e);
            return <Error404 />
        }
        return (
            <div>
                {(row != null) ? (
                    <Grid container sx={style.divBody} rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1 }}>
                        <Grid xs={1} sm={1} md={1} lg={2}/>
                        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1 }} xs={10} sm={10} md={10} lg={8} sx={style.paper}>
                            <Grid xs={1} sm={1} md={1} lg={1}/>
                            <Grid xs = {10} sm={10} md={10} lg={10} sx={style.gridFlex}>
                                <Typography variant={"h4"}><span style={{fontWeight: 'bold'}}> {row.campus} {this.page.title}</span></Typography>
                                <Typography variant={"subtitle1"} noWrap>{this.page.description}</Typography>
                            </Grid>
                            <Grid xs={1} sm={1} md={1}lg={1}/>

                            {/* View Analysis Data */}
                            <Grid xs = {12} sm={12} md={12} lg={12}>
                                <CampusAnalysisInfo data={row}/>
                            </Grid>

                            <Grid xs = {12} sm={12} md={6} lg={6}>
                                <div style={style.box}>
                                    <Typography variant={"h6"} style={{paddingBottom: 10}}><span style={{fontWeight: 'bold'}}> Campus Info </span></Typography>
                                    <div style={{paddingLeft: 15}}>
                                        <Typography variant={"body1"}>
                                            <span style={{fontWeight: 'bold'}}> Campus: </span>
                                            {row.campus}
                                        </Typography>

                                        <Typography variant={"body1"}>
                                            <span style={{fontWeight: 'bold'}}> Number of Courses: </span>
                                            {row.course_count}
                                        </Typography>

                                        <Typography variant={"body1"}>
                                            <span style={{fontWeight: 'bold'}}> Year Collected: </span>
                                            <ul>
                                                {row.date_uploaded.map((d)=>(
                                                    <li><Typography variant={"body1"}> {d} </Typography></li>
                                                ))}
                                            </ul>
                                        </Typography>
                                    </div>
                                    
                                </div>
                            </Grid>

                            <Grid xs = {12} sm={12} md={6} lg={6}>
                                <div style={style.box}>
                                    <Typography variant={"h6"} style={{paddingBottom: 10}}><span style={{fontWeight: 'bold'}}> Faculty List </span></Typography>
                                    <div style={{paddingLeft: 15}}>
                                        <ul>
                                            {row.faculties.map((fac) => (
                                                <li><Typography variant={"body1"}> {fac} </Typography></li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </Grid>

                        </Grid>
                        <Grid xs={1} sm={1} md={1} lg={2}/>
                    </Grid>
                )
                :
                (
                    <Error404 />
                )}
            </div>
            
            );
        
    }
}
 
export default CampusResultPage;