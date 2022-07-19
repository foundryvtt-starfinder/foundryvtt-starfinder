import { SFRPG } from "../../../config.js";

function computeCompoundBulkForItem(item, contents) {
    let contentBulk = 0;
    const itemData = item.data.data;
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
    }

    item.data.itemBulk = itemBulk;

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
    const itemData = item.data.data;
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
    
    item.data.itemWealth = itemWealth;

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

        //console.warn(`Starting calculateBulkAndWealth for ${actor.name}`);

        const items = fact.items;
        const physicalItems = items.filter(x => SFRPG.physicalItemTypes.includes(x.type));

        // Compute ownership tree
        for (const item of physicalItems) {
            item.contents = [];
            item.parentItem = items.find(x => x.data.data.container?.contents && x.data.data.container.contents.find(y => y.id === item.id));
            if (item.data.data?.container?.contents?.length > 0) {
                for (const containedItemEntry of item.data.data.container.contents) {
                    const containedItem = items.find(x => x.id === containedItemEntry.id);
                    if (containedItem) {
                        item.contents.push(containedItem);
                    }
                }
            }
        }

        for (const item of physicalItems) {
            const i = item.data;
            i.img = i.img || DEFAULT_TOKEN;

            i.data.quantity = i.data.quantity || 0;
            i.data.price = i.data.price || 0;
            i.data.bulk = i.data.bulk || "-";
            i.isOpen = i.data.container?.isOpen === undefined ? true : i.data.container.isOpen;

            let weight = 0;
            if (i.data.bulk === "L") {
                weight = 0.1;
            } else if (i.data.bulk === "-") {
                weight = 0;
            } else {
                weight = parseFloat(i.data.bulk);
            }

            // Compute number of packs based on quantityPerPack, provided quantityPerPack is set to a value.
            let packs = 1;
            if (i.data.quantityPerPack === null || i.data.quantityPerPack === undefined) {
                packs = i.data.quantity;
            } else {
                if (i.data.quantityPerPack <= 0) {
                    packs = 0;
                } else {
                    packs = Math.floor(i.data.quantity / i.data.quantityPerPack);
                }
            }

            i.totalWeight = packs * weight;
            if (i.data.equippedBulkMultiplier !== undefined && i.data.equipped) {
                i.totalWeight *= i.data.equippedBulkMultiplier;
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

        data.bulk = Math.floor(totalWeight / 10); // Divide bulk by 10 to correct for integer-space bulk calculation.
        data.wealth = computeWealthForActor(actor, totalWealth);

        //console.warn(`Finished calculateBulkAndWealth for ${actor.name}, total wealth: ${data.wealth.total}, total weight: ${totalWeight}`);

        return fact;
    });
}