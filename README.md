# Starfinder

This is a game system definition of the Starfinder RPG for the awesome [Foundry Virtual Tabletop](http://foundryvtt.com/).

_This version of the starfinder system is only compatible with FoundryVTT version 0.5.6 or later. If you are still on v0.5.5 or earlier, **PLEASE DO NOT UPDATE**. You will need to stay on v0.2.2 or earlier._

## Installation
1. Download the current release that is compatible with your version of Foundry VTT from the [releases tab](https://github.com/wildj79/foundryvtt-starfinder/releases). Unzip the files and place them in the data folder for your installation. See [http://foundryvtt.com/pages/hosting.html#where-do-i-put-my-data](http://foundryvtt.com/pages/hosting.html#where-do-i-put-my-data) for more details about where your data is stored for Foundry. Make sure to put the files in a folder named `starfinder` in the `modules` directory. _NOTE: This is no longer the perfered method of installing modules. Please use the module browser within foundry._
2. Copy this link and use Foundry's Module manager to install it: `https://raw.githubusercontent.com/wildj79/foundryvtt-starfinder/master/src/system.json`

## Use

The Starfinder system borrows a lot of functionality from the `dnd5e` system, so most functions should seem familar if you've used that system. One of the big differences is with skills. Skills in Starfinder are more dynamic than they are in D&D 5e. Skills can have skill ranks and other miscellaneous modifers applied to them. To do this, right click on the skill name. This will bring up an edit dialog where you can apply these modifiers. You can also have multiple profession skills, all tied to different specialities or fields of study. You can add new ones by clicking the "Add Profession" button at the bottom of the skills panel. This will bring up a similar dialog where you can specify the linked ability, the number of ranks in the skill, any miscellaneous modifiers that might apply, and the name of the profession or speciality. 

## Things Missing

There are several things that I would like to add to the system, but wanted to get it "out the door" so that people could start using it sooner (I'd never get it done otherwise, becuase there is always one more thing I could improve). Here is a short list of things that still need to be done (not all inclusive. I reserve the right to change my mind about what features should be included or not).

* Vehicle attacks, modifiers, and systems. This still needs to be implemented.
* Starship systems and critical damage.
* Containers. e.g. Backbacks and Null-space chambers
* Compendium content. I definetly want to include content from the Core Rulebook, but I'm still on the fence whether I should include content from other books in the core system, or save those for other modules.

   _partialy done. I've added all of the Basic melee weapons, and most of the Advanced melee. Working on the rest._

If you have any issues or concerns, please don't hesitate to open an issue on the tracker [https://github.com/wildj79/foundryvtt-starfinder/issues](https://github.com/wildj79/foundryvtt-starfinder/issues) or reach out to me on the Foundry discord server: `wildj79#0980`.

## Legal

_This game system definition for the Foundry Virtual Tabletop uses trademarks and/or copyrights owned by Paizo Inc., which are used under Paizo's Community Use Policy. We are expressly prohibited from charging you to use or access this content. This game system definition for the Foundry Virtual Tabletop is not published, endorsed, or specifically approved by Paizo Inc. For more information about Paizo's Community Use Policy, please visit [paizo.com/communityuse](paizo.com/communityuse). For more information about Paizo Inc. and Paizo products, please visit [paizo.com](paizo.com)._
_Starfinder game system definition, Copyright 2020, James Allred_
