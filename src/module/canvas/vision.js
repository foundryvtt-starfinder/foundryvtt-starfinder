const { VisionMode } = foundry.canvas.perception;
const { ColorAdjustmentsSamplerShader } = foundry.canvas.rendering.shaders;

export default function setupVision() {
    setupVisionModes();
    setDefaultSceneSettings();
    sceneConfigTooltips();
    setupConditions();
}

function setupVisionModes() {

    // Override core darkvision
    CONFIG.Canvas.visionModes.darkvision = new VisionMode({
        id: "darkvision",
        label: "SFRPG.SensesTypes.SensesDark",
        canvas: {
            shader: ColorAdjustmentsSamplerShader,
            uniforms: {
                enable: true,
                contrast: 0,
                saturation: -1.0,
                brightness: 0
            }
        },
        lighting: {
            background: { visibility: VisionMode.LIGHTING_VISIBILITY.REQUIRED },
            darkness: { visibility: VisionMode.LIGHTING_VISIBILITY.REQUIRED }
        },
        vision: {
            darkness: {
                // The darker the scene, the more monochrome vision will become
                adaptive: true
            },
            defaults: {
                attenuation: 0.1,
                contrast: 0,
                saturation: -1.0,
                brightness: 0.75
            }
        }
    });

    CONFIG.Canvas.visionModes.lowLightVision = new VisionMode({
        id: "lowLightVision",
        label: "SFRPG.SensesTypes.SensesLLV",
        canvas: {
            shader: ColorAdjustmentsSamplerShader,
            uniforms: {
                enable: true,
                contrast: 0,
                saturation: 0,
                brightness: 0
            }
        },
        lighting: {
            levels: {
                // LLV sees dim as bright
                [VisionMode.LIGHTING_LEVELS.DIM]: VisionMode.LIGHTING_LEVELS.BRIGHT
            },
            background: { visibility: VisionMode.LIGHTING_VISIBILITY.REQUIRED }
        },
        vision: {
            darkness: { adaptive: true },
            defaults: {
                attenuation: 0.1,
                contrast: 0,
                saturation: 0,
                brightness: 0
            }
        }
    });

    CONFIG.Canvas.visionModes.lowLightVisionDarkvision = new VisionMode({
        id: "lowLightVisionDarkvision",
        label: "SFRPG.SensesTypes.SensesLLVDark",
        canvas: {
            shader: ColorAdjustmentsSamplerShader,
            uniforms: {
                enable: true,
                contrast: 0,
                saturation: -1.0,
                brightness: 0
            }
        },
        lighting: {
            levels: {
                // LLV sees dim as bright
                [VisionMode.LIGHTING_LEVELS.DIM]: VisionMode.LIGHTING_LEVELS.BRIGHT
            },
            darkness: { visibility: VisionMode.LIGHTING_VISIBILITY.DISABLED },
            background: { visibility: VisionMode.LIGHTING_VISIBILITY.REQUIRED }
        },
        vision: {
            darkness: { adaptive: true },
            defaults: {
                attenuation: 0.1,
                contrast: 0,
                saturation: -1.0,
                brightness: 0.75
            }
        }
    });
}

function setDefaultSceneSettings() {
    Hooks.on("preCreateScene", (scene) => {
        scene.updateSource({ "environment.globalLight.darkness.max": 0.75, "environment.globalLight.enabled": true });
    });
}

function sceneConfigTooltips() {
    Hooks.on("renderSceneConfig", (app, html) => {
        const darknessSlider = html.querySelector("range-picker[name='environment.globalLight.darkness.max']");
        const globalIllumination = html.querySelector("input[name='environment.globalLight.enabled']");

        const tooltip = `
        <i data-tooltip="${ game.i18n.localize("SFRPG.SensesTypes.GlobalIlluminationThresholdMessage") }"
        class="fas fa-lightbulb"
        style="flex: 0; padding-left: 2px">`;

        globalIllumination?.insertAdjacentHTML("afterend", tooltip);
        darknessSlider?.insertAdjacentHTML("afterend", tooltip);

        app.setPosition({height: "auto"});
    });
}

function setupConditions() {
    CONFIG.specialStatusEffects.BLIND = "blinded";
    CONFIG.specialStatusEffects.INVISIBLE = "invisible";
}
