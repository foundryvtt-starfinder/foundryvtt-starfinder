import FloatingNumberMenu from "../classes/floating-number-menu.js";
import { SFRPG } from "../config.js";
import { ItemSFRPG } from "../item/item.js";

export const registerSystemSettings = function() {
    game.settings.register("sfrpg", "disableExperienceTracking", {
        name: "SFRPG.Settings.ExperienceTracking.Name",
        hint: "SFRPG.Settings.ExperienceTracking.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("sfrpg", "useAdvantageDisadvantage", {
        name: "SFRPG.Settings.Advantage.Name",
        hint: "SFRPG.Settings.Advantage.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("sfrpg", "autoCollapseItemCards", {
        name: "SFRPG.Settings.AutoCollapseCard.Name",
        hint: "SFRPG.Settings.AutoCollapseCard.Hint",
        scope: "client",
        config: true,
        default: false,
        type: Boolean,
        onChange: () => {
            ui.chat.render();
        }
    });

    game.settings.register("sfrpg", "worldSchemaVersion", {
        name: "SFRPG.Settings.WorldSchemaVersion.Name",
        hint: "SFRPG.Settings.WorldSchemaVersion.Hint",
        scope: "world",
        config: false,
        default: 0,
        type: Number
    });

    game.settings.register("sfrpg", "useCustomChatCards", {
        name: "SFRPG.Settings.UseCustomChatCard.Name",
        hint: "SFRPG.Settings.UseCustomChatCard.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("sfrpg", "autoAddUnarmedStrike", {
        name: "SFRPG.Settings.AutoAddUnarmedStrike.Name",
        hint: "SFRPG.Settings.AutoAddUnarmedStrike.Hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("sfrpg", "useQuickRollAsDefault", {
        name: "SFRPG.Settings.UseQuickRollAsDefault.Name",
        hint: "SFRPG.Settings.UseQuickRollAsDefault.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("sfrpg", "useInitiativeTiebreaker", {
        name: "SFRPG.Settings.CombatTiebreaker.Name",
        hint: "SFRPG.Settings.CombatTiebreaker.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("sfrpg", "scalingCantrips", {
        name: "SFRPG.Settings.ScalingCantrips.Name",
        hint: "SFRPG.Settings.ScalingCantrips.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean,
        onChange: () => {
            ItemSFRPG._onScalingCantripsSettingChanges();
        }
    });

    game.settings.register("sfrpg", "difficultyDisplay", {
        name: "SFRPG.Settings.DifficultyDisplay.Name",
        hint: "SFRPG.Settings.DifficultyDisplay.Hint",
        scope: "world",
        config: true,
        default: true,
        type: Boolean,
        onChange: () => ui.combat.render(false)
    });

    for (const combatType of SFRPG.combatTypes) {
        const capitalizedCombatType = combatType[0].toUpperCase() + combatType.slice(1);
        game.settings.register("sfrpg", `${combatType}ChatCards`, {
            name: `SFRPG.Settings.CombatCards.${capitalizedCombatType}Name`,
            hint: `SFRPG.Settings.CombatCards.${capitalizedCombatType}Hint`,
            scope: "world",
            config: true,
            default: "enabled",
            type: String,
            choices: {
                "enabled": "SFRPG.Settings.CombatCards.Values.Enabled",
                "roundsPhases": "SFRPG.Settings.CombatCards.Values.RoundsPhases",
                "roundsTurns": "SFRPG.Settings.CombatCards.Values.RoundsTurns",
                "roundsOnly": "SFRPG.Settings.CombatCards.Values.OnlyRounds",
                "disabled": "SFRPG.Settings.CombatCards.Values.Disabled"
            }
        });
    }

    game.settings.register("sfrpg", "starshipActionsSource", {
        name: "SFRPG.Settings.StarshipActionsSource.Name",
        hint: "SFRPG.Settings.StarshipActionsSource.Hint",
        scope: "world",
        config: true,
        default: "sfrpg.starship-actions",
        type: String
    });

    game.settings.register("sfrpg", "starshipActionsCrit", {
        name: "SFRPG.Settings.StarshipActionsCrit.Name",
        hint: "SFRPG.Settings.StarshipActionsCrit.Hint",
        scope: "world",
        config: true,
        default: "critOnly",
        type: String,
        choices: {
            "never": "SFRPG.Settings.StarshipActionsCrit.Values.Never",
            "critOnly": "SFRPG.Settings.StarshipActionsCrit.Values.CritOnly",
            "always": "SFRPG.Settings.StarshipActionsCrit.Values.Always"
        }
    });

    game.settings.register("sfrpg", "enableGalacticTrade", {
        name: "SFRPG.Settings.GalacticTrade.Name",
        hint: "SFRPG.Settings.GalacticTrade.Hint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("sfrpg", "rollDamageWithAttack", {
        name: "SFRPG.Settings.DamageWithAttack.Name",
        hint: "SFRPG.Settings.DamageWithAttack.Hint",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("sfrpg", "damageRoundingAdvantage", {
        name: "SFRPG.Settings.DamageRoundingAdvantage.Name",
        hint: "SFRPG.Settings.DamageRoundingAdvantage.Hint",
        scope: "world",
        config: true,
        default: "defender",
        type: String,
        choices: {
            "attacker": "SFRPG.Settings.DamageRoundingAdvantage.ValueAttacker",
            "defender": "SFRPG.Settings.DamageRoundingAdvantage.ValueDefender"
        }
    });

    game.settings.register("sfrpg", "alwaysShowQuantity", {
        name: "SFRPG.Settings.AlwaysShowQuantity.Name",
        hint: "SFRPG.Settings.AlwaysShowQuantity.Hint",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("sfrpg", "warnInvalidRollData", {
        name: "SFRPG.Settings.WarnInvalidRollData.Name",
        hint: "SFRPG.Settings.WarnInvalidRollData.Hint",
        scope: "client",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("sfrpg", "tokenConditionLabels", {
        name: "SFRPG.Settings.TokenConditionLabels.Name",
        hint: "SFRPG.Settings.TokenConditionLabels.Hint",
        scope: "client",
        config: true,
        default: true,
        type: Boolean
    });

    game.settings.register("sfrpg", "sfrpgTheme", {
        name: "SFRPG.Settings.SFRPGTheme.Name",
        hint: "SFRPG.Settings.SFRPGTheme.Hint",
        scope: "client",
        config: true,
        default: true,
        type: Boolean
    });

    // Floating Number settings
    game.settings.registerMenu("sfrpg", "floatingHP", {
        name: "SFRPG.Settings.FloatingHP.Menu.Label",
        label: "SFRPG.Settings.FloatingHP.Button",
        hint: "SFRPG.Settings.FloatingHP.Hint",
        icon: "fas fa-heart",
        type: FloatingNumberMenu
    });

    game.settings.register("sfrpg", "floatingHP", {
        scope: "world",
        config: false,
        type: Boolean,
        default: true
    });

    game.settings.register("sfrpg", "verboseFloatyText", {
        scope: "world",
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register("sfrpg", "limitByCriteria", {
        scope: "world",
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register("sfrpg", "canSeeBars", {
        scope: "world",
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register("sfrpg", "canSeeName", {
        scope: "world",
        config: false,
        type: Boolean,
        default: false
    });

    game.settings.register("sfrpg", "minPerm", {
        scope: "world",
        config: false,
        type: String,
        default: "LIMITED"
    });
};
