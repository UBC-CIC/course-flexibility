import React, { Component } from 'react';
import { FormGroup, FormControlLabel, Grid, Checkbox, Box, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Snackbar, Alert} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Close from '@mui/icons-material/Close';
import { TextField, Toolbar, Typography } from '@material-ui/core';
import CircularProgress from '@mui/material/CircularProgress';


// import API from Amplify library
import { API } from "aws-amplify";
import {getAllGuidelines} from "../graphql/queries";
import {addGuideline, removeGuideline, startJobRun} from "../graphql/mutations";

class Selector extends Component {
    /** DB Interaction **/
    /**
     * 
     * Fetch guideline from remote database and update the this.state to re-render DOM 
     */
    fetchGuideline = async () => {
        try{
            const query = await API.graphql({ query: getAllGuidelines });
            console.log("data 2: ", query);
            const guidelines =  JSON.parse(query.data.getAllGuidelines.result);

            /** Load queried data into page **/
            if(query.data.getAllGuidelines.statusCode === 200){
                var selected_update = [];
                for(var gl in guidelines){
                    selected_update.push({key: guidelines[gl].guideline_id, txt: guidelines[gl].guideline, code: guidelines[gl].code});
                    
                }

                this.setState({options: { selected: selected_update }});
            }
        } catch (err){
            console.log(err);
            throw new Error("There are some problems with getting guidelines.");
        }
    }

    uploadGuideline = async (guideline, code) => {
        try{
            const mutation = await API.graphql({
                query: addGuideline, variables: { guideline: guideline, guidelineCode: code}
            });

            console.log("mutation: ", mutation);
        } catch(err){
            console.log(err);
            throw new Error("There are some problems with uploading guidelines.");
        }
    }

    deleteGuidelines = async (guidelines) => {
        try{
            const mutation = await API.graphql({
                query: removeGuideline, variables: { guidelineID: JSON.stringify(guidelines) }
            });

            console.log("mutation (delete): ", mutation);
        } catch(err){
            console.log(err);
            throw new Error("There are some problems with deleting guidelines.");
        }
    }

    triggerGlue = async(guideline) => {
        try{
            const mutation = await API.graphql({
                query: startJobRun, variables: { guideline: guideline }
            });

            // const guidelines =  JSON.parse(mutation.data.startJobRun.result);

            if(mutation.data.startJobRun.statusCode === 200){
                return undefined;
            } else {
                return mutation.data.startJobRun.result;
            }
        } catch(err){
            console.log(err);
            throw new Error("There are some problems with triggering AWS Glue.");
        }
    }

    /** Invoke during initialation of component **/
    componentDidMount = async() =>{
        try{
            /** Fetching new guidelines **/
            await this.fetchGuideline();
            this.setState({loadPage: true});
        } catch(err){
            this.setState({loadPage: false, snackbarMsg: err + "Try refresh the page.", snackbarOn: true});
        }
    }

    /** Page Render Info **/
    page = {
        header: "Current Guidelines",
        deleteSelectedListButton: "Delete Selected",
        noSelection: {
            title: "Oops!",
            body1: "Nothing has selected",
            body2: "Please click the plus (+) button below to select options."
        },
        deleteConfirmation:{
            title: "Are you sure you wand to DELETE the selected Options?",
            actionResult: "This action will DELETE the guideline, its question and all analysis results for each syllabi on this guideline. Click START ANALYSIS to run the analysis base on the current changes.",
            headerList: "Guideline to be deleted:",
            cancle: "Cancel",
            delete: "Delete"

        },
        startAnalysisConfirmation:{
            title: "Are you sure you wand to ADD a guideline and START the analysis?",
            actionResult: "Adding new guideline will trigger the analysis of all syllabus. This action will take time to complete, please be patience.",
            headerList: "Guideline to ADD and START analysis:",
            cancle: "Cancel",
            description: "Guideline Description: ",
            code: "Guideline Shortcut: ",
            start: "ADD & START"
        },
        moreOption:{
            title: "Add more guideline"
        },
        addMoreFlexibility: {
            popUpHeader:"Add Flexibility Guidelines",
            popupTitle: "Add New Guideline",
            popupDscr: "to search through the course syllabus.",
            guideLineTitle:"Description",
            submitbtn: "Add Guideline",
            guideLineTitleCode: "Shortcut"
        }
    }

