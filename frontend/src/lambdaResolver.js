let AWS = require("aws-sdk");
let postgres = require("postgres");

let secretsManager = new AWS.SecretsManager();
let glue_client = new AWS.Glue();

let { SM_DB_CREDENTIALS } = process.env;

exports.handler = async (event, context) => {
  /** Seting up postgres package **/
  let sm = await secretsManager
    .getSecretValue({ SecretId: SM_DB_CREDENTIALS })
    .promise();

  let credentials = JSON.parse(sm.SecretString);

  let connectionConfig = {
    host: credentials.host,
    port: credentials.port,
    username: credentials.username,
    password: credentials.password,
    database: credentials.dbname,
    ssl: true,
  };

  let sql = postgres(connectionConfig);

  console.log("event: ", event);
  
  /* Output Object */
  var response = {
    statusCode: 200,
    result: "",
  };
  
  /** Request Authorization Check with AWS Cognito **/
  /** Operation on AWS RDS **/
  /** AppSync GraphQL Operation **/
  var dbRespond;
  try {
    if (event.info.fieldName) {
      console.log("fieldName: ", event.info.fieldName);
    }

    switch (event.info.fieldName) {
      
      /** Mutation Operation **/
      case "startJobRun":
        let new_guideline = event.arguments.guideline
        let date = new Date()
        date = date.toISOString().split('T')[0]
        console.log("mutation: Start Job Run");
        const params = {
          //JobName: "preload_database_with_SQL",
          JobName: "test-semantic-similarity",
          Arguments: {
            "--NEW_GUIDELINE": new_guideline,
            "--INVOKE_MODE": "new_guideline",
            "--TIMESTAMP": date
          },
        };
        try {
          let res = await glue_client.startJobRun(params).promise();
          response.result = `Successfully started analysis on guideline ${new_guideline}`;
        } catch (err) {
          if (err.statusCode === 400 && err.code === "ConcurrentRunsExceededException") {
            response.statusCode = 400
            response.result = "The data analysis pipeline is busy, please try again later!"
          } else {
            response.statusCode = err.statusCode
            let err_body = JSON.stringify(err)
            response.result = "Unknown Error: " + err_body
          }
        }
        
        break;
        
      case "addGuideline":
        const guideline = event.arguments.guideline;
        const guidelineCode = event.arguments.guidelineCode;
        dbRespond = await sql`INSERT INTO flexibility_guideline (guideline, code) VALUES (${guideline}, ${guidelineCode});`;
        response.result = "Insert successful";
        
        break;
        
      case "removeGuideline":
        const guideline_id = JSON.parse(event.arguments.guidelineID);
        for(var i = 0; i < guideline_id.length; i++){
          await sql`DELETE FROM flexibility_guideline WHERE guideline_id = ${guideline_id[i]};`; 
        }
        
        response.result = "Delete successful";
        
        break;
        
      /** Query Operation **/
      case "getAllGuidelines":
        dbRespond = await sql`SELECT * FROM flexibility_guideline`;
        response.result = JSON.stringify(dbRespond);
        
        break;
        
      case "getAllSyllabusMetadata":
        dbRespond = await sql`SELECT * FROM syllabus`;
        
        var rows = [];
        
        // Loop though each syllabus
        for(var sb_i in dbRespond){
          const sb = dbRespond[sb_i];
          
          // Keep analysis fetching data
          if(sb.analyzed){
            const as = await sql`SELECT * FROM analysis_result WHERE syllabus_id = ${sb.syllabus_id}`;
            
            var analysisResult = [];
            for(var an in as){
                var analysis = {
                    guideline_id: as[an].guideline_id,
                    result_txt: as[an].output_result,
                    confScore: as[an].output_confidence_score,
                }
                analysisResult.push(analysis);
            }
            
            // Load data into array
            var course =     {  id: sb.syllabus_id, 
                                courseCode: sb.course_code, 
                                courseNumber: sb.course_number, 
                                session: sb.date_uploaded, 
                                campus: sb.campus, 
                                faculty: sb.faculty, 
                                syllURL: sb.s3_filepath, 
                                result: analysisResult};
            
            // Push to rows
            rows.push(course);
          }
        }
        
        response.result = JSON.stringify(rows);
        
        
        break;
        
      case "getSyllabusAnalysis":
        const syllabus_id = event.arguments.syllabusID;
        // response.result = syllabus_id;
        // break;
        dbRespond = await sql`SELECT * FROM analysis_result WHERE syllabus_id = ${syllabus_id}`;
        response.result = JSON.stringify(dbRespond);
        
        break;
      case "getTodo":
        dbRespond = await sql`SELECT * FROM flexibility_guideline`;
        response.result = JSON.stringify(dbRespond);
        
        break;
        
      /** Test Operations **/
      case "loadSQL":
        const sql_i = event.arguments.sql; 
        dbRespond = await sql`${sql_i}`;
        response.result = sql_i;
        
        break;
        
      /** Invalid Operation **/
      default:
        response.statusCode = 400;
        response.result = "Error: bad request.";
        console.log("Error: bad request");
    }
    
  } catch (err) {
    response.statusCode = 400;
    response.result="Switch Error: "+ err;
    console.log(err);
  }
  
  // Close connection to DB
  await sql.end({ timeout: 0 });
  console.log(response)
  return response;
};