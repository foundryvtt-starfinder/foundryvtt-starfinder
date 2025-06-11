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

                // Add the resource displays if they're needed
                if (additionalHtml.length !== 0) {
                    const $combatantHtml = html.querySelector(`.combatant[data-combatant-id="${combatant.id}"]`);
                    const $name = $combatantHtml.querySelector('.token-name');
                    const counterTokensDiv = document.createElement('div');
                    counterTokensDiv.classList.add('flexcol-sfrpg');
                    $name.after(counterTokensDiv);
                    counterTokensDiv.innerHTML = additionalHtml;

                    html.addEventListener('click', function(event) {
                        if (!event.target.closest('.counter-token')) return;
                        event.preventDefault();

                        const counterToken = event.target.closest('.counter-token');
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
