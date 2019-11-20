Hooks.once("init", () => {
    game.settings.register("starfinder", "diagonalMovement", {
        name: "Diagonal Movement Rule",
        hint: "Configures which diagonal movement rule should be used for games within this system.",
        scope: "world",
        config: true,
        default: "5105",
        type: String,
        choices: {
            "555": "Optional (5/5/5)",
            "5105": "Core Rulebook (5/10/5)"
        },
        onChange: rule => canvas.grid.diagonalRule = rule
    });

    game.settings.register("starfinder", "disableExperienceTracking", {
        name: "Disable Experience Tracking",
        hint: "Remove experience bars from character sheets.",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    // Preload templates
    loadTemplates([
        "public/systems/starfinder/templates/actors/actor-sheet.html",
        "public/systems/starfinder/templates/actors/actor-attributes.html",
        "public/systems/starfinder/templates/actors/actor-abilities.html",
        "public/systems/starfinder/templates/actors/actor-biography.html",
        "public/systems/starfinder/templates/actors/actor-skills.html",
        "public/systems/starfinder/templates/actors/actor-traits.html",
        "public/systems/starfinder/templates/actors/actor-classes.html",

        "public/systems/starfinder/templates/items/class-sidebar.html",
        "public/systems/starfinder/templates/items/consumable-details.html",
        "public/systems/starfinder/templates/items/consumable-sidebar.html",
        "public/systems/starfinder/templates/items/equipment-details.html",
        "public/systems/starfinder/templates/items/equipment-sidebar.html",
        "public/systems/starfinder/templates/items/feat-details.html",
        "public/systems/starfinder/templates/items/feat-sidebar.html",
        "public/systems/starfinder/templates/items/spell-details.html",
        "public/systems/starfinder/templates/items/spell-sidebar.html",
        "public/systems/starfinder/templates/items/tool-sidebar.html",
        "public/systems/starfinder/templates/items/weapon-details.html",
        "public/systems/starfinder/templates/items/weapon-sidebar.html"
    ]);
});

Hooks.on("canvasInit", () => {
    canvas.grid.diagonalRule = game.settings.get("starfinder", "diagonalMovement");

    SquareGrid.prototype.measureDistance = function (p0, p1) {
        let qs = canvas.dimensions.size,
            ray = new Ray(p0, p1),
            nx = Math.abs(Math.ceil(ray.dx / qs)),
            ny = Math.abs(Math.ceil(ray.dy / qs));

        let nDiagonal = Math.min(nx, ny),
            nStraight = Math.abs(ny - nx);

        if (this.parent.diagonalRule === "555") {
            return (nStraight + nDiagonal) * canvas.scene.data.gridDistance;
        } else {
            let nd10 = Math.floor(nDiagonal / 2);
            let spaces = (nd10 * 2) + (nDiagonal - nd10) + nStraight;

            return spaces * canvas.dimensions.distance;
        }
    };
});