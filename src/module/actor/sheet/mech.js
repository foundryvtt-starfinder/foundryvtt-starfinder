import { ActorSFRPG } from "../actor.js";
import { ActorSheetSFRPG } from "./base.js";

/**
 * An Actor sheet for a mech in the SFRPG system.
 * @type {ActorSheetSFRPG}
 */
export class ActorSheetSFRPGMech extends ActorSheetSFRPG {
    constructor(...args) {
        super(...args);

        this.acceptedItemTypes.push(...CONFIG.SFRPG.mechDefinitionItemTypes);
        this.acceptedItemTypes.push(...CONFIG.SFRPG.physicalItemTypes);
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.scrollY = [...(options.scrollY || []), ".tab.details", ".tab.features", ".tab.actions"];
        return foundry.utils.mergeObject(options, {
            classes: ["sfrpg", "sheet", "actor", "mech"],
            width: 700
        });
    }

    get template() {
        if (!game.user.isGM && this.actor.limited) return "systems/sfrpg/templates/actors/mech-sheet-limited.hbs";
        return "systems/sfrpg/templates/actors/mech-sheet-full.hbs";
    }

    async getData() {
        const data = await super.getData();

        const tier = parseFloat(data.system.details.tier || 0);
        const tiers = { 0: "0", 0.25: "1/4", [1 / 3]: "1/3", 0.5: "1/2" };
        data.labels["tier"] = tier >= 1 ? String(tier) : tiers[tier] || 1;

        // Compute frame label from equipped frame item: "Size FrameName"
        const frameItem = this.actor.items.find(i => i.type === "mechFrame");
        if (frameItem) {
            const sizeKey = CONFIG.SFRPG.mechSizes[frameItem.system.size];
            const sizeLabel = sizeKey ? game.i18n.localize(sizeKey) : "";
            data.labels["frame"] = sizeLabel ? `${sizeLabel} ${frameItem.name}` : frameItem.name;
        } else {
            data.labels["frame"] = "";
        }

        this._getCrewData(data);

        // Enrich text editors
        data.enrichedDescription = await foundry.applications.ux.TextEditor.enrichHTML(this.actor.system.details.notes, {
            async: true,
            rollData: this.actor.getRollData() ?? {},
            secrets: this.actor.isOwner
        });

        return data;
    }

    /**
     * Process any flags that the crew actor might have that would affect the sheet.
     *
     * @param {Object} data The data object to update with any crew data.
     */
    async _getCrewData(data) {
        const crewData = this.actor.system.crew;
        const operatorActors = crewData.operator.actorIds.map(crewId => game.actors.get(crewId)).filter(Boolean);
        const operatorMin = data.system.attributes.operators?.min || 1;
        const operatorMax = crewData.operator.limit || data.system.attributes.operators?.max || 2;

        const crew = {
            operators: {
                label:
                    game.i18n.format("SFRPG.MechSheet.Crew.Operators")
                    + " "
                    + game.i18n.format("SFRPG.MechSheet.Crew.AssignedCount", {
                        current: operatorActors.length,
                        max: operatorMax
                    }),
                actors: operatorActors,
                dataset: { type: "mechCrew", role: "operator" },
                cssClass: operatorActors.length < operatorMin ? "crew-warning" : ""
            }
        };

        data.crew = Object.values(crew);
    }

