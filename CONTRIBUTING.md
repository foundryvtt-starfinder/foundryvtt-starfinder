# Welcome, Developers!

If you would like to contribute to the project then we welcome any contributions. There are plenty of things to work on, so fork the repository and start submitting pull requests!!!

> [!NOTE]
> The maintainers of this project all use Windows as an OS and the Visual Studio Code (VS Code) IDE, so the instructions here will likewise assume you are using it unless otherwise stated. You do not have to use this OS or IDE, just be aware that if you are using another OS you may need to modify some of the following instructions for the setup process to work.



# General Setup Process

This section details the general setup process from start to finish for new developers interested in contributing to the Starfinder system.

## Dependency program installation

Before getting to anything related to the Starfinder system, you'll need to install some programs that the development process requires.

1. You'll need `node` installed on your system. You will need a version of `node` that is at least 24.x or greater. To install it, go to [the Node.js downloads page](https://nodejs.org/en/download/) and choose an installer for your operating system. The current LTS is probably a good choice, though the current version works just as well.
2. You'll also need a `git` client installed; whether that is the [command line tool](https://cli.github.com) or something like [Sourcetree](https://www.sourcetreeapp.com) or [GitKraken](https://www.gitkraken.com) is up to you.
Your integrated development environment (IDE) may also include git integration; please refer to the documentation available for the IDE for how to set this up.
3. Install an Integrated Development Environment (IDE) to edit code, debug, etc. We recommend [VS Code](https://code.visualstudio.com/download).

## Contributing through Forks and Pull Requests

With those things installed, we can work on getting the repository ready for development. The preferred method for contributing to the repository is through the typical ["Pull Request"](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) methodology. To get started, you'll need to [fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/about-forks) the `foundryvtt-starfinder` repository. Once you've forked the repository, you can clone that repo to your local machine (instructions below). When you are making changes, it is recommended that you [create a new branch](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-and-deleting-branches-within-your-repository) for this purpose, based off of the development branch. After your changes are pushed back to your forked repository, you can then create a pull request from there.

## Setting up installation and data folders

> [!NOTE]
> You do not need to set up your installation in the manner described here, it is only the recommended method. If you prefer to organize things differently, then feel free to do so. All folder and file names can be different if you so choose, we'll just be referencing them as they are written in this section.

To avoid conflicts between your "live" Foundry installation and data (i.e. the install and data used to run your live game), we recommend creating a separate Foundry installation solely for development using the Node.js version of Foundry. To begin, create a `Foundry-Dev` folder somewhere where you have permissions to execute programs (e.g. in `C:/Users/username/`, where "username" is your Windows account name).

Within the newly created `Foundry-Dev` folder, do the following:

1. Download the installer for the current stable Foundry version, Node.js Operating System, from the FoundryVTT website. Extract the downloaded zip file to a new folder called `foundryvtt-install`.
<img width="662" height="287" alt="image" src="https://github.com/user-attachments/assets/c2868763-e2ac-4942-b6fa-5755ac9a9833" />

2. Create an empty `user-data` folder to store user data (worlds, systems, modules, etc.).
3. Create a `foundry-launch.bat` batch file with the text below. Executing this file will automatically launch a Foundry server with the correct configuration in a new command window. Closing the window will close the Foundry server. You may need to change this file type or the code within if using a non-Windows operating system.

```sh
cd "C:\Users\username\Foundry-Dev"
node foundryvtt-install\main.js --port=30000 --dataPath=./user-data
```

4. Finally, clone your forked repository into its own folder (default: `foundryvtt-starfinder`). To clone a github repository locally using VS Code, [follow these instructions](https://code.visualstudio.com/docs/sourcecontrol/repos-remotes#_clone-repositories).

Once this process is complete, you should have a `Foundry-Dev` folder that contains the following within it:
<img width="782" height="195" alt="image" src="https://github.com/user-attachments/assets/41503927-47f2-471d-ae1e-671e7a276ac7" />

## Set up symlinks and configure the `src->dist` pipeline

The Starfinder system uses a build process (vite) to convert the source code edited during programming to distribution code and data compendiums that are installed by users and run by Foundry VTT. To manage this process, `npm` and a number of scripts are used, and a symbolic link (symlink) is set up between the `user-data/Data/systems/sfrpg/` folder and your code's `dist` folder to remove the need to manually copy files each time changes are made. To get an initial build set up that can be run for testing, follow these steps.

> [!NOTE]
> For Windows users: To make a symlink (while running `npm run link` in Step 3), you may need to run your command line/terminal program with administrator privileges.
> Also for Windows users: You may need to give Windows permissions to run local unsigned scripts if you receive permission errors when trying to run `npm` scripts. To do so, open powershell as an administrator and run the command `Set-ExecutionPolicy RemoteSigned`. [This website](https://dev.to/jackfd120/resolving-npm-execution-policy-error-in-powershell-a-step-by-step-guide-for-developers-32ip) includes full details of what that does.

1. Install the development dependencies by running the following command: `npm ci`
2. If you already have the Starfinder RPG System installed in your development `user-data/Data/systems` folder, uninstall it so that the next steps will properly set up your symlink.
3. Run `npm run link` to create a symbolic link between the `dist` folder and your Foundry data folder. When prompted, enter the file path to where your install's user data folder resides (`C:\Users\username\Foundry-Dev\user-data\Data` if you followed the naming conventions in the previous sections, replacing "username" with yours). This can be found on the Configuration tab on the Setup screen.
4. Run `npm run build`. This will do a one-time compile of all the `less` files and copy all the necessary code and template files to a `dist` folder in the project root. Because you created a symbolic link to this `dist` folder within, the compiled and copied files will also appear in your Foundry `Data/systems/sfrpg` folder. Neat!

To launch Foundry, simply run the `foundry-launch.bat` file and open a web browser to `http://localhost:30000/`.

To have the system dynamically recompile/copy changed files and serve them as you are developing, you can use `npm run build:watch`. Note that you must launch your Foundry server before running this command. When you make changes to `.hbs`, `.less`, or `.js` files, you'll need to do a page refresh in Foundry to pick up the changes (F5). Any changes to `system.json` require you to return to the Setup screen and then reload the world, and any creation of new files within the `static` folder will require you to run `npm run build` to capture them.

> [!NOTE]
> This command only displays anything in the console as you are actively making changes; running it without making changes will result in it appearing to be hanging.

This should be all you need to help contribute. If you have any issues, you can reach out to us on the Foundry Discord in the `#sf1e` channel, either directly in the channel or in the `development` thread.

## (Optional) Additional Visual Studio Code Integration

Visual Studio Code (VS Code) is the most commonly used IDE by the system developers, and so a few handy integrations have been added to the system. You may find these helpful.

### Getting Foundry Intellisense in Visual Studio Code

If you would like some basic Intellisense for the Foundry types when using Visual Studio Code, follow the following steps:

1. Create a copy of `foundry-config.example.json` and rename it to `foundry-config.json`
2. Edit the `installPath` property of `foundry-config.json` to point to the folder where your Foundry installation is located. This should be the folder containing the "Backups", "Config", "Data", and "Logs" folders (`C:\Users\username\Foundry-Dev\user-data` if you followed the naming conventions in the previous sections, replacing "username" with yours).
3. Navigate your terminal application of choice to your repository's root folder and run `npm run setupIntellisense`
4. Restart VS Code

### Enabling Debugging with the VS Code Debugger & Google Chrome

If you would like to debug the system code using the VS Code debugger and breakpoints via the Google Chrome browser, you can do so by setting up a correctly configured `launch.json` file in the `.vscode/` folder. To do so, create a copy of `launch.example.json` in the `.vscode/` folder, and rename it `launch.json`.

You should now see options to run and debug the code on VS Code's *Run and Debug* tab. Make sure to build the source code using `build` or `build:watch` before starting debugging.

> There are two versions of the debugging, one for if the system has been built most recently using the `build` command, and one for if `build:watch` is currently running (to connect to the proxy served by Vite at `http://localhost:30001`). You can select which one to use via a dropdown menu on the Run and Debug tab. If the debugging isn't working as expected, make sure you're using the correct debug method!



# Contributing to Compendiums

> [!NOTE]
> Please be aware that this process relies on you having completed the previously mentioned setup steps in General Setup.

If you want to do data entry for the project, we have a version control friendly way of managing the compendium data. Inside the `src/items` folder, you will find a subfolder for each compendium we have. Within these subfolders you will find a JSON file for each document. Note that a "document" in this context refers to any data object stored on a Foundry server in a sidebar tab, compendium, or within another document. These include actors, items, scenes, macros, rollable tables, journal entries, etc. The `src/items` folder contains compendium data for all document types, not just items (we need to update that folder name to `src/documents` one day).

## Adding new documents

The easiest workflow is to create the document in Foundry and "unpack" it into a JSON file. To do so, follow the following steps:
1. Create a new document in the appropriate sidebar tab (Items for items, Actors for actors, etc.).
2. Fill out the details, description, modifiers, image, etc. Make sure the name matches the original name from [Archives of Nethys](https://www.aonsrd.com/) exactly.
> Due to Paizo's extremely permissive licensing of their material, we can include any characters, aliens, starships, vehicles, classes, features, equipment, etc. from rulebooks, Adventure Paths, and Starfinder Society products, but we are NOT allowed to include artwork directly from these publications in the system without permission. For items, you can leave the image as the default OR select one of the icons that is included in the Starfinder system or Foundry base data. You may also add new images but ONLY if they were created by a human, have a license that allows free use, and are properly attributed. **AI-generated artwork is explicitly disallowed by Paizo's policies, and we will not accept any PRs that contain it**.

4. Drag the document to the relevant compendium & folder when complete. If that compendium is locked, unlock it first, and click to indicate that you understand that the compendiums are overwritten during system updates.
5. Continue making additional documents using this process as needed to complete the data entry.

> [!IMPORTANT]
> Ensure links to documents point to that document's instance in the compendium, *not* to a document in the sidebar!

Once you have finished entering data for all the new documents you wish to create, return to the Foundry admin page/setup screen (or close it completely) before doing the next steps.

6. Run `npm run unpack` to unpack the changes from your local system install's DB files into JSON files in your git repo.
    1. You can also unpack a single compendium rather than all of them by adding the `--pack=XXX` option, where `XXX` is the name of the pack in the `src/items` folder.
    2. e.g. to only unpack the Equipment compendium, you would run `npm run unpack --pack=equipment`
7. Once you've finished making changes, run `npm run cook` to check you haven't made any formatting errors, and to run some final sanitization on the JSON files.
    1. You can also cook a single compendium rather than all of them by adding the `--pack=XXX` option, where `XXX` is the name of the pack in the `src/items` folder.
    2. e.g. to only cook the Equipment compendium, you would run `npm run cook --pack=equipment`
8. (Optional) Restart Foundry and check one last time all your work looks good.
9. Commit the changes made to a new branch and submit a pull request if they look good.

## Updating existing items

The easiest workflow is to work through Foundry, as you would if adding new items, but simply make any changes to each document you want to edit _directly_ in the compendium (i.e. without importing them to the sidebar first), then follow steps 6-9 above. Importing the document to the sidebar creates a new instance with a different `id` field. Trying to then add this back to the compendium and overwriting the original will use the new `id`, breaking any links to it in other documents.

> [!CAUTION]
> Ensure you have NOT edited any document's `id` field! ID field edits result in your Pull Request being rejected!

Alternatively, you can make edits directly to the JSON files and save the file, and then continue the workflow from step 7 above. This method should generally only be used if making simple changes, or when making repeated bulk changes to many documents.

## Deleting existing items

Sometimes, a document is in the wrong place, is a duplicate, erroneous, or there is another reason as to why it should be deleted. Because it is possible to link to docuuments within other documents, care must be taken not to break references unnecessarily. There is no Foundry workflow for this, and as such is a little more technical.

1. Before beginning, return to the Foundry admin/setup page and/or shut down the server completely.
2. Open the JSON file of the document you wish to delete in your IDE.
3. Copy the `id` field value, e.g. `MkyvEJGsciB2FCD2`
4. Search the entire `src/items` directory for files containing that ID, updating them as necessary.
    1. If no results are found, no other document references this one directly, and you can safely delete the JSON file.
    2. If results are found, you will have to remove all references to the document from the referencing document before deleting the JSON file.
5. Update the compendium pack files by running `npm run cook`.
6. Restart Foundry.
7. Check in Foundry if the compendium is updated properly.
8. Commit the changes made to a new branch and submit a pull request if they look good.

## Source

Items have a source field, and this source field should be filled in. There is a format that has been decided upon to use for the value inside the Source field, where **bold** letters indicate characters to fill in based on the particular source. For a full list of all Adventure Path, Adventure, One-Shot, and Society Scenario codes, check `data-sources.md`.

| Book | Format | Example |
| --- | --- | --- |
| Core Rulebook | CRB pg. **x** | CRB pg. **123** |
| Alien Archive 1 | AA1 pg. **x** | AA1 pg. **123** |
| Alien Archive 2 | AA2 pg. **x** | AA2 pg. **123** |
| Alien Archive 3 | AA3 pg. **x** | AA3 pg. **123** |
| Alien Archive 4 | AA4 pg. **x** | AA4 pg. **123** |
| Pact Worlds | PW pg. **x** | PW pg. **123** |
| Armory | AR pg. **x** | AR pg. **123** |
| Character Operations Manual | COM pg. **x** | COM pg. **123** |
| Near Space | NS pg. **x** | NS pg. **123** |
| Starship Operations Manual | SOM pg. **x** | SOM pg. **123** |
| Galaxy Exploration Manual | GEM pg. **x** | GEM pg. **123** |
| Tech Revolution | TR pg. **x** | TR pg. **123** |
| Galactic Magic | GM pg. **x** | GM pg. **123** |
| Drift Crisis | DC pg. **x** | DC pg. **123** |
| Interstellar Species | IS pg. **x** | IS pg. **123** |
| Ports of Call | PoC pg. **x** | PoC pg. **123** |
| Starfinder Enhanced | EN pg. **x** | pg. **123** |
| Dead Suns (hardcover compilation) | DS pg. **x** | DS pg. **123** |
| Scoured Stars (hardcover compilation) | SS pg. **x** | SS pg. **123** |
| Mechageddon | MG pg. **x** | MG pg. **123** |
| Adventure Path books | AP #**y** pg. **x** | AP #**3** pg. **58** |
| Starfinder Adventures | SA:**abc** pg. **x** | SA:**JD** pg. **61** |
| Starfinder One-Shot | SOS #**y** pg. **x** | SOS #**1** pg. **51** |
| Starfinder Society | SFS #**y**-**z** pg. **x** | SFS #**1**-**2** pg. **23** |
| Alien Card Deck | ACD | ACD |



# NPM Scripts
The following are the various scripts used for the development of the system, which automate a lot of what would otherwise be manual work.

To run these, run `npm run SCRIPT_NAME` in your command promt while in your local repo's folder. Alternatively VSCode has a handy NPM Scripts toolbar you can enable that lets you run them all at a click of a button.

## `build`
Perform a one time build of the system, using Vite's build functionality. Checks whether the system compendiums exist, and cooks them if they do not. Then takes the necessary files from the `src/` and `static/` folders for the system to work and copies them into the `dist/` folder.

## `build:watch`
Like `build` but `build:watch` automatically rebuilds the system quickly whenever you make changes to system files (.js, .less, .hbs). Runs via Vite's `serve` functionality, so must be connected to on `http://localhost:30001` rather than at the normal port (`http://localhost:30000` by default). Very useful for code development.

> Note that `build:watch` can only be used while a Foundry server instance is running, or else it will error.

## `clean`
Deletes the contents of the `dist/` folder.

## `cook`
Everyone's favourite, `cook` takes the contents of the `src/items` and cooks them up into pretty little .db files usable with Foundry. Cook runs sanitization on JSONs to remove superfluous data to keep pack sizes down, finds unlinked references to conditions (*currently non-working, v0.29.0*), and checks if you've made any glaring formatting errors (*currently non-working, v0.29.0*).

Sometimes you are only making changes to a single compendium, such as `alien-archives`. Having to wait for the entire project to cook each time, even though nothing changed outside the alien-archives compendium data folder, takes longer and just wastes electricity. You can speed up the process by only cooking the specific compendium as follows: `npm run cook --pack=alien-archives`.

This also works for other compendiums; just replace `alien-archives` with another pack. Currently, this only works with 1 pack at a time; additional pack arguments will be ignored.

## `copyLocalization`

Automatically sorts localization files and copies any new strings from the edited file to the others. This means you only have to do localizations once (and you don't need to be too precise with where you put them), then you run the script, and the others are taken care of, ready for a kind contributor to translate them into that language into the future.

## `link`

Prompts the user for the installation location of their Foundry data folder, and creates a symbolic link for the sfrpg system to the `dist/` folder in the code repository folder.

## `lint`

Checks the system code for style violations, and reports warnings and errors in the console.

## `package`
Packs the contents of the `dist/` folder into a .zip file. You shouldn't need to run this as it's only used by the system maintainers to package a new release when an update happens.

## `setupIntellisense`

Link to your foundry installation to add some basic Intellisense support for the Foundry types when using Visual Studio Code. Requires a specific set of steps to implement, see the **Getting Foundry Intellisense in Visual Studio Code** section below for instructions.

## `unpack`
The yin to `cook`'s yang, `unpack` takes Foundry's compendium files and unpacks them into nice, human-readable JSONs, ready for you to make edits to. You'll run this after you've made new items/changes in Foundry. Similar to `cook`, you can unpack just a single compendium by adding the `--pack=XXX` option, where `XXX` is the name of the pack as found in the `src/items` folder.



# Package Release Process (for maintainers only)

The steps below indicate step-by-step what to do to release a new version of the game system. This should only need to be done by package maintainers.

1. In the `development` branch:
    1. Update `changelist.md` with the changes included in the version and commit them. For major changes, try to indicate the contributor when possible (it's nice to give people credit :D ).
2. On Github:
    1. Create a new release with the desired version number of the new release as the tag (don't include a `v` in front of the version number), and target the `development` branch. Include the changelist for this version in the release notes. Make sure the option to set as latest release is selected for a non-beta release. The name of the release can be anything relevant.
    2. Allow the automatic Github actions to run.
        1. This should take 5-10 minutes and will set all version numbers and url's in `system.json` to the correct values, update the localization files, cook the data packs, build the system, package everything into a .zip file, and then attach `system.json` and the .zip file to the release. It will then push and commit the changes made into `development` (localizations and `json` changes, specifically), and then merge `development` into the `master` branch.
3. On the Foundry package admin website, add the new system version and the appropriate links. It may also be necessary to update download links for older versions.
