import { SFRPG } from "../../../config.js";

export default function (engine) {
    engine.closures.add("calculateDroneMods", (fact, context) => {
        const data = fact.data;
        const mods = fact.mods;

        data.attributes.arms = 0;
        data.attributes.weaponMounts.melee = 0;
        data.attributes.weaponMounts.ranged = 0;
        data.attributes.armorSlots.current = 0;
        data.attributes.armorSlots.max = 0;
        data.traits.senses = "";

        // Process common mod properties
        for (let mod of mods) {
            if (mod.data.arms.number > 0) {
                if (mod.data.arms.armType === "general") {
                    data.attributes.arms += mod.data.arms.number;
                }
                if (mod.data.arms.armType === "melee") {
                    data.attributes.weaponMounts.melee = mod.data.arms.number;
                }
                if (mod.data.arms.armType === "ranged") {
                    data.attributes.weaponMounts.ranged = mod.data.arms.number;
                }
            }

            if (mod.data.additionalMovement) {
                if (data.attributes.speed.special) {
                    data.attributes.speed.special += ", ";
                }
                data.attributes.speed.special += mod.data.additionalMovement;
            }

            if (mod.data.additionalSenses) {
                if (data.traits.senses) {
                    data.traits.senses += ", ";
                }
                data.traits.senses += mod.data.additionalSenses;
            }

            if (mod.data.isArmorSlot) {
                data.attributes.armorSlots.max += 1;
            }

            if (mod.data.weaponProficiency) {
                if (!data.traits.weaponProf.value.includes(mod.data.weaponProficiency)) {
                    data.traits.weaponProf.value.push(mod.data.weaponProficiency);
                }
            }
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}