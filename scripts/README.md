# Starfinder Scripts

## Javascript Scripts
Running the javascript scripts is done by the following process:

1. These scripts operate on files within the same folder as the script, so copy the script from its location in the `sfrpg/scripts` folder to where your files are.
2. Open Command Prompt (or terminal, powershell, what have you). You can quickly open CMD in your current location on Windows by typing `cmd` in the address bar in Windows Explorer and hitting enter.
3. Assuming you've put the script in your current folder, type: `node script_name.js`.

### Overview of the scripts

- `action_target/fix_xxx_actionTarget.js`: These scripts sets the action target (e.g "X Against KAC/EAC" on the chat card) of the inputted files. If you've been setting action target you don't need to run this, but you still can to see if you missed any. Note that in some cases the logic may be incorrect as there are (as always) exceptions, so be sure to double check.
- `damage/update_xxx.js`: These scripts migrate the inputted files' damage data to the new schema. You don't need to use these unless you *know* you need to.
- `data_entry/item_cleaner.js`: Removes the `_id` and `flags` field from the inputted files, speeding up JSON wrangling massively, and will output them to a new folder called `Clean` in the folder you ran it in. Don't use on items already cooked and in compendiums.
- `equipment/fix_xxx.js`: These scripts migrate the inputted files' equipment data to the new schema. Similar to the damage scripts, you don't need to use these unless you *know* you need to.
- `migrations/convert_all_items_to_webp.js`: Converts the inputted images from .png or .jpg to .webp. Useful if you're adding new art to the system.
- `npcs/cleanup_crew_actors.js`: Empty NPC Starship crews. Doesn't hurt to run on any NPC starships just in case some left over data is there.
    - `cleanup_npc_temp_health.js`: Ensure Temp HP for NPCs is zero.
    - `fix_npc_starship_piloting.js`: Piloting used to be used to input Gunnery, but isn't anymore so a migration was needed. You don't need to use this on any new Starships, doing so will cause errors.
    - `migrate_aliens_to_npc2.js`: Migrates any NPCs from the old NPC type to the new NPC2 type. You won't need to run this as long as you haven't been making Old-Style NPCs.


## Python Scripts (Outdated)

**These scripts are outdated and shouldn't be used. The following guidance has been left for legacy purposes.**

Each of the python scripts can be used for different things depending on the type of file you're trying to add to the compendium.

### `data_entry/comp_actor_cleaner.py` and `data_entry/comp_equipment_cleaner.py`
`comp_actor_cleaner.py` and `comp_equipment_cleaner.py` are to be copied to the same directory as the actor/equipment files to be added to the compendium. This is not intended to update existing actors and is only for cleaning the files of actors that are not yet in the compendium. Copy `comp_actor_cleaner.py` to the directory and run it. If all goes well then it will remove the `_id`, `sort`, and `exportSource` fields from the files. Then you can move those files into the correct place and cook them with npm.

### `data_entry/comp_equipment_id_migrator.py`
`comp_equipment_id_migrator.py` does not need to be in the same directory as the files to be edited and will work for items that need to be updated. It will ask for the location of the old files that have the ids that you want. Then it will ask for the corrected items location. Then it will remove "_id", "sort", and "exportSource" fields and change the name to match existing files. Then pull the id's from the files already located in the compendiums and put those in the corrected items. Finally, it will move the old files into a new folder where the script is located in case anything goes wrong and put the new files where the old ones were.
