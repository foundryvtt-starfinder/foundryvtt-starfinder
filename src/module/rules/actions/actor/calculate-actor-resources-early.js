import { SFRPGModifierType, SFRPGModifierTypes, SFRPGEffectType } from "../../../modifiers/types.js";

export default function(engine) {
    engine.closures.add('calculateActorResources', (fact, context) => {
        const data = fact.data;
        const actorResources = fact.actorResources.filter(x => x.system.stage !== "late");
        const modifiers = fact.modifiers;

        const addModifier = (bonus, data, item, localizationKey) => {
            if (bonus.modifierType === SFRPGModifierType.FORMULA) {
                if (item.rolledMods) {
                    item.rolledMods.push({mod: bonus.modifier, bonus: bonus});
                } else {
                    item.rolledMods = [{mod: bonus.modifier, bonus: bonus}];
                }

                return 0;
            }

            let computedBonus = 0;
            try {
                const roll = Roll.create(bonus.modifier.toString(), data).evaluate({maximize: true});
                computedBonus = roll.total;
            } catch {

            }

            if (computedBonus !== 0 && localizationKey) {
                item.tooltip.push(game.i18n.format(localizationKey, {
                    type: bonus.type.capitalize(),
                    mod: computedBonus.signedString(),
                    source: bonus.name
                }));
            }

            return computedBonus;
        };

        const actorResourceMods = modifiers.filter(mod => {
            return (mod.enabled || mod.modifierType === "formula") && [SFRPGEffectType.ACTOR_RESOURCE].includes(mod.effectType);
        });

        for (const actorResource of actorResources) {
            const resourceData = actorResource.system;
            if (resourceData.enabled && resourceData.type && resourceData.subType && (resourceData.base || resourceData.base === 0)) {
                const modifierKey = `${resourceData.type}.${resourceData.subType}`;
                const filteredMods = actorResourceMods.filter(mod => mod.valueAffected === modifierKey);
                const processedMods = context.parameters.stackModifiers.process(filteredMods, context);

                if (!data.resources) {
                    data.resources = {};
                }

                if (!data.resources[resourceData.type]) {
                    data.resources[resourceData.type] = {};
                }

                if (!data.resources[resourceData.type][resourceData.subType]) {
                    data.resources[resourceData.type][resourceData.subType] = {};
                }

                const finalActorResource = {
                    base: resourceData.base,
                    value: resourceData.base,
                    rolledMods: [],
                    source: actorResource.id,
                    tooltip: []
                };

                data.resources[resourceData.type][resourceData.subType] = finalActorResource;

                // Post mode only performs clamping at the end. Immediate mode clamps at every step along the way.
                if (resourceData.range.mode === "post") {
                    // First apply all modifiers
                    const resourceMod = Object.entries(processedMods).reduce((sum, curr) => {
                        if (curr[1] === null || curr[1].length < 1) return sum;

                        if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(curr[0])) {
                            for (const bonus of curr[1]) {
                                sum += addModifier(bonus, data, finalActorResource, "SFRPG.ACTooltipBonus");
                            }
                        }
                        else {
                            sum += addModifier(curr[1], data, finalActorResource, "SFRPG.ACTooltipBonus");
                        }

                        return sum;
                    }, 0);

                    finalActorResource.value = finalActorResource.base + resourceMod;

                    // Finally, clamp value at the very end
                    if (resourceData.range.min || resourceData.range.min === 0) {
                        finalActorResource.value = Math.max(finalActorResource.value, resourceData.range.min);
                    }

                    if (resourceData.range.max || resourceData.range.max === 0) {
                        finalActorResource.value = Math.min(finalActorResource.value, resourceData.range.max);
                    }
                } else {
                    // First, clamp base value
                    if (resourceData.range.min || resourceData.range.min === 0) {
                        finalActorResource.value = Math.max(finalActorResource.value, resourceData.range.min);
                    }

                    if (resourceData.range.max || resourceData.range.max === 0) {
                        finalActorResource.value = Math.min(finalActorResource.value, resourceData.range.max);
                    }

                    // Next, iterate each modifier, and re-clamp value.
                    for (const [key, mod] of Object.entries(processedMods)) {
                        if (mod === null || mod.length < 1) continue;

                        let resourceMod = 0;
                        if ([SFRPGModifierTypes.CIRCUMSTANCE, SFRPGModifierTypes.UNTYPED].includes(key)) {
                            for (const bonus of mod) {
                                resourceMod = addModifier(bonus, data, finalActorResource, "SFRPG.ACTooltipBonus");
                            }
                        }
                        else {
                            resourceMod = addModifier(mod, data, finalActorResource, "SFRPG.ACTooltipBonus");
                        }

                        finalActorResource.value = finalActorResource.base + resourceMod;
                        if (resourceData.range.min || resourceData.range.min === 0) {
                            finalActorResource.value = Math.max(finalActorResource.value, resourceData.range.min);
                        }

                        if (resourceData.range.max || resourceData.range.max === 0) {
                            finalActorResource.value = Math.min(finalActorResource.value, resourceData.range.max);
                        }
                    }
                }
            }
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}
