/**
 * A custom implementation for the foundry {@link Die} class.
 */
export default class SFRPGDie extends Die {
    /** @override */
    getTooltipData() {
        return foundry.utils.mergeObject(super.getTooltipData(), {
            test: true
        });
    }
}