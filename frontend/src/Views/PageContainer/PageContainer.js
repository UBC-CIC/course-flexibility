import React from 'react';
import Grid from '@material-ui/core/Grid';
import { Route, Switch, useHistory, Redirect} from 'react-router-dom';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import HomeIcon from '@material-ui/icons/Home';
import DashboardIcon from '@material-ui/icons/Dashboard';
import { makeStyles } from '@material-ui/core/styles';
import Navbar from "../../Components/Navbar/Navbar";
import { connect } from "react-redux";
import {updateMenuState} from "../../Actions/menuActions";

/** Import Pages **/
import CoursesPage from '../Pages/CoursesPage';
import Dashboard from '../Pages/Dashboard';
import SettingsPage from '../Pages/SettingPage';
import AnalysisResultPage from '../Pages/AnalysisResultPage';
import FacultyResultPage from '../Pages/FacultyResultPage';
import Error404 from '../../Components/error404';
import CampusResultPage from '../Pages/CampusResultPage';

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
    },
    list: {
        width: 250,
    },
    fullList: {
        width: 'auto',
    },
    drawer: {
        width: 240,
        flexShrink: 0,
    },
    drawerContainer: {
        overflow: 'auto',
    },
    drawerPaper: {
        width: 240,
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
    },
}));


function PageContainer(props) {
    const { menuEnabled, updateMenuState } = props;
    const classes = useStyles();
    const history = useHistory();


    /*
    * Handles closing side menu if an event occurs
    * */
    const handleSideMenuClose = () => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        updateMenuState(false);
    }


    {/* Example side menu is provided below */}
    const list = () => (
        <div
            className={classes.drawerContainer}
            onClick={handleSideMenuClose(false)}
            onKeyDown={handleSideMenuClose(false)}
        >
            <List>
                <ListItem button key={"home"} onClick={() => history.push("/home")}>
                    <ListItemIcon><HomeIcon /></ListItemIcon>
                    <ListItemText primary={"Home"} />
                </ListItem>
                <ListItem button key={"controlPanel"} onClick={() => history.push("/controlPanel")}>
                    <ListItemIcon><DashboardIcon /></ListItemIcon>
                    <ListItemText primary={"Control Panel"} />
                </ListItem>
            </List>
            <Divider />
            <List>
                {['Inactive', 'Inactive', 'Inactive'].map((text, index) => (
                    <ListItem button key={text}>
                        <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
                        <ListItemText primary={text} />
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return(<Grid container direction="column">
        {/* Navbar component, set side menu button parameter -->
        button updates redux state to show/hide left sidebar */}
        <Navbar showSideMenuButton={true} />
        {/* <Header /> */}
        
        <main className={classes.content}>
            <Switch>
                <Redirect exact from="/" to="/dashboard" />
                <Route exact path={"/dashboard"} component={Dashboard}/>
                <Route exact path={"/courses"} component={CoursesPage}/>
                <Route exact path={'/settings'} component={SettingsPage} />
                <Redirect exact from="/login" to="/dashboard" />
                <Route exact path={'/result'} component={AnalysisResultPage} />
                <Route exact path={'/faculty'} component={FacultyResultPage} />
                <Route exact path={'/campus'} component={CampusResultPage} />
                <Route exact path="*" component={Error404} />
            </Switch>

        </main>
    </Grid>)
}

const mapStateToProps = (state) => {
    return {
        menuEnabled: state.appState.showSideBar,
    };
};

const mapDispatchToProps = {
    updateMenuState,
};

export default connect(mapStateToProps, mapDispatchToProps)(PageContainer);