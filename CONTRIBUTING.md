# Welcome, Developers!

If you would like to contribute to the project then I welcome any contributions. There are plenty of things to work on, so fork the repository and start submitting pull requests!!!

## In order to set up your development environment, we need to ensure that a few things are in place:

1. You'll need `node` installed on your system. You will need a version of `node` that is at least 14.x or greater. To install it, go to [the Node.js downloads page](https://nodejs.org/en/download/) and choose an installer for your operating system. The current LTS is probably a good choice, though the current version works just as well.
2. This system uses `gulp` to process `less` into usable `css` as well as some other utilities. You will need to install `gulp` for this purpose. To install, open up your preferred command line tool and enter the following command `npm install --global gulp-cli`. This will install the `gulp` command line utilities globally.
3. You'll also need a `git` client installed; whether that is the [command line tool](https://cli.github.com) or something like [Sourcetree](https://www.sourcetreeapp.com) or [GitKraken](https://www.gitkraken.com) is up to you.  
Your integrated development environment (IDE) may also include git integration; please refer to the documentation available for the IDE for how to set this up.

With those things installed, we can work on getting the repository ready for development. The preferred method for contributing to the repository is through the typical ["Pull Request"](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) methodology. To get started, you'll need to [fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/about-forks) the `foundryvtt-starfinder` repository. Once you've forked the repository, you can clone that repo to your local machine. When you are making changes, it is recommended that you [create a new branch](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-and-deleting-branches-within-your-repository) for this purpose, based off of the development branch. After your changes are pushed back to your forked repository, you can then create a pull request from there. 

## Follow these steps to get your development environment going after downloading your fork locally:

1. Install the development dependencies by running the following command: `npm ci`
2. Configure a `foundryconfig.json` file in the root folder of the project with a `dataPath` property. An example can be found in the `foundryconfig.example.json` file provided in the project. Just copy the file and rename it to `foundryconfig.json` and change the `dataPath`. The `dataPath` property is the file path to your Foundry installs user data. This can be found on the Configuration tab on the Setup screen.
3. If you already have the Starfinder RPG System installed on Foundry VTT, uninstall it from Foundry so that the next steps will properly set up your Symlink.
4. Run `npm run build`. This will compile all of the `less` and copy all the necessary files to a `dist` folder in the project root. It will also create a symbolic link to this new folder with your Foundry installs user data path.

```diff
+ Note for Windows users: You may need to run your commandline with administrator privileges if your 
+ dataPath folder is the default FoundryVTT setting of "C:\Users\Username\AppData\Local\FoundryVTT\Data". 
+ Additionally on Windows, you may need to use double back-slashes in your filepath. 
+ (E.g "C:\\Users\\Username\\AppData\\Local\\FoundryVTT\\Data")
```

5. Run `npm run build:watch` while you're developing so that changes are automatically synced with the `dist` folder. When you make changes to `html`, `css`, or `javascript` files, you'll need to do a page refresh in Foundry to pick up the changes (F5). Any changes to `template.json` or `system.json` require you to return to the Setup screen and then reload the world. ***Note***: This step only functions if you are actively making changes; running it without making changes will appear to be hanging.

This should be all you need to help contribute. If you have any issues, you can reach out to me on the Foundry Discord.

# Contributing to the compendiums

If you want to do data entry for the project, we have a version control friendly way of managing the compendium data.

```diff
+ Please be aware that this process relies on you having completed the previously mentioned setup steps.
```

Inside the `src/items` folder, you will find a subfolder for each compendium we have. Within these subfolders you will find a JSON file for each entry.

## Adding new items

The easiest workflow is to work through Foundry, and follow the following steps:
1. Create a new item in the Items sidebar tab.
2. Fill out the details, modifiers, etc. Make sure the name closely matches the original name from the SRD.
3. Add the item to the relevant compendium.

```diff 
- IMPORTANT: Ensure links point to the item in the compendium, *not* to the item in the sidebar!
```
4. Run `npm run unpack` to unpack the changes from your local system install's DB files into JSON files in your git repo.
5. Once you've finished making changes, run `npm run cook` to check you haven't made any formatting errors, and to run some final sanitization on the JSON iles.
6. (Optional) Restart Foundry and check one last time all your work looks good.
7. Submit a pull request if everything looks good. :-)

```diff
- Please don't include database files in your pull request as this can lead to merge conflicts. 
- Obviously you can still cook in order to check everything is in order, 
- but only submit your JSON files as a final cook is performed before every release.
```

## Updating existing items

The easiest workflow is to work through Foundry, just simply make the changes to the item in the compendium, then run `npm run unpack` as described in step 4 above.

Alternatively, you can make edits directly to the JSON files and save the file, and then continue the workflow from step 5 as described above.

```diff
- BE CAREFUL
- Ensure you have NOT edited any item's ID field!
- ID field edits result in your Pull Request being rejected!
```

## Deleting existing items

Sometimes, an item is in the wrong place, is a duplicate, erroneous, or there is another reason as to why it should be deleted. Because it is possible to link to items, care must be taken not to break references unnecessarily.
There is no Foundry workflow for this, and this is going to get a little more technical.

