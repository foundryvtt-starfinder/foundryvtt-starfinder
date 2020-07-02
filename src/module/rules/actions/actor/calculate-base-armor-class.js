export default function (engine) {
    engine.closures.add("calculateBaseArmorClass", (fact, context) => {
        const data = fact.data;
        const armor = fact.armor;
        const eac = data.attributes.eac;
        const kac = data.attributes.kac;
        const baseTooltip = game.i18n.format("SFRPG.ACTooltipBase", { base: "10" });
        const notProfTooltip = game.i18n.format("SFRPG.ACTooltipNotProficientMod", { profMod: "-4" });

        eac.tooltip = [baseTooltip];
        kac.tooltip = [baseTooltip];

        if (armor) {
            const maxDex = Math.min(data.abilities.dex.mod, armor.data.armor.dex || Number.MAX_SAFE_INTEGER);
            const maxDexTooltip = game.i18n.format("SFRPG.ACTooltipMaxDex", { 
                maxDex: maxDex.signedString(), 
                armorMax: armor.data.armor.dex.signedString() 
            });
            
            let eacMod = armor.data.armor.eac + maxDex;
            let kacMod = armor.data.armor.kac + maxDex;
            
            if (!armor.data.proficient) {
                eacMod -= 4;
                kacMod -= 4;

                eac.tooltip.push(notProfTooltip);
                kac.tooltip.push(notProfTooltip);
            }

            eac.value = 10 + eacMod;
            kac.value = 10 + kacMod;
            
            eac.tooltip.push(game.i18n.format("SFRPG.ACTooltipArmorACMod", { armor: armor.data.armor.eac.signedString(), name: armor.name }));
            eac.tooltip.push(maxDexTooltip);
            kac.tooltip.push(game.i18n.format("SFRPG.ACTooltipArmorACMod", { armor: armor.data.armor.kac.signedString(), name: armor.name }));
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