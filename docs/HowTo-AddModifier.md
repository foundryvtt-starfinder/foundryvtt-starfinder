# How to add a new modifier

This is a how to documentation on adding new modifiers to the system.

Written because I keep forgetting how to add them, and have to backtrack all the things constantly is getting tiresome.

## module/config.js

Extend SFRPG.modifierEffectTypes with the new type, please use the SFRPG.ActorSheet.Modifiers.EffectTypes localization structure here.

## module/modifiers/types.js

Extend SFRPGEffectType with the new type.

## module/apps/modifier-app.js

If the modifier has to have options, add them to activateListener and render() here

## templates/apps/modifier-app.hbs

If the modifier has to have options, make sure to reflect that in the select.

## templates/actors/parts/actor-modifiers.hbs

If the modifier has an effected value, double-check it properly represents here

## Remaining integration

Any remaining steps, such as integration with the right automation scripts, can now be done manually where needed.

## Localization files

Add any newly created localization keys, such as the changes to config.js, to en.json.

In the console, execute "npm run copyLocalization", this will ensure it gets copied into the other localization files.

## Test

Verify your modifier works as intended and did not break any other modifiers that you might have affected inside modifier-app.js or modifier-app.hbs.