    /**
     * Organize and classify items for mech sheets.
     *
     * @param {Object} data Data for the sheet
     * @private
     */
    _prepareItems(data) {
        const actorData = data.actor.system;

        const inventory = {
            inventory: { label: game.i18n.localize("SFRPG.MechSheet.Inventory.Inventory"), items: [], dataset: { type: this.acceptedItemTypes }, allowAdd: true }
        };

        // First pass: Find the active mission pod and get IDs of items it created
        const activePodItem = data.items.find(i => i.type === "mechMissionPod" && i.system?.isActive);
        const podCreatedIds = new Set(activePodItem?.system?.createdItemIds || []);

        const [
            weapons,
            frames,
            auxiliarySystems,
            upgrades,
            powerCores,
            lowerLimbs,
            upperLimbs,
            cargo,
            actorResources,
            missionPods
        ] = data.items.reduce((arr, item) => {
            item.img = item.img || DEFAULT_TOKEN;
            if (!item.config) item.config = {};
            const hasAttack = item.type === "mechWeapon";
            const hasDamage = item.system.damage?.parts
                && item.system.damage.parts.length > 0;

            // Mark items created by active mission pod
            const isFromPod = podCreatedIds.has(item._id);
            item.isFromPod = isFromPod;

            if (item.type === "actorResource") {
                this._prepareActorResource(item, actorData);
            }

            if (item.config.hasAttack || hasAttack) {
                this._prepareAttackString(item);
            }

            if (item.config.hasDamage || hasDamage) {
                this._prepareDamageString(item);
            }

            if (item.type === "mechWeapon") {
                item.config.hasAttack = true;
                item.config.hasDamage = hasDamage;
                const effectiveLevel = item.system.levelOverride || actorData.details?.tier || 1;
                item.config.levelLabel = `(${game.i18n.localize("SFRPG.MechSheet.Weapon.LevelShort")} ${effectiveLevel})`;
                arr[0].push(item);
            } else if (item.type === "mechFrame") arr[1].push(item);
            else if (item.type === "mechAuxiliary") arr[2].push(item);
            else if (item.type === "mechUpgrade") arr[3].push(item);
            else if (item.type === "mechPowerCore") arr[4].push(item);
            else if (item.type === "mechLowerLimb") arr[5].push(item);
            else if (item.type === "mechUpperLimb") arr[6].push(item);
            else if (item.type === "actorResource") arr[8].push(item);
            else if (item.type === "mechMissionPod") arr[9].push(item);
            else if (this.acceptedItemTypes.includes(item.type)) arr[7].push(item);

            return arr;
        }, [[], [], [], [], [], [], [], [], [], []]);

        this.processItemContainment(cargo, function(itemType, itemData) {
            inventory.inventory.items.push(itemData);
        });
        data.inventory = inventory;

        // Organize weapons by slot
        const frameWeapons = weapons.filter(w => w.system.slot === "frame");
        const upperLimbWeapons = weapons.filter(w => w.system.slot === "upperLimb");
        const lowerLimbWeapons = weapons.filter(w => w.system.slot === "lowerLimb");
        const lockerWeapons = weapons.filter(w => w.system.slot === "locker");

        const sumSlots = (wpns) => wpns.reduce((sum, w) => sum + (w.system.slotsUsed || 1), 0);

        // Sort auxiliary systems alphabetically by name
        auxiliarySystems.sort((a, b) => a.name.localeCompare(b.name));

        // Get slot capacities
        const frameSlots = actorData.attributes?.slots?.frame || 0;
        const upperLimbSlots = actorData.attributes?.slots?.upperLimb || 0;
        const lowerLimbSlots = actorData.attributes?.slots?.lowerLimb || 0;

        const frameSlotsUsed = sumSlots(frameWeapons);
        const upperLimbSlotsUsed = sumSlots(upperLimbWeapons);
        const lowerLimbSlotsUsed = sumSlots(lowerLimbWeapons);

        // Check if components exist
        const hasFrame = frames.length > 0;
        const hasUpperLimb = upperLimbs.length > 0;
        const hasLowerLimb = lowerLimbs.length > 0;

        const features = {
            frame: {
                category: game.i18n.format("SFRPG.MechSheet.Features.Frame", { current: frames.length }),
                items: frames,
                hasActions: false,
                dataset: { type: "mechFrame" },
                allowAdd: frames.length < 1,
                weapons: frameWeapons,
                weaponSlots: { used: frameSlotsUsed, max: frameSlots },
                slotType: "frame",
                hasComponent: hasFrame,
                allowAddWeapon: hasFrame && frameSlotsUsed < frameSlots
            },
            powerCores: {
                category: game.i18n.format("SFRPG.MechSheet.Features.PowerCores", { current: powerCores.length }),
                items: powerCores,
                hasActions: false,
                dataset: { type: "mechPowerCore" },
                allowAdd: powerCores.length < 1
            },
            lowerLimbs: {
                category: game.i18n.format("SFRPG.MechSheet.Features.LowerLimbs", { current: lowerLimbs.length }),
                items: lowerLimbs,
                hasActions: false,
                dataset: { type: "mechLowerLimb" },
                allowAdd: lowerLimbs.length < 1,
                weapons: lowerLimbWeapons,
                weaponSlots: { used: lowerLimbSlotsUsed, max: lowerLimbSlots },
                slotType: "lowerLimb",
                hasComponent: hasLowerLimb,
                allowAddWeapon: hasLowerLimb && lowerLimbSlotsUsed < lowerLimbSlots
            },
            upperLimbs: {
                category: game.i18n.format("SFRPG.MechSheet.Features.UpperLimbs", { current: upperLimbs.length }),
                items: upperLimbs,
                hasActions: false,
                dataset: { type: "mechUpperLimb" },
                allowAdd: upperLimbs.length < 1,
                weapons: upperLimbWeapons,
                weaponSlots: { used: upperLimbSlotsUsed, max: upperLimbSlots },
                slotType: "upperLimb",
                hasComponent: hasUpperLimb,
                allowAddWeapon: hasUpperLimb && upperLimbSlotsUsed < upperLimbSlots
            },
            auxiliarySystems: {
                category: game.i18n.format("SFRPG.MechSheet.Features.AuxiliarySystems", {
                    current: auxiliarySystems.length,
                    max: Math.min(4, actorData.attributes?.slots?.auxiliary || 0)
                }),
                items: auxiliarySystems,
                hasActions: false,
                dataset: { type: "mechAuxiliary" },
                allowAdd: auxiliarySystems.length < Math.min(4, actorData.attributes?.slots?.auxiliary || 0)
            },
            upgrades: {
                category: game.i18n.format("SFRPG.MechSheet.Features.Upgrades"),
                items: upgrades,
                hasActions: false,
                dataset: { type: "mechUpgrade" },
                allowAdd: true
            }
        };

        data.featuresTop = [features.frame];
        data.featuresBottom = [features.powerCores, features.lowerLimbs, features.upperLimbs, features.auxiliarySystems, features.upgrades];

        // Weapons locker data
        data.weaponsLocker = {
            weapons: lockerWeapons,
            label: game.i18n.localize("SFRPG.MechSheet.WeaponsLocker.Title")
        };
        data.hasLockerWeapons = lockerWeapons.length > 0;

        // === Actions Tab Data ===
        const actionsTab = {};
        const tier = actorData.details?.tier || 1;

        const saveTypeLabels = {
            fort: game.i18n.localize("SFRPG.MechSheet.Action.SaveTypes.Fort"),
            fortitude: game.i18n.localize("SFRPG.MechSheet.Action.SaveTypes.Fort"),
            ref: game.i18n.localize("SFRPG.MechSheet.Action.SaveTypes.Ref"),
            reflex: game.i18n.localize("SFRPG.MechSheet.Action.SaveTypes.Ref"),
            will: game.i18n.localize("SFRPG.MechSheet.Action.SaveTypes.Will")
        };

        // Enabled weapons: mounted weapons (not in locker)
        actionsTab.enabledWeapons = weapons.filter(w => w.system.slot !== "locker");

        for (const weapon of actionsTab.enabledWeapons) {
            const weaponLevel = weapon.system.levelOverride || tier;
            const save = weapon.system.save;
            if (save?.type) {
                const dc = save.dc || (12 + Math.floor(weaponLevel / 2));
                weapon.config.saveLabel = `${saveTypeLabels[save.type] || save.type} DC ${dc}`;
            }
        }

        // PP Actions (universal, always available)
        const currentPP = actorData.attributes?.pp?.value || 0;
        const insufficientPPTooltip = game.i18n.localize("SFRPG.MechSheet.Actions.InsufficientPP");
        actionsTab.ppActions = [
            { name: game.i18n.localize("SFRPG.MechSheet.Actions.PP.Aim.Name"), description: game.i18n.localize("SFRPG.MechSheet.Actions.PP.Aim.Description"), ppCost: 1 },
            { name: game.i18n.localize("SFRPG.MechSheet.Actions.PP.DevastatingHit.Name"), description: game.i18n.localize("SFRPG.MechSheet.Actions.PP.DevastatingHit.Description"), ppCost: 3 },
            { name: game.i18n.localize("SFRPG.MechSheet.Actions.PP.Maneuver.Name"), description: game.i18n.localize("SFRPG.MechSheet.Actions.PP.Maneuver.Description"), ppCost: 1 },
            { name: game.i18n.localize("SFRPG.MechSheet.Actions.PP.Replenish.Name"), description: game.i18n.localize("SFRPG.MechSheet.Actions.PP.Replenish.Description"), ppCost: 2 },
            { name: game.i18n.localize("SFRPG.MechSheet.Actions.PP.Resist.Name"), description: game.i18n.localize("SFRPG.MechSheet.Actions.PP.Resist.Description"), ppCost: 1 }
        ];
        for (const action of actionsTab.ppActions) {
            action.canAfford = currentPP >= action.ppCost;
            action.insufficientPPTooltip = insufficientPPTooltip;
        }

        // Special Actions (universal, action type instead of PP cost)
        const actionTypeLabels = {
            standard: game.i18n.localize("SFRPG.MechSheet.Actions.ActionTypes.Standard"),
            move: game.i18n.localize("SFRPG.MechSheet.Actions.ActionTypes.Move"),
            full: game.i18n.localize("SFRPG.MechSheet.Actions.ActionTypes.Full"),
            swift: game.i18n.localize("SFRPG.MechSheet.Actions.ActionTypes.Swift"),
            reaction: game.i18n.localize("SFRPG.MechSheet.Actions.ActionTypes.Reaction")
        };
        const constantLabel = game.i18n.localize("SFRPG.MechSheet.Actions.ActionTypes.Constant");

        actionsTab.specialActions = [
            { name: game.i18n.localize("SFRPG.MechSheet.Actions.Special.CalledShot.Name"), description: game.i18n.localize("SFRPG.MechSheet.Actions.Special.CalledShot.Description"), actionType: "standard", actionTypeLabel: actionTypeLabels.standard },
            { name: game.i18n.localize("SFRPG.MechSheet.Actions.Special.Hurl.Name"), description: game.i18n.localize("SFRPG.MechSheet.Actions.Special.Hurl.Description"), actionType: "full", actionTypeLabel: actionTypeLabels.full },
            { name: game.i18n.localize("SFRPG.MechSheet.Actions.Special.Scan.Name"), description: game.i18n.localize("SFRPG.MechSheet.Actions.Special.Scan.Description"), actionType: "move", actionTypeLabel: actionTypeLabels.move }
        ];

        // Gear Actions: from equipped components that have actions arrays
        actionsTab.gearActions = [];
        const componentSources = [...weapons, ...lowerLimbs, ...upperLimbs, ...auxiliarySystems];
        for (const component of componentSources) {
            const actions = component.system.actions || [];
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                if (!action.name) continue;

                const hasPPCost = action.ppCost !== null && action.ppCost !== undefined;
                let buttonLabel;
                if (hasPPCost) {
                    buttonLabel = `${action.ppCost} PP`;
                } else if (action.actionType && actionTypeLabels[action.actionType]) {
                    buttonLabel = actionTypeLabels[action.actionType];
                } else {
                    buttonLabel = constantLabel;
                }

                let saveLabel = null;
                if (action.saveType && saveTypeLabels[action.saveType]) {
                    const dc = action.saveDCBase !== null
                        ? action.saveDCBase + (action.saveDCScaling === "tier" ? tier : Math.floor(tier / 2))
                        : 12 + Math.floor(tier / 2);
                    saveLabel = `${saveTypeLabels[action.saveType]} DC ${dc}`;
                }

                actionsTab.gearActions.push({
                    actionName: action.name,
                    gearName: component.name,
                    displayName: `${action.name} (${component.name})`,
                    description: action.description,
                    ppCost: action.ppCost,
                    actionType: action.actionType,
                    buttonLabel: buttonLabel,
                    hasPPCost: hasPPCost,
                    canAfford: !hasPPCost || currentPP >= action.ppCost,
                    insufficientPPTooltip: insufficientPPTooltip,
                    itemId: component._id,
                    actionIndex: i,
                    saveLabel: saveLabel
                });
            }
        }
        actionsTab.gearActions.sort((a, b) => a.displayName.localeCompare(b.displayName));

