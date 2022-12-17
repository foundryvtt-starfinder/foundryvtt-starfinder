import { SFRPG } from "../../../config.js";

function computeCompoundBulkForItem(item, contents) {
    let contentBulk = 0;
    const itemData = item.system;
    //console.log(["computeCompoundBulk", item?.name, contents]);
    if (itemData?.container?.storage && itemData.container.storage.length > 0) {
        for (const storage of itemData.container.storage) {
            const storageIndex = itemData.container.storage.indexOf(storage);
            let storageBulk = 0;

            const storedItems = contents.filter(x => itemData.container.contents.find(y => y.id === x.id && y.index === storageIndex));
            if (storage.affectsEncumbrance) {
                for (const child of storedItems) {
                    const childBulk = computeCompoundBulkForItem(child, child.contents);
                    storageBulk += childBulk.totalBulk;
                }
            }

            contentBulk += storageBulk;
            //console.log(`${item.name}, storage ${storageIndex}, contentBulk: ${contentBulk}`);
        }
    } else if (contents?.length > 0) {
        for (const child of contents) {
            const childBulk = computeCompoundBulkForItem(child, child.contents);
            contentBulk += childBulk.totalBulk;
        }
    }

    let personalBulk = 0;
    if (itemData?.bulk) {
        if (itemData.bulk.toUpperCase() === "L") {
            personalBulk = 1;
        } else if (!Number.isNaN(Number.parseInt(itemData.bulk))) {
            personalBulk = itemData.bulk * 10;
        }

        if (itemData.quantity && !Number.isNaN(Number.parseInt(itemData.quantity))) {
            // Compute number of packs based on quantityPerPack, provided quantityPerPack is set to a value.
            let packs = 1;
            if (itemData.quantityPerPack === null || itemData.quantityPerPack === undefined) {
                packs = itemData.quantity;
            } else {
                if (itemData.quantityPerPack <= 0) {
                    packs = 0;
                } else {
                    packs = Math.floor(itemData.quantity / itemData.quantityPerPack);
                }
            }

            personalBulk *= packs;
        }

        if (itemData.equipped) {
            const bulkMultiplier = Number.parseInt(itemData.equippedBulkMultiplier);
            if (itemData.equippedBulkMultiplier !== undefined && !Number.isNaN(bulkMultiplier)) {
                personalBulk *= bulkMultiplier;
            }
        }
    }

    const itemBulk = {
        personalBulk: personalBulk,
        contentBulk: contentBulk,
        totalBulk: personalBulk + contentBulk
    };

    item.itemBulk = itemBulk;

    //console.log(`${item?.name || "null"} has a content bulk of ${contentBulk}, and personal bulk of ${personalBulk}`);
    return itemBulk;
}

function computeCompoundWealthForItem(item, contents, depth = 1) {
    /*
    let arrows = ">";
    for (let i = 0; i<depth; i++) {
        arrows += ">";
    }

    console.log(`${arrows} ${item?.name || "null"} start`); //*/

    let contentWealth = 0;
    const itemData = item.system;
    if (itemData?.container?.includeContentsInWealthCalculation) {
        if (itemData?.container?.storage && itemData.container.storage.length > 0) {
            for (const storage of itemData.container.storage) {
                const storageIndex = itemData.container.storage.indexOf(storage);
                let storageWealth = 0;

                const storedItems = contents.filter(x => itemData.container.contents.find(y => y.id === x.id && y.index === storageIndex));
                for (const child of storedItems) {
                    const childWealth = computeCompoundWealthForItem(child, child.contents, depth + 1);
                    storageWealth += childWealth.totalWealth;
                }

                contentWealth += storageWealth;
            }
        } else if (contents?.length > 0) {
            for (const child of contents) {
                const childWealth = computeCompoundWealthForItem(child, child.contents, depth + 1);
                contentWealth += childWealth.totalWealth;
            }
        }
    }

    let personalWealth = Number(itemData.price ?? 0);
    if (personalWealth > 0) {
        if (!Number.isNaN(Number.parseInt(itemData.quantity))) {
            // Compute number of packs based on quantityPerPack, provided quantityPerPack is set to a value.
            let packs = 1;
            if (itemData.quantityPerPack === null || itemData.quantityPerPack === undefined) {
                packs = itemData.quantity;
            } else {
                if (itemData.quantityPerPack <= 0) {
                    packs = 0;
                } else {
                    packs = Math.floor(itemData.quantity / itemData.quantityPerPack);
                }
            }

            personalWealth *= packs;
        }
    }

    const itemWealth = {
        totalWealth: personalWealth + contentWealth,
        personalWealth: personalWealth,
        contentWealth: contentWealth
    };

    if (item.type === "container") {
        item.contentWealth = itemWealth.contentWealth;
    }
    
    item.itemWealth = itemWealth;

    //console.log(`${arrows} ${item?.name || "null"} has a content wealth of ${itemWealth.contentWealth}, and personal wealth of ${itemWealth.personalWealth}, totalling in at ${itemWealth.totalWealth}`);
    return itemWealth;
}

