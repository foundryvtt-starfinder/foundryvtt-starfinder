# Welcome, Developers!

If you would like to contribute to the project then I welcome any contributions. There are plenty of things to work on, so fork the repository and start submitting pull requests!!!

In order to setup your development environment, we need to ensure that a few things are in place:

1. You'll need `node` installed on your system. You will need a version of `node` that is at least 12.x or greater. To install it, go to https://nodejs.org/en/download/ and choose an installer for your operating system. The current LTS is probably a good choice, though the current version works just as well.
2. This system uses `gulp` to process `less` into usable `css` as well as some other utilities. You will need to install `gulp` for this purpose. To install, open up your prefered command line tool and enter the following command `npm install --global gulp-cli`. This will install the `gulp` command line utilities globally.
3. You'll also need a `git` client installed. Whether that is the command line tool or something like Sourcetree or GitKraken is up to you.

With those things installed, we can work on getting the repository ready for development. The preferred method for contributing to the repository is through the typical "Pull Request" methodology. To get started, you'll need to fork the foundryvtt-starfinder repository. Once you've forked the repository, you can clone that repo to your local machine. When you are making changes, it is recommended that you create a new branch for this purpose, based off of the development branch. Once you've pushed your changes back to your forked repository, you can then create a pull request from there. 

Once you've cloned the repository to your local machine, follow these steps to get your development environment going:

1. Install the development dependencies by running the following command: `npm install`
2. Configure a `foundryconfig.json` file in the root folder of the project with a `dataPath` property. And example can be found in the `foundryconfig.example.json` file provided in the project. Just copy the file and rename it to `foundryconfig.json` and change the `dataPath`. The `dataPath` property is the file path to your Foundry installs user data. This can be found on the Configuration tab on the Setup screen.
3. Run `npm run build`. This will compile all of the `less` and copy all of the necessary files to a `dist` folder in the project root. It will also create a symbolic link to this new folder with your Foundry installs user data path. 
4. Run `npm run build:watch` while your developing so that changes are automatically synced with the `dist` folder. When you make changes to `html`, `css`, or `javascript` files, you'll need to do a page refresh in foundry to pick up the changes (F5). Any changes to `template.json` or `system.json` require you to return to the Setup screen and then reload the world.

This should be all you need to help contribute. If you have any issues, you can reach out to me on the Foundry discord.

## Contributing to the compendiums

If you want to do data entry for the project, we have a version control friendly way of managing the compendium data.
> Please be aware that this process relies on you having completed the previously mentioned setup steps.

Inside the `src/items` folder, you will find a subfolder for each compendium we have. Within these subfolders you will find a json file for each entry.

### Adding new items

The easiest workflow is to work through Foundry, and follow the following steps:
1. Create a new item in the Items sidebar tab.
2. Fill out the details, modifiers, etc. Make sure the name closely matches the original name from the SRD.
3. Right-clicking the item in the Items sidebar tab and select Export Data.
4. Save the JSON file into the appropriate compendium subfolder.
5. Open the exported JSON file in a text editor of your choice, and do some clean-up.
    1. Remove the ID field.
    2. Remove the permission field, if it is there.
    3. Remove the sort field, if it is there.
    4. Remove the exportSource section from the flags field, if it is there.
    
    Listed below is a list of regexp to help you edit .json files quickly:
    * `"_id":.*`
    * `"sort":.*`
    * `"exportSource": \{.*\s.*\s.*\s.*\s.*\s.*\}$`
6. Save and close the JSON file.
7. Update the compendium pack files, by running the following command: `npm run cook`
8. Restart Foundry.
9. Check in Foundry if the compendium is updated properly.
10. Submit pull request if everything's great. :-)

An alternative workflow, for the more tech-savvy people, would be to skip step 1-4, simply duplicate an existing JSON file, editing it, and then continuing from step 5.

### Updating existing items

The easiest workflow is to work through Foundry, and follow the following steps:
1. Create a new item in the Items sidebar tab.
2. Right-clicking the item in the Items sidebar tab and select Import Data.
3. Import the JSON file for the item you wish to make changes to.
4. Make the changes you want to make, details, modifiers, etc.
5. Right-clicking the item in the Items sidebar tab and select Export Data.
6. Save the JSON file into the appropriate compendium subfolder.
7. Open the exported JSON file in a text editor of your choice, and do some clean-up.
    1. Revert the ID field, set it to the old value.
    2. Remove the permission field, if it is there.
    3. Remove the sort field, if it is there.
    4. Remove the exportSource section from the flags field, if it is there.
8. Update the compendium pack files, by running the following command: `npm run cook`
8. Restart Foundry.
10. Check in Foundry if the compendium is updated properly.
11. Submit pull request if everything's great. :-)

Alternatively, you can make edits directly to the json files and save the file, and then continue the workflow from step 7.

> BE CAREFUL
> 
> Do NOT alter already existing IDs! Editing the ID field will break existing links to the item. ID field edits will get rejected when you submit your Pull Request!

### Deleting existing items

Sometimes, an item is in the wrong place, is duplicate, erroneous, or there is another reason as to why it should be deleted. Because it is possible to link to items, care must be taken not to break references unnecessarily.
There is no Foundry workflow for this, and this is going to get a little more technical.

1. Open the item JSON file you wish to delete.
2. Copy the ID field value, e.g. `MkyvEJGsciB2FCD2`
3. Search the entire `src/items` directory for files containing that ID.
    1. If no results are found, no-one was referencing this item directly, and you can safely delete the JSON file.
    2. If results are found, you will have to remove all references to the item from the referencing items.
4. Update the compendium pack files, by running the following command: `npm run cook`
8. Restart Foundry.
6. Check in Foundry if the compendium is updated properly.
7. Submit pull request if everything's great. :-)
