export const registerSystemSettings = function () {
    game.settings.register("sfrpg", "diagonalMovement", {
        name: "SFRPG.SFRPGDiagN",
        hint: "SFRPG.SFRPGDiagL",
        scope: "world",
        config: true,
        default: "5105",
        type: String,
        choices: {
            "5105": "SFRPG.SFRPGDiagCore",
            "555": "SFRPG.SFRPGOptional"
        },
        onChange: rule => canvas.grid.diagonalRule = rule
    });

    game.settings.register("sfrpg", "disableExperienceTracking", {
        name: "SFRPG.SFRPGNoExpN",
        hint: "SFRPG.SFRPGNoExpL",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("sfrpg", "useAdvantageDisadvantage", {
        name: "SFRPG.SFRPGUseAdvantageDisadvantage",
        hint: "SFRPG.SFRPGUseAdvantageDisadvantageHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("sfrpg", "autoCollapseItemCards", {
        name: "SFRPG.SettingsAutoCollapseCardName",
        hint: "SFRPG.SettingsAutoCollapseCardHint",
        scope: "client",
        config: true,
        default: false,
        type: Boolean,
        onChange: s => {
            ui.chat.render();
        }
    });

    game.settings.register("sfrpg", "worldSchemaVersion", {
        name: "SFRPG.SettingsWorldSchemaVersionName",
        hint: "SFRPG.SettingsWorldSchemaVersionHint",
        scope: "world",
        config: false,
        default: 0,
        type: Number
    });
};