# IMPORT PYTHON LIBRARIES
import os
import re
import sys
import json
import logging
from urllib.request import urlopen
from tqdm import tqdm
import pandas as pd
from datetime import datetime
import boto3
from tqdm import tqdm

# libs for NLP pre-processing
import nltk
from nltk.tokenize import sent_tokenize
from PyPDF2 import PdfReader
import docx
from bs4 import BeautifulSoup

# libs for semantic-similarity model
import torch
from sentence_transformers import SentenceTransformer, util

# libs for QA-model
from torch.utils.data import TensorDataset, DataLoader, RandomSampler, SequentialSampler
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AdamW

# custom modules
from custom_utils.utils import fetchFromS3, putToS3
from utils import get_most_recent_file, get_most_recent_folder, get_primary_keys, remove_extension

# Glue module
from awsglue.utils import getResolvedOptions

# ---------------------------------------------------------
# SETTING UP THE WORKING ENVIRONMENT

def createDir(path):
    os.makedirs(path) # using os.markdirs to also create intermediate directories
    return os.path.join(os.getcwd(), path)

nltk_custom_path = createDir("nltk")
nltk.data.path.append(nltk_custom_path)
nltk.download("punkt", download_dir=nltk_custom_path)

model_custom_path = createDir("cache/torch/sentence_transformers")
# os.environ['TRANSFORMERS_CACHE'] = model_custom_path

transformer_cache_dir = createDir("transformers_cache")

# Create a session and service clients
session = boto3.Session()
s3_client = session.client('s3')
glue_client = session.client('glue')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Accessing Glue job parameters as environment variables
args = getResolvedOptions(
    sys.argv, ["BUCKET_NAME", "TEMP_BUCKET_NAME", "DB_SECRET_NAME", "METADATA_FILEPATH", "TIMESTAMP"])
BUCKET_NAME = args["BUCKET_NAME"]  # the syllabus files bucket
TEMP_BUCKET_NAME = args["TEMP_BUCKET_NAME"]  # glue temp bucket
DB_SECRET_NAME = args["DB_SECRET_NAME"]
METADATA_FILEPATH = args["METADATA_FILEPATH"]
TIMESTAMP = args["TIMESTAMP"]

# ---------------------------------------------------------

campuses_to_analyze = ["UBCV", "UBCO"]

def download_files(bucket_name=BUCKET_NAME, download_dir='syllabus_files'):

    bucket_name = bucket_name
    
    metadata_file = fetchFromS3(TEMP_BUCKET_NAME, METADATA_FILEPATH)

    # Iterate over each path and download the file to the relevant directory
    metadata_df = pd.read_csv(metadata_file)
    s3_filepaths = list(metadata_df['s3_filepath'])

    for s3_key in s3_filepaths:
        key_split = s3_key.split("/")
        path = key_split[:-1] # the folder path
        filename = key_split[-1] # the file name
        local_file_path = os.path.join(os.getcwd(), download_dir, *path)

        # Create the necessary directories locally
        os.makedirs(local_file_path, exist_ok=True)
        
        try:
            full_local_path = os.path.join(local_file_path, filename)
            with open(full_local_path, 'wb') as f:
                s3_client.download_fileobj(bucket_name, s3_key, f)
        except NotADirectoryError:
             print(f"File not found for syllabus_path: {full_local_path}. Skipping...")

def upload_files(directory, bucket_name=TEMP_BUCKET_NAME):
    for root, dirs, files in os.walk(directory):
        for file in files:
            local_path = os.path.join(root, file)
            relative_path = os.path.relpath(local_path, directory)
            s3_key = os.path.join(directory, os.path.dirname(relative_path), file)
            s3_client.upload_file(local_path, bucket_name, s3_key)
            print(f"Uploaded {local_path} to S3 bucket {bucket_name} with key {s3_key}")


def preprocess_extracted_text(text):
    # Tokenize the text into sentences
    sentences_with_backslash_chars = sent_tokenize(text)
    # Remove newline and tab characters from each sentence
    sentences = [s.replace('\n', '').replace('\t', ' ') for s in sentences_with_backslash_chars]
    # Split sentences containing bullet points
    processed_sentences = []
    for sentence in sentences:
        if '•' in sentence:
            bullet_points = re.split(r'\s*•\s*', sentence)
            processed_sentences.extend(bullet_points)
        else:
            processed_sentences.append(sentence)

    return processed_sentences

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

def load_text_from_docx(path):
    # Read the DOCX document
    document = docx.Document(path)
    # Extract text from paragraphs and join them with double newlines
    doc_text = '\n\n'.join(paragraph.text for paragraph in document.paragraphs)
    filtered_sentences = preprocess_extracted_text(doc_text)
    return filtered_sentences

def load_text_from_html(path):
    # Load the HTML content
    url = r"file:///" + path
    html = urlopen(url).read()
    soup = BeautifulSoup(html, features="html.parser")
    # Remove script and style elements from the HTML
    for script in soup(["script", "style"]):
        script.extract()
    # Get the plain text from the HTML
    text = soup.get_text()
    # Split text into lines and remove leading/trailing spaces
    lines = (line.strip() for line in text.splitlines())
    # Split lines into chunks and remove extra spaces
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    # Join the chunks with newlines
    html_text = '\n'.join(chunk for chunk in chunks if chunk)
    filtered_sentences = preprocess_extracted_text(html_text)
    return filtered_sentences

def get_embeddings(content, embedder_model='all-mpnet-base-v2'):
    # Initialize the SentenceTransformer with the specified model
    embedder = SentenceTransformer(embedder_model, cache_folder=model_custom_path)
    # Encode the content into embeddings
    content_embeddings = embedder.encode(content, convert_to_tensor=True)
    # Ensure the embeddings have the correct shape
    if len(content_embeddings.shape) != 2:
        content_embeddings = torch.unsqueeze(content_embeddings, 0)
    return content_embeddings