function computeWealthForActor(actor, inventoryWealth) {
    const wealth = {
        inventory: 0,
        currencies: 0,
        total: 0,
        expectedByLevel: 0,
        tooltip: []
    };

    if (!actor) {
        return wealth;
    }
    
    const currencyLocale = game.settings.get('sfrpg', 'currencyLocale');
    const moneyFormatter  = new Intl.NumberFormat(currencyLocale);

    wealth.inventory = Math.floor(inventoryWealth);
    wealth.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Inventory.Wealth.Inventory", {amount: moneyFormatter.format(wealth.inventory)}));

    const actorData = actor.system;
    if (actorData.currency && Object.entries(actorData.currency).length > 0) {
        for (const [currency, amount] of Object.entries(actorData.currency)) {
            const currencyValue = Number(amount);
            if (!Number.isNaN(currencyValue)) {
                wealth.currencies += currencyValue;
                wealth.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Inventory.Wealth.Currency", {currency: SFRPG.currencies[currency], amount: moneyFormatter.format(currencyValue)}));
            }
        }
    }

    wealth.total = wealth.inventory + wealth.currencies;

    if (actor.type === "character") {
        const actorLevel = Math.min(Math.max(0, actorData.details?.level?.value || 0), 20);
        wealth.expectedByLevel = SFRPG.characterWealthByLevel[actorLevel];

        wealth.tooltip.push("");
        wealth.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Inventory.Wealth.Expected", {expectedWealth: moneyFormatter.format(wealth.expectedByLevel)}));

        if (wealth.expectedByLevel < wealth.total) {
            let estimatedLevel = 1;
            for (let i = 1; i<20; i++) {
                if (SFRPG.characterWealthByLevel[i] >= wealth.total) {
                    estimatedLevel = i;
                    break;
                }
            }
            wealth.tooltip.push(game.i18n.format("SFRPG.ActorSheet.Inventory.Wealth.EstimatedLevel", {estimatedLevel: estimatedLevel, valueAtLevel: moneyFormatter.format(SFRPG.characterWealthByLevel[estimatedLevel])}));
        }
    }

    return wealth;
}

export default function (engine) {
    engine.closures.add("calculateBulkAndWealth", (fact, context) => {
        const data = fact.data;
        const actor = fact.actor;
        const actorData = actor.system;

        //console.warn(`Starting calculateBulkAndWealth for ${actor.name}`);

        const items = fact.items;
        const physicalItems = items.filter(x => SFRPG.physicalItemTypes.includes(x.type));

        // Compute ownership tree
        for (const item of physicalItems) {
            item.contents = [];
            item.parentItem = items.find(x => x.system.container?.contents && x.system.container.contents.find(y => y.id === item.id));
            if (item.system?.container?.contents?.length > 0) {
                for (const containedItemEntry of item.system.container.contents) {
                    const containedItem = items.find(x => x.id === containedItemEntry.id);
                    if (containedItem) {
                        item.contents.push(containedItem);
                    }
                }
            }
        }

        for (const item of physicalItems) {
            const i = item.system;
            i.img = item.img || DEFAULT_TOKEN;

            i.quantity = i.quantity || 0;
            i.price = i.price || 0;
            i.bulk = i.bulk || "-";
            i.isOpen = i.container?.isOpen === undefined ? true : i.container.isOpen;

            let weight = 0;
            if (i.bulk === "L") {
                weight = 0.1;
            } else if (i.bulk === "-") {
                weight = 0;
            } else {
                weight = parseFloat(i.bulk);
            }

            // Compute number of packs based on quantityPerPack, provided quantityPerPack is set to a value.
            let packs = 1;
            if (i.quantityPerPack === null || i.quantityPerPack === undefined) {
                packs = i.quantity;
            } else {
                if (i.quantityPerPack <= 0) {
                    packs = 0;
                } else {
                    packs = Math.floor(i.quantity / i.quantityPerPack);
                }
            }

            i.totalWeight = packs * weight;
            if (i.equippedBulkMultiplier !== undefined && i.equipped) {
                i.totalWeight *= i.equippedBulkMultiplier;
            }
            i.totalWeight = i.totalWeight < 1 && i.totalWeight > 0 ? "L" : 
                            i.totalWeight === 0 ? "-" : Math.floor(i.totalWeight);
        }

        let totalWeight = 0;
        let totalWealth = 0;
        for (const item of physicalItems) {
            // Contained items will be calculated recursively
            if (item.parentItem) {
                continue;
            }

            const itemBulk = computeCompoundBulkForItem(item, item.contents);
            totalWeight += itemBulk.totalBulk;

            const itemWealth = computeCompoundWealthForItem(item, item.contents);
            totalWealth += itemWealth.totalWealth;
            if (item.type === "container") {
                item.contentWealth = itemWealth.contentWealth;
            }

            //console.log(`> ${item.name} has a total wealth of ${itemWealth.totalWealth}, bringing the sum to ${totalWealth}`);
            //console.log(`> ${item.name} has a total weight of ${itemBulk}, bringing the sum to ${totalWeight}`);
        }

        actorData.bulk = Math.floor(totalWeight / 10); // Divide bulk by 10 to correct for integer-space bulk calculation.
        actorData.wealth = computeWealthForActor(actor, totalWealth);
        
        data.wealth = actorData.wealth;
        data.bulk = actorData.bulk;

        //console.warn(`Finished calculateBulkAndWealth for ${actor.name}, total wealth: ${data.wealth.total}, total weight: ${totalWeight}`);

        return fact;
    });
}