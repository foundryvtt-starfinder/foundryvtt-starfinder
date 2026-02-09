/**
 * Calculate mech statistics from component items (frame, limbs, power core).
 * Based on Starfinder Tech Revolution mech rules.
 *
 * Formulas (Tech Revolution pg. 98):
 * - HP: Base HP from frame and limbs + (HP Advancement from frame and limbs × tier)
 * - SP: See tier table
 * - Hardness: Hardness from frame + hardness bonus from tier table
 * - AC: Base AC from tier table + bonuses from frame and limbs
 * - Saving Throws: Base save bonus from tier table + bonuses from frame and lower limbs
 * - Attack Bonus: Base attack bonus from tier table + operator's BAB/Piloting + bonuses from upper limbs
 * - Damage Modifier: Tier (+ Strength modifier for melee attacks)
 * - Strength Modifier: Strength modifier from tier table + bonus from frame
 */
export default function(engine) {
    engine.closures.add("calculateMechComponents", (fact, context) => {
        const data = fact.data;
        const items = fact.items;

        // Get component items
        const frame = items.find(i => i.type === "mechFrame");
        const lowerLimb = items.find(i => i.type === "mechLowerLimb");
        const upperLimb = items.find(i => i.type === "mechUpperLimb");
        const powerCore = items.find(i => i.type === "mechPowerCore");

        const tier = Math.max(1, Math.min(20, data.details.tier || 1));

        // Get base stats from tier table (Tech Revolution pg. 98)
        const tierStats = CONFIG.SFRPG.mechStatsByTier[tier] || CONFIG.SFRPG.mechStatsByTier[1];

        // Initialize tooltips for calculated values
        data.attributes.hp.tooltip = [];
        data.attributes.sp.tooltip = [];
        data.attributes.eac.tooltip = [];
        data.attributes.kac.tooltip = [];
        data.attributes.strength.tooltip = [];
        data.attributes.attackBonus.tooltip = [];
        data.attributes.fort = data.attributes.fort || { value: 0, tooltip: [] };
        data.attributes.ref = data.attributes.ref || { value: 0, tooltip: [] };
        data.attributes.fort.tooltip = [];
        data.attributes.ref.tooltip = [];

        // ========================================
        // HP: Base HP + (HP Advancement × tier)
        // ========================================
        let baseHp = 0;
        let hpAdvancement = 0;

        if (frame) {
            baseHp += frame.system.baseHp || 0;
            hpAdvancement += frame.system.hpAdvancement || 0;
            data.attributes.hp.tooltip.push(`${frame.name} (Base): +${frame.system.baseHp}`);
            data.attributes.hp.tooltip.push(`${frame.name} (Advancement): +${frame.system.hpAdvancement}/tier`);
        }

        if (lowerLimb) {
            baseHp += lowerLimb.system.baseHp || 0;
            hpAdvancement += lowerLimb.system.hpAdvancement || 0;
            if (lowerLimb.system.baseHp) {
                data.attributes.hp.tooltip.push(`${lowerLimb.name} (Base): +${lowerLimb.system.baseHp}`);
            }
            if (lowerLimb.system.hpAdvancement) {
                data.attributes.hp.tooltip.push(`${lowerLimb.name} (Advancement): +${lowerLimb.system.hpAdvancement}/tier`);
            }
        }

        // Upper limbs can contribute base HP but not advancement
        if (upperLimb && upperLimb.system.baseHp) {
            baseHp += upperLimb.system.baseHp;
            data.attributes.hp.tooltip.push(`${upperLimb.name} (Base): +${upperLimb.system.baseHp}`);
        }

        // HP = Base HP + (HP Advancement × tier)
        const tierHp = hpAdvancement * tier;
        data.attributes.hp.max = baseHp + tierHp;
        data.attributes.hp.tooltip.push(`Tier advancement (${hpAdvancement} × ${tier}): +${tierHp}`);

        // ========================================
        // SP: From tier table
        // ========================================
        data.attributes.sp.max = tierStats.sp;
        data.attributes.sp.tooltip.push(`Tier ${tier}: ${tierStats.sp}`);

        // ========================================
        // Hardness: Frame hardness + tier table bonus
        // ========================================
        const frameHardness = frame?.system.hardness || 0;
        data.attributes.hardness = frameHardness + tierStats.hardnessBonus;

        // ========================================
        // AC: Base AC (tier table) + bonuses from frame and limbs
        // ========================================
        let eacBonus = 0;
        data.attributes.eac.tooltip.push(`Base AC (Tier ${tier}): ${tierStats.baseAC}`);

        if (frame?.system.eac) {
            eacBonus += frame.system.eac;
            data.attributes.eac.tooltip.push(`${frame.name}: +${frame.system.eac}`);
        }
        if (lowerLimb?.system.eac) {
            eacBonus += lowerLimb.system.eac;
            data.attributes.eac.tooltip.push(`${lowerLimb.name}: +${lowerLimb.system.eac}`);
        }
        if (upperLimb?.system.eac) {
            eacBonus += upperLimb.system.eac;
            data.attributes.eac.tooltip.push(`${upperLimb.name}: +${upperLimb.system.eac}`);
        }

        data.attributes.eac.value = tierStats.baseAC + eacBonus;

        let kacBonus = 0;
        data.attributes.kac.tooltip.push(`Base AC (Tier ${tier}): ${tierStats.baseAC}`);

        if (frame?.system.kac) {
            kacBonus += frame.system.kac;
            data.attributes.kac.tooltip.push(`${frame.name}: +${frame.system.kac}`);
        }
        if (lowerLimb?.system.kac) {
            kacBonus += lowerLimb.system.kac;
            data.attributes.kac.tooltip.push(`${lowerLimb.name}: +${lowerLimb.system.kac}`);
        }
        if (upperLimb?.system.kac) {
            kacBonus += upperLimb.system.kac;
            data.attributes.kac.tooltip.push(`${upperLimb.name}: +${upperLimb.system.kac}`);
        }

        data.attributes.kac.value = tierStats.baseAC + kacBonus;

        // ========================================
        // Saving Throws: Base save (tier table) + bonuses from frame and lower limbs
        // ========================================
        let fortBonus = 0;
        data.attributes.fort.tooltip.push(`Base Save (Tier ${tier}): +${tierStats.baseSaveBonus}`);
        if (frame?.system.fort) {
            fortBonus += frame.system.fort;
            data.attributes.fort.tooltip.push(`${frame.name}: +${frame.system.fort}`);
        }
        if (lowerLimb?.system.fort) {
            fortBonus += lowerLimb.system.fort;
            data.attributes.fort.tooltip.push(`${lowerLimb.name}: +${lowerLimb.system.fort}`);
        }
        data.attributes.fort.value = tierStats.baseSaveBonus + fortBonus;

        let refBonus = 0;
        data.attributes.ref.tooltip.push(`Base Save (Tier ${tier}): +${tierStats.baseSaveBonus}`);
        if (frame?.system.ref) {
            refBonus += frame.system.ref;
            data.attributes.ref.tooltip.push(`${frame.name}: +${frame.system.ref}`);
        }
        if (lowerLimb?.system.ref) {
            refBonus += lowerLimb.system.ref;
            data.attributes.ref.tooltip.push(`${lowerLimb.name}: +${lowerLimb.system.ref}`);
        }
        data.attributes.ref.value = tierStats.baseSaveBonus + refBonus;

        // ========================================
        // Strength Modifier: Tier table + bonus from frame ONLY
        // ========================================
        let frameStrengthBonus = frame?.system.strength || 0;
        data.attributes.strength.tooltip.push(`Base Strength (Tier ${tier}): +${tierStats.strengthMod}`);
        if (frameStrengthBonus) {
            data.attributes.strength.tooltip.push(`${frame.name}: +${frameStrengthBonus}`);
        }
        data.attributes.strength.value = tierStats.strengthMod + frameStrengthBonus;

        // ========================================
        // Attack Bonus: Base attack (tier table) + upper limb bonuses
        // Operator's BAB/Piloting is added at roll time (depends on who rolls)
        // ========================================
        const meleeAttackMod = upperLimb?.system.meleeAttack || 0;
        const rangedAttackMod = upperLimb?.system.rangedAttack || 0;

        data.attributes.attackBonus.tooltip.push(`Base Attack (Tier ${tier}): +${tierStats.baseAttackBonus}`);
        data.attributes.attackBonus.value = tierStats.baseAttackBonus;

        // Store separate melee/ranged attack bonuses (without operator - added at roll time)
        data.attributes.meleeAttackBonus = tierStats.baseAttackBonus + meleeAttackMod;
        data.attributes.rangedAttackBonus = tierStats.baseAttackBonus + rangedAttackMod;
        data.attributes.meleeAttackMod = meleeAttackMod;
        data.attributes.rangedAttackMod = rangedAttackMod;

        if (meleeAttackMod) {
            data.attributes.attackBonus.tooltip.push(`${upperLimb.name} (Melee): +${meleeAttackMod}`);
        }
        if (rangedAttackMod) {
            data.attributes.attackBonus.tooltip.push(`${upperLimb.name} (Ranged): +${rangedAttackMod}`);
        }
        data.attributes.attackBonus.tooltip.push(game.i18n.localize("SFRPG.MechSheet.OperatorBonusAtRollTime"));

        // ========================================
        // Damage Modifier: Tier (+ Strength modifier for melee)
        // ========================================
        const strengthMod = tierStats.strengthMod + frameStrengthBonus;
        data.attributes.damageModifier = {
            melee: tier + strengthMod,
            ranged: tier,
            tooltip: [
                `Base (Tier): +${tier}`,
                `Melee adds Strength: +${strengthMod}`
            ]
        };

        // ========================================
        // Speed: Base from frame + modifiers from lower limbs
        // ========================================
        // Start with frame base speed
        if (frame?.system.speed) {
            parseSpeedString(frame.system.speed, data.attributes.speed);
        }

        // Apply lower limb speed modifiers on top of frame base
        if (lowerLimb?.system.speed) {
            applySpeedModifiers(lowerLimb.system.speed, data.attributes.speed);
        }

        // ========================================
        // Power Points: From power core
        // ========================================
        if (powerCore) {
            data.attributes.pp.initial = powerCore.system.ppInitial || 3;
            data.attributes.pp.max = powerCore.system.ppMax || 5;
            data.attributes.pp.regen = powerCore.system.ppRegen || 1;
        }

        // ========================================
        // Size: From frame
        // ========================================
        if (frame?.system.size) {
            data.attributes.size = frame.system.size;
        }

        // ========================================
        // Reach: Determined by size
        // ========================================
        data.attributes.reach = CONFIG.SFRPG.mechReachBySize[data.attributes.size] || "15 ft.";

        // ========================================
        // Slots: From frame and limbs
        // ========================================
        data.attributes.slots.frame = frame?.system.frameSlots || 0;
        data.attributes.slots.auxiliary = frame?.system.auxSlots || 0;
        data.attributes.slots.lowerLimb = lowerLimb?.system.slots || 0;
        data.attributes.slots.upperLimb = upperLimb?.system.slots || 0;

        // ========================================
        // Operators: From frame
        // ========================================
        data.attributes.operators = {
            min: frame?.system.operatorsMin || 1,
            max: frame?.system.operatorsMax || 2
        };

        // ========================================
        // Senses: Alphabetize comma-separated entries
        // ========================================
        if (data.attributes.senses) {
            const senseParts = data.attributes.senses.split(",").map(s => s.trim()).filter(Boolean);
            senseParts.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
            data.attributes.senses = senseParts.join(", ");
        }

        // ========================================
        // Mission Pod Modifiers: From active mission pod
        // ========================================
        const activeMissionPod = items.find(i => i.type === "mechMissionPod" && i.system?.isActive);
        if (activeMissionPod && activeMissionPod.system.statMods) {
            const podMods = activeMissionPod.system.statMods;

            // HP modifier
            if (podMods.hp) {
                data.attributes.hp.max += podMods.hp;
                data.attributes.hp.tooltip.push(`${activeMissionPod.name}: +${podMods.hp}`);
            }

            // SP modifier
            if (podMods.sp) {
                data.attributes.sp.max += podMods.sp;
                data.attributes.sp.tooltip.push(`${activeMissionPod.name}: +${podMods.sp}`);
            }

            // EAC modifier
            if (podMods.eac) {
                data.attributes.eac.value += podMods.eac;
                data.attributes.eac.tooltip.push(`${activeMissionPod.name}: +${podMods.eac}`);
            }

            // KAC modifier
            if (podMods.kac) {
                data.attributes.kac.value += podMods.kac;
                data.attributes.kac.tooltip.push(`${activeMissionPod.name}: +${podMods.kac}`);
            }

            // Fort modifier
            if (podMods.fort) {
                data.attributes.fort.value += podMods.fort;
                data.attributes.fort.tooltip.push(`${activeMissionPod.name}: +${podMods.fort}`);
            }

            // Ref modifier
            if (podMods.ref) {
                data.attributes.ref.value += podMods.ref;
                data.attributes.ref.tooltip.push(`${activeMissionPod.name}: +${podMods.ref}`);
            }

            // Strength modifier
            if (podMods.strength) {
                data.attributes.strength.value += podMods.strength;
                data.attributes.strength.tooltip.push(`${activeMissionPod.name}: +${podMods.strength}`);
            }

            // Speed modifier (adds to land speed)
            if (podMods.speed) {
                const currentLand = parseInt(data.attributes.speed.land) || 0;
                const newSpeed = currentLand + podMods.speed;
                data.attributes.speed.land = `${newSpeed} ft.`;
            }
        }

        // ========================================
        // Weapon Damage: Computed from tier + damage level (Tech Revolution Table 4-5)
        // ========================================
        const damageTable = CONFIG.SFRPG.mechWeaponDamageByTier[tier];
        if (damageTable) {
            const mechWeapons = items.filter(i => i.type === "mechWeapon");
            for (const weapon of mechWeapons) {
                const level = weapon.system.damageLevel || "medium";
                const formula = damageTable[level];
                if (formula && weapon.system.damage?.parts) {
                    // Set the first damage part's formula from the table
                    if (weapon.system.damage.parts.length > 0) {
                        weapon.system.damage.parts[0].formula = formula;
                    } else {
                        weapon.system.damage.parts.push({
                            formula: formula,
                            types: {},
                            name: "",
                            group: null,
                            isPrimarySection: false
                        });
                    }
                }
            }
        }

        return fact;
    });
}

