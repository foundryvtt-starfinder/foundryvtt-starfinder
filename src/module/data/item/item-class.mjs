import SFRPGItemBase from './base-item.mjs';

export default class SFRPGItemClass extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Class'
    ];

    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        // merge schema with templates
        foundry.utils.mergeObject(schema, {
            ...SFRPGItemBase.modifiersTemplate()
        });

        // Class-specific properties
        foundry.utils.mergeObject(schema, {
            bab: new fields.StringField({
                initial: "moderate",
                required: true,
                choices: Object.keys(CONFIG.SFRPG.babProgression),
                blank: false,
                label: "SFRPG.ClassBABProgression"
            }),
            bonusSpellsPerDay: SFRPGItemClass.bonusSpellsPerDayField(),
            csk: new fields.ObjectField({ // TODO-Ian: detail this type more
                required: true,
                label: "SFRPG.ClassSkills"
            }),
            fort: new fields.StringField({
                initial: "slow",
                required: true,
                choices: Object.keys(CONFIG.SFRPG.saveProgression),
                blank: false,
                label: "SFRPG.ClassFortSaveProgression"
            }),
            hp: new fields.SchemaField({
                min: new fields.NumberField({ // TODO-Ian: Might be unneeded?
                    initial: 1,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                value: new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: false,
                    required: true,
                    label: "SFRPG.ClassHPPerLevel"
                })
            }),
            isCaster: new fields.BooleanField(),
            levels: new fields.NumberField({
                initial: 1,
                min: 1,
                nullable: false,
                required: true
            }),
            kas: new fields.StringField({
                initial: "str",
                required: true,
                choices: Object.keys(CONFIG.SFRPG.abilities),
                blank: false,
                label: "SFRPG.KeyAbility"
            }),
            proficiencies: new fields.SchemaField({
                armor: new fields.ObjectField({ // TODO-Ian: detail this type more
                    required: true,
                    label: "SFRPG.ClassArmorProf"
                }),
                weapon: new fields.ObjectField({ // TODO-Ian: detail this type more
                    required: true,
                    label: "SFRPG.ClassWeaponProf"
                })
            }),
            ref: new fields.StringField({
                initial: "slow",
                required: true,
                choices: Object.keys(CONFIG.SFRPG.saveProgression),
                blank: false,
                label: "SFRPG.ClassReflexSaveProgression"
            }),
            skillRanks: new fields.SchemaField({
                min: new fields.NumberField({ // TODO-Ian: Might be unneeded?
                    initial: 4,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                value: new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: false,
                    required: true,
                    label: "SFRPG.ClassSkillRanksPerlevel"
                })
            }),
            slug: new fields.StringField({
                initial: "",
                required: true,
                blank: true
            }),
            sp: new fields.SchemaField({
                min: new fields.NumberField({ // TODO-Ian: Might be unneeded?
                    initial: 1,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                value: new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: false,
                    required: true,
                    label: "SFRPG.ClassSPPerLevel"
                })
            }),
            spellAbility: new fields.StringField({
                initial: "",
                required: true,
                choices: ["", ...Object.keys(CONFIG.SFRPG.abilities)],
                blank: true,
                label: "SFRPG.ClassSpellcastingAbility"
            }),
            spellsKnown: SFRPGItemClass.spellsKnownField(),
            spellsPerDay: SFRPGItemClass.spellsPerDayField(),
            will: new fields.StringField({
                initial: "slow",
                required: true,
                choices: Object.keys(CONFIG.SFRPG.saveProgression),
                blank: false,
                label: "SFRPG.ClassWillSaveProgression"
            })
        });

        // No other initial values specific to classes

        return schema;
    }

    static spellsKnownField() {
        const fields = foundry.data.fields;
        return new fields.SchemaField({
            "1": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "2": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "3": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "4": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "5": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "6": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "7": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "8": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "9": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "10": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "11": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "12": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "13": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "14": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "15": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "16": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "17": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "18": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "19": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "20": new fields.SchemaField({
                "0": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "1": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 6,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                })
            })
        });
    }

    static spellsPerDayField() {
        const fields = foundry.data.fields;
        return new fields.SchemaField({
            "1": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "2": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "3": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "4": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "5": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "6": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "7": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "8": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "9": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "10": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "11": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "12": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "13": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "14": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "15": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "16": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "17": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "18": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "19": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 4,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "20": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: true,
                    required: true
                })
            })
        });
    }

    static bonusSpellsPerDayField() {
        const fields = foundry.data.fields;
        return new fields.SchemaField({
            "0": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "1": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "2": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "3": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "4": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "5": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: null,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "6": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "7": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "8": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "9": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 1,
                    min: 0,
                    nullable: true,
                    required: true
                })
            }),
            "10": new fields.SchemaField({
                "1": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "2": new fields.NumberField({
                    initial: 3,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "3": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "4": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "5": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                }),
                "6": new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: true,
                    required: true
                })
            })
        });
    }
}
