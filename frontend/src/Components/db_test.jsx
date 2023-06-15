// import API from Amplify library
import { API } from "aws-amplify";
import {getTodo} from "../graphql/queries";

import React, { useEffect } from "react";

export default function DB_TEST(){
    // const cog = await Auth.currentAuthenticatedUser();

    // console.log("cog: ", cog); 
    /** DB Interaction **/
    async function fetchGuideline() {
        console.log("Try.... fetchGuideline() is called");
        try{
            console.log("SOMETHING");
            const postData = await API.graphql({ query: getTodo });
            console.log("postData: ", postData);
        } catch (err){
            console.log(err);
        }
    }

    useEffect(() => {
        fetchGuideline();
      }, []);

    return (<div></div>);
}