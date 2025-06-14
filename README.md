# Starfinder

This is a game system definition of the Starfinder 1st edition RPG for the awesome [Foundry Virtual Tabletop](http://foundryvtt.com/).

## Join the discussion

If you have quesions or just want to chat about all things Starfinder, then join us on the official FoundryVTT discord server [here](https://discord.gg/foundryvtt).

## Version support table
If you wish to use Starfinder with older versions of FoundryVTT, the following list will help:
- FoundryVTT v0.5.5 or earlier: The latest supported Starfinder system version is [v0.2.2](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/releases/tag/v0.2.2)
- FoundryVTT v0.5.6 to v0.6.6: The latest supported Starfinder system version is [v0.5.1](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/releases/tag/v0.5.1.0)
- FoundryVTT v0.7.0 to v0.7.10: The latest supported Starfinder system version is [v0.10.0](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/releases/tag/v0.10.0.0)
- FoundryVTT v0.8.0 to v9.269: The latest supported Starfinder system version is [v0.18.3](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/releases/tag/v0.18.3)
- FoundryVTT v9.269 to v9.280: The latest supported Starfinder system version is [v0.19.2](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/releases/tag/v0.19.2)
- FoundryVTT v10 (10.282 to 10.291): The latest supported Starfinder system version is [v0.23.0](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/releases/tag/v0.23.0)
- FoundryVTT v11 (11.299 to 11.315): The latest supported Starfinder system version is [v0.25.3](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/releases/tag/v0.25.3)
- FoundryVTT v12 (12.324 to 12.343): The latest supported Starfinder system version is [v0.27.3](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/releases/tag/0.27.3)
- FoundryVTT v13 (13.341+): The latest supported Starfinder system version is [the latest release](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/releases/latest).

Please keep in mind the Starfinder system identifier changed with Starfinder system version v0.3 from 'starfinder' to 'sfrpg'. If you have a world older than this version, you will have to update your world.json file to reflect this, or your world will not load.

## Installation
The preferred installation method is through the Foundry Package Manager. To do this, open Foundry Virtual Tabletop to the Setup page, click "Game Systems" and then "Install System". Type "Starfinder" into the search bar, locate the package, and click the install button. That's it! To get system updates, just use the integrated update feature within Foundry. If you find that your system is not updating to the latest available, make sure that you are using a compatible Foundry version (table above). If so, many times issues with updating can be resolved by uninstalling and then reinstalling the system (this shouldn't affect any of your world data, buut it never hurts to make backups!).

### Alternative installation methods
You can also install a specific system version rather than the latest one in one of two ways. _NOTE: These are not the preferred installation methods for this package, and so should only be used where use of the package manager is not possible._
1. Manifest URL Method (only system version 0.27.1 and above): Copy the link to the `system.json` file attached to the [release version](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/releases) you are trying to install. In the "Install System" window within foundry, paste this link in the "Manifest URL" text box at the bottom of the window and click "Install". If you want the latest version, you can copy [this link](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/releases/latest/download/system.json).
2. Full Manual Installation (system versions 0.27.0 and below): Download the `.zip` file from the release that is compatible with your version of Foundry VTT from the [releases tab](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/releases). Unzip the files and place them in the data folder for your installation. See [https://foundryvtt.com/article/configuration#where-user-data](https://foundryvtt.com/article/configuration#where-user-data) for more details about where your data is stored for Foundry. Make sure to put the files in a folder named `sfrpg` in the `systems` directory.

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

If you have any issues or concerns, please don't hesitate to open an issue on the tracker [https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/issues](https://github.com/foundryvtt-starfinder/foundryvtt-starfinder/issues) or reach out to us on the Foundry discord server: #starfinder, where the community can help out.

## Legal

_This game system definition uses trademarks and/or copyrights owned by Paizo Inc., which are used under Paizo's Community Use Policy. We are expressly prohibited from charging you to use or access this content. This game system definition is not published, endorsed, or specifically approved by Paizo Inc. For more information about Paizo's Community Use Policy, please visit paizo.com/communityuse. For more information about Paizo Inc. and Paizo products, please visit paizo.com._