/**
 * Parse a speed string like "60 ft." or "30 ft., swim 60 ft., fly 40 ft."
 * and populate the speed object with absolute values.
 */
function parseSpeedString(speedStr, speedObj) {
    if (!speedStr) return;

    // Reset speeds
    speedObj.land = "";
    speedObj.fly = "";
    speedObj.swim = "";
    speedObj.burrow = "";

    // Split by comma
    const parts = speedStr.split(",").map(s => s.trim());

    for (const part of parts) {
        if (part.toLowerCase().startsWith("fly")) {
            speedObj.fly = part.replace(/^fly\s*/i, "");
        } else if (part.toLowerCase().startsWith("swim")) {
            speedObj.swim = part.replace(/^swim\s*/i, "");
        } else if (part.toLowerCase().startsWith("burrow")) {
            speedObj.burrow = part.replace(/^burrow\s*/i, "");
        } else {
            // Assume land speed if no prefix
            speedObj.land = part;
        }
    }
}

/**
 * Apply speed modifiers from lower limbs.
 * Handles modifier strings like "+10 ft.", "fly +10 ft. (perfect, max 5 ft.)",
 * or absolute new speed types like "burrow 40 ft.".
 * A modifier without a type prefix (e.g., "+10 ft.") applies to ALL existing speeds.
 */
