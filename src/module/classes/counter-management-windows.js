/**
 * Class to open the right windows to manage all counter classes
 */
export class CounterManagementWindows extends Dialog {
    constructor(dialogData={}, options={}) {
        super(dialogData, options);
        this.options.classes = ["sfrpg", "dialog"];
        this.windows = null;
    }

    /**
     * Create the windows to manage all counter classes
     * Returns a Promise which resolves to the dialog FormData once the workflow has been completed.
     */
    static async create(actorId, targetClasses,combatantId) {

        let counterClassesLabel = CONFIG.SFRPG.counterClassesLabel;

        const Actor = game.actors.get(actorId);
        const htmlContent = await renderTemplate("systems/sfrpg/templates/classes/counter-management.html", {
            counter: Actor.data.data.counterClasses.values[targetClasses].count,
            labelClasses: game.i18n.localize(counterClassesLabel[targetClasses]),
            currentPosition: Actor.data.data.counterClasses.values[targetClasses].position,
            classes: targetClasses,
            actorId:actorId,
            combatantId:combatantId,
            config: CONFIG.SFRPG,
        });

        return new Promise((resolve, reject) => {
            this.windows = new this({
                    title: game.i18n.localize('SFRPG.CounterClassesManagementWindowsTitles'),
                    content: htmlContent,
                    buttons: {},
                    default: 'save'
                }, {
                    title:game.i18n.localize('SFRPG.CounterClassesManagementWindowsTitles'),
                    width:496
            });
            this.windows.render(true);
        });
    }

    /**
     * Activate listener to manage click on button
     * @param html
     */
    activateListeners(html) {
        super.activateListeners(html);

        let solarianPosition = html.find('.counter-management-position-solarian li div img');
        solarianPosition.click(event => {
                event.preventDefault();
                const dataset = event.currentTarget.dataset;
                const classesToUpdate = {};
                const Actor = game.actors.get(dataset.actorId);
                const targetClasses = dataset.managementPosition;

                classesToUpdate['solarianAttunement'] = {
                    'count': 0,
                    'position': targetClasses,
                };

                Actor.update({
                    "data.counterClasses.values": classesToUpdate
                });

                $(".counter-management-position-input").val(targetClasses);
                $(".counter-management-counter-input").attr('value', 0);
            }
        );

        //Button to add 1 to counter
        let addButton = html.find('.counter-management-button button[name=counter-management-button-add]');
        addButton.click(event => {
            event.preventDefault();
            const dataset = event.currentTarget.dataset;
            const Actor = game.actors.get(dataset.actorId);
            const classesToUpdate = {};

            if(Actor.data.data.counterClasses.values[dataset.managementClasses].count < 3 || !(dataset.managementClasses == 'solarianAttunement')) {
                const newCounter = Actor.data.data.counterClasses.values[dataset.managementClasses].count +1;
                classesToUpdate[dataset.managementClasses] = {
                    'count': newCounter,
                    'position': Actor.data.data.counterClasses.values[dataset.managementClasses].position
                };

                $(".counter-management-position-input").val(Actor.data.data.counterClasses.values[dataset.managementClasses].position);
                $(".counter-management-counter-input").attr('value', Actor.data.data.counterClasses.values[dataset.managementClasses].count + 1);

                Actor.update({
                    "data.counterClasses.values": classesToUpdate
                });
            }
        })

        //Button to remove 1 to counter
        let removeButton = html.find('.counter-management-button button[name=counter-management-button-remove]');
        removeButton.click(event => {
            event.preventDefault();
            const dataset = event.currentTarget.dataset;
            const Actor = game.actors.get(dataset.actorId);
            const classesToUpdate = {};

            // console.log("REMOVE BUTTON");
            // console.log(Actor.data.data.counterClasses);
            if(Actor.data.data.counterClasses.values[dataset.managementClasses].count > 0) {
                 classesToUpdate[dataset.managementClasses] = {
                    'count': Actor.data.data.counterClasses.values[dataset.managementClasses].count - 1,
                    'position': Actor.data.data.counterClasses.values[dataset.managementClasses].position
                };

                $(".counter-management-position-input").val(Actor.data.data.counterClasses.values[dataset.managementClasses].position);
                $(".counter-management-counter-input").attr('value', Actor.data.data.counterClasses.values[dataset.managementClasses].count - 1);

                Actor.update({
                    "data.counterClasses.values": classesToUpdate
                });
            }
        })
    }
}