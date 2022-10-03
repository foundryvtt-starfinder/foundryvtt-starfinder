export default function (engine) {
    engine.closures.add("calculateBaseArmorClass", (fact, context) => {
        const data = fact.data;
        const armors = fact.armors?.length > 0 ? fact.armors : null;
        const shields = fact.shields;
        const eac = data.attributes.eac;
        const kac = data.attributes.kac;
        const baseTooltip = game.i18n.format("SFRPG.ACTooltipBase", { base: "10" });
        const notProfTooltip = game.i18n.format("SFRPG.ACTooltipNotProficientMod", { profMod: "-4" });

        eac.tooltip.push(baseTooltip);
        kac.tooltip.push(baseTooltip);

        if (armors || shields) {
            const worstDexArmor = armors?.reduce((armor, worstArmor) => (armor.system?.armor?.dex || 0) < (worstArmor.system?.armor?.dex || 0) ? armor : worstArmor);
            const worstDexArmorData = worstDexArmor?.system;

            // Max dex
            const shieldMinDex = shields?.sort((a, b) => a.system.dex <= b.system.dex ? -1 : 1)[0];
            let maxShieldDex = shieldMinDex?.system.dex ?? Number.MAX_SAFE_INTEGER;
            let maxArmorDex = worstDexArmorData?.armor.dex ?? Number.MAX_SAFE_INTEGER;

            const maxDex = Math.min(data.abilities.dex.mod, maxArmorDex, maxShieldDex);
            const maxDexTooltip = game.i18n.format("SFRPG.ACTooltipMaxDex", { 
                maxDex: maxDex.signedString(), 
                armorMax: worstDexArmorData?.armor.dex?.signedString() ?? game.i18n.localize("SFRPG.Items.Unlimited"),
                shieldMax: shieldMinDex?.system.dex?.signedString() ?? game.i18n.localize("SFRPG.Items.Unlimited")
            });

            const powerArmor = armors?.find(x => x?.system?.armor?.type === 'power');
            if (powerArmor) {
                const powerArmorData = powerArmor.system;
                data.abilities.str.value = powerArmorData.strength;
                data.abilities.str.mod = Math.floor((data.abilities.str.value - 10) / 2);
                data.abilities.str.tooltip = [
                    game.i18n.format("SFRPG.AbilityScoreGenericTooltip", {
                        score: game.i18n.localize("SFRPG.AbilityStr"),
                        value: data.abilities.str.value.signedString(),
                        source: powerArmor.name
                    })
                ];
                data.abilities.str.modifierTooltip = [
                    game.i18n.format("SFRPG.AbilityScoreGenericTooltip", {
                        score: game.i18n.localize("SFRPG.AbilityStr"),
                        value: data.abilities.str.mod.signedString(),
                        source: powerArmor.name
                    })
                ];
            }

            // AC bonuses
            const profMap = {
                light: "lgt",
                heavy: "hvy",
                power: "pwr",
                shield: "shl"
            };

            const actorArmorProf = data.traits?.armorProf?.value || [];
            const bestEACArmor = armors?.reduce((armor, bestArmor) => (armor.system?.armor?.eac || 0) > (bestArmor.system?.armor?.eac || 0) ? armor : bestArmor);
            let armorEac = {
                value: 0,
                armor: bestEACArmor,
                name: bestEACArmor?.name
            };

            if (bestEACArmor) {
                const armorData = bestEACArmor.system;
                
                armorEac.value = armorData?.armor?.eac || 0;

                const armorType = armorData?.armor?.type || "lgt"; // Assume light if no type selected.
                if (!armorData?.proficient && !actorArmorProf.includes(profMap[armorType])) {
                    armorEac.value -= 4;
                    eac.tooltip.push(notProfTooltip);
                }
            }

            const bestKACArmor = armors?.reduce((armor, bestArmor) => (armor.system?.armor?.eac || 0) > (bestArmor.system?.armor?.eac || 0) ? armor : bestArmor);
            let armorKac = {
                value: 0,
                armor: bestKACArmor,
                name: bestKACArmor?.name
            };

            if (bestKACArmor) {
                const armorData = bestKACArmor.system;

                armorKac.value = armorData?.armor?.kac || 0;

                const armorType = armorData?.armor?.type || "lgt"; // Assume light if no type selected.
                if (!armorData?.proficient && !actorArmorProf.includes(profMap[armorType])) {
                    armorKac.value -= 4;
                    kac.tooltip.push(notProfTooltip);
                }
            }

            let shieldBonus       = 0;
            let totalShieldBonus  = 0;
            
            if (shields) {
                shields.forEach(shield => {
                    const shieldData = shield.system;
                    const wieldBonus = shieldData.bonus.wielded || 0;

                    totalShieldBonus += wieldBonus;
                    if (shieldData.proficient) shieldBonus += wieldBonus;
                });

                if (shieldBonus !== totalShieldBonus) {
                    const shieldNotProfTooltip = game.i18n.format("SFRPG.ACTooltipNotProficientShield", { profMod: shieldBonus - totalShieldBonus });
                    eac.tooltip.push(shieldNotProfTooltip);
                    kac.tooltip.push(shieldNotProfTooltip);
                }
            }

            let eacMod = armorEac.value + shieldBonus + maxDex;
            let kacMod = armorKac.value + shieldBonus + maxDex;

            // AC
            eac.value = 10 + eacMod;
            kac.value = 10 + kacMod;

            // Max Dex
            eac.maxDex = maxDex;
            kac.maxDex = maxDex;
            
            if (armorEac.armor) eac.tooltip.push(game.i18n.format("SFRPG.ACTooltipArmorACMod", { armor: armorEac.value.signedString(), name: armorEac.name }));
            if (shields) shields.forEach(shield => eac.tooltip.push(game.i18n.format("SFRPG.ACTooltipShieldACMod", { shield: (shield.system.bonus.wielded || 0).signedString(), name: shield.name })));
            eac.tooltip.push(maxDexTooltip);

            if (armorKac.armor) kac.tooltip.push(game.i18n.format("SFRPG.ACTooltipArmorACMod", { armor: armorKac.value.signedString(), name: armorKac.name }));
            if (shields) shields.forEach(shield => kac.tooltip.push(game.i18n.format("SFRPG.ACTooltipShieldACMod", { shield: (shield.system.bonus.wielded || 0).signedString(), name: shield.name })));
            kac.tooltip.push(maxDexTooltip);
        } else {
            eac.value = 10 + data.abilities.dex.mod;
            kac.value = 10 + data.abilities.dex.mod;

            eac.tooltip.push(game.i18n.format("SFRPG.ACTooltipMaxDex", { maxDex: data.abilities.dex.mod.signedString() }));
            kac.tooltip.push(game.i18n.format("SFRPG.ACTooltipMaxDex", { maxDex: data.abilities.dex.mod.signedString() }));
        }

        return fact;
    });
}