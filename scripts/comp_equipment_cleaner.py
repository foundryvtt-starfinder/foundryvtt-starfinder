# Requiers python 3

# Load the JSON module and use it to load your JSON file.                       
# I'm assuming that the JSON file contains a list of objects.
import os
import json

for files in os.listdir("."):
	# Check to see if file contains costMultipliedBySize
	key_name = "name"
	key_id = "_id"
	key_sort = "sort"
	key_export = "exportSource"

	# Skips file if it isn't a .json file
	if files.endswith(".json") is True:
		# Opens .json file
		with open(files, encoding='utf-8') as f:
			data = json.load(f)

		if key_name in data.keys():
			print('Key ' + key_name + ' is found in ' + files)

			# If key is in file, it deletes it, makes a new 'clean' file,
			# and deletes the old file.
			del data["_id"]
			del data["sort"]
			del data["flags"]["exportSource"]
			weapon_name = data["name"] + ".json"

			clean_data = data

			with open(weapon_name, "w") as clean_f:
				json.dump(clean_data, clean_f)
			os.remove(files)











