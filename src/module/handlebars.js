/**
 * Define a set of template paths to pre-load
 *
 * Pre-loaded templates are compiled and cached for fast access when rendering
 *
 * @returns {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
    const templatePaths = [
        // Actor Sheet Partials
        "systems/sfrpg/templates/actors/parts/actor-biography.hbs",
        "systems/sfrpg/templates/actors/parts/actor-features-item.hbs",
        "systems/sfrpg/templates/actors/parts/actor-features.hbs",
        "systems/sfrpg/templates/actors/parts/actor-inventory-item.hbs",
        "systems/sfrpg/templates/actors/parts/actor-inventory.hbs",
        "systems/sfrpg/templates/actors/parts/actor-modifiers.hbs",
        "systems/sfrpg/templates/actors/parts/actor-movement-element.hbs",
        "systems/sfrpg/templates/actors/parts/actor-spellbook.hbs",
        "systems/sfrpg/templates/actors/parts/actor-traits.hbs",
        "systems/sfrpg/templates/actors/parts/actor-vehicle-system-item.hbs",
        "systems/sfrpg/templates/actors/parts/actor-vehicle-systems.hbs",

        // Item Sheet Partials
        "systems/sfrpg/templates/items/parts/item-action.hbs",
        "systems/sfrpg/templates/items/parts/item-activation.hbs",
        "systems/sfrpg/templates/items/parts/item-description.hbs",
        "systems/sfrpg/templates/items/parts/item-capacity.hbs",
        "systems/sfrpg/templates/items/parts/item-modifiers.hbs",
        "systems/sfrpg/templates/items/parts/item-header.hbs",
        "systems/sfrpg/templates/items/parts/item-special-materials.hbs",
        "systems/sfrpg/templates/items/parts/item-descriptors.hbs",
        "systems/sfrpg/templates/items/parts/item-status.hbs",
        "systems/sfrpg/templates/items/parts/physical-item-details.hbs",
        "systems/sfrpg/templates/items/parts/starship-subactions.hbs",
        "systems/sfrpg/templates/items/parts/starship-component.hbs",
        "systems/sfrpg/templates/items/parts/container-details.hbs",
        "systems/sfrpg/templates/items/parts/weapon-properties.hbs",
        "systems/sfrpg/templates/items/parts/damage-sections.hbs",
        "systems/sfrpg/templates/items/parts/item-duration.hbs",
        "systems/sfrpg/templates/items/parts/effect-turn-events.hbs"
    ];

    return foundry.applications.handlebars.loadTemplates(templatePaths);
};

export function setupHandlebars() {
    Handlebars.registerHelper("length", function(value) {
        if (value instanceof Array) {
            return value.length;
        } else if (typeof value === "string") {
            return value.length;
        } else if (typeof value === "number") {
            return String(value).length;
        } else if (value instanceof Object) {
            return Object.entries(value).length;
        }

        return 0;
    });

    Handlebars.registerHelper("crDecimalToFraction", function(value) {
        let string = "";
        switch (value) {
            case 0.125: string = "1/8";
                break;
            case 0.16666666666666666: string = "1/6";
                break;
            case 0.25: string = "1/4";
                break;
            case 0.3333333333333333: string = "1/3";
                break;
            case 0.5: string = "1/2";
                break;
        }
        return string || value;
    });

    Handlebars.registerHelper("not", function(value) {
        return !value;
    });

    Handlebars.registerHelper("add", function(v1, v2, options) {
        'use strict';
        return v1 + v2;
    });

    Handlebars.registerHelper("sub", function(v1, v2, options) {
        'use strict';
        return v1 - v2;
    });

    Handlebars.registerHelper("mult", function(v1, v2, options) {
        'use strict';
        return v1 * v2;
    });

    Handlebars.registerHelper("div", function(v1, v2, options) {
        'use strict';
        return v1 / v2;
    });

    Handlebars.registerHelper("isNull", function(value) {
        if (value === 0) return false;
        return !value;
    });

    Handlebars.registerHelper('greaterThan', function(v1, v2, options) {
        'use strict';
        if (v1 > v2) {
            return true;
        }
        return false;
    });

    Handlebars.registerHelper("isNaN", function(value) {
        const valueNumber = Number(value);
        return Number.isNaN(valueNumber);
    });

    Handlebars.registerHelper('ellipsis', function(displayedValue, limit) {
        const str = displayedValue.toString();
        if (str.length <= limit) {
            return str;
        }
        return str.substring(0, limit) + '…';
    });

    Handlebars.registerHelper('formatBulk', function(bulk) {
        const reduced = bulk / 10;
        if (reduced < 0.1) {
            return "-";
        } else if (reduced < 1) {
            return "L";
        } else return Math.floor(reduced);
    });

    Handlebars.registerHelper('getTotalStorageCapacity', function(item) {
        let totalCapacity = 0;
        if (item?.system?.container?.storage && item.system.container.storage.length > 0) {
            for (const storage of item.system.container.storage) {
                totalCapacity += storage.amount;
            }
        }
        return totalCapacity;
    });

    Handlebars.registerHelper('getStarfinderBoolean', function(settingName) {
        return game.settings.get('sfrpg', settingName);
    });

    Handlebars.registerHelper('capitalize', function(value) {
        return value.capitalize();
    });

    Handlebars.registerHelper('contains', function(container, value) {
        if (!container || !value) return false;

        if (container instanceof Array) {
            return container.includes(value);
        }

        if (container instanceof Object) {
            return container.hasOwnProperty(value);
        }

        return false;
    });

    Handlebars.registerHelper('console', function(...args) {
        const options = args.pop();
        console.log(...args);
    });

    Handlebars.registerHelper('indexOf', function(array, value, options) {
        const index = array.indexOf(value);
        if (index < 0) return index;
        return index + (Number(options.hash.firstIdx) || 0);
    });

    Handlebars.registerHelper('append', function(left, right) {
        return left + right;
    });

    /** Returns null if 0 is entered. */
    Handlebars.registerHelper('modToScoreRange', function(value) {
        const score = 10 + value * 2;
        return `${score}-${score + 1}`;
    });

    /** Returns null if 0 is entered. */
    Handlebars.registerHelper('nullOrNonZero', function(value) {
        if (value === 0) return null;
        return value;
    });

    /** Returns the value based on whether left is null or not. */
    Handlebars.registerHelper('leftOrRight', function(left, right) {
        return left || right;
    });

    Handlebars.registerHelper('createTippy', function(options) {
        const title = options.hash['title'];
        const subtitle = options.hash['subtitle'];
        const attributes = options.hash['attributes'];
        const tooltips = options.hash['tooltips'];
        if ( !title ) {
            console.stack();
            throw new Error(game.i18n.localize("SFRPG.Tippy.ErrorNoTitle"));
        }

        let html = "data-tooltip=\"<strong>" + Handlebars.escapeExpression(game.i18n.localize(title)) + "</strong>";
        if (subtitle) {
            html += "<br/>" + Handlebars.escapeExpression(game.i18n.localize(subtitle));
        }
        if (attributes) {
            const printableAttributes = [];
            if (attributes instanceof Array) {
                for (const attrib of attributes) {
                    printableAttributes.push(attrib);
                }
            } else if (attributes instanceof Object) {
                for (const key of Object.keys(attributes)) {
                    printableAttributes.push(key);
                }
            } else {
                printableAttributes.push(attributes);
            }
            if (printableAttributes.length > 0) {
                html += "<br/><br/>" + game.i18n.localize("SFRPG.Tippy.Attributes");
                for (const attrib of printableAttributes) {
                    html += "<br/>" + attrib;
                }
            }
        }
        if (tooltips) {
            const printabletooltips = [];
            if (tooltips instanceof Array) {
                for (const tooltip of tooltips) {
                    printabletooltips.push(game.i18n.localize(tooltip));
                }
            } else {
                printabletooltips.push(game.i18n.localize(tooltips));
            }
            if (printabletooltips.length > 0) {
                html += "<br/>";
                for (const attrib of printabletooltips) {
                    html += "<br/>" + game.i18n.localize(attrib);
                }
            }
        }

        html += "\"";

        return new Handlebars.SafeString(html);
    });

    Handlebars.registerHelper('i18nNumberFormat', function(value) {
        const formatter = new Intl.NumberFormat(game.i18n.lang);
        const formattedValue = formatter.format(value);
        return formattedValue;
    });

    /**
     * An API-similar supplement to Foundry's {@linkcode https://foundryvtt.com/api/classes/client.HandlebarsHelpers.html#selectOptions|selectOptions}.
     * This helper is for adding one-off select options and is meant to be used alongside `selectOptions`.
     */
    Handlebars.registerHelper('selectOption', function(value, label, options) {
        const tagParams = [
            `value="${Handlebars.escapeExpression(value)}"`,
            options.hash.hidden && 'hidden',
            (value === options.hash.selected) && 'selected'
        ].filter(Boolean).join(' ');
        const safeLabel = Handlebars.escapeExpression(options.hash.localize ? game.i18n.localize(label) : label);
        return new Handlebars.SafeString(`<option ${tagParams}>${safeLabel}</option>`);
    });

    /**
     * Look up a sequence of properties.
     *
     * @param {object} root     Topmost object.
     * @param {object} hbsOpts  The Handlebars helper options parameter.
     * @param {object} props    Sequence of properties (if any) to look up.
     */
    function configHelper(root, hbsOpts, ...props) {
        let result = root;
        for (const prop of props) {
            result = foundry.utils.getProperty(result, prop);
        }
        return result;
    }

    /**
     * Utility helper to get global config.
     *
     * Accepts any number (including zero) arguments, which will be recursively looked up starting from `CONFIG`.
     */
    Handlebars.registerHelper('config', function(...args) {
        const options = args.pop();
        return configHelper(CONFIG, options, ...args);
    });

    /**
     * Utility helper to get global SFRPG config. Equivalent to `(config "SFRPG" ...)`
     *
     * Accepts any number (including zero) arguments, which will be recursively looked up starting from `CONFIG.SFRPG`.
     */
    Handlebars.registerHelper('sfrpg', function(...args) {
        const options = args.pop();
        return configHelper(CONFIG.SFRPG, options, ...args);
    });
}