1. Open the item JSON file you wish to delete.
2. Copy the ID field value, e.g. `MkyvEJGsciB2FCD2`
3. Search the entire `src/items` directory for files containing that ID.
    1. If no results are found, no-one was referencing this item directly, and you can safely delete the JSON file.
    2. If results are found, you will have to remove all references to the item from the referencing items.
4. Update the compendium pack files, by running the following command: `npm run cook`. Alternately you can run `npm run cookNoFormattingCheck` to only cook the files, and skip validation steps. This should only be done if you need to quickly update the data and are sure of its validity.
5. Restart Foundry.
6. Check in Foundry if the compendium is updated properly.
7. Submit pull request if everything's great. :-)

## Source

Items have a source field, and this source field should be filled in. There is a format that has been decided upon to use for the value inside the Source field.

| Book | Format | Example |
| --- | --- | --- |
| Core Rulebook | CRB pg. x | CRB pg. 123 |
| Armory | AR pg. x | AR pg. 123 |
| Pact Worlds | PW pg. x | PW pg. 123 |
| Character Operations Manual | COM pg. x | COM pg. 123 |
| Starship Operations Manual | SOM pg. x | SOM pg. 123 |
| Near Space | NS pg. x | NS pg. 123 |
| Galaxy Exploration Manual | GEM pg. x | GEM pg. 123 |
| Tech Revolution | TR pg. x | TR pg. 123 |
| Galactic Magic | GM pg. x | GM pg. 123 |
| Drift Crisis | DC pg. x | DC pg. 123 |
| Interstellar Species | IS pg. x | IS pg. 123 |
| Ports of Call | PoE pg. x | PoE pg. 123 |
| Alien Archive 1 | AA1 pg. x | AA1 pg. 123 |
| Alien Archive 2 | AA2 pg. x | AA2 pg. 123 |
| Alien Archive 3 | AA3 pg. x | AA3 pg. 123 |
| Alien Archive 4 | AA4 pg. x | AA4 pg. 123 |
| Adventure path books | AP #x pg. y | AP #3 pg. 58 |
| Starfinder Society | SFS #x-y pg. z | SFS #1-2 pg. 23 |
| Starfinder Adventures | SA:xy pg. z | SA:JD pg. 61 |
| Starfinder One Shot | SOS #x pg. y | SOS #1 pg. 51 |
| Alien Card Deck | ACD | ACD |

# NPM Scripts
The following are the various scripts used for the development of the system, which automate a lot of what would otherwise be manual work. 

To run these, run `npm run SCRIPT_NAME` in your command promt while in your local repo's folder. Alternatively VSCode has a handy NPM Scripts toolbar you can enable that lets you run them all at a click of a button.

## `package`
Packs the contents of the `dist` folder into a ZIP. You shouldn't need to run this as it's only used by the system maintainer to package a new release when an update happens.

## `build`
Perform a one time build of the system. Takes the neccesary files from the `src/` folder and copies them into the `dist/` folder, as well as to your Foundry data folder if you set that up in step 2 of the initial setup.

## `buildDock`
Like build, but for Docker. I assume if you use Docker you know what you're doing, because I sure as hell don't!

## `build:watch`
Like `build` but `build:watch` automatically rebuilds the system quickly whenever you make changes to system files (.js, .less, .hbs). Very useful for code development

## `clean`
Deletes the contents of the `dist/` folder and the sym-link in your Foundry data folder if you set that up.

## `cleanDock`
Like `clean` but for Docker. Same as `buildDock` applies!

## `cook`
Everyone's favourite, `cook` takes the contents of the `src/items` and cooks them up into pretty little .db files usable with Foundry. Cook runs sanitization on JSONs to remove superfluous data to keep pack sizes down, and can find unlinked references to conditions, and if you've made any glaring formatting errors.

You can also run `cookNoFormattingCheck` to skip cook's format checking if you're in hurry.

Sometimes you are only making changes to a single compendium, such as `alien-archives`. Having to wait for the entire project to cook each time, even though nothing changed outside the alien-archives compendium data folder takes longer and just wastes electricity. You can speed up the process by only cooking the specific compendium as follows: `npm run cook -- --pack alien-archives`.

This also works for other compendiums, naturally. Just replace `alien-archives` with another pack.
This also only works with 1 pack at a time; adding more pack arguments will be ignored. If this is desired functionality, you can request it in Discord.

## `copyLocalization`

Automatically sorts localization files and copies any new strings from the edited file to the others. This means you only have to do localizations once (and you don't need to be too precise with where you put them), then you run the script, and the others are taken care of, ready for a kind contributor to translate them into that language into the future.

## `libs`
Copies various libraries the system uses into `dist/` and your system install. Shouldn't really ever need to be used as `build`does this.

## `unpack`
The yin to `cook`'s yang, `unpack` takes Foundry's db files and unpacks them into nice, human-readable JSONs, ready for you to make edits to. You'll run this after you've made new items/changes in Foundry.

## `update`
Don't use this, just run `npm ci` instead.

### Getting Foundry Intellisense in Visual Studio Code

If you would like some basic Intellisense for the Foundry types when using Visual Studio Code, all you have to do is copy `foundry.js` into the projects root folder. Once you do this, restart VS Code, and you should now see proper Intellisense.