function applySpeedModifiers(speedStr, speedObj) {
    if (!speedStr) return;

    const parts = speedStr.split(",").map(s => s.trim());
    const speedTypes = ["land", "fly", "swim", "burrow"];

    for (const part of parts) {
        let type = null; // null means "all speeds"
        let remainder = part;

        if (part.toLowerCase().startsWith("fly")) {
            type = "fly";
            remainder = part.replace(/^fly\s*/i, "");
        } else if (part.toLowerCase().startsWith("swim")) {
            type = "swim";
            remainder = part.replace(/^swim\s*/i, "");
        } else if (part.toLowerCase().startsWith("burrow")) {
            type = "burrow";
            remainder = part.replace(/^burrow\s*/i, "");
        }

        // Check if this is a modifier (starts with + or -)
        const modMatch = remainder.match(/^([+-]\d+)\s*ft\./);
        if (modMatch) {
            const mod = parseInt(modMatch[1]);

            if (type === null) {
                // No type prefix - apply modifier to ALL existing speeds
                for (const speedType of speedTypes) {
                    const current = parseInt(speedObj[speedType]) || 0;
                    if (current > 0) {
                        const newSpeed = current + mod;
                        speedObj[speedType] = `${newSpeed} ft.`;
                    }
                }
            } else {
                // Specific type - apply to that type only
                const current = parseInt(speedObj[type]) || 0;
                const newSpeed = current + mod;
                speedObj[type] = `${newSpeed} ft.`;
            }
        } else {
            // It's an absolute value (e.g., "burrow 40 ft.") - set it if not already set
            const targetType = type || "land";
            if (!speedObj[targetType]) {
                speedObj[targetType] = remainder;
            }
        }
    }
}
