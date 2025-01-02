export default class CounterManagement {

    setup() {
        Hooks.on('renderCombatTracker', async (app, html, options) => {
            const combatants = this._getCombatants();

            for (const combatant of combatants) {
                const currentActor = combatant.actor;
                if (!currentActor) {
                    continue;
                }

                const displayedResources = currentActor.getResourcesForCombatTracker();
                if (displayedResources.length === 0) {
                    continue;
                }

                let additionalHtml = "";
                for (const displayedResource of displayedResources) {
                    const resourceValue = currentActor.getResourceComputedValue(displayedResource.system.type, displayedResource.system.subType);

                    if (displayedResource.system.combatTracker.showOwnerAndGMOnly) {
                        if (!game.user.isGM && !currentActor.isOwner) {
                            continue;
                        }
                    }

                    let title = displayedResource.name;
                    let image = displayedResource.img;
                    let displayValue = resourceValue;

                    if (displayedResource.system.combatTracker.displayAbsoluteValue) {
                        displayValue = Math.abs(displayValue);
                    }

                    if (displayedResource.system.combatTracker.visualization) {
                        for (const visualizationEntry of displayedResource.system.combatTracker.visualization) {
                            switch (visualizationEntry.mode) {
                                case 'eq':
                                    if (resourceValue === visualizationEntry.value) {
                                        title = visualizationEntry.title || title;
                                        image = visualizationEntry.image || image;
                                    }
                                    break;
                                case 'neq':
                                    if (resourceValue !== visualizationEntry.value) {
                                        title = visualizationEntry.title || title;
                                        image = visualizationEntry.image || image;
                                    }
                                    break;
                                case 'gt':
                                    if (resourceValue > visualizationEntry.value) {
                                        title = visualizationEntry.title || title;
                                        image = visualizationEntry.image || image;
                                    }
                                    break;
                                case 'gte':
                                    if (resourceValue >= visualizationEntry.value) {
                                        title = visualizationEntry.title || title;
                                        image = visualizationEntry.image || image;
                                    }
                                    break;
                                case 'lt':
                                    if (resourceValue < visualizationEntry.value) {
                                        title = visualizationEntry.title || title;
                                        image = visualizationEntry.image || image;
                                    }
                                    break;
                                case 'lte':
                                    if (resourceValue <= visualizationEntry.value) {
                                        title = visualizationEntry.title || title;
                                        image = visualizationEntry.image || image;
                                    }
                                    break;
                            }
                        }
                    }

                    additionalHtml += `<a class='combatant-control-counter counter-token' data-combatant-id='${combatant.id}' data-actor-resource-id='${displayedResource.id}' title='${title}'>`;
                    additionalHtml += `<img class='counter-token-image' src='${image}' />`;
                    additionalHtml += `<p>${displayValue}</p>`;
                    additionalHtml += "</a>";
                }

                // If no additional HTML needs to be added, we can exit early. This can happen when the resources are all set to only show for owner and GM, and local user is neither.
                if (additionalHtml.length === 0) {
                    continue;
                }

                // Rearrange the items in the combat tracker so they appear in the right places
                const $combatantHtml = html.find(`.combatant[data-combatant-id="${combatant.id}"]`);
                $combatantHtml.addClass('counter-image-relative');

                $combatantHtml.find('.token-image').before('<div id="initiative-wrapper" class="flexcol"><div id="foundry-elements" class="flexrow"></div></div>');
                const $div = $combatantHtml.find('#foundry-elements');

                $combatantHtml.find('.token-image').detach()
                    .appendTo($div);
                $combatantHtml.find('.token-name').detach()
                    .appendTo($div);
                $combatantHtml.find('.token-resource').detach()
                    .appendTo($combatantHtml);
                $combatantHtml.find('.token-initiative').detach()
                    .appendTo($combatantHtml);

                // Add classes to the token resource and initiative divs so they are vertically centered
                $combatantHtml.find('.token-resource').addClass('flexcol');
                $combatantHtml.find('.token-initiative').addClass('flexcol');
                $combatantHtml.find('.resource').addClass('flex0');
                $combatantHtml.find('.initiative').addClass('flex0');

                // Add the resource displays
                $div.after('<div id="counter-tokens" class=""></div>');
                const $counterTokens = $combatantHtml.find('#counter-tokens');
                $counterTokens.append(additionalHtml);

                html.on('click', '.counter-token', function(event) {
                    event.preventDefault();

                    const counterToken = event.currentTarget;
                    const combatantId = counterToken.dataset.combatantId;

                    const combatant = game.combat.combatants.get(combatantId);
                    if (combatant) {
                        const actorResourceId = counterToken.dataset.actorResourceId;
                        const actorResource = combatant.actor.items.get(actorResourceId);
                        if (actorResource) {
                            actorResource.sheet.render(true);
                        }
                    }
                });
            }
        });
    }

    _getCombatants() {
        const combatants = [];

        if (game.combat?.combatants) {
            for (const combatant of game.combat.combatants.values()) {
                combatants.push(combatant);
            }
        }

        return combatants;
    }
}
