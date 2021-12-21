# Starfinder Scripts

## Javascript Scripts

Running the javascript scripts is done by the following process:
1. Open Command Prompt (or terminal, powershell, what have you)
2. Go to your sfrpg folder
3. Type: node scripts/script_name.js

## Python Scripts
Each of the python scripts can be used for different things depending on the type of file you're trying to add to the compendium.

### comp_actor_cleaner.py and comp_equipment_cleaner.py
comp_actor_cleaner.py and comp_equipment_cleaner.py are to be copied to the same directory as the actor/equipment files to be added to the compendium. This is not intended to update existing actors and is only for cleaning the files of actors that are not yet in the compendium. Copy comp_actor_cleaner.py to the directory and run it. If all goes well then it will remove the "_id", "sort", and "exportSource" fields from the files. Then you can move those files into the correct place and cook them with npm.

### comp_equipment_id_migrator.py
comp_equipment_id_migrator.py does not need to be in the same directory as the files to be edited and will work for items that need to be updated. It will ask for the location of the old files that have the ids that you want. Then it will ask for the corrected items location. Then it will remove "_id", "sort", and "exportSource" fields and change the name to match existing files. Then pull the id's from the files already located in the compendiums and put those in the corrected items. Finally, it will move the old files into a new folder where the script is located in case anything goes wrong and put the new files where the old ones were.
