# Requires Python 3

# Load the JSON module and use it to load your JSON file.
# I'm assuming that the JSON file contains a list of objects.
import os
import json

for files in os.listdir("."):

    # Skips file if it isn't a .json file
    if files.endswith(".json") is True:
        # Opens .json file
        with open(files, encoding='utf8') as f:
            data = json.load(f)

        # If key is in file, it deletes it, makes a new 'clean' file,
        # and deletes the old file.
        try:
            del data["flags"]["core"]["sourceId"]
        except KeyError:
            print("field sourceId not found in " + files)
        try:
            del data["_id"]
        except KeyError:
            print("field _id not found in " + files)
        try:
            del data["sort"]
        except KeyError:
            print("field sort not found in " + files)
        try:
            del data["flags"]["exportSource"]
        except KeyError:
            print("field exportSource not found in " + files)

        clean_data = data

        with open("clean_" + files, "w") as clean_f:
            json.dump(clean_data, clean_f)
        os.remove(files)
