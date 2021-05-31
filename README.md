# Starfinder

This is a game system definition of the Starfinder RPG for the awesome [Foundry Virtual Tabletop](http://foundryvtt.com/).

_The latest version of the Starfinder system is compatible with FoundryVTT version 0.8.6 or later._

## Join the discussion

If you have quesions or just want to chat about all things Starfinder, then join us on the official FoundryVTT discord server [here](https://discord.gg/QyAeMy4Dyu).

## Version support table
If you wish to use Starfinder with older versions of FoundryVTT, the following table will help:
- FoundryVTT v0.5.5 or earlier: The latest supported Starfinder system version is v0.2.2
- FoundryVTT v0.5.6 till v0.6.6: The latest supported Starfinder system version is v0.5.1
- FoundryVTT v0.7.0 till v0.7.10: The latest supported Starfinder system version is v0.10.0.0
- FoundryVTT v0.8.3 and up: The latest supported Starfinder system version is v0.11.1

Please keep in mind the Starfinder system identifier changed with Starfinder system version v0.3 from 'starfinder' to 'sfrpg'. If you have a world older than this version, you will have to update your world.json file to reflect this, or your world will not load.

## Installation
1. Download the current release that is compatible with your version of Foundry VTT from the [releases tab](https://github.com/wildj79/foundryvtt-starfinder/releases). Unzip the files and place them in the data folder for your installation. See [http://foundryvtt.com/pages/hosting.html#where-do-i-put-my-data](http://foundryvtt.com/pages/hosting.html#where-do-i-put-my-data) for more details about where your data is stored for Foundry. Make sure to put the files in a folder named `sfrpg` in the `systems` directory. _NOTE: This is no longer the perfered method of installing modules. Please use the module browser within foundry._
2. Copy this link and use Foundry's Module manager to install it: `https://raw.githubusercontent.com/wildj79/foundryvtt-starfinder/master/src/system.json`

## Use

The Starfinder FoundryVTT system works similar to most of the other systems available on FoundryVTT, so if you have experience with FoundryVTT overall, you should have little difficulty using the Starfinder system. There are a few notable differences in the implementation details, either because of the way the system dictates things should function, or because of quality of life changes that have been integrated.

### Skills
Skills in Starfinder are more dynamic than they are in D&D 5e. Skills can have skill ranks and other miscellaneous modifiers applied to them. To view more detailed information on skills you can right click on the skill name. This will bring up an edit dialog where you can edit properties. You can also have multiple profession skills, all tied to different specialities or fields of study. You can add new ones by clicking the "Add Profession" button at the bottom of the skills panel. This will bring up a similar dialog where you can specify the linked ability, the number of ranks in the skill, any miscellaneous modifiers that might apply, and the name of the profession or speciality.

### Ability Score Increases
Because ability score increases in Starfinder work a little different than other systems, there is an 'asi' item you can add to your character where you select the ability scores to increase. This properly automates on the character sheet in the right order of operations, meaning that personal upgrades or ability score penalties, damages, and drains do not affect your ASI gains. The base ability score box on the player character sheet should include your original, level 1, original, rolled/point-bought/stat-array'ed score, before Race and Theme bonuses are applied.

### Inventory
The inventory in Starfinder has a few quality of life features. If you right-click a stack of items it will split the stack in half. If you drop identical items on top of each other, the stacks will merge. If you hold down the shift key when dropping an item, the game will ask you how many of the item you wish to drop. If you drag and drop an item onto another item that can contain it, such as an armor upgrade on an armor, the armor upgrade will be nested under the container.

### Combat
Combat in Starfinder can vary from regular, character to character combat, but it also includes vehicle chases and starship combat. To accomodate this, there is a combat type selector underneath your combat encounter when you create it, allowing you to switch combat types.

### Modifiers
Instead of the Active Effects, as introduced in FoundryVTT v0.7, Starfinder uses what is called Modifiers, which was built before FoundryVTT introduced Active Effects. The Modifiers system works similar, in that you can specify attributes to modify, along with the amount to modify it by. These amounts can be numbers, but also formula, so for example, "2", "1d6", and "@details.level.value" are all valid values. Finally, you can set a modifier type to be either "constant" or "roll formula". A constant modifier is always active as long as the modifier is enabled, a roll formula will show up on the appropriate roll made, allowing the player to choose what modifiers affect them at that point.

## Bugs and Issues

If you have any issues or concerns, please don't hesitate to open an issue on the tracker [https://github.com/wildj79/foundryvtt-starfinder/issues](https://github.com/wildj79/foundryvtt-starfinder/issues) or reach out to me on the Foundry discord server: `wildj79#0980`.

## Legal

_This game system definition uses trademarks and/or copyrights owned by Paizo Inc., which are used under Paizo's Community Use Policy. We are expressly prohibited from charging you to use or access this content. This game system definition is not published, endorsed, or specifically approved by Paizo Inc. For more information about Paizo's Community Use Policy, please visit paizo.com/communityuse. For more information about Paizo Inc. and Paizo products, please visit paizo.com._
