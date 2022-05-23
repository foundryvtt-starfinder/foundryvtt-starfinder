# Requires python 3

# This script will ask for the location of the old files that have the
# ids that you want. Then it will ask for the corrected items location.
# Then it will remove "_id", "sort", and "exportSource" fields and change
# the name to match existing files. Then pull the id's from the files
# already located in the compendiums and put those in the corrected items
# Finally, it will move the old files into a new folder where the script
# is located in case anything goes wrong and put the new files where the
# old ones were.


import shutil
import os
import json

print("This tool is for making changes to items already existing in the compendiums. It works will equipment and is "
      "untested for other types but should work. Just copy and paste the location of the old files "
      "(e.g. D:\Documents\GitHub\\foundryvtt-starfinder\src\items\equipment) when prompted. Then enter the location "
      "of the modified files.")
print("It will delete '_id', 'sort', and 'exportSource' fields form the new file then search for an old file with a "
      "matching name. If found, it will apply the old file's '_id' field to the modified file. It will then move "
      "the old file to a backup directory in the same directory as the modified files and move the modified files to "
      "where the old files where.")
print("Once it finishes, you *should* just be able to run 'npm run cook' and it should work. The modified files "
      "should exist where the old files were with the old file's '_id' field.")
print("As per usual, it is safer (and quicker) to move the old files into a separate directory and not work within "
      "GitHub\\foundryvtt-starfinder\src\items\equipment. And a backup never hurt anyone.")

oldPathRaw = input("Location of old files: ")
newPathRaw = input("Location of the modified files: ")

oldpath = oldPathRaw + "/"
newpath = newPathRaw + "/"

# Creates directory to hold items already in the compendiums.
if not os.path.isdir("./old_files"):
    os.mkdir("./old_files")
    print("./old_files directory created")
else:
    print("./old_files already exists")


def id_getter(name):
    print("start id_getter() with " + name)
    for old_file in os.listdir(oldpath):
        if old_file == name:
            print("Match found")
            with open(oldpath + "/" + old_file) as of:
                old_data = json.load(of)
            return old_data["_id"]


def file_mover(name):
    print("start file_mover()")
    oldFile = oldpath + item_name
    newFile = os.getcwd() + "/old_files/" + item_name

    # move old files to new directory
    for oldFiles in os.listdir(oldpath):
        if oldFiles == name:
            print("Match found")
            shutil.copyfile(oldFile, newFile)
            print("Old file " + item_name + " moved to " + newFile)
            os.remove(oldFile)
            print(oldFile + " deleted.")


for files in os.listdir(newpath):
    if files.endswith(".json") is True:
        with open(files, encoding='utf-8') as f:
            data = json.load(f)

        if "_id" in data.keys():
            # If key is in file, it deletes it, makes a new 'clean' file,
            # and deletes the old file.
            del data["_id"]
            del data["sort"]
            del data["flags"]["exportSource"]

            item_name = data["name"].replace(" ", "_").replace(",", "").lower() + ".json"
            clean_data = data

            with open(item_name, "w") as clean_f:
                json.dump(clean_data, clean_f)
            os.remove(files)
            print(files + " deleted")

            old_id = id_getter(item_name)

            with open(item_name, encoding='utf-8') as f:
                data = json.load(f)

            data["_id"] = old_id

            file_mover(item_name)

            item_name_migrated = "migrated_" + item_name

            with open(item_name_migrated, "w") as clean_f:
                json.dump(data, clean_f)

            shutil.copy(newpath + item_name_migrated, oldpath + "migrated_" + item_name)
            print(newpath + item_name_migrated + " moved to " + oldpath + item_name)

            os.remove(item_name)
            print(item_name + " deleted")

input("Press enter to exit")