def generate_semantic_reports(syllabus_path, guidelines, destination_path, embedder_model='all-mpnet-base-v2', top=3):
    # Create the destination_path directory if it doesn't exist already
    if not os.path.exists(destination_path):
        os.mkdir(destination_path)
        
    # Prepare the destination path for the semantic report and remove the existing semantic report if it exists
    campus_destination_paths = {}
    for campus in os.listdir(syllabus_path):
        # this_datetime = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        if not os.path.exists(os.path.join(destination_path, campus)):
            os.mkdir(os.path.join(destination_path, campus))
        campus_destination_paths[campus] = os.path.join(destination_path, campus,"semantic_results_"+TIMESTAMP+".json")
    
    # Encode the guideline statements into embeddings
    guidelines_embeddings = get_embeddings(guidelines)
    
    for campus in os.listdir(syllabus_path):
        # Check if we need to analyze the syllabus files in this campus folder
        if campus in campuses_to_analyze:
            # Open the folder containing the latest syllabus files and process each file in the syllabus path
            most_recent_syllabus_folder = get_most_recent_folder(os.path.join(syllabus_path, campus))
            for file in tqdm(os.listdir(os.path.join(syllabus_path, campus, most_recent_syllabus_folder)), 
                             desc="Analyzing syllabus files from the {} campus for the year {}...".format(campus, most_recent_syllabus_folder)):
                # Create an empty dictionary to store the semantic results for this current syllabus file
                semantic_dict = {}
                filename = os.path.join(campus, most_recent_syllabus_folder, file)
                # If this syllabus file has already been analyzed in the current analysis, skip it
                if file in list(semantic_dict.keys()):
                    continue

                # Else if a previous version of the file exists
                elif get_most_recent_file(folder_path=os.path.join(destination_path, campus), file_type="semantic"):
                    # AND if this syllabus file has already been analyzed in the previous analysis, skip it
                    if get_primary_keys(get_most_recent_file(folder_path=os.path.join(destination_path, campus), file_type="semantic")):
                        if file in get_primary_keys(
                            get_most_recent_file(
                                folder_path=os.path.join(destination_path, campus), file_type="semantic")):
                            continue
            
                if file.split('.')[-1] == 'pdf':
                    # Load text from a PDF file
                    filtered_sentences = load_text_from_pdf(os.path.join(syllabus_path, campus, most_recent_syllabus_folder, file))
                elif file.split('.')[-1] == 'docx':
                    # Load text from a DOCX file
                    filtered_sentences = load_text_from_docx(os.path.join(syllabus_path, campus, most_recent_syllabus_folder, file))
                #elif file.split('.')[-1] == 'html':
                    # Load text from an HTML file
                    #filtered_sentences = load_text_from_html(os.path.join(syllabus_path, campus, most_recent_syllabus_folder, file))
                else:
                    # Skip files with unsupported extensions
                    continue
                
                # If filtered_sentences is not an empty list,  then continue
                if filtered_sentences:
                    # Encode the extracted sentences into embeddings
                    filtered_sentences_embeddings = get_embeddings(filtered_sentences)
                    # Perform semantic search to find matching sentences for each guideline
                    hits = util.semantic_search(guidelines_embeddings, filtered_sentences_embeddings, top_k=top)
                    # Store the semantic results in the dictionary
                    semantic_dict[filename] = {}
                    for i in range(len(guidelines)):
                        semantic_dict[filename][guidelines[i]] = []
                        for t in range(top):
                            semantic_dict[filename][guidelines[i]].append([filtered_sentences[hits[i][t]['corpus_id']]])
                            
            # Save the semantic results of this syllabus as a JSON file
            #with open(campus_destination_paths[campus], "w", encoding='utf-8') as outfile:
                #json.dump(semantic_dict, outfile, indent=4, ensure_ascii=False)
                
                if os.path.exists(campus_destination_paths[campus]):
                    # File already exists, load the existing data
                    with open(campus_destination_paths[campus], "r") as file:
                        existing_data = json.load(file)
                    # Update the existing data with the new dictionary
                    existing_data.update(semantic_dict)
                    
                else:
                    # File doesn't exist, create a new file with the dictionary
                    existing_data = semantic_dict
                    
                # Save the updated or new data to the JSON file
                with open(campus_destination_paths[campus], "w", encoding='utf-8') as file:
                    json.dump(existing_data, file, indent=4, ensure_ascii=False)

    upload_files(directory=destination_path)


def main():
    # Entry point of the program
    logger.info("Starting semantic report generation...")
    # # Initialize the GuidelineManager and retrieve the guidelines
    # guideline_manager = GuidelineManager()
    # guidelines = guideline_manager.get_guidelines()

    guidelines = [
        "Online recordings of lectures can be accessed.",
        "Questions can be posted anonymously.",
        "Late assignments or deliverables are not accepted.",
        "Make-up midterms are offered.",
        "The lowest assessment grades will not count towards your total grade.",
        "Your top M out of N scores will count towards your final grade.",
        "There are multiple attempts for assignments."
    ]

    # Set the paths for the syllabus and destination
    syllabus_path = "syllabus_files/"
    destination_path = "model_outputs/"
    
    # Download files in the current metadata .csv
    download_files()
    
    # Generate the semantic reports
    generate_semantic_reports(
        syllabus_path=syllabus_path,
        guidelines=guidelines,
        destination_path=destination_path
    )

    logger.info("Semantic report generation completed successfully.")

if __name__ == "__main__":
    main()
    # response = glue_client.start_job_run(
    #     JobName="test-question-answering",
    #     Arguments={
            
    #     }
    # )

