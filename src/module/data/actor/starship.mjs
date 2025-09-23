import SFRPGActorBase from "./base-actor.mjs";

const { fields } = foundry.data;

export default class SFRPGActorStarship extends SFRPGActorBase {
    static defineSchema() {
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGActorBase.conditionsTemplate(), // TODO: Disable conditions on starships and remove this later
            ...SFRPGActorBase.crewTemplate({type: "starship"})
        });

        // Add additional fields needed to template fields
        foundry.utils.mergeObject(schema, {
            attributes: new fields.SchemaField({
                hp: new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.Health"}),
                systems: new fields.SchemaField({
                    engines: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["pilot"]}), {label: "SFRPG.StarshipSheet.Critical.Systems.Engines"}),
                    lifeSupport: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["captain"]}), {label: "SFRPG.StarshipSheet.Critical.Systems.LifeSupport"}),
                    powerCore: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({
                        initialRoles: ["captain", "pilot", "gunner", "engineer", "scienceOfficer", "magicOfficer", "chiefMate", "openCrew", "minorCrew"]
                    }), {label: "SFRPG.StarshipSheet.Critical.Systems.PowerCore"}),
                    sensors: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["scienceOfficer"]}), {label: "SFRPG.StarshipSheet.Critical.Systems.Sensors"}),
                    weaponsArrayAft: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["gunner"]}), {label: "SFRPG.StarshipSheet.Critical.Systems.WeaponsArrayAft"}),
                    weaponsArrayForward: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["gunner"]}), {label: "SFRPG.StarshipSheet.Critical.Systems.WeaponsArrayForward"}),
                    weaponsArrayPort: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["gunner"]}), {label: "SFRPG.StarshipSheet.Critical.Systems.WeaponsArrayPort"}),
                    weaponsArrayStarboard: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["gunner"]}), {label: "SFRPG.StarshipSheet.Critical.Systems.WeaponsArrayStarboard"})
                })
            }),
            currency: new fields.SchemaField({
                bp: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: true
                }),
                upb: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: true
                })
            }),
            details: new fields.SchemaField({
                frame: new fields.StringField({
                    initial: "",
                    blank: true,
                    label: "SFRPG.ShipFrameLabel"
                }),
                model: new fields.StringField({
                    initial: "",
                    blank: true,
                    label: "SFRPG.ShipModelLabel"
                }),
                notes: new fields.HTMLField(),
                size: new fields.StringField({
                    initial: "",
                    blank: true,
                    label: "SFRPG.Size"
                }),
                tier: new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: false,
                    label: "SFRPG.ShipTierLabel"
                })
            }),
            quadrants: new fields.SchemaField({
                aft: new fields.SchemaField(
                    SFRPGActorStarship._quadrantFieldData(),
                    {label: "SFRPG.Rolls.StarshipActions.Quadrant.Aft"}
                ),
                forward: new fields.SchemaField(
                    SFRPGActorStarship._quadrantFieldData(),
                    {label: "SFRPG.Rolls.StarshipActions.Quadrant.Forward"}
                ),
                port: new fields.SchemaField(
                    SFRPGActorStarship._quadrantFieldData(),
                    {label: "SFRPG.Rolls.StarshipActions.Quadrant.Port"}
                ),
                starboard: new fields.SchemaField(
                    SFRPGActorStarship._quadrantFieldData(),
                    {label: "SFRPG.Rolls.StarshipActions.Quadrant.Starboard"}
                )
            }, {label: "SFRPG.Rolls.StarshipActions.Quadrant.Quadrant"})
        });

        return schema;
    }

    static _quadrantFieldData() {
        return {
            ablative: new fields.SchemaField({
                max: new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                value: new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }, {label: "SFRPG.StarshipSheet.Quadrants.AblativeHeader"}),
            ac: new fields.SchemaField({
                misc: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                value: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true
                })
            }, {label: "SFRPG.StarshipSheet.Quadrants.ArmorClass"}),
            shields: new fields.SchemaField({
                value: new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }, {label: "SFRPG.StarshipSheet.Quadrants.ShieldHeader"}),
            targetLock: new fields.SchemaField({
                misc: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                value: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: true
                })
            }, {label: "SFRPG.StarshipSheet.Quadrants.TargetLock"})
        };
    }

    static _shipSystemFieldData(options = {}) {
        const initialRoles = options.initialRoles ?? [];
        const initialRoleObject = {};
        for (const role of initialRoles) {
            initialRoleObject[role] = true;
        }

        const fieldData = {
            affectedRoles: new fields.TypedObjectField(
                new fields.BooleanField({initial: true}),
                {initial: initialRoleObject, label: "SFRPG.StarshipSheet.Critical.AffectedRoles"}
            ),
            patch: new fields.StringField({
                initial: "unpatched",
                blank: false,
                choices: Object.keys(CONFIG.SFRPG.starshipSystemPatch),
                required: true,
                label: "SFRPG.StarshipSheet.Critical.PatchState"
            }),
            value: new fields.StringField({
                initial: "nominal",
                blank: false,
                choices: Object.keys(CONFIG.SFRPG.starshipSystemStatus),
                required: true,
                label: "SFRPG.StarshipSheet.Critical.SystemStatus"
            })
        };

        return fieldData;
    }
}
