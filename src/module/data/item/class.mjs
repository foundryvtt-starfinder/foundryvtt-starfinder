import SFRPGItemBase from './base-item.mjs';

const {fields} = foundry.data;

export default class SFRPGItemClass extends SFRPGItemBase {

    static LOCALIZATION_PREFIXES = [
        'SFRPG.Item.Base',
        'SFRPG.Item.Class'
    ];

    static defineSchema() {
        const schema = super.defineSchema();

        // Class-specific properties
        foundry.utils.mergeObject(schema, {
            bab: new fields.StringField({
                initial: "moderate",
                required: true,
                choices: Object.keys(CONFIG.SFRPG.babProgression),
                blank: false,
                label: "SFRPG.ClassBABProgression"
            }),
            bonusSpellsPerDay: SFRPGItemClass._bonusSpellsPerDayFieldData(),
            csk: new fields.TypedObjectField(
                new fields.BooleanField({initial: false}),
                { required: true, label: "SFRPG.ClassSkills", validateKey: (key) => key in CONFIG.SFRPG.skills}
            ),
            fort: new fields.StringField({
                initial: "slow",
                required: true,
                choices: Object.keys(CONFIG.SFRPG.saveProgression),
                blank: false,
                label: "SFRPG.ClassFortSaveProgression"
            }),
            hp: new fields.SchemaField({
                value: new fields.NumberField({
                    initial: 1,
                    min: 0,
                    integer: true,
                    nullable: false,
                    required: true,
                    label: "SFRPG.ClassHPPerLevel"
                })
            }),
            isCaster: new fields.BooleanField({initial: false}),
            levels: new fields.NumberField({
                initial: 1,
                min: 1,
                integer: true,
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
                armor: new fields.TypedObjectField(
                    new fields.BooleanField({initial: false}),
                    { required: true, label: "SFRPG.ClassArmorProf", validateKey: (key) => Object.keys(CONFIG.SFRPG.armorProficiencies).includes(key)}
                ),
                weapon: new fields.TypedObjectField(
                    new fields.BooleanField({initial: false}),
                    { required: true, label: "SFRPG.ClassWeaponProf", validateKey: (key) => Object.keys(CONFIG.SFRPG.weaponProficiencies).includes(key)}
                )
            }),
            ref: new fields.StringField({
                initial: "slow",
                required: true,
                choices: Object.keys(CONFIG.SFRPG.saveProgression),
                blank: false,
                label: "SFRPG.ClassReflexSaveProgression"
            }),
            skillRanks: new fields.SchemaField({
                value: new fields.NumberField({
                    initial: 4,
                    min: 0,
                    integer: true,
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
                value: new fields.NumberField({
                    initial: 1,
                    min: 0,
                    integer: true,
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
            spellsKnown: SFRPGItemClass._spellsKnownFieldData(),
            spellsPerDay: SFRPGItemClass._spellsPerDayFieldData(),
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

    static _spellsKnownFieldData() {
        const initialValues = {
            "1":  {"0": 4, "1": 2, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0},
            "2":  {"0": 5, "1": 3, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0},
            "3":  {"0": 6, "1": 4, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0},
            "4":  {"0": 6, "1": 4, "2": 2, "3": 0, "4": 0, "5": 0, "6": 0},
            "5":  {"0": 6, "1": 4, "2": 3, "3": 0, "4": 0, "5": 0, "6": 0},
            "6":  {"0": 6, "1": 4, "2": 4, "3": 0, "4": 0, "5": 0, "6": 0},
            "7":  {"0": 6, "1": 5, "2": 4, "3": 2, "4": 0, "5": 0, "6": 0},
            "8":  {"0": 6, "1": 5, "2": 4, "3": 3, "4": 0, "5": 0, "6": 0},
            "9":  {"0": 6, "1": 5, "2": 4, "3": 4, "4": 0, "5": 0, "6": 0},
            "10": {"0": 6, "1": 5, "2": 5, "3": 4, "4": 2, "5": 0, "6": 0},
            "11": {"0": 6, "1": 6, "2": 5, "3": 4, "4": 3, "5": 0, "6": 0},
            "12": {"0": 6, "1": 6, "2": 5, "3": 4, "4": 4, "5": 0, "6": 0},
            "13": {"0": 6, "1": 6, "2": 5, "3": 5, "4": 4, "5": 2, "6": 0},
            "14": {"0": 6, "1": 6, "2": 6, "3": 5, "4": 4, "5": 3, "6": 0},
            "15": {"0": 6, "1": 6, "2": 6, "3": 5, "4": 4, "5": 4, "6": 0},
            "16": {"0": 6, "1": 6, "2": 6, "3": 5, "4": 5, "5": 4, "6": 2},
            "17": {"0": 6, "1": 6, "2": 6, "3": 6, "4": 5, "5": 4, "6": 3},
            "18": {"0": 6, "1": 6, "2": 6, "3": 6, "4": 5, "5": 4, "6": 4},
            "19": {"0": 6, "1": 6, "2": 6, "3": 6, "4": 5, "5": 5, "6": 4},
            "20": {"0": 6, "1": 6, "2": 6, "3": 6, "4": 6, "5": 5, "6": 5}
        };

        const fieldData = {};

        for (const [classLevel, spellsAtLevel] of Object.entries(initialValues)) {
            const fieldDataInner = {};
            for (const [spellLevel, numSpells] of Object.entries(spellsAtLevel)) {
                fieldDataInner[spellLevel] = new fields.NumberField({
                    initial: numSpells,
                    min: 0,
                    integer: true,
                    required: true
                });
            }
            fieldData[classLevel] = new fields.SchemaField(fieldDataInner);
        }

        return new fields.SchemaField(fieldData);
    }

    static _spellsPerDayFieldData() {
        const initialValues = {
            "1":  {"1": 2, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0},
            "2":  {"1": 2, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0},
            "3":  {"1": 3, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0},
            "4":  {"1": 3, "2": 2, "3": 0, "4": 0, "5": 0, "6": 0},
            "5":  {"1": 4, "2": 2, "3": 0, "4": 0, "5": 0, "6": 0},
            "6":  {"1": 4, "2": 3, "3": 0, "4": 0, "5": 0, "6": 0},
            "7":  {"1": 4, "2": 3, "3": 2, "4": 0, "5": 0, "6": 0},
            "8":  {"1": 4, "2": 4, "3": 2, "4": 0, "5": 0, "6": 0},
            "9":  {"1": 5, "2": 4, "3": 3, "4": 0, "5": 0, "6": 0},
            "10": {"1": 5, "2": 4, "3": 3, "4": 2, "5": 0, "6": 0},
            "11": {"1": 5, "2": 4, "3": 4, "4": 2, "5": 0, "6": 0},
            "12": {"1": 5, "2": 5, "3": 4, "4": 3, "5": 0, "6": 0},
            "13": {"1": 5, "2": 5, "3": 4, "4": 3, "5": 2, "6": 0},
            "14": {"1": 5, "2": 5, "3": 4, "4": 4, "5": 2, "6": 0},
            "15": {"1": 5, "2": 5, "3": 5, "4": 4, "5": 3, "6": 0},
            "16": {"1": 5, "2": 5, "3": 5, "4": 4, "5": 3, "6": 2},
            "17": {"1": 5, "2": 5, "3": 5, "4": 4, "5": 4, "6": 2},
            "18": {"1": 5, "2": 5, "3": 5, "4": 5, "5": 4, "6": 3},
            "19": {"1": 5, "2": 5, "3": 5, "4": 5, "5": 5, "6": 4},
            "20": {"1": 5, "2": 5, "3": 5, "4": 5, "5": 5, "6": 5}
        };

        const fieldData = {};

        for (const [classLevel, spellsAtLevel] of Object.entries(initialValues)) {
            const fieldDataInner = {};
            for (const [spellLevel, numSpells] of Object.entries(spellsAtLevel)) {
                fieldDataInner[spellLevel] = new fields.NumberField({
                    initial: numSpells,
                    min: 0,
                    integer: true,
                    required: true
                });
            }
            fieldData[classLevel] = new fields.SchemaField(fieldDataInner);
        }

        return new fields.SchemaField(fieldData);
    }

    static _bonusSpellsPerDayFieldData() {
        const initialValues = {
            "0":  {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0},
            "1":  {"1": 1, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0},
            "2":  {"1": 1, "2": 1, "3": 0, "4": 0, "5": 0, "6": 0},
            "3":  {"1": 1, "2": 1, "3": 1, "4": 0, "5": 0, "6": 0},
            "4":  {"1": 1, "2": 1, "3": 1, "4": 1, "5": 0, "6": 0},
            "5":  {"1": 2, "2": 1, "3": 1, "4": 1, "5": 1, "6": 0},
            "6":  {"1": 2, "2": 2, "3": 1, "4": 1, "5": 1, "6": 1},
            "7":  {"1": 2, "2": 2, "3": 2, "4": 1, "5": 1, "6": 1},
            "8":  {"1": 2, "2": 2, "3": 2, "4": 2, "5": 1, "6": 1},
            "9":  {"1": 3, "2": 2, "3": 2, "4": 2, "5": 2, "6": 1},
            "10": {"1": 3, "2": 3, "3": 2, "4": 2, "5": 2, "6": 2}
        };

        const fieldData = {};

        for (const [classLevel, spellsAtLevel] of Object.entries(initialValues)) {
            const fieldDataInner = {};
            for (const [spellLevel, numSpells] of Object.entries(spellsAtLevel)) {
                fieldDataInner[spellLevel] = new fields.NumberField({
                    initial: numSpells,
                    min: 0,
                    integer: true,
                    required: true
                });
            }
            fieldData[classLevel] = new fields.SchemaField(fieldDataInner);
        }

        return new fields.SchemaField(fieldData);
    }
}
