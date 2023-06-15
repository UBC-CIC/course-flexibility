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
        let current_date = new Date()
        let date = current_date.toISOString().split('T')[0]
        let unix_timestamp = current_date.getTime()
        let combined_timestamp = date + '-' + unix_timestamp
        console.log("mutation: Start Job Run");
        const params = {
          //JobName: "preload_database_with_SQL",
          JobName: "test-semantic-similarity",
          Arguments: {
            "--NEW_GUIDELINE": new_guideline,
            "--INVOKE_MODE": "new_guideline",
            "--TIMESTAMP": combined_timestamp
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
        for(let i = 0; i < guideline_id.length; i++){
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
        const offset = event.arguments.offset;
        dbRespond = await sql`SELECT * FROM syllabus 
                              ORDER BY syllabus_id
                              LIMIT 30
                              OFFSET ${offset};`;
        
        var rows = [];
        
        // Loop though each syllabus
        for(let sb_i in dbRespond){
          const sb = dbRespond[sb_i];
          
          // Keep analysis fetching data
          if(sb.analyzed){
            const as = await sql`SELECT * FROM analysis_result WHERE syllabus_id = ${sb.syllabus_id}`;
            
            var analysisResult = [];
            for(let an in as){
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
        
        // rows.push({length: rows.length});
        response.result = JSON.stringify(rows);
        
        
        break;
        
      case "getSyllabusAnalysis":
        const syllabus_id = event.arguments.syllabusID;
        // response.result = syllabus_id;
        // break;
        dbRespond = await sql`SELECT * FROM analysis_result WHERE syllabus_id = ${syllabus_id}`;
        response.result = JSON.stringify(dbRespond);
        
        break;
        
      case "getFacultyResult":
        dbRespond = await sql`SELECT faculty, campus, array_agg(DISTINCT date_uploaded) AS date_uploaded, 
                                COUNT(*) AS course_count
                                FROM syllabus
                                GROUP BY faculty, campus 
                                ORDER BY faculty, campus;
                                `;
        response.result = JSON.stringify(dbRespond);
        
        break; 
      
      case "getCampusResult":
        dbRespond = await sql`SELECT campus, array_agg(DISTINCT faculty) AS faculties, array_agg(DISTINCT date_uploaded) AS date_uploaded,
                                COUNT(*) AS course_count
                                FROM syllabus
                                GROUP BY campus;
                                `;
        response.result = JSON.stringify(dbRespond);
        
        break; 
      
      case "getGuidelineCountCampus":
          let campus = event.arguments.campus;

          let counts = [];
          
          // Get all year
          const year_c = await sql`SELECT DISTINCT date_uploaded FROM syllabus;`;
          
          // Get all guidelines
          let guidelines = await sql`SELECT guideline FROM flexibility_guideline`;
          
          
          
          for(let c in year_c){
            const year_i = year_c[c].date_uploaded;
            
            // Get total number of syllabus
            const syllSize = await sql`SELECT COUNT(*) FROM syllabus as s 
                                        WHERE s.date_uploaded = ${year_i} AND s.campus = ${campus}`;
            let guidelineCount = [];
            
            for(let i in guidelines){
              const gl = guidelines[i].guideline;
              
              // Get guidelines percentage
              const req = await sql`SELECT (
                                        SELECT COUNT(*) FROM analysis_result AS a
                                        INNER JOIN syllabus AS s ON a.syllabus_id = s.syllabus_id
                                        INNER JOIN flexibility_guideline AS g ON a.guideline_id = g.guideline_id
                                        WHERE s.date_uploaded = ${year_i}
                                            AND s.campus = ${campus}
                                            AND a.output_result = 'yes' 
                                            AND g.guideline = ${gl}
                                    ) AS result;`;
              guidelineCount.push({
                guideline: gl,
                count: (Number(req[0].result)/Number(syllSize[0].count))*100,
              });
            }
            
            // Load result based on year
            counts.push({
              year: year_i,
              result: guidelineCount
            });
          }
          
          
          response.result = JSON.stringify(counts);
          
          break;
          
          
                                
      case "getGuidelineCountFaculty":
          const faculty = event.arguments.faculty;
          // const year_f = event.arguments.year;
          
          let counts_f = [];
          
          // Get all year
          const year_f = await sql`SELECT DISTINCT date_uploaded FROM syllabus;`;
          
          // Get all guidelines
          const guidelines_f = await sql`SELECT guideline FROM flexibility_guideline`;
          
          for(let y in year_f){
            const year_i = year_f[y].date_uploaded;
            
            // Get total number of syllabus
            let syllSize_i = await sql`SELECT COUNT(*) FROM syllabus as s 
                                        WHERE s.date_uploaded = ${year_i} AND s.faculty = ${faculty}`;
            let guidelineCount = [];
            for(let i in guidelines_f){
              const gl = guidelines_f[i].guideline;
              
              // Get guidelines percentage
              const req = await sql`SELECT (
                                        SELECT COUNT(*) FROM analysis_result AS a
                                        INNER JOIN syllabus AS s ON a.syllabus_id = s.syllabus_id
                                        INNER JOIN flexibility_guideline AS g ON a.guideline_id = g.guideline_id
                                        WHERE s.date_uploaded = ${year_i}
                                            AND s.faculty = ${faculty}
                                            AND a.output_result = 'yes' 
                                            AND g.guideline = ${gl}
                                    ) AS result;`;
              guidelineCount.push({
                guideline: gl,
                count: (Number(req[0].result)/Number(syllSize_i[0].count))*100,
              });
            }
            
            // Load result based on year
            counts_f.push({
              year: year_i,
              result: guidelineCount
            });
          }
          
          response.result = JSON.stringify(counts_f);
          
          break;
                                
        case "getFacultyList":
          dbRespond = await sql`SELECT faculty
                                  FROM syllabus
                                  GROUP BY faculty
                                  ORDER BY faculty;
                                  `;
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