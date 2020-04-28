export const registerSystemSettings = function () {
    game.settings.register("starfinder", "diagonalMovement", {
        name: "STARFINDER.StarfinderDiagN",
        hint: "STARFINDER.StarfinderDiagL",
        scope: "world",
        config: true,
        default: "5105",
        type: String,
        choices: {
            "5105": "STARFINDER.StarfinderDiagCore",
            "555": "STARFINDER.StarfinderOptional"
        },
        onChange: rule => canvas.grid.diagonalRule = rule
    });

    game.settings.register("starfinder", "disableExperienceTracking", {
        name: "STARFINDER.StarfinderNoExpN",
        hint: "STARFINDER.StarfinderNoExpL",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("starfinder", "useAdvantageDisadvantage", {
        name: "STARFINDER.StarfinderUseAdvantageDisadvantage",
        hint: "STARFINDER.StarfinderUseAdvantageDisadvantageHint",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
};