        data.actionsTab = actionsTab;

        // Mission pods data - sort alphabetically
        missionPods.sort((a, b) => a.name.localeCompare(b.name));
        const activePod = missionPods.find(p => p.system.isActive);
        data.missionPods = {
            items: missionPods,
            activePod: activePod || null,
            label: game.i18n.localize("SFRPG.MechSheet.MissionPod.Title"),
            allowAdd: true
        };
    }

    /**
     * Activate event listeners using the prepared sheet HTML
     *
     * @param {JQuery} html The prepared HTML object ready to be rendered into the DOM
     */
    activateListeners(html) {
        super.activateListeners(html);

        if (!this.options.editable) return;

        // Crew Tab
        html.find('.crew-delete').click(this._onRemoveFromCrew.bind(this));

        const handler = ev => this._onDragCrewStart(ev);
        html.find('li.crew').each((i, li) => {
            li.setAttribute("draggable", true);
            li.addEventListener("dragstart", handler, false);
        });

        html.find('.crew-list').each((i, li) => {
            li.addEventListener("dragover", this._onCrewDragOver.bind(this), false);
        });

        html.find('li.crew-header').each((i, li) => {
            li.addEventListener("dragenter", this._onCrewDragEnter, false);
            li.addEventListener("dragleave", this._onCrewDragLeave, false);
        });

        // Operator Tab
        html.find('.crew-view').click(event => this._onActorView(event));

        // Mission Pods
        html.find('.pod-activate').click(event => this._onMissionPodActivate(event));
        html.find('.pod-deactivate').click(event => this._onMissionPodDeactivate(event));

        // PP Controls
        html.find('.pp-control:not(.ac-adjust)').click(event => this._onPPControl(event));

        // AC Adjustment Controls
        html.find('.ac-adjust').click(event => this._onACAdjust(event));

        // Actions Tab - action buttons post to chat
        html.find('.mech-pp-action').click(event => this._onMechAction(event, "pp"));
        html.find('.mech-special-action').click(event => this._onMechAction(event, "special"));
        html.find('.mech-gear-action').click(event => this._onMechAction(event, "gear"));

        // Mech weapon action button dragging (for creating hotbar macros)
        const attackButtons = html[0].querySelectorAll('button.attack, button.damage');
        for (const btn of attackButtons) {
            btn.setAttribute("draggable", "true");
            btn.addEventListener("dragstart", (ev) => {
                ev.stopPropagation();
                const el = ev.currentTarget;
                const liItem = el.closest("li.item");
                const item = this.actor.items.get(liItem?.dataset?.itemId);
                if (!item) return;
                const dragData = item.toDragData();
                dragData.macroType = Array.from(el.classList)[1];
                ev.dataTransfer.setData("text/plain", JSON.stringify(dragData));
            }, false);
        }
    }

    /**
     * Handle PP increment/decrement controls.
     * @param {Event} event The click event
     */
    _onPPControl(event) {
        event.preventDefault();
        const action = event.currentTarget.dataset.action;
        const currentPP = this.actor.system.attributes.pp.value || 0;
        const maxPP = this.actor.system.attributes.pp.max || 0;

        let newValue;
        if (action === "increase") {
            newValue = Math.min(currentPP + 1, maxPP);
        } else {
            newValue = Math.max(currentPP - 1, 0);
        }

        this.actor.update({ "system.attributes.pp.value": newValue });
    }

    /**
     * Handle AC adjustment increment/decrement controls.
     * @param {Event} event The click event
     */
    _onACAdjust(event) {
        event.preventDefault();
        event.stopPropagation();
        const el = event.currentTarget;
        const action = el.dataset.action;
        const field = el.dataset.field;
        const current = foundry.utils.getProperty(this.actor, field) || 0;
        const newValue = action === "increase" ? current + 1 : current - 1;
        this.actor.update({ [field]: newValue });
    }

    /**
     * Handle clicking a mech action button. Posts a chat card describing the action.
     * @param {Event} event The click event
     * @param {string} actionCategory "pp", "special", or "gear"
     */
    async _onMechAction(event, actionCategory) {
        event.preventDefault();
        const el = event.currentTarget;
        const actionIndex = parseInt(el.dataset.actionIndex);

        let name, description, ppCost, actionType, gearName, img;
        img = this.actor.img;

        if (actionCategory === "pp") {
            const ppActions = [
                { name: "SFRPG.MechSheet.Actions.PP.Aim.Name", desc: "SFRPG.MechSheet.Actions.PP.Aim.Description", ppCost: 1 },
                { name: "SFRPG.MechSheet.Actions.PP.DevastatingHit.Name", desc: "SFRPG.MechSheet.Actions.PP.DevastatingHit.Description", ppCost: 3 },
                { name: "SFRPG.MechSheet.Actions.PP.Maneuver.Name", desc: "SFRPG.MechSheet.Actions.PP.Maneuver.Description", ppCost: 1 },
                { name: "SFRPG.MechSheet.Actions.PP.Replenish.Name", desc: "SFRPG.MechSheet.Actions.PP.Replenish.Description", ppCost: 2 },
                { name: "SFRPG.MechSheet.Actions.PP.Resist.Name", desc: "SFRPG.MechSheet.Actions.PP.Resist.Description", ppCost: 1 }
            ];
            const action = ppActions[actionIndex];
            name = game.i18n.localize(action.name);
            description = game.i18n.localize(action.desc);
            ppCost = action.ppCost;
        } else if (actionCategory === "special") {
            const specialActions = [
                { name: "SFRPG.MechSheet.Actions.Special.CalledShot.Name", desc: "SFRPG.MechSheet.Actions.Special.CalledShot.Description", actionType: "standard" },
                { name: "SFRPG.MechSheet.Actions.Special.Hurl.Name", desc: "SFRPG.MechSheet.Actions.Special.Hurl.Description", actionType: "full" },
                { name: "SFRPG.MechSheet.Actions.Special.Scan.Name", desc: "SFRPG.MechSheet.Actions.Special.Scan.Description", actionType: "move" }
            ];
            const action = specialActions[actionIndex];
            name = game.i18n.localize(action.name);
            description = game.i18n.localize(action.desc);
            actionType = action.actionType;
        } else if (actionCategory === "gear") {
            const itemId = el.dataset.itemId;
            const itemActionIndex = parseInt(el.dataset.itemActionIndex);
            const item = this.actor.items.get(itemId);
            if (!item) return;
            const action = item.system.actions?.[itemActionIndex];
            if (!action) return;
            name = `${action.name} (${item.name})`;
            description = action.description;
            ppCost = action.ppCost;
            actionType = action.actionType;
            gearName = item.name;
            img = item.img;
        }

        const actionTypeLabels = {
            standard: game.i18n.localize("SFRPG.MechSheet.Actions.ActionTypes.Standard"),
            move: game.i18n.localize("SFRPG.MechSheet.Actions.ActionTypes.Move"),
            full: game.i18n.localize("SFRPG.MechSheet.Actions.ActionTypes.Full"),
            swift: game.i18n.localize("SFRPG.MechSheet.Actions.ActionTypes.Swift"),
            reaction: game.i18n.localize("SFRPG.MechSheet.Actions.ActionTypes.Reaction")
        };

        // Deduct PP if this action has a cost
        if (ppCost !== null && ppCost !== undefined && ppCost > 0) {
            const currentPP = this.actor.system.attributes.pp.value || 0;
            if (currentPP < ppCost) {
                ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.Actions.InsufficientPP"));
                return;
            }
            await this.actor.update({ "system.attributes.pp.value": currentPP - ppCost });
        }

        const ppSpent = (ppCost !== null && ppCost !== undefined && ppCost > 0)
            ? game.i18n.format("SFRPG.MechSheet.Actions.PPSpent", { amount: ppCost })
            : null;

        const templateData = {
            actor: this.actor,
            name: name,
            img: img,
            description: description,
            ppCost: ppCost !== null && ppCost !== undefined ? `${ppCost} PP` : null,
            ppSpent: ppSpent,
            actionTypeLabel: actionType ? (actionTypeLabels[actionType] || actionType) : null,
            gearName: gearName || null
        };

        const html = await renderTemplate("systems/sfrpg/templates/chat/mech-action-card.hbs", templateData);
        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: html,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });
    }

    /**
     * Handle activating a mission pod.
     * @param {Event} event The click event
     */
    async _onMissionPodActivate(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents(".item");
        const podId = li.data("item-id");
        const pod = this.actor.items.get(podId);

        if (!pod) return;

        // Check if another pod is already active
        const activePod = this.actor.items.find(i => i.type === "mechMissionPod" && i.system.isActive);
        if (activePod) {
            ui.notifications.warn(game.i18n.localize("SFRPG.MechSheet.MissionPod.OnlyOne"));
            return;
        }

        // Confirm activation
        const confirmed = await Dialog.confirm({
            title: game.i18n.localize("SFRPG.MechSheet.MissionPod.ActivateConfirmTitle"),
            content: `<p>${game.i18n.format("SFRPG.MechSheet.MissionPod.ActivateConfirmPrompt", { pod: pod.name })}</p>`,
            yes: () => true,
            no: () => false,
            defaultYes: false
        });

        if (!confirmed) return;

        // Create items from pod's item templates
        const itemTemplates = pod.system.itemTemplates || [];
        const createdItemIds = [];

        if (itemTemplates.length > 0) {
            // Prepare item data from templates
            const itemsToCreate = itemTemplates.map(template => {
                const itemData = foundry.utils.deepClone(template);
                // Remove _id so Foundry generates a new one
                delete itemData._id;
                // Mark as from mission pod
                itemData.flags = itemData.flags || {};
                itemData.flags.sfrpg = itemData.flags.sfrpg || {};
                itemData.flags.sfrpg.fromMissionPod = pod.id;
                return itemData;
            });

            // Create the items on the actor
            const createdItems = await this.actor.createEmbeddedDocuments("Item", itemsToCreate);
            for (const item of createdItems) {
                createdItemIds.push(item.id);
            }
        }

        // Activate the pod and store created item IDs
        await pod.update({
            "system.isActive": true,
            "system.createdItemIds": createdItemIds
        });

        // Force actor data re-preparation and sheet re-render
        this.actor.prepareData();
        this.render(false);

        ui.notifications.info(`${pod.name} activated.`);
    }

    /**
     * Handle deactivating a mission pod.
     * @param {Event} event The click event
     */
    async _onMissionPodDeactivate(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents(".item");
        const podId = li.data("item-id");
        const pod = this.actor.items.get(podId);

        if (!pod) return;

        // Confirm deactivation
        const confirmed = await Dialog.confirm({
            title: game.i18n.localize("SFRPG.MechSheet.MissionPod.DeactivateConfirmTitle"),
            content: `<p>${game.i18n.format("SFRPG.MechSheet.MissionPod.DeactivateConfirmPrompt", { pod: pod.name })}</p>`,
            yes: () => true,
            no: () => false,
            defaultYes: false
        });

        if (!confirmed) return;

        // Remove items that were created from this pod's templates
        const createdItemIds = pod.system.createdItemIds || [];
        if (createdItemIds.length > 0) {
            // Filter to only IDs that still exist
            const idsToDelete = createdItemIds.filter(id => this.actor.items.has(id));
            if (idsToDelete.length > 0) {
                await this.actor.deleteEmbeddedDocuments("Item", idsToDelete);
            }
        }

        // Deactivate the pod and clear created item IDs
        await pod.update({
            "system.isActive": false,
            "system.createdItemIds": []
        });

        // Force actor data re-preparation and sheet re-render
        this.actor.prepareData();
        this.render(false);

        ui.notifications.info(`${pod.name} deactivated.`);
    }

    /**
     * This method is called upon form submission after form data is validated
     *
     * @param {Event} event The initial triggering submission event
     * @param {Object} formData The object of validated form data with which to update the object
     * @private
     */
    _updateObject(event, formData) {
        const tiers = { "1/4": 0.25, "1/3": 1 / 3, "1/2": 0.5 };
        const v = "system.details.tier";
        let tier = formData[v];
        tier = tiers[tier] || parseFloat(tier);
        if (tier) formData[v] = tier < 1 ? tier : parseInt(tier);

        return super._updateObject(event, formData);
    }

    /** @override */
    async _onDrop(event) {
        event.preventDefault();

        const data = TextEditor.getDragEventData(event);
        if (Hooks.call('dropActorSheetData', this.actor, this, data) === false) {
            // Further processing halted
        } else if (data.type === "Actor") {
            const actor = await ActorSFRPG.fromDropData(data);
            return this._onCrewDrop(event, actor.id);
        } else if (data.type === "Item") {
            const rawItemData = (await Item.fromDropData(data)).toObject();

            if (CONFIG.SFRPG.mechDefinitionItemTypes.includes(rawItemData.type)) {
                // Only allow one frame per mech
                if (rawItemData.type === "mechFrame") {
                    const existingFrame = this.actor.items.find(i => i.type === "mechFrame");
                    if (existingFrame) {
                        ui.notifications.error(game.i18n.format("SFRPG.MechSheet.Frame.OnlyOne"));
                        return false;
                    }
                }
                // Only allow one power core per mech
                if (rawItemData.type === "mechPowerCore") {
                    const existingPowerCore = this.actor.items.find(i => i.type === "mechPowerCore");
                    if (existingPowerCore) {
                        ui.notifications.error(game.i18n.format("SFRPG.MechSheet.PowerCore.OnlyOne"));
                        return false;
                    }
                }
                // Only allow one lower limb per mech
                if (rawItemData.type === "mechLowerLimb") {
                    const existingLowerLimb = this.actor.items.find(i => i.type === "mechLowerLimb");
                    if (existingLowerLimb) {
                        ui.notifications.error(game.i18n.format("SFRPG.MechSheet.LowerLimb.OnlyOne"));
                        return false;
                    }
                }
                // Only allow one upper limb per mech
                if (rawItemData.type === "mechUpperLimb") {
                    const existingUpperLimb = this.actor.items.find(i => i.type === "mechUpperLimb");
                    if (existingUpperLimb) {
                        ui.notifications.error(game.i18n.format("SFRPG.MechSheet.UpperLimb.OnlyOne"));
                        return false;
                    }
                }
                return this.actor.createEmbeddedDocuments("Item", [rawItemData]);
            } else if (rawItemData.type === "mechWeapon") {
                return this._onWeaponDrop(event, rawItemData);
            } else if (this.acceptedItemTypes.includes(rawItemData.type)) {
                return this.processDroppedItems(event, data);
            } else {
                ui.notifications.error(game.i18n.format("SFRPG.MechSheet.InvalidItem", { name: rawItemData.name }));
                return false;
            }
        }

        return false;
    }

    /**
     * Handle dropping a mech weapon onto the sheet.
     * Shows a slot selection dialog if multiple valid slots are available.
     *
     * @param {Event} event The drop event
     * @param {Object} itemData The weapon item data
     * @returns {Promise}
     */
    async _onWeaponDrop(event, itemData) {
        const validSlots = itemData.system.validSlots || ["frame"];
        const actorData = this.actor.system;

        // Check which slots have components and available capacity
        const weaponSlotsNeeded = itemData.system.slotsUsed || 1;
        const availableSlots = [];
        for (const slot of validSlots) {
            const hasComponent = this._hasComponentForSlot(slot);
            const slotsUsed = this._getWeaponsInSlot(slot).reduce((sum, w) => sum + (w.system.slotsUsed || 1), 0);
            const maxSlots = actorData.attributes?.slots?.[slot] || 0;

            if (hasComponent && slotsUsed + weaponSlotsNeeded <= maxSlots) {
                availableSlots.push({
                    slot,
                    label: game.i18n.localize(CONFIG.SFRPG.mechWeaponMountableSlots[slot]),
                    used: slotsUsed,
                    max: maxSlots
                });
            }
        }

        // If no slots available, add to locker
        if (availableSlots.length === 0) {
            itemData.system.slot = "locker";
            ui.notifications.info(game.i18n.localize("SFRPG.MechSheet.WeaponsLocker.AddedToLocker"));
            return this.actor.createEmbeddedDocuments("Item", [itemData]);
        }

        // If only one slot available, use it
        if (availableSlots.length === 1) {
            itemData.system.slot = availableSlots[0].slot;
            return this.actor.createEmbeddedDocuments("Item", [itemData]);
        }

        // Multiple slots available - show selection dialog
        const selectedSlot = await this._showSlotSelectionDialog(itemData.name, availableSlots);
        if (selectedSlot === null) {
            return false; // User cancelled
        }

        itemData.system.slot = selectedSlot;
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    /**
     * Check if the mech has a component installed for the given slot type.
     *
     * @param {string} slotType The slot type (frame, upperLimb, lowerLimb)
     * @returns {boolean}
     */
    _hasComponentForSlot(slotType) {
        const componentTypes = {
            frame: "mechFrame",
            upperLimb: "mechUpperLimb",
            lowerLimb: "mechLowerLimb"
        };
        const componentType = componentTypes[slotType];
        return componentType ? this.actor.items.some(i => i.type === componentType) : false;
    }

    /**
     * Get all weapons assigned to a specific slot.
     *
     * @param {string} slotType The slot type
     * @returns {Array}
     */
    _getWeaponsInSlot(slotType) {
        return this.actor.items.filter(i => i.type === "mechWeapon" && i.system.slot === slotType);
    }

    /**
     * Show a dialog for selecting which slot to mount a weapon in.
     *
     * @param {string} weaponName The name of the weapon
     * @param {Array} availableSlots Array of available slot options
     * @returns {Promise<string|null>} The selected slot or null if cancelled
     */
    async _showSlotSelectionDialog(weaponName, availableSlots) {
        const content = `
            <form>
                <p>${game.i18n.format("SFRPG.MechSheet.WeaponsLocker.SelectSlotPrompt", { weapon: weaponName })}</p>
                <div class="form-group">
                    <label>${game.i18n.localize("SFRPG.MechSheet.Weapon.Slot")}</label>
                    <select name="slot">
                        ${availableSlots.map(s => `<option value="${s.slot}">${s.label} (${s.used}/${s.max})</option>`).join("")}
                    </select>
                </div>
            </form>
        `;

        return new Promise((resolve) => {
            new Dialog({
                title: game.i18n.localize("SFRPG.MechSheet.WeaponsLocker.SelectSlotTitle"),
                content,
                buttons: {
                    ok: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("SFRPG.Accept"),
                        callback: (html) => {
                            const slot = html.find('[name="slot"]').val();
                            resolve(slot);
                        }
                    },
                    locker: {
                        icon: '<i class="fas fa-box"></i>',
                        label: game.i18n.localize("SFRPG.MechSheet.WeaponsLocker.SendToLocker"),
                        callback: () => resolve("locker")
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("SFRPG.Cancel"),
                        callback: () => resolve(null)
                    }
                },
                default: "ok"
            }).render(true);
        });
    }

    /**
     * Handle deleting an Owned Item for the actor.
     * Overrides base to add confirmation for components with attached weapons.
     *
     * @param {Event} event The originating click event
     */
    async _onItemDelete(event) {
        event.preventDefault();

        const li = $(event.currentTarget).parents(".item");
        const itemId = li.attr("data-item-id");
        const item = this.actor.items.get(itemId);

        if (!item) return;

        // If deleting a mission pod, also delete its created items
        if (item.type === "mechMissionPod") {
            const createdItemIds = item.system.createdItemIds || [];
            if (createdItemIds.length > 0) {
                const idsToDelete = createdItemIds.filter(id => this.actor.items.has(id));
                if (idsToDelete.length > 0) {
                    await this.actor.deleteEmbeddedDocuments("Item", idsToDelete);
                }
            }
        }

        // Check if this is a component with attached weapons
        const proceed = await this._confirmComponentDeletion(item);
        if (!proceed) return;

        // Call parent implementation
        return super._onItemDelete(event);
    }

    /**
     * Handle deleting a mech component. If weapons are attached, prompt to move them to locker.
     *
     * @param {Item} item The item being deleted
     * @returns {Promise<boolean>} Whether to proceed with deletion
     */
    async _confirmComponentDeletion(item) {
        const slotTypes = {
            mechFrame: "frame",
            mechUpperLimb: "upperLimb",
            mechLowerLimb: "lowerLimb"
        };

        const slotType = slotTypes[item.type];
        if (!slotType) return true; // Not a component with weapon slots

        const attachedWeapons = this._getWeaponsInSlot(slotType);
        if (attachedWeapons.length === 0) return true; // No weapons attached

        // Show confirmation dialog
        const confirmed = await Dialog.confirm({
            title: game.i18n.localize("SFRPG.MechSheet.WeaponsLocker.RemoveComponentTitle"),
            content: `<p>${game.i18n.format("SFRPG.MechSheet.WeaponsLocker.RemoveComponentPrompt", {
                component: item.name,
                count: attachedWeapons.length
            })}</p>`,
            yes: () => true,
            no: () => false,
            defaultYes: false
        });

        if (confirmed) {
            // Move all attached weapons to locker
            const updates = attachedWeapons.map(w => ({
                _id: w.id,
                "system.slot": "locker"
            }));
            await this.actor.updateEmbeddedDocuments("Item", updates);
        }

        return confirmed;
    }

    /**
     * Handles drop events for the Crew list
     *
     * @param {Event}  event The originating drop event
     * @param {string} actorId  The id of the crew being dropped on the mech.
     */
    async _onCrewDrop(event, actorId) {
        $(event.target).css('background', '');

        const targetRole = event.target.dataset.role || "operator";
        if (!actorId) return false;

        const crew = foundry.utils.deepClone(this.actor.system.crew);
        const crewRole = crew[targetRole];
        if (!crewRole) return false;

        // Check if this actor is already assigned
        if (crewRole.actorIds.includes(actorId)) return false;

        if (crewRole.limit === -1 || crewRole.actorIds.length < crewRole.limit) {
            crewRole.actorIds.push(actorId);

            await this.actor.update({
                "system.crew": crew
            }).then(this.render(false));
        } else {
            ui.notifications.error(game.i18n.format("SFRPG.MechSheet.Crew.CrewLimitReached", {max: crewRole.limit}));
        }

        return true;
    }

    /**
     * Handles dragenter for the crew tab
     * @param {Event} event The originating dragenter event
     */
    _onCrewDragEnter(event) {
        $(event.target).css('background', "rgba(0,0,0,0.3)");
    }

    /**
     * Handles dragleave for the crew tab
     * @param {Event} event The originating dragleave event
     */
    _onCrewDragLeave(event) {
        $(event.target).css('background', '');
    }

    /**
     * Handle dragging crew members on the sheet.
     *
     * @param {Event} event Originating dragstart event
     */
    _onDragCrewStart(event) {
        const actorId = event.currentTarget.dataset.actorId;
        const actor = game.actors.get(actorId);

        const dragData = actor.toDragData();

        if (this.actor.isToken) dragData.tokenId = actorId;
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
    }

    /**
     * Handles ondragover for crew drag-n-drop
     *
     * @param {Event} event Originating ondragover event
     */
    _onCrewDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }

    /**
     * Remove an actor from the crew.
     *
     * @param {Event} event The originating click event
     */
    async _onRemoveFromCrew(event) {
        event.preventDefault();

        const actorId = $(event.currentTarget).parents('.crew')
            .data('actorId');
        this.actor.removeFromCrew(actorId);
    }

    /**
     * Opens the sheet of a crew member.
     *
     * @param {Event} event The originating click event
     */
    async _onActorView(event) {
        event.preventDefault();

        const actorId = $(event.currentTarget).parents('.crew')
            .data('actorId');
        const actor = game.actors.get(actorId);
        actor.sheet.render(true);
    }
}
