# Load the JSON module and use it to load your JSON file.
# I'm assuming that the JSON file contains a list of objects.
import os
import json

justified = ' style="text-align: justify;"'

for files in os.listdir("."):

    # Skips file if it isn't a .json file
    if files.endswith(".json") is True:
        # Opens .json file
        with open(files, encoding='utf8') as f:
            data = json.load(f)

        desc = data["data"]["description"]["value"]

        try:
            data["data"]["description"]["value"] = desc.replace(justified, '')
        except:
            print("did not replace correctly")
        
        clean_data = data

        with open(files, "w") as clean_f:
            json.dump(clean_data, clean_f, indent=2)

input("Press 'Enter' to exit")
