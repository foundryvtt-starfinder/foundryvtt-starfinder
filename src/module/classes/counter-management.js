export default class CounterManagement {

    setup() {
        Hooks.on('renderCombatTracker', async (app, html, options) => {
            const combatants = this._getCombatants();

            for (const combatant of combatants) {
                const currentActor = combatant.actor;
                
                const displayedResources = currentActor.getResourcesForCombatTracker();
                if (displayedResources.length === 0) {
                    continue;
                }

                let additionalHtml = "";
                for (const displayedResource of displayedResources) {
                    const resourceValue = currentActor.getResourceComputedValue(displayedResource.data.data.type, displayedResource.data.data.subType);

                    additionalHtml += `<a class='combatant-control-counter counter-token' data-combatant-id='${combatant.id}' data-actor-resource-id='${displayedResource.id}' title='${displayedResource.name}'>`;
                    additionalHtml += `<img class='counter-token-image' src='${displayedResource.img}' />`;
                    additionalHtml += `<p>${resourceValue}</p>`;
                    additionalHtml += "</a>";
                }

                const $combatantHtml = html.find(`.combatant[data-combatant-id="${combatant.id}"]`);
                $combatantHtml.addClass('counter-image-relative');
                $combatantHtml.addClass('flexcol');
                $combatantHtml.removeClass('flexrow');

                $combatantHtml.find('.token-image').before('<div id="foundry-elements" class="flexrow"></div>');
                const $div = $combatantHtml.find('#foundry-elements');

                $combatantHtml.find('.token-image').detach().appendTo($div);
                $combatantHtml.find('.token-name').detach().appendTo($div);
                $combatantHtml.find('.token-initiative').detach().appendTo($div);

                $div.after('<div id="counter-tokens" class=""></div>');
                const $counterTokens = $combatantHtml.find('#counter-tokens');
                $counterTokens.append(additionalHtml);

                //$combatantHtml.find('.token-effects').before(additionalHtml);

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
