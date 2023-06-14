import sys
import time
from awsglue.utils import getResolvedOptions
from custom_utils.utils import fetchFromS3, putToS3
import io
import urllib
import boto3
from botocore.exceptions import ClientError
# import sagemaker
import json
import pandas as pd
import re
import os
import logging
from collections import Counter
import datetime

import nltk
from nltk.tokenize import sent_tokenize
from PyPDF2 import PdfReader
import docx
from bs4 import BeautifulSoup


args = getResolvedOptions(
    sys.argv, ["BUCKET_NAME", "QUEUE_NAME", "TEMP_BUCKET_NAME", "DLQ_QUEUE_NAME", "DB_SECRET_NAME"])
BUCKET_NAME = args["BUCKET_NAME"]  # the syllabus files bucket
TEMP_BUCKET_NAME = args["TEMP_BUCKET_NAME"]  # glue temp bucket
QUEUE_NAME = args["QUEUE_NAME"]
DLQ_QUEUE_NAME = args["DLQ_QUEUE_NAME"]
DB_SECRET_NAME = args["DB_SECRET_NAME"]

MAX_QUEUE_MESSAGES = 10
current_date = datetime.date.today().strftime("%Y-%m-%d")  # 2023-05-30

"""
This code create a temporary directory to download the artifacts for the nltk punkt tokenizer
then add the newly created directory path to the list of directories in nltk.data.path.
without this step the punkt tokenizer cannot be downloaded on AWS Glue Job
"""

dir_name = "nltk_data"
os.mkdir(dir_name)
nltk_custom_path = os.path.join(os.getcwd(), dir_name)
nltk.data.path.append(nltk_custom_path)
nltk.download("punkt", download_dir=nltk_custom_path)

# Some custom Exceptions

# for events that are junk and not actual S3 upload events


