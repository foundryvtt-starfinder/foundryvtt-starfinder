import SFRPGDocumentBase from "../base-document.mjs";

const { fields } = foundry.data;

export default class SFRPGActorBase extends SFRPGDocumentBase {
    static defineSchema() {
        const schema = super.defineSchema();
        return schema;
    }

    static commonTemplate(options = {}) {
        const includeBaseAbilities = options.includeBaseAbilities ?? false;

        return {
            abilities: new fields.SchemaField({
                cha: new fields.SchemaField(SFRPGActorBase._abilityFieldData(includeBaseAbilities)),
                con: new fields.SchemaField(SFRPGActorBase._abilityFieldData(includeBaseAbilities)),
                dex: new fields.SchemaField(SFRPGActorBase._abilityFieldData(includeBaseAbilities)),
                int: new fields.SchemaField(SFRPGActorBase._abilityFieldData(includeBaseAbilities)),
                str: new fields.SchemaField(SFRPGActorBase._abilityFieldData(includeBaseAbilities)),
                wis: new fields.SchemaField(SFRPGActorBase._abilityFieldData(includeBaseAbilities))
            }),
            attributes: new fields.SchemaField({
                eac: new fields.SchemaField(SFRPGActorBase._defenseFieldData()),
                kac: new fields.SchemaField(SFRPGActorBase._defenseFieldData()),
                cmd: new fields.SchemaField(SFRPGActorBase._defenseFieldData()),
                hp: new fields.SchemaField({
                    ...SFRPGActorBase.tooltipTemplate(),
                    max: new fields.NumberField({
                        initial: 10,
                        min: 0,
                        nullable: false,
                        required: true
                    }),
                    min: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        nullable: false,
                        required: true
                    }),
                    temp: new fields.NumberField({
                        initial: null,
                        min: 0,
                        nullable: true,
                        required: true
                    }),
                    tempmax: new fields.NumberField({
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
                }),
                init: new fields.SchemaField({
                    ...SFRPGActorBase.tooltipTemplate(),
                    bonus: new fields.NumberField({
                        initial: 0,
                        min: 0,
                        nullable: false,
                        required: true
                    }),
                    total: new fields.NumberField({
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
                }),
                fort: new fields.SchemaField(SFRPGActorBase._saveFieldData()),
                reflex: new fields.SchemaField(SFRPGActorBase._saveFieldData()),
                will: new fields.SchemaField(SFRPGActorBase._saveFieldData()),
                arms: new fields.NumberField({
                    initial: 2,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                space: new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                reach: new fields.NumberField({
                    initial: 5,
                    min: 0,
                    nullable: false,
                    required: true
                }),
                speed: new fields.SchemaField({
                    ...SFRPGDocumentBase.speedTemplate()
                })
            }),
            currency: new fields.SchemaField({
                credit: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: true,
                    required: false
                }),
                upb: new fields.NumberField({
                    initial: 0,
                    min: 0,
                    nullable: true,
                    required: false
                }),
            }),
            details: new fields.SchemaField({
                alignment: new fields.StringField({
                    initial: "",
                    blank: "",
                    required: true
                }),
                biography: new fields.SchemaField({
                    age: new fields.NumberField({
                        initial: null,
                        min: 0,
                        nullable: true,
                        required: false
                    }),
                    dateOfBirth: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false
                    }),
                    deity: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false
                    }),
                    fullBodyImage: new fields.FilePathField({
                        initial: "",
                        blank: true,
                        required: false,
                        categories: ["IMAGE"]
                    }),
                    genderPronouns: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false
                    }),
                    height: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false
                    }),
                    homeWorld: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false
                    }),
                    otherVisuals: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false
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
                        required: false
                    })
                }),
                race: new fields.StringField({
                    initial: "",
                    blank: true,
                    required: true
                })
            }),
            skills: new fields.SchemaField({
                acr: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "dex",
                    isTrainedOnly: false,
                    hasArmorCheckPenalty: true
                }), {label: "SFRPG.SkillAcr"}),
                ath: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "str",
                    isTrainedOnly: false,
                    hasArmorCheckPenalty: true
                }), {label: "SFRPG.SkillAth"}),
                blu: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "cha",
                    isTrainedOnly: false,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillBlu"}),
                com: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "int",
                    isTrainedOnly: true,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillCom"}),
                cul: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "int",
                    isTrainedOnly: true,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillCul"}),
                dip: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "cha",
                    isTrainedOnly: false,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillDip"}),
                dis: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "cha",
                    isTrainedOnly: false,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillDis"}),
                eng: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "int",
                    isTrainedOnly: true,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillEng"}),
                int: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "cha",
                    isTrainedOnly: false,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillInt"}),
                lsc: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "int",
                    isTrainedOnly: true,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillLsc"}),
                med: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "int",
                    isTrainedOnly: true,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillMed"}),
                mys: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "wis",
                    isTrainedOnly: true,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillMys"}),
                per: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "wis",
                    isTrainedOnly: false,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillPer"}),
                phs: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "int",
                    isTrainedOnly: true,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillPhs"}),
                pil: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "dex",
                    isTrainedOnly: false,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillPil"}),
                pro: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "int",
                    isTrainedOnly: true,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillPro"}),
                sen: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "wis",
                    isTrainedOnly: false,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillSen"}),
                sle: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "dex",
                    isTrainedOnly: true,
                    hasArmorCheckPenalty: true
                }), {label: "SFRPG.SkillSle"}),
                ste: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "dex",
                    isTrainedOnly: false,
                    hasArmorCheckPenalty: true
                }), {label: "SFRPG.SkillSte"}),
                sur: new fields.SchemaField(SFRPGActorBase._skillFieldData({
                    ability: "wis",
                    isTrainedOnly: false,
                    hasArmorCheckPenalty: false
                }), {label: "SFRPG.SkillSur"})
            }),
            spells: new fields.SchemaField({
                spell0: new fields.SchemaField(SFRPGActorBase._spellFieldData(), {required: false}),
                spell1: new fields.SchemaField(SFRPGActorBase._spellFieldData(), {required: false}),
                spell2: new fields.SchemaField(SFRPGActorBase._spellFieldData(), {required: false}),
                spell3: new fields.SchemaField(SFRPGActorBase._spellFieldData(), {required: false}),
                spell4: new fields.SchemaField(SFRPGActorBase._spellFieldData(), {required: false}),
                spell5: new fields.SchemaField(SFRPGActorBase._spellFieldData(), {required: false}),
                spell6: new fields.SchemaField(SFRPGActorBase._spellFieldData(), {required: false})
            }, {required: false}),
            traits: new fields.SchemaField({
                ci: new fields.SchemaField(SFRPGActorBase._traitFieldData(), {label: "SFRPG.ConImm"}),
                damageReduction: new fields.SchemaField({
                    negatedBy: new fields.StringField({
                        initial: "",
                        blank: true,
                        required: false
                    }),
                    value: new fields.NumberField({
                        initial: 0,
                        nullable: true,
                        required: false
                    })
                }),
                di: new fields.SchemaField(SFRPGActorBase._traitFieldData(), {label: "SFRPG.Damage.Immunities"}),
                dr: new fields.SchemaField(SFRPGActorBase._traitFieldData(), {label: "SFRPG.Damage.Reduction"}),
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
                spellResistance: new fields.SchemaField({ // TODO: collate this and 'sr' into one field
                    base: new fields.NumberField({
                        initial: 0,
                        nullable: true,
                        required: false
                    })
                }, {label: "SFRPG.SpellResistance"}),
                sr: new fields.NumberField({ // TODO: collate this and 'spellResistance' into one field
                    initial: 0,
                    nullable: false,
                    required: true,
                    label: "SFRPG.SpellResistance"
                })
            })
        };
    }

    static conditionsTemplate() {
        return {
            conditions: new fields.ObjectField({}) // TODO-Ian: Detail this field
        };
    }

    static _abilityFieldData(includeBase) {
        const data = {
            value: new fields.NumberField({
                initial: 10,
                min: 0
            }),
            min: new fields.NumberField({
                initial: 3,
                min: 0
            }),
            misc: new fields.NumberField({
                initial: 3,
                min: 0
            }),
            mod: new fields.NumberField({
                initial: 3,
                min: 0
            })
        };

        if (includeBase) {
            data.base = new fields.NumberField({
                initial: 10,
                min: 0
            });
        }

        return data;
    }

    static _defenseFieldData() {
        return {
            ...SFRPGActorBase.tooltipTemplate(),
            min: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                required: true
            }),
            value: new fields.NumberField({
                initial: 10,
                min: 0,
                nullable: false,
                required: true
            })
        }
    }

    static _saveFieldData() {
        return {
            ...SFRPGActorBase.tooltipTemplate(),
            bonus: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                required: true
            }),
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
        }
    }

    static _skillFieldData(options = {}) {
        const ability = options.ability ?? "cha";
        const isTrainedOnly = options.isTrainedOnly ?? false;
        const hasArmorCheckPenalty = options.hasArmorCheckPenalty ?? false;
        return {
            ability: new fields.StringField({
                initial: ability,
                blank: false,
                choices: Object.keys(CONFIG.SFRPG.abilities),
                required: false
            }),
            min: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                required: false
            }),
            ranks: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                required: false
            }),
            value: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                required: false
            }),
            misc: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                required: false
            }),
            mod: new fields.NumberField({
                initial: 0,
                min: 0,
                nullable: false,
                required: false
            }),
            enabled: new fields.BooleanField({
                initial: false,
                required: false
            }),
            isTrainedOnly: new fields.BooleanField({
                initial: isTrainedOnly,
                required: false
            }),
            hasArmorCheckPenalty: new fields.BooleanField({
                initial: hasArmorCheckPenalty,
                required: false
            })
        }
    }

    static _spellFieldData() {
        return {
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
            }),
            perClass: new fields.ObjectField() // TODO-Ian: Detail this field a bit more
        }
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
        }
    }

    static tooltipTemplate() {
        return {
            tooltip: new fields.ArrayField(
                new fields.StringField({
                    initial: "",
                    required: false,
                    blank: true
                }), {required: false}
            )
        };
    }
}
