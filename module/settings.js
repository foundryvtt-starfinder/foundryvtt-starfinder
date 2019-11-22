export const registerSystemSettings = function () {
    game.settings.register("starfinder", "diagonalMovement", {
        name: "SETTINGS.StarfinderDiagN",
        hint: "SETTINGS.StarfinderDiagL",
        scope: "world",
        config: true,
        default: "5105",
        type: String,
        choices: {
            "5105": "SETTINGS.StarfinderDiagCore",
            "555": "SETTINGS.StarfinderOptional"
        },
        onChange: rule => canvas.grid.diagonalRule = rule
    });

    game.settings.register("starfinder", "disableExperienceTracking", {
        name: "SETTINGS.StarfinderNoExpN",
        hint: "SETTINGS.StarfinderNoExpL",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
};