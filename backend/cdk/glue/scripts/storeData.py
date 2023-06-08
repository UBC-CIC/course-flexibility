# IMPORT PYTHON LIBRARIES
import os
import re
import sys
import json
import logging
from urllib.request import urlopen
import pandas as pd
import numpy as np
from datetime import datetime
import boto3
import psycopg2

# custom modules
from custom_utils.utils import fetchFromS3, putToS3

# Glue module
from awsglue.utils import getResolvedOptions

# ---------------------------------------------------------
# SETTING UP THE WORKING ENVIRONMENT

# Create a session and service clients
session = boto3.Session()
s3_client = session.client('s3')
glue_client = session.client('glue')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Accessing Glue job parameters as environment variables
args = getResolvedOptions(
    sys.argv, ["BUCKET_NAME", "TEMP_BUCKET_NAME", "DB_SECRET_NAME", "METADATA_FILEPATH", "SEMANTIC_FILEPATH", "QA_FILEPATH", "TIMESTAMP"])
BUCKET_NAME = args["BUCKET_NAME"]  # the syllabus files bucket
TEMP_BUCKET_NAME = args["TEMP_BUCKET_NAME"]  # glue temp bucket
DB_SECRET_NAME = args["DB_SECRET_NAME"]
METADATA_FILEPATH = args["METADATA_FILEPATH"]
SEMANTIC_FILEPATH = args["SEMANTIC_FILEPATH"]
QA_FILEPATH = args["QA_FILEPATH"]
TIMESTAMP = args["TIMESTAMP"]

# ---------------------------------------------------------

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

"""
@param bucket: string, bucket name
@param key: string, the s3 key of the file
@return dictionary, the json content as a python dictionary
"""
def download_json_files(bucket, key):
    # Retrieve the JSON file from S3
    response = s3_client.get_object(Bucket=bucket, Key=key)

    # Read the contents of the JSON file
    json_data = response['Body'].read().decode('utf-8')

    # Parse the JSON data
    data = json.loads(json_data)
    return data


"""
@param meta_df: pandas DataFrame,
@param data_s: dictionary
@param data_q: dictionary
"""
def generate_and_insert_analysis_results(meta_df, data_s, data_q):
    
    # if the metadata was extracted from the filetext -> need_revision = True else False
    meta_df["need_revision"] = meta_df["metadata"] == "filetext" 
    meta_df = meta_df.drop(columns="metadata")
    
    # ensure column datatype will match the data type stored in the db
    meta_df["date_uploaded"] = meta_df["date_uploaded"].astype("string")
    meta_df["analyzed"] = meta_df['analyzed'].astype('bool')
    meta_df["need_revision"] = meta_df['need_revision'].astype('bool')

    meta_dict = meta_df.to_dict("records") # convert df to list of dict
    
    # each syllabus metadata entry in the df
    
    for syl in meta_dict:

        # insert the syllabus metadata entry
        syl_sql = """
        INSERT INTO syllabus (course_code, course_number, campus, faculty, date_uploaded, s3_filepath, analyzed, need_revision)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (s3_filepath)
        DO UPDATE SET (course_code, course_number, campus, faculty, date_uploaded, analyzed, need_revision) =
        (EXCLUDED.course_code, EXCLUDED.course_number, EXCLUDED.campus, EXCLUDED.faculty, EXCLUDED.date_uploaded, EXCLUDED.analyzed, EXCLUDED.need_revision);
        """
        row_data = tuple(syl.values()) # python 3.7+ dict will preserve key order, so can convert to tuple
        cursor.execute(syl_sql, row_data)
        connection.commit()
        
        # retrieved the uuid of the entry we just inserted
        uuid_sql = """
        SELECT syllabus_id FROM syllabus WHERE s3_filepath=%s;
        """
        cursor.execute(uuid_sql, (syl.get("s3_filepath"),))
        cur_syl_uuid = cursor.fetchone()[0] # this return a single tuple, the first element of the tup is the uuid

        file_key = syl.get("s3_filepath")
        list_of_result = [] # set of analysis results for this syllabus entry
        for guideline_result in data_s.get(file_key).keys():
            
            # retrieve the uuid of the current guideline
            guideline_sql = """
            SELECT guideline_id FROM flexibility_guideline WHERE guideline=%s;
            """
            cursor.execute(guideline_sql, (guideline_result,))
            res = cursor.fetchone()
            guideline_id = res[0]

            analysis_result = {
                "syllabus_id": cur_syl_uuid,
                "guideline_id": guideline_id,
                # "s3_filepath": file_key,
                # "guideline": guideline_result
            }

            # get the output yes/no of this guideline from the qa json file
            q_output = data_q.get(file_key).get(guideline_result)

            if q_output["yes"] >= q_output["no"]:
                analysis_result["output_result"] = "yes"
                analysis_result["output_confidence_score"] = int(q_output["yes"] * 100)
            else:
                analysis_result["output_result"] = "no"
                analysis_result["output_confidence_score"] = int(q_output["no"] * 100)

            # get the top 3 extracted sentences for this guideline from the semantic json file
            s_output = data_s.get(file_key).get(guideline_result)
            sentences_list = np.array(s_output).flatten().tolist()
            analysis_result["output_extracted_sentences"] = sentences_list

            # append the other placeholders attributes
            analysis_result["manual_validate"] = "n/a"
            analysis_result["manual_validate_date"] = "n/a"

            list_of_result.append(analysis_result)

        # insert those results to the db
        for ana_res in list_of_result:
            insert_res_sql = """
            INSERT INTO analysis_result 
                (syllabus_id, guideline_id, output_result, output_confidence_score, output_extracted_sentences, 
                manual_validate_result, manual_validate_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (syllabus_id, guideline_id)
            DO UPDATE SET (output_result, output_confidence_score, output_extracted_sentences) =
            (EXCLUDED.output_result, EXCLUDED.output_confidence_score, EXCLUDED.output_extracted_sentences);
            """
            res_row_data = tuple(ana_res.values()) # python 3.7+ dict will preserve key order, so can convert to tuple
            cursor.execute(insert_res_sql, res_row_data)
            connection.commit()
            
        update_sql = "UPDATE syllabus SET analyzed=%s WHERE syllabus_id=%s;"
        cursor.execute(update_sql, (True, cur_syl_uuid))
        connection.commit()

def main():
    
    meta_df = pd.read_csv(fetchFromS3(TEMP_BUCKET_NAME, METADATA_FILEPATH))
    data_s = download_json_files(TEMP_BUCKET_NAME, SEMANTIC_FILEPATH)
    data_q = download_json_files(TEMP_BUCKET_NAME, QA_FILEPATH)
    generate_and_insert_analysis_results(meta_df, data_s, data_q)
    cursor.close()
    connection.close()
    
main()