# Welcome, Developers!

If you would like to contribute to the project then I welcome any contributions. There are plenty of things to work on, so fork the repository and start submitting pull requests!!!

In order to setup your development environment, we need to ensure that a few things are in place:

1. You'll need `node` installed on your system. You will need a version of `node` that is at least 12.x or greater. To install it, go to https://nodejs.org/en/download/ and choose an installer for your operating system. The current LTS is probably a good choice, though the current version works just as well.
2. This system uses `gulp` to process `less` into usable `css` as well as some other utilities. You will need to install `gulp` for this purpose. To install, open up your prefered command line tool and enter the following command `npm install --global gulp-cli`. This will install the `gulp` command line utilities globally.
3. You'll also need a `git` client installed. Whether that is the command line tool or something like Sourcetree or GitKraken is up to you.

With those things installed, we can work on getting the repository ready for development. The prefered method for contributing to the repository is through the typical "Pull Request" methodology. To get started, you'll need to fork the foundryvtt-starfinder repository. Once you've forked the repository, you can clone that repo to your local machine. When you are making changes, it is recommended that you create a new branch for this purpose, based off of the development branch. Once you've pushed your changes back to your forked repository, you can then create a pull request from there. 

Once you've cloned the repository to your local machine, follow these steps to get your development environment going:

1. Install the development dependencies by running the following command: `npm install`
2. Configure a `foundryconfig.json` file in the root folder of the project with a `dataPath` property. And example can be found in the `foundryconfig.example.json` file provided in the project. Just copy the file and rename it to `foundryconfig.json` and change the `dataPath`. The `dataPath` property is the file path to your Foundry installs user data. This can be found on the Configuration tab on the Setup screen.
3. Run `gulp build`. This will compile all of the `less` and copy all of the necesarry files to a `dist` folder in the project root. It will also create a symbolic link to this new folder with your Foundry installs user data path. 
4. Run `gulp build:watch` while your developing so that changes are automatically synced with the `dist` folder. When you make changes to `html`, `css`, or `javascript` files, you'll need to do a page refresh in foundry to pick up the changes (F5). Any changes to `template.json` or `system.json` require you to return to the Setup screen and then reload the world.

This should be all you need to help contribute. If you have any issues, you can reach out to me on the Foundry discord.