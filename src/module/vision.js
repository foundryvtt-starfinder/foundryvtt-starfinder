export default function setupVision() {
    setupVisionModes();
    setDefaultIlluminationThreshold();
    globalIlluminationThresholdTooltip();
}

function setupVisionModes() {
    //Set global illumination luminosity to dim light, so LLV will see it as bright
    CONFIG.Canvas.globalLightConfig.luminosity = 0.5;

    //Override core darkvision
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
            background: { visibility: VisionMode.LIGHTING_VISIBILITY.REQUIRED }
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

function setDefaultIlluminationThreshold() {
    Hooks.on("preCreateScene", (scene) => {
        scene.updateSource({ globalLightThreshold: 0.75 });
    });
}

function globalIlluminationThresholdTooltip() {
    Hooks.on("renderSceneConfig", (config, html) => {
        const darknessSlider = html[0].querySelector("input[name='globalLightThreshold']").nextElementSibling;

        const tooltip = 
        `<i data-tooltip="${ game.i18n.localize("SFRPG.SensesTypes.GlobalIlluminationThresholdMessage") }"
         class="fas fa-lightbulb" 
         style="flex: 0; padding-left: 2px">`;
        darknessSlider.insertAdjacentHTML("afterend", tooltip);
    });
}