    /** CSS Styling **/
    checkBox = {
        marginTop:0.5,
        marginBottom:0.5,
        borderRadius: 1.5,
        padding: 1,
        border: '2px solid #4c8beb'
    }
    
    addMoreButtom = {
        padding: 1.5,
        marginTop:0.5,
        marginBottom:0.5,
    }

    moreOptionBox = {
        paddingTop: 5,
        paddingBottom: 5,
        // backgroundColor: '#ff9800'
    }
    
    uploadIcon = {
        fontSize: 70,
        color: '#4c8beb',
        borderRadius: '50%',
        padding: 2,
        backgroundColor: '#F7F8FB'
    }

    /** State variable - handle all change in the class **/
    state = {
        deleteBtnOn : false,
        addMoreOptionBtnOn: true,
        loadMoreOptionOn: false,
        loadAnalysisConfirmationOn: false,
        loadDeleteConfirmationOn: false,
        currentSelectOptions:[],
        guidelineInputText: undefined,      // Use to control data input in text box
        guidelineInputCode: undefined,      // Use to represent code of guideline
        newGuideline: undefined,            // Use to hold new guideline description
        loadPage: false,
        snackbarOn: false,
        snackbarMsg: undefined,
        options: {
            selected: [
            ]
        }
    }

    render() {
        /**
         * 
         * Add more guidelines handler.
         */
        const addMoreGuidelineSubmitHandler = async () =>{
            
            var inputGuideline = document.getElementById("userGuideline").value;
            inputGuideline = inputGuideline.trim();

            var inputGuidelineCode = document.getElementById("userGuidelineCode").value;
            inputGuidelineCode = inputGuidelineCode.trim();

            if(!inputGuideline || !inputGuidelineCode){
                this.setState({snackbarMsg: "Invalid guideline is found.", snackbarOn: true});
                return ;
            }

            for(var i in this.state.options.selected)
                if(this.state.options.selected[i].txt === inputGuideline || this.state.options.selected[i].code === inputGuidelineCode ){
                    this.setState({snackbarMsg: "Invalid guideline or guideline shortcut already exist.", snackbarOn: true});
                    return ;
                }
                    

            // Store guideline
            this.state.newGuideline = inputGuideline;
            this.state.guidelineInputCode = inputGuidelineCode.toUpperCase();


            this.setState({loadAnalysisConfirmationOn: true});
        }

        /**
         * 
         * Handle delete guidelines from selected options
         */
        const optionDeleteConfirmationHandler =()=>{
            this.setState({loadDeleteConfirmationOn: true});
            
        }
        const deleteConfirmationAgreeHandler = async ()=>{

            /** Process Data **/
            // Remove intersected data between this.state.currentSelectOptions and this.state.options.selected
            // Remove guidelines in remoteDB
            var mgs = "";
            try{
                await this.deleteGuidelines(this.state.currentSelectOptions);
    
                this.setState({currentSelectOptions:[]});
                
                // Fetch guidelines from remote DB
                await this.fetchGuideline();
    
                mgs = "Deleted guidelines successfully!";
            } catch(err){
                mgs = err;
            }
            
            this.setState({loadDeleteConfirmationOn: false, deleteBtnOn: false, snackbarMsg: mgs, snackbarOn: true});
            
        }
        const deleteConfirmationDisagreeHandler = ()=>{
            this.setState({loadDeleteConfirmationOn: false});
            
        }

        
        /**
         * 
         * Handler of confirmaiton to start analysis
         * End point of component to push data to next block
         */
        const analysisConfirmationAgreeHandler = async ()=>{
            if(this.state.newGuideline !== undefined){
                var val = undefined;
                try{
                    // Invoke AWS Glue to run analysis and check for confirmation
                    val = await this.triggerGlue(this.state.newGuideline);

                    if(val === undefined){
                        // Load new guideline to remote database
                        await this.uploadGuideline(this.state.newGuideline, this.state.guidelineInputCode);
                        
                        // Fetch all the avialable guidelies and update DOM
                        await this.fetchGuideline();
    
                        val = "Add guideline successful!";
                    } else {
                        console.log("Error: ", val);
                    }
                } catch(err){
                    val = err;
                    console.log("analysisConfirmationAgreeHandler: ", err);
                }
                
                // Activate loading effect
                this.setState({ loadAnalysisConfirmationOn: false, 
                                deleteBtnOn: false, 
                                currentSelectOptions:[], 
                                guidelineInputText: undefined, 
                                guidelineInputCode: undefined, 
                                newGuideline: undefined,
                                snackbarMsg: val,
                                snackbarOn: true
                            });
            }

        }
        const analysisConfirmationDisagreeHandler = ()=>{
            this.setState({loadAnalysisConfirmationOn: false, newGuideline: undefined});
        }


        const exitMoreOptionBtnHandler = () =>{
            this.setState({loadMoreOptionOn: false, addMoreOptionBtnOn: true, deleteBtnOn: ((this.state.currentSelectOptions.length !== 0))});
        }
        const addMoreOptionBtnHandler = () =>{
            this.setState({loadMoreOptionOn: true, addMoreOptionBtnOn: false});
        }

        /**
         * 
         * @param {*} event changes on the list of selected guidelines
         * push changes of list to an array and update button status
         */
        const handleChangeSelectOptions = (event) =>{
            if(event.target.checked){
                this.state.currentSelectOptions.push(event.target.value);
            } else{
                this.state.currentSelectOptions.pop(event.target.value);
            }
            
            // Call delete button visibility funtion
            this.setState({deleteBtnOn: ((this.state.currentSelectOptions.length !== 0) && !this.state.loadMoreOptionOn)});
        }
        /**
         * 
         * @returns either delete button or add more button based on the selection of checkbox
         */
        const deleteBtnVis = () =>{
            if(this.state.deleteBtnOn)
                return (<Button fullWidth variant="outlined" sx={this.addMoreButtom} color="error" onClick={optionDeleteConfirmationHandler}> {this.page.deleteSelectedListButton} </Button>);
            else
                return (<Button fullWidth variant="outlined" sx={this.addMoreButtom} startIcon={<AddIcon />} disabled={!this.state.addMoreOptionBtnOn} onClick={addMoreOptionBtnHandler} color="success"></Button>);
        }

        /** Snackbar Handlers **/
        // handleClickSnackBar = (item, event) => {
        //     const label = item.result_txt + ", " + "at " + item.confScore + "%, " +  "(" + this.guidlineCode[item.guideline_id].code + ") " + this.guidlineCode[item.guideline_id].guideline.toLowerCase();
        //     this.setState({snackbarOn: true, snackbarMsg: label })
    
        // };
    
        const handleClickSnackBarClose = (event, reason) => {
            this.setState({snackbarOn: false})
        };

        /**
         * 
         * @returns list of options (guidelines) to add to analysis list
         */
        const loadMoreOptionBlock = ()=>{
            if(this.state.loadMoreOptionOn)
                return (
                    <Box sx={this.moreOptionBox}>
                        <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1 }}>
                            {/* Header: add more title and exit button */}
                            <Grid xs={11} style={{display: 'flex', alignItems: 'center'}}>
                                <Typography variant={"subtitle1"} >{this.page.moreOption.title}</Typography>
                            </Grid>
                            <Grid xs={1}>
                                <center>
                                    <IconButton aria-label="delete" size="large" onClick={exitMoreOptionBtnHandler}> <Close /> </IconButton>
                                </center>
                            </Grid>

                            {/* List of all available add more options */}
                            <Grid xs={12}>
                                <div>
                                    <div style={{paddingBottom:15}}>
                                        <Typography sx={{ ml: 2, flex: 1 }} variant="h5" component="div">{this.page.addMoreFlexibility.popupTitle}</Typography>
                                        <Typography sx={{ ml: 2, flex: 1 }} variant="subtitle1" component="div">{this.page.addMoreFlexibility.popupDscr}</Typography>
                                    </div>
                                    <form>
                                        <TextField fullWidth multiline maxRows={6} id="userGuideline" label={this.page.addMoreFlexibility.guideLineTitle} value={this.state.guidelineInputText} variant="outlined"/>
                                        <TextField fullWidth multiline maxRows={1} id="userGuidelineCode" label={this.page.addMoreFlexibility.guideLineTitleCode} value={this.state.guidelineInputText} style={{marginTop: 15, marginBottom: 15}} variant="outlined"/>
                                        <Button fullWidth variant="outlined" sx={this.addMoreButtom} color="warning" onClick={addMoreGuidelineSubmitHandler}> {this.page.addMoreFlexibility.submitbtn} </Button>
                                    </form>
                                </div>
                            </Grid>
                        </Grid>
                    </Box>
                );
        }

        return (
            <div>
                {!this.state.loadPage && 
                <center>
                    <CircularProgress color="success"/>
                </center>}

                {this.state.loadPage &&
                <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1 }}>
                    <Grid xs={12}>
                        {
                            // Header indicate list of selected guidelines
                            (this.state.options.selected.length != 0) && <Typography variant={"h6"} noWrap>{this.page.header}</Typography>
                        }
                    </Grid>

                    <Grid xs={12}>
                        <FormGroup>
                            {
                                // List of selected options
                                (this.state.options.selected.length != 0) ? (
                                    
                                    this.state.options.selected.map((item) =>(
                                        <Box sx={this.checkBox}>
                                            <FormControlLabel control={<Checkbox onChange={handleChangeSelectOptions}/>}  label={"(" + item.code + ") " + item.txt} value={item.key} key={item.key}/>
                                        </Box>
                                    ))
                                    
                                ):
                                // Message for when nothing has selected
                                <center style={{padding: '6vh'}}>
                                    <Typography variant={"h5"} noWrap>{this.page.noSelection.title}</Typography>
                                    <Typography variant={"h4"} noWrap>{this.page.noSelection.body1}</Typography>
                                    <Typography variant={"subtitle1"} noWrap>{this.page.noSelection.body2}</Typography>
                                </center>
                            }
                        </FormGroup>
                        { 
                            // Delete button, only show when there are some selected options
                            deleteBtnVis() 
                        }
                    </Grid>
                </Grid>
                }

                {/* Confirmaiton pop-up before removing guidelines */}
                <Dialog
                    fullWidth
                    maxWidth = 'md'
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                    open={this.state.loadDeleteConfirmationOn}
                >
                    <DialogTitle id="alert-dialog-title">
                    {this.page.deleteConfirmation.title}
                    </DialogTitle>
                    <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        <span>{this.page.deleteConfirmation.actionResult}</span>

                        <h2>{this.page.deleteConfirmation.headerList}</h2>
                        <ul>
                            {this.state.currentSelectOptions.map((item) =>{
                                const elementFound = this.state.options.selected.find(e => e.key === item);
                                return (<li>{elementFound.txt}</li>);
                            }
                            )}
                        </ul>
                    </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={deleteConfirmationDisagreeHandler} >{this.page.deleteConfirmation.cancle}</Button>
                        <Button onClick={deleteConfirmationAgreeHandler} autoFocus color = "error"> {this.page.deleteConfirmation.delete} </Button>
                    </DialogActions>
                </Dialog>

                {/* Confirmaiton pop-up before starting analysis */}
                <Dialog
                    fullWidth
                    maxWidth = 'md'
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                    open={this.state.loadAnalysisConfirmationOn}
                >
                    <DialogTitle id="alert-dialog-title">
                    {this.page.startAnalysisConfirmation.title}
                    </DialogTitle>
                    <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        <Typography variant={"subtitle1"}>{this.page.startAnalysisConfirmation.actionResult}</Typography>
                        
                        <Typography variant={"h6"} noWrap style={{marginTop: 20}}>{this.page.startAnalysisConfirmation.headerList}</Typography>
                        <Typography variant={"subtitle1"} noWrap>{this.page.startAnalysisConfirmation.description}  {this.state.newGuideline}</Typography>
                        <Typography variant={"subtitle1"} noWrap>{this.page.startAnalysisConfirmation.code}  {this.state.guidelineInputCode}</Typography>
                        
                    </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={analysisConfirmationDisagreeHandler}>{this.page.startAnalysisConfirmation.cancle}</Button>
                        <Button onClick={analysisConfirmationAgreeHandler} autoFocus color = "success"> {this.page.startAnalysisConfirmation.start} </Button>
                    </DialogActions>
                </Dialog>
                {
                    // More guidelines to add, only show when user click + 
                    this.state.loadPage && loadMoreOptionBlock()
                }
            
            <Snackbar open={this.state.snackbarOn} autoHideDuration={6000} onClose={handleClickSnackBarClose} anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}>
            <Alert onClose={handleClickSnackBarClose} severity="info" sx={{ width: '100%' }}>
                {this.state.snackbarMsg}
            </Alert>
            </Snackbar>
            </div>
        );
    }
}
 
export default Selector;