class JunkEventException(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

# Invalid file Extension (currently supported are .pdf, .docx and .html)


class InvalidFileExtensionException(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

# Syllabus metadata is not determinable programmatically


class NotDeterminableException(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)


# valid file extension currently supported
valid_extensions = [".pdf", ".docx"]

# import course_campus_faculty_mapping.csv file into a pandas DataFrame
courseMapping = pd.read_csv(fetchFromS3(
    TEMP_BUCKET_NAME, "artifacts/course_campus_faculty_mapping.csv"))

"""
@params text: string, the corpus text string
@return: List of Strings

This function takes in a corpus string and tokenize it into sentences
"My name is Ben. I am a Software Developer" -> ["My name is Ben", "I am a Software Developer"]
"""


def preprocess_extracted_text(text):
    # Tokenize the text into sentences
    sentences_with_backslash_n = sent_tokenize(text)
    # Remove newline characters from each sentence
    sentences = [s.replace('\n', '') for s in sentences_with_backslash_n]
    return sentences


"""
@params path: bytesIO or string (path)
@return: string

This function converts pdf to text
"""


def load_text_from_pdf(path):
    # Read the PDF document
    document = PdfReader(path)
    number_of_pages = len(document.pages)
    filtered_sentences = []
    # Extract text from each page and preprocess it
    for page_idx in range(number_of_pages):
        page = document.pages[page_idx]
        page_text = page.extract_text()
        filtered_sentences += preprocess_extracted_text(page_text)
    return filtered_sentences


"""
@params path: bytesIO or string (path)
@return: string

This function converts docx to text
"""


def load_text_from_docx(path):
    # Read the DOCX document
    document = docx.Document(path)
    # Extract text from paragraphs and join them with double newlines
    doc_text = '\n\n'.join(paragraph.text for paragraph in document.paragraphs)
    filtered_sentences = preprocess_extracted_text(doc_text)
    return filtered_sentences


"""
@params path: bytesIO or string (path)
@return: string

This function converts html to text
"""


# def load_text_from_html(path):
#     # Load the HTML content
#     url = r"file:///" + path
#     html = urlopen(url).read()
#     soup = BeautifulSoup(html, features="html.parser")
#     # Remove script and style elements from the HTML
#     for script in soup(["script", "style"]):
#         script.extract()
#     # Get the plain text from the HTML
#     text = soup.get_text()
#     # Split text into lines and remove leading/trailing spaces
#     lines = (line.strip() for line in text.splitlines())
#     # Split lines into chunks and remove extra spaces
#     chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
#     # Join the chunks with newlines
#     html_text = '\n'.join(chunk for chunk in chunks if chunk)
#     filtered_sentences = preprocess_extracted_text(html_text)
#     return filtered_sentences


"""
@params text: String, the text corpus to search for the pattern
@params courseMapppingSubset: List of Dictionaries, the filtered list of course mapping based on campus
@return: Dictionary

This function will take those 2 params and output a dictionary then perform regex matching to extract all
course-code and course-num pattern in the corpus. Then it considered the 2 scenarios:
+ If the regex matching results have a distinct code-num pair that has the highest occurrence, it will output that code-num pair.
  which is the one that is most likely to be the actual course code and number of the corpus
    e.g CPSC 110 (5 occurrences), CPSC 121 (2 occurences) -> CSPC 110 as the final result
    
+ If the distinct code-num pairs have a similar occurrence frequency, then it output the code num pair that appears the earliest
  into the text base on the token's position. The position means that how far into the text string it was found. You could have the token
  CPSC 110 appears at multiple position in the text, but we consider the earliest position.
    e.g "This course CPSC 110 is great. CSPC 110 is awesome" -> the token CPSC 110 appears at position 12 and 31 -> thus the earliest that
    this unique token CPSC 110 appears is position 12 in the text string.
  Again, there could be many other unique tokens that were matched and they may appears multiple times in the text, 
  so the algorithm records the other's earliest position as well. The matching results might look like
    e.g CPSC 110 (2 occurences, earliest pos is at character 12), CPSC 121 (2 occurences, earliest pos is at character 28) ->
    both tokens has the same number of occurrences in the text -> CPSC 110 is the output since it first appears the earliest in the text
    
The rationale behind these 2 educated guess:
+ If a distinct token appears more in the text then the rest of the other distinct tokens, then it is most likely to be the
code-num pair of the syllabus
+ If the distinct tokens has the same number of occurrences, then we must make an informed decision based on how early each distinct
token were found in the text. This is due to the fact that for a syllabus file, the actual course's code-name is likely to be mentioned 
at early into the text e.g. at the top (the title/header, first introduction paragraph, etc).

"""


def scan_file_text(text, courseMappingSubset):

    # this list will eventually contain the extracted code-num pair e.g [("CPSC", "110"), ("CPSC", "121")]
    arr = []
    # this dictionary store the earlist occurence of each distinct code-num pair tuple
    # with the tuple as key and earliest position (integer) as value
    # e.g {("CSPC", "110"): 15, ("CPSC", "121"): 28}
    mapping_earliest_occurrence = {}
    for course in courseMappingSubset:
        code = course["Subject Code"]
        #regex = code + '.?1\d{2}'
        # regex = code + '.?\d{3}'
        regex = code + '.{0,2}\d{3}'
        # instead of finding the first pattern matched, it looks for all pattern within the file text
        # thus it might returns more than one distinct code-num for the same corpus. Using finditer
        # here let us have access to the list of regex matchObject instead of just a list of matched
        # tokens (strings)
        # matchObject example: <re.Match object; span=(7, 14), match='CSPC 110'>
        reg_finditer = re.finditer(regex, text, re.IGNORECASE)
        # turn the callable_iterable to a list
        reg_finditer_list = list(reg_finditer)
        if len(reg_finditer_list) > 0:  # if at least 1 matched in found
            for match_obj in reg_finditer_list:  # iterate thru the list of matchObject
                # extract the course code and number from the extracted match e.g ("CPSC", "110")
                # uppercase the code
                crs_code = re.search(
                    '[a-zA-Z]+', match_obj.group()).group().upper()
                crs_num = re.search('\d{3}',  match_obj.group()).group()
                start_pos = match_obj.start()  # the position of the match in the text
                match_tuple = (crs_code, crs_num)
                # if the unique token does not has its position stored in the dict,
                # store the tuple as key and its earliest position as value
                if match_tuple not in mapping_earliest_occurrence:
                    mapping_earliest_occurrence[match_tuple] = start_pos
                # if the unique token already has its position stored in the list,
                # then check if this new position is smaller than the currently stored position, if so,
                # store the new earliest position
                else:
                    # e.g {("CSPC", "110"): 55}, but then we encounter a CPSC 110 token at position 17 as well
                    # thus the earliest position of the unique CPSC 110 token is actually 17
                    # and the dict entry must be updated {("CSPC", "110"): 17}
                    if start_pos < mapping_earliest_occurrence[match_tuple]:
                        mapping_earliest_occurrence[match_tuple] = start_pos
                # append the result as a tuple to the list of extracted code-num pair
                arr.append(match_tuple)

    # return the number of occurrence for each unique code-num pair
    most_common = Counter(arr).most_common()
    if most_common:
        # if there are more than 1 distinct code-num pair AND they have same frequency of occur
        if len(most_common) > 1 and all(occ[1] == most_common[0][1] for occ in most_common):
            # retried the distinct code-num pair with the earliest starting position from the dictionary
            match_with_smallest_start_pos = min(
                mapping_earliest_occurrence, key=mapping_earliest_occurrence.get)
            return {
                "code": match_with_smallest_start_pos[0],  # CPSC
                "num": match_with_smallest_start_pos[1],  # 110
                "occurrence": "using start pos",
            }
        return {
            "code": most_common[0][0][0],  # CSPC
            "num": most_common[0][0][1],  # 110
            "occurrence": most_common[0][1],  # 12
        }
    return {}


"""
@params filePath: string, the path (key) to the file on S3
@params courseMappingSubset
@return Dictionary

This function will first convert the file into text based on its extension e.g .pdf, .docs, .html
then call the function scan_file_text() on that corpus.
It returns whatever output scan_file_text() returns
"""


def extract_course_info_from_text(filePath, courseMappingSubset):

    # download file as byte stream from S3
    s3 = boto3.resource('s3')
    obj = s3.Object(BUCKET_NAME, filePath)
    file = io.BytesIO(obj.get()['Body'].read())

    corpus = ""
    if ".pdf" in filePath:
        corpus = " ".join(load_text_from_pdf(file))  # file
    elif ".docx" in filePath:
        corpus = " ".join(load_text_from_docx(file))  # file
    # elif ".html" in filePath:
    #     corpus = " ".join(load_text_from_html(file))  # file
    # ensure that the corpus don't have consecutive spaces e.g "     "
    corpus = re.sub(r' +', ' ', corpus)
    result = scan_file_text(corpus, courseMappingSubset)
    return result


"""
@params fileName
@params courseMappingSubset
@return Dictionary

This function will search for a course's code-num pair within the files's name 
(e.g CSPC_110 from CPSC_110_Intro.pdf). Return examples:

    {"filename": "CSPC_110_Intro.pdf", "match": CPSC_110, "code": "CSPC", "num", "110"} if a match is found, else
    {"filename": "random_syllabus.pdf", "match": "n/a","code": "n/a", "num": "n/a"} if no match is found
"""


def scan_for_course_code_and_num(fileName, courseMappingSubset):
    result = {"filename": fileName, "match": "n/a",
              "code": "n/a", "num": "n/a"}
    for course in courseMappingSubset:
        code = course["Subject Code"]
        #regex = code + '.?1\d{2}'
        regex = code + '.?\d{3}'
        reg_search = re.search(regex, fileName, re.IGNORECASE)
        if reg_search:
            matched = reg_search.group()
            crs_code = re.search('[a-zA-Z]+', matched).group()
            crs_num = re.search('\d{3}', matched).group()

            result["match"] = matched
            result["code"] = crs_code.upper()
            result["num"] = crs_num
            return result

    return result


"""
@param s3event: Dictionary, the JSON s3 event

This function process the S3 event to process the uploaded syllabi files. It will extract/enrich metadata
for each file. It first attemp to extract the course code and number (e.g. CPSC 110) from the file name
(e.g CPSC_110_intro_to_software.pdf). If the code-num pair is not extractable from the file name alone. It
will attempt to scan the file text to search for all combination of valid code-num pair.
"""


def process_s3_event(s3event):
    # print(s3event)
    if "Records" in s3event:

        # s3 file path UBCV/2023/CPSC_110_otherThing.pdf
        s3FilePath = s3event["Records"][0]["s3"]["object"]["key"]
        # some file name have are url encoded due to special characters and needs to be restore to original file name.
        s3FilePath = urllib.parse.unquote_plus(s3FilePath)
        # end of string split array is the file name e.g: CPSC_110_otherThing.pdf
        fileName = s3FilePath.split("/")[-1]

        # if the file path ends with a /, it is a folder creation event
        if s3FilePath[-1] == "/":
            raise JunkEventException(
                f"Probably a Folder creation event: {s3FilePath}")
        # if all the valid extensions are not in the filepath, raise an Exception
        if all(ext not in fileName for ext in valid_extensions):
            error_msg = f"File {fileName} contains invalid file extension, currently supported extensions are {valid_extensions}"
            raise InvalidFileExtensionException(error_msg)

        date_upload = s3FilePath.split("/")[1]  # 2023
        campus = "n/a"
        faculty = "n/a"
        campus = s3FilePath.split("/")[0]  # UBC

        mapping_subset = courseMapping.query("Campus == @campus")
        mapping_subset_dict = mapping_subset.to_dict("records")

        result = scan_for_course_code_and_num(
            fileName=fileName, courseMappingSubset=mapping_subset_dict)
        metadata = "filename"

        # if course info cannot determine based on the syllabus file name,
        # start scanning the text content
        if result["match"] == "n/a":
            result = extract_course_info_from_text(
                s3FilePath, mapping_subset_dict)
            metadata = "filetext"
            if not result:
                raise NotDeterminableException(
                    f"Syllabus's course info cannot be determined programmatically for file {s3FilePath}")
        else:
            course_code = result["code"]
            course_num = result["num"]
        course_code = result["code"]
        course_num = result["num"]
        faculty = mapping_subset.query(
            "`Subject Code` == @course_code").iloc[0]["Faculty"]

        syllabus_info = {
            "course_code": course_code,
            "course_number": course_num,
            "campus": campus,
            "faculty": faculty,
            "date_uploaded": date_upload,
            "s3_filepath": s3FilePath,
            "analyzed": False,
            "metadata": metadata
        }

    elif ("Event" in s3event) and (s3event["Event"] == "s3:TestEvent"):
        raise JunkEventException(
            "Encountered s3:TestEvent, discarding from queue")

    print(syllabus_info)
    return syllabus_info


"""
Programmatically receives SQS messages that contains S3 upload events, process them, then delete them
from the Queue. Event that are deemed unprocessable will be dumped into a separate DLQ for manual inspection.

@return true if there are event processed, false otherwise
"""


def retrieve_sqs_messages():

    # based on this https://stackoverflow.com/a/33156030
    sqs = boto3.resource('sqs')
    queue = sqs.get_queue_by_name(QueueName=QUEUE_NAME)  # main queue
    dlq = sqs.get_queue_by_name(QueueName=DLQ_QUEUE_NAME)  # DLQ
    metadata = []
    while True:
        messages_to_delete = []
        for message in queue.receive_messages(MaxNumberOfMessages=MAX_QUEUE_MESSAGES):

            # process message body
            body_json = json.loads(message.body)
            try:
                syllabus_info = process_s3_event(body_json)
                metadata.append(syllabus_info)

            except JunkEventException as e:
                print(e.message)  # print exception message

            except (InvalidFileExtensionException, NotDeterminableException) as e:
                body = {
                    "Error": e.message,
                    "BucketName": BUCKET_NAME,
                    "FileKey": body_json["Records"][0]["s3"]["object"]["key"]
                }
                response = dlq.send_message(MessageBody=json.dumps(body))
                print(e.message)
                print(
                    f"Event is sent to to Dead-Letter Queue: {DLQ_QUEUE_NAME}")

            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchKey':
                    print(
                        f'No S3 object with key {body_json["Records"][0]["s3"]["object"]["key"]}')
                else:
                    print(
                        f"{e.response['Error']['Code']}:{e.response['Error']['Message']}")
                body = {
                    "Error": e.response['Error']['Message'],
                    "BucketName": BUCKET_NAME,
                    "FileKey": body_json["Records"][0]["s3"]["object"]["key"]
                }
                response = dlq.send_message(MessageBody=json.dumps(body))

            # add message to delete
            messages_to_delete.append({
                'Id': message.message_id,
                'ReceiptHandle': message.receipt_handle
            })

        # if you don't receive any notifications the
        # messages_to_delete list will be empty
        if len(messages_to_delete) == 0:
            break
        # delete messages to remove them from SQS queue
        # handle any errors
        else:
            delete_response = queue.delete_messages(Entries=messages_to_delete)

    # if no files upload -> no metadata extracted -> return False
    if len(metadata) == 0:
        return False
    putToS3(pd.DataFrame(metadata), TEMP_BUCKET_NAME,
            f"syllabus_metadata/metadata_{current_date}.csv")
    return True


def main():
    
    run = retrieve_sqs_messages()
    if run:
        glue_client = boto3.client("glue")
        response = glue_client.start_job_run(
            JobName="courseFlexibility-GenerateNLPAnalysis",
            Arguments={
                "--TIMESTAMP": current_date,
                "--METADATA_FILEPATH": f"syllabus_metadata/metadata_{current_date}.csv",
                "--INVOKE_MODE": "file_upload",
                "--NEW_GUIDELINE": "n/a"
            }
        )
        print(f"Metadata was successfully processed. Job run {current_date}")
    else:
        print(f"No files to analyze for this invocation on {current_date}")

main()
