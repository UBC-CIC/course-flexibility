import os
import json
import boto3
import psycopg2

BUCKET_NAME = os.environ["BUCKET_NAME"]
DB_SECRET_NAME = os.environ["DB_SECRET_NAME"]

def getDbSecret():
    # secretsmanager client to get db credentials
    sm_client = boto3.client("secretsmanager")
    response = sm_client.get_secret_value(
        SecretId=DB_SECRET_NAME)["SecretString"]
    secret = json.loads(response)
    return secret

dbSecret = getDbSecret()

connection = psycopg2.connect(
    user=dbSecret["username"],
    password=dbSecret["password"],
    host=dbSecret["host"],
    dbname=dbSecret["dbname"]
)

cursor = connection.cursor()

s3 = boto3.client("s3")

def lambda_handler(event, context):

    # CREATE POSTGRESQL TABLE AND PRE-POPULATE THE GUIDELINES

    sql = """
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE IF NOT EXISTS "flexibility_guideline" (
          "guideline_id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          "guideline" varchar,
          "code" varchar,
          UNIQUE(guideline)
        );
        
        CREATE TABLE IF NOT EXISTS "syllabus" (
          "syllabus_id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          "course_code" varchar,
          "course_number" varchar,
          "campus" varchar,
          "faculty" varchar,
          "date_uploaded" varchar,
          "s3_filepath" varchar,
          "analyzed" boolean,
          "need_revision" boolean,
          UNIQUE(s3_filepath)
        );
        
        CREATE TABLE IF NOT EXISTS "analysis_result" (
          "result_id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          "syllabus_id" uuid,
          "guideline_id" uuid,
          "output_result" varchar,
          "output_confidence_score" int,
          "output_extracted_sentences" varchar[],
          "manual_validate_result" varchar,
          "manual_validate_date" varchar,
          UNIQUE(syllabus_id, guideline_id)
        );
        
        CREATE TABLE IF NOT EXISTS "table_update_log" (
          "table_name" varchar PRIMARY KEY,
          "update_date" varchar
        );
        
         CREATE TABLE IF NOT EXISTS "flagged_file" (
            "issue_id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
            "s3_filepath" varchar,
            "date" varchar,
            "issue" varchar
        );
        
        ALTER TABLE analysis_result DROP CONSTRAINT IF EXISTS analysis_result_guideline_id_fkey;
        ALTER TABLE analysis_result
        ADD CONSTRAINT analysis_result_guideline_id_fkey
            FOREIGN KEY (guideline_id) REFERENCES flexibility_guideline (guideline_id)
            ON DELETE CASCADE;
        
        ALTER TABLE analysis_result DROP CONSTRAINT IF EXISTS analysis_result_syllabus_id_fkey;
        ALTER TABLE analysis_result
        ADD CONSTRAINT analysis_result_syllabus_id_fkey
            FOREIGN KEY (syllabus_id) REFERENCES syllabus (syllabus_id)
            ON DELETE CASCADE;
    """

    cursor.execute(sql)
    connection.commit()
    
    guidelines = [
        {'guideline': 'Online recordings of lectures can be accessed.', 'code': 'REC'},
        {'guideline': 'Questions can be posted anonymously.', 'code': 'QUES'},
        {'guideline': 'Late assignments or deliverables are accepted.','code': 'LATE'},
        {'guideline': 'Make-up midterms are offered.', 'code': 'MAKEUP'},
        {'guideline': 'The lowest assessment grades will not count towards your total grade.','code': 'LOWEST'},
        {'guideline': 'Your top M out of N scores will count towards your final grade.','code': 'TOP'},
        {'guideline': 'There are multiple attempts for assignments.', 'code': 'MULT'}
    ]

    for guideline in guidelines:
        gl_sql = """
            INSERT INTO flexibility_guideline (guideline, code) VALUES (%s, %s)
            ON CONFLICT (guideline) DO NOTHING;
        """
        cursor.execute(gl_sql, (guideline["guideline"], guideline["code"]))

    connection.commit()

    cursor.close()
    connection.close()

    # CREATE A FOLDER STRUCTURE FOR THE AMPLIFY S3 STORAGE with a public/ top level folder

    s3.put_object(Bucket=BUCKET_NAME, Key="UBCV/")
    s3.put_object(Bucket=BUCKET_NAME, Key="UBCO/")
    
    print("Trigger Function scripts finished execution successfully!")