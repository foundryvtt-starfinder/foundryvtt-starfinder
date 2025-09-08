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
                    engines: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["pilot"]}), {label: ""}),
                    lifeSupport: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["captain"]}), {label: ""}),
                    powerCore: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({
                        initialRoles: ["captain", "pilot", "gunner", "engineer", "scienceOfficer", "magicOfficer", "chiefMate", "openCrew", "minorCrew"]
                    }), {label: ""}),
                    sensors: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["scienceOfficer"]}), {label: ""}),
                    weaponsArrayAft: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["gunner"]}), {label: ""}),
                    weaponsArrayForward: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["gunner"]}), {label: ""}),
                    weaponsArrayPort: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["gunner"]}), {label: ""}),
                    weaponsArrayStarboard: new fields.SchemaField(SFRPGActorStarship._shipSystemFieldData({initialRoles: ["gunner"]}), {label: ""})
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
                    label: ""
                }),
                model: new fields.StringField({
                    initial: "",
                    blank: true,
                    label: ""
                }),
                notes: new fields.HTMLField(),
                size: new fields.StringField({
                    initial: "",
                    blank: true,
                    label: ""
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
                    {label: ""}
                ),
                forward: new fields.SchemaField(
                    SFRPGActorStarship._quadrantFieldData(),
                    {label: ""}
                ),
                port: new fields.SchemaField(
                    SFRPGActorStarship._quadrantFieldData(),
                    {label: ""}
                ),
                starboard: new fields.SchemaField(
                    SFRPGActorStarship._quadrantFieldData(),
                    {label: ""}
                )
            })
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
            }, {label: ""}),
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
            }, {label: ""}),
            shields: new fields.SchemaField({
                value: new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }, {label: ""}),
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
            }, {label: ""})
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
                {initial: initialRoleObject}
            ),
            patch: new fields.StringField({
                initial: "unpatched",
                blank: false,
                // choices: Object.keys(CONFIG.SFRPG.starshipSystemPatch), // TODO-Ian: Add this in once patch PR is merged in
                required: true,
                label: ""
            }),
            value: new fields.StringField({
                initial: "nominal",
                blank: false,
                choices: Object.keys(CONFIG.SFRPG.starshipSystemStatus),
                required: true,
                label: ""
            })
        };

        return fieldData;
    }
}
