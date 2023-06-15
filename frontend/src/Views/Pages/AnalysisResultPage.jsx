import React, { Component } from 'react';
import { Grid } from '@mui/material';
import AnalysisInfo from '../../Components/analysisInfo'
import Typography from '@material-ui/core/Typography';
import Error404 from '../../Components/error404';

// Import the styles
import PDFLoad from '../../Components/pdfViewer'

class AnalysisResultPage extends Component {
    /** Page Render Info **/
    page = {
        title: "Analysis Result",
        description: "More detail of course and the analysis",
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
        } catch (e){
            // When catch error, print error page
            console.log("errror!!", e);
            return <Error404 />
        }
        return (
            <div>
                {(row != null && row.courseCode) ? (
                    <Grid container sx={style.divBody} rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1 }}>
                        <Grid xs={1} sm={1} md={1} lg={2}/>
                        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1 }} xs={10} sm={10} md={10} lg={8} sx={style.paper}>
                            <Grid xs={1} sm={1} md={1} lg={1}/>
                            <Grid xs = {10} sm={10} md={10} lg={10} sx={style.gridFlex}>
                                <Typography variant={"h4"}><span style={{fontWeight: 'bold'}}> {row.courseCode + row.courseNumber} {this.page.title}</span></Typography>
                                <Typography variant={"subtitle1"} noWrap>{this.page.description}</Typography>
                            </Grid>
                            <Grid xs={1} sm={1} md={1}lg={1}/>

                            {/* View Analysis Data */}
                            <Grid xs = {12} sm={12} md={5} lg={5}>
                                <AnalysisInfo data={row}/>
                            </Grid>

                            {/* View PDF of syllabus */}
                            <Grid xs = {12} sm={12} md={7} lg={7}>
                                <div style={style.box}>
                                    <Typography variant={"h6"} style={{padding: "0 0 1vh 0"}}><span style={{fontWeight: 'bold'}}> {row.courseCode + row.courseNumber} {this.page.pdf}</span></Typography>
                                    <PDFLoad url={url}/>
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
 
export default AnalysisResultPage;