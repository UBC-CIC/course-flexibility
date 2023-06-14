import os
import json

def get_most_recent_file(folder_path, file_type):
    # Get a list of all files in the directory
    files = os.listdir(folder_path)
    
    # Filter files to include only those with the expected filename pattern
    if file_type == "semantic":
        filtered_files = [file for file in files if file.startswith('semantic_results_') and file.endswith('.json')]
    elif file_type == "qa":
        filtered_files = [file for file in files if file.startswith('qa_results_') and file.endswith('.json')]
    else:
        return 0

    # If there are no relevant results files in the folder
    if not filtered_files:
        return 0
    
    sorted_files = sorted(filtered_files, key=lambda x: os.path.getmtime(os.path.join(folder_path, x)), reverse=True)
    if sorted_files:
        return os.path.join(folder_path, sorted_files[0])
    
def get_most_recent_folder(folder_path):
    # Get the list of directories
    directories = [d for d in os.listdir(folder_path) if os.path.isdir(os.path.join(folder_path, d))]
    print(directories)
    # Sort the directories based on their names (as integers)
    sorted_directories = sorted(directories, key=int)

    # Get the most recent year folder (the last one in the sorted list)
    return sorted_directories[-1]
    
def get_primary_keys(json_path):
    # If the path is not a .json path to begin with
    if json_path == 0:
        return 0
    # If the json path does not exist
    if os.path.exists(json_path):
        return 0
    with open(json_path, 'r') as json_file:
        # Load the contents of the JSON file
        data = json.load(json_file)
        return list(set([key.split('.')[0] for key in data.keys()]))
    
def remove_extension(filename):
    # Get the base name of the filename
    base_name = os.path.basename(filename)
    # Remove the extension from the base name
    name_without_extension = os.path.splitext(base_name)[0]
    return name_without_extension