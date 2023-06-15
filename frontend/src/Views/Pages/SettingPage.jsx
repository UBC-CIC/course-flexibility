import React, { Component } from 'react';
import Selector from '../../Components/selector'
import { Grid } from '@mui/material';
import Typography from '@material-ui/core/Typography';



class SettingsPage extends Component {
    pageInfo = {
        title: "Flexibility Guidelines Settings",
        description: "Personalized your guidelines and start the analysis.",
    }
    state = { 
        userGroup: "student"
     } 
    render() { 
        const style= {
            /** CSS Styling **/
            divBody: {
                marginTop:0,
                marginBottom: 0,
            },

            paper: {
                paddingTop: 5,
                paddingBottom: 7,
                borderRadius: 1.5,
            },

            gridFlex: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: 5
            }
        }
        return (
        <div>
            <Grid container sx={style.divBody} rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1 }}>
                <Grid xs={0} sm={1} md={1} lg={2}/>
                <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1 }} xs={12} sm={10} md={10} lg={8} sx={style.paper}>
                    <Grid xs={1} sm={1} md={1} lg={1}/>
                    <Grid xs = {10} sm={10} md={10} lg={10} sx={style.gridFlex}>
                        <Typography variant={"h4"} noWrap>{this.pageInfo.title}</Typography>
                        <Typography variant={"subtitle1"} noWrap>{this.pageInfo.description}</Typography>
                    </Grid>
                    <Grid xs={1} sm={1} md={1}lg={1}/>

                    {
                        (this.state.userGroup === "student") && (
                            <React.Fragment>
                                <Grid xs={1} sm={1} md={1} lg={3}/>
                                <Grid xs = {10} sm={10} md={10} lg={6} sx={style.gridFlex}>
                                    <Selector />
                                </Grid>
                                <Grid xs={1} sm={1} md={1} lg={3}/>
                            </React.Fragment>
                        )
                    }

                </Grid>
                <Grid xs={0} sm={1} md={1} lg={2}/>
            </Grid>
        </div>
        
        );
    }
}
 
export default SettingsPage;