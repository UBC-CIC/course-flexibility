import React, { useState, useEffect } from "react";
import { makeStyles } from "@mui/styles";
import { connect } from "react-redux";
import { updateMenuState } from "../../actions/menuActions";
import { Grid } from "@mui/material";
import NavigationBar from "../../components/NavigationBar";
import { Routes, Route } from "react-router-dom";
import { Auth } from "aws-amplify";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  list: {
    width: 250,
  },
  fullList: {
    width: "auto",
  },
  drawer: {
    width: 240,
    flexShrink: 0,
  },
  drawerContainer: {
    overflow: "auto",
  },
  drawerPaper: {
    width: 240,
  },
  content: {
    flexGrow: 1,
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(3),
    },
  },
}));

function PageContainer(props) {
  const classes = useStyles();
  const [adminUser, setAdminUser] = useState(false);

  useEffect(() => {
    //gets the groups that the currently authenticated cognito user belongs to and sets AdminUser state to true if the user is in the Admins group, false otherwise
    const getCognitoUser = async () => {
      const cognitoUserEntry = await Auth.currentAuthenticatedUser();
      const cognitoUserGroups =
        cognitoUserEntry.signInUserSession.idToken.payload["cognito:groups"];
      if(cognitoUserGroups){
        setAdminUser(cognitoUserGroups.includes("Admins"));
      }
      else {
        setAdminUser(false);
      }
    };
    getCognitoUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Grid container direction="column">
      <NavigationBar adminUser={adminUser} />

      {/* <main className={classes.content}>
        <Routes>
          <Route
            path="/Researchers/:researcherId/"
            element={<ResearcherProfile />}
          />
          <Route path="/Metrics/" element={<Metrics />} />
          {adminUser && (
            <Route path="/AdminDashboard/" element={<AdminDashboard />} />
          )}
          <Route path="/Impact/" element={<Impacts />} />
          <Route
            path="/AdvancedSearch/:SearchForWhat/:AllWords/:ExactPhrase/:AnyWords/:NoneOfTheseWords/:Department/:Faculty/:yearFrom/:yearTo/:Journal"
            element={<AdvancedSearchComponent />}
          />
          <Route
            path="/Search/Researchers/:anyDepartmentFilter/:anyFacultyFilter/:searchValue/"
            element={<SearchComponent whatToSearch={"Researchers"} />}
          />
          <Route
            path="/Search/Publications/:journalFilter/:searchValue/"
            element={<SearchComponent whatToSearch={"Publications"} />}
          />
          <Route
            path="/Search/Grants/:grantFilter/:searchValue/"
            element={<SearchComponent whatToSearch={"Grants"} />}
          />
          <Route
            path="/Search/Patents/:patentClassifications/:searchValue/"
            element={<SearchComponent whatToSearch={"Patents"} />}
          />
          <Route
            path="/:anyDepartmentFilter/:anyFacultyFilter/:journalFilter/:grantFilter/:patentClassifications/:searchValue/"
            element={<SearchComponent whatToSearch={"Everything"} />}
          />
          <Route
            path="/"
            element={<SearchComponent whatToSearch={"Everything"} />}
          />
        </Routes>
      </main> */}
    </Grid>
  );
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
