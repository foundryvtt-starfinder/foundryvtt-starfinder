import SFRPGDocumentBase from "../base-document.mjs";

const { fields } = foundry.data;

export default class SFRPGActorBase extends SFRPGDocumentBase {
    static defineSchema() {
        const schema = super.defineSchema();
        return schema;
    }

    static commonTemplate(options = {}) {
        const isCharacter = options.actorType === "character" ? true : false;
        const isDrone = options.actorType === "drone" ? true : false;
        const isNPC = options.actorType === "npc" ? true : false;

        const schema = {
            abilities: new fields.SchemaField({
                cha: new fields.SchemaField(!isDrone ? SFRPGActorBase._abilityFieldData(isCharacter) : {}, {label: "SFRPG.AbilityCha"}),
                con: new fields.SchemaField(!isDrone ? SFRPGActorBase._abilityFieldData(isCharacter) : {}, {label: "SFRPG.AbilityCon"}),
                dex: new fields.SchemaField(!isDrone ? SFRPGActorBase._abilityFieldData(isCharacter) : {}, {label: "SFRPG.AbilityDex"}),
                int: new fields.SchemaField(!isDrone ? SFRPGActorBase._abilityFieldData(isCharacter) : {}, {label: "SFRPG.AbilityInt"}),
                str: new fields.SchemaField(!isDrone ? SFRPGActorBase._abilityFieldData(isCharacter) : {}, {label: "SFRPG.AbilityStr"}),
                wis: new fields.SchemaField(!isDrone ? SFRPGActorBase._abilityFieldData(isCharacter) : {}, {label: "SFRPG.AbilityWis"})
            }),
            attributes: new fields.SchemaField({
                eac: new fields.SchemaField({}, {label: "SFRPG.EnergyArmorClass"}),
                fort: new fields.SchemaField(!isNPC ? SFRPGActorBase._saveFieldData() : {}, {label: "SFRPG.FortitudeSave"}),
                hp: new fields.SchemaField({
                    temp: new fields.NumberField({
                        initial: null,
                        min: 0,
                        nullable: true,
                        required: true
                    }),
                    value: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        nullable: false,
                        required: true
                    })
                }, {label: "SFRPG.Health"}),
                init: new fields.SchemaField({}, {label: "SFRPG.InitiativeLabel"}),
                kac: new fields.SchemaField({}, {label: "SFRPG.KineticArmorClass"}),
                reflex: new fields.SchemaField(!isNPC ? SFRPGActorBase._saveFieldData() : {}, {label: "SFRPG.ReflexSave"}),
                speed: new fields.SchemaField(SFRPGDocumentBase._speedFieldData()),
                will: new fields.SchemaField(!isNPC ? SFRPGActorBase._saveFieldData() : {}, {label: "SFRPG.WillSave"})
            }),
            currency: new fields.SchemaField({
                credit: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: true,
                    required: false,
                    label: "SFRPG.Credits"
                }),
                upb: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: true,
                    required: false,
                    label: "SFRPG.UPBs"
                })
            }),
            details: new fields.SchemaField({
                biography: new fields.SchemaField({
                    age: new fields.NumberField({
                        initial: null,
                        min: 0,
                        nullable: true,
                        required: false,
                        label: "SFRPG.ActorSheet.Biography.Age"
                    }),
                    dateOfBirth: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false,
                        label: "SFRPG.ActorSheet.Biography.DateOfBirth"
                    }),
                    deity: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false,
                        label: "SFRPG.ActorSheet.Biography.Deity"
                    }),
                    fullBodyImage: new fields.FilePathField({
                        initial: "",
                        blank: true,
                        required: false,
                        categories: ["IMAGE"],
                        label: "SFRPG.ActorSheet.Biography.FullBodyImage",
                        hint: "SFRPG.ActorSheet.Biography.ImageTooltip"
                    }),
                    genderPronouns: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false,
                        label: "SFRPG.ActorSheet.Biography.GenderPronouns"
                    }),
                    height: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false,
                        label: "SFRPG.ActorSheet.Biography.Height"
                    }),
                    homeWorld: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false,
                        label: "SFRPG.ActorSheet.Biography.Homeworld"
                    }),
                    otherVisuals: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false,
                        label: "SFRPG.ActorSheet.Biography.OtherVisuals"
                    }),
                    public: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false
                    }),
                    value: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false
                    }),
                    weight: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false,
                        label: "SFRPG.ActorSheet.Biography.Weight"
                    })
                })
            }),
            skills: new fields.TypedObjectField(
                new fields.SchemaField(SFRPGActorBase._skillFieldData()),
                SFRPGActorBase._skillsInitial()
            )
        };

        // Add these in for characters and npcs
        if (!isDrone) {
            foundry.utils.mergeObject(schema, {
                traits: new fields.SchemaField({
                    ci: new fields.SchemaField(SFRPGActorBase._traitFieldData(), {label: "SFRPG.ConImm"}),
                    di: new fields.SchemaField(SFRPGActorBase._traitFieldData(), {label: "SFRPG.Damage.Immunities"}),
                    dv: new fields.SchemaField(SFRPGActorBase._traitFieldData(), {label: "SFRPG.Damage.Vulnerabilities"}),
                    languages: new fields.SchemaField(SFRPGActorBase._traitFieldData(), {label: "SFRPG.Languages"}),
                    senses: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false,
                        label: "SFRPG.SensesTypes.Senses"
                    }),
                    size: new fields.StringField({
                        initial: "medium",
                        blank: false,
                        choices: Object.keys(CONFIG.SFRPG.actorSizes),
                        required: true,
                        label: "SFRPG.Size"
                    }),
                    sr: new fields.NumberField({ // TODO: collate this and 'spellResistance' into one field
                        initial: 0,
                        nullable: false,
                        required: true,
                        label: "SFRPG.SpellResistance"
                    })
                })
            });

            foundry.utils.mergeObject(schema.attributes.fields, {
                arms: new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: false,
                    required: true,
                    label: "SFRPG.NumberOfArms"
                }),
                reach: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: true,
                    label: "SFRPG.Reach"
                }),
                space: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: true,
                    label: "SFRPG.Space"
                })
            });

            schema.attributes.fields.init.fields.value = new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                required: true
            });

            schema.details.fields.alignment = new fields.StringField({
                initial: "",
                blank: true,
                required: true,
                label: "SFRPG.AlignmentPlaceHolderText"
            });
        }
        return schema;
    }

    static conditionsTemplate() {
        const conditions = Object.keys(CONFIG.SFRPG.conditionTypes);
        const conditionFields = {};

        for (const condition of conditions) {
            conditionFields[condition] = new fields.BooleanField({
                initial: false,
                required: true
            });
        }

        return {conditions: new fields.SchemaField(conditionFields)};
    }

    static crewTemplate(options = {}) {
        const type = options.type ?? "vehicle";

        const schema = {
            passenger: SFRPGActorBase._crewPCField({
                init: 0,
                label: "SFRPG.StarshipSheet.Role.Passenger"
            }),
            pilot: SFRPGActorBase._crewPCField({
                init: 1,
                label: "SFRPG.StarshipSheet.Role.Pilot"
            }),
            useNPCCrew: new fields.BooleanField({
                initial: true,
                required: true
            })
        };

        if (type === "vehicle") {
            foundry.utils.mergeObject(schema, {
                complement: SFRPGActorBase._crewPCField({
                    init: 0,
                    label: "SFRPG.VehicleSheet.Details.OtherAttributes.Complement"
                })
            });
        } else if (type === "starship") {
            foundry.utils.mergeObject(schema, {
                captain: SFRPGActorBase._crewPCField({
                    init: 1,
                    label: "SFRPG.StarshipSheet.Role.Captain"
                }),
                chiefMate: SFRPGActorBase._crewPCField({
                    init: -1,
                    label: "SFRPG.StarshipSheet.Role.ChiefMate"
                }),
                engineer: SFRPGActorBase._crewPCField({
                    init: -1,
                    label: "SFRPG.StarshipSheet.Role.Engineer"
                }),
                gunner: SFRPGActorBase._crewPCField({
                    init: 0,
                    label: "SFRPG.StarshipSheet.Role.Gunner"
                }),
                magicOfficer: SFRPGActorBase._crewPCField({
                    init: -1,
                    label: "SFRPG.StarshipSheet.Role.MagicOfficer"
                }),
                scienceOfficer: SFRPGActorBase._crewPCField({
                    init: -1,
                    label: "SFRPG.StarshipSheet.Role.ScienceOfficer"
                }),
                npcData: new fields.SchemaField({
                    captain: SFRPGActorBase._crewNPCField({label: "SFRPG.StarshipSheet.Role.Captain"}),
                    chiefMate: SFRPGActorBase._crewNPCField({label: "SFRPG.StarshipSheet.Role.ChiefMate"}),
                    engineer: SFRPGActorBase._crewNPCField({label: "SFRPG.StarshipSheet.Role.Engineer"}),
                    gunner: SFRPGActorBase._crewNPCField({label: "SFRPG.StarshipSheet.Role.Gunner"}),
                    magicOfficer: SFRPGActorBase._crewNPCField({label: "SFRPG.StarshipSheet.Role.MagicOfficer"}),
                    pilot: SFRPGActorBase._crewNPCField({label: "SFRPG.StarshipSheet.Role.Pilot"}),
                    scienceOfficer: SFRPGActorBase._crewNPCField({label: "SFRPG.StarshipSheet.Role.ScienceOfficer"})
                })
            });
        }

        return {
            crew: new fields.SchemaField(schema)
        };
    }

    static spellTemplate(options = {}) {
        const actorType = options.actorType ?? "npc";
        return {
            spells: new fields.SchemaField({
                spell0: new fields.SchemaField(SFRPGActorBase._spellFieldData({actorType})),
                spell1: new fields.SchemaField(SFRPGActorBase._spellFieldData({actorType})),
                spell2: new fields.SchemaField(SFRPGActorBase._spellFieldData({actorType})),
                spell3: new fields.SchemaField(SFRPGActorBase._spellFieldData({actorType})),
                spell4: new fields.SchemaField(SFRPGActorBase._spellFieldData({actorType})),
                spell5: new fields.SchemaField(SFRPGActorBase._spellFieldData({actorType})),
                spell6: new fields.SchemaField(SFRPGActorBase._spellFieldData({actorType}))
            }, {required: true, label: "SFRPG.Items.Categories.Spells"})
        };
    }

    static _abilityFieldData(isCharacter) {
        const dataField = {
            base: new fields.NumberField({
                initial: 10,
                min: -5
            })
        };

        if (isCharacter) {
            foundry.utils.mergeObject(dataField, {
                damage: new fields.NumberField({
                    initial: null,
                    nullable: true
                }),
                drain: new fields.NumberField({
                    initial: null,
                    nullable: true
                }),
                userPenalty: new fields.NumberField({
                    initial: null,
                    nullable: true
                })
            });
        }

        return dataField;
    }

    static _crewNPCField(options = {}) {
        const label = options.label ?? "";
        const hint = options.hint ?? "";
        return new fields.SchemaField({
            numberOfUses: new fields.NumberField({
                initial: null,
                min: 0,
                nullable: true,
                label: "SFRPG.StarshipSheet.Crew.NumberOfUses"
            }),
            skills: new fields.TypedObjectField(
                new fields.SchemaField(SFRPGActorBase._skillFieldData({forStarship: true}))
            )
        }, {label: label, hint: hint});
    }

    static _crewPCField(options = {}) {
        const init = options.init ?? 0;
        const label = options.label ?? "";
        const hint = options.hint ?? "";
        return new fields.SchemaField({
            actorIds: new fields.ArrayField(
                new fields.StringField({
                    blank: false,
                    label: "SFRPG.StarshipSheet.Crew.ActorIDs",
                    hint: "SFRPG.StarshipSheet.Crew.ActorIDsTooltip"
                })
            ),
            limit: new fields.NumberField({
                initial: init,
                min: -1,
                nullable: false,
                required: true,
                label: "SFRPG.StarshipSheet.Crew.RoleLimit",
                hint: "SFRPG.StarshipSheet.Crew.RoleLimitTooltip"
            })
        }, {label: label, hint: hint});
    }

    static _saveFieldData() {
        return {
            misc: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                required: true
            })
        };
    }

    static _skillFieldData(options = {}) {
        const ability = options.ability ?? "cha";
        const forStarship = options.forStarship ?? false;
        const hasArmorCheckPenalty = options.hasArmorCheckPenalty ?? false;
        const isTrainedOnly = options.isTrainedOnly ?? false;
        const dataField = {
            ranks: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                required: false
            })
        };

        if (forStarship) {
            foundry.utils.mergeObject(dataField, {
                mod: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: false
                })
            });
        } else {
            foundry.utils.mergeObject(dataField, {
                ability: new fields.StringField({
                    initial: ability,
                    blank: false,
                    choices: Object.keys(CONFIG.SFRPG.abilities),
                    required: false
                }),
                enabled: new fields.BooleanField({
                    initial: false,
                    required: false
                }),
                hasArmorCheckPenalty: new fields.BooleanField({
                    initial: hasArmorCheckPenalty,
                    required: false
                }),
                isTrainedOnly: new fields.BooleanField({
                    initial: isTrainedOnly,
                    required: false
                }),
                misc: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: false
                }),
                subname: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: false
                }),
                value: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: false,
                    required: false
                })
            });
        }

        return dataField;
    }

    static _skillsInitial() {
        const dataObject = {
            initial: {
                acr: {
                    ability: "dex",
                    hasArmorCheckPenalty: true,
                    isTrainedOnly: false
                },
                ath: {
                    ability: "str",
                    hasArmorCheckPenalty: true,
                    isTrainedOnly: false
                },
                blu: {
                    ability: "cha",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: false
                },
                com: {
                    ability: "int",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: false
                },
                cul: {
                    ability: "int",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: true
                },
                dip: {
                    ability: "cha",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: false
                },
                dis: {
                    ability: "cha",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: false
                },
                eng: {
                    ability: "int",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: true
                },
                int: {
                    ability: "cha",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: false
                },
                lsc: {
                    ability: "int",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: true
                },
                med: {
                    ability: "int",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: true
                },
                mys: {
                    ability: "wis",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: true
                },
                per: {
                    ability: "wis",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: false
                },
                phs: {
                    ability: "int",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: true
                },
                pil: {
                    ability: "dex",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: false
                },
                pro: {
                    ability: "int",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: true
                },
                sen: {
                    ability: "wis",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: false
                },
                sle: {
                    ability: "dex",
                    hasArmorCheckPenalty: true,
                    isTrainedOnly: true
                },
                ste: {
                    ability: "dex",
                    hasArmorCheckPenalty: true,
                    isTrainedOnly: false
                },
                sur: {
                    ability: "wis",
                    hasArmorCheckPenalty: false,
                    isTrainedOnly: false
                }
            }
        };
        return dataObject;
    }

    static _spellFieldData(options = {}) {
        const actorType = options.actorType ?? "npc";
        const schema = {
            value: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: true,
                required: false
            }),
            max: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: true,
                required: false
            })
        };

        // If an actor is a character, add a per-class field for spell slots
        if (actorType === "character") {
            schema.perClass = new fields.TypedObjectField(
                new fields.SchemaField({
                    value: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        nullable: true,
                        required: false
                    })
                })
            );
        }

        return schema;
    }

    static _traitFieldData() {
        return {
            custom: new fields.StringField({
                initial: "",
                blank: true,
                required: false
            }),
            value: new fields.ArrayField(
                new fields.StringField({
                    initial: "",
                    blank: true,
                    required: false
                })
            )
        };
    }
}
