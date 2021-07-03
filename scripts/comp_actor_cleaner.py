# Load the JSON module and use it to load your JSON file.                       
# I'm assuming that the JSON file contains a list of objects.
import os
import json

for files in os.listdir("."):
	# Check to see if file contains keys _id, sort, and export source
	key_id = "_id"
	key_sort = "sort"
	key_exportSource = "exportSource"

	# Skips file if it isn't a .json file
	if files.endswith(".json") is True:
		# Opens .json file
		with open(files, encoding='utf8') as f:
			data = json.load(f)

		if key_id in data.keys():
			print('Key ' + key_id + ' and ' + key_sort + ' is found in ' + files)

			# If key is in file, it deletes it, makes a new 'clean' file,
			# and deletes the old file.
			del data["_id"]
			del data["sort"]
			del data["flags"]["exportSource"]

			clean_data = data

			with open("clean_" + files, "w") as clean_f:
				json.dump(clean_data, clean_f)
			os.remove(files)
	else:
		print("\nSurprise, surprise it worked! (I think)")











