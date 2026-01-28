/**
 * A list of the notifications to display, as well as the system version associated with them.
 * `userType` has options "gm" or "all" to show to either just GMs or all users, respectively
 */
const updateNotifications = {
    0.001: {
        version: "0.30.1",
        userType: "all",
        message: "To facilitate better communication between the system developers and users, we have added this notification system, starting in Version 0.30.1, which will display upon installing a new system version with significant changes to be aware of. If an update is minor, you may not see one of these messages.<br>As they will only show up upon installing a new system version and we don't have the ability to wait for localization for all languages before releasing system updates, these messages will unfortunately only be in English (apologies to international users!)."
    }
};

/**
 * Determines whether a notification dialog is necessary after a system update, and what should be displayed
 */
export async function updateNotification() {
    // The current system version's notification schema number
    const systemNotificationSchema = Math.max(...Object.keys(updateNotifications).map(Number));
    // The current world's notification schema number
    const worldSchema = game.settings.get("sfrpg", "notificationSchema");

    if (systemNotificationSchema > worldSchema) {
        // Get list of update versions and list of messages to display
        // Only display the latest message if the user is new (schema setting at default of 0)
        const toDisplay = worldSchema === 0 ? [updateNotifications[systemNotificationSchema]] : [];
        if (worldSchema !== 0) {
            for (const [schema, entry] of Object.entries(updateNotifications)) {
                if (Number(schema) > worldSchema && Number(schema) <= systemNotificationSchema) {
                    toDisplay.push(entry);
                }
            }
        }

        // Construct message
        let dlgText = "";
        for (const notif of toDisplay) {
            if (notif.userType === "all" || (notif.userType === "gm" && game.user.isGM)) {
                dlgText += `<h4>Version ${notif.version}</h4><p>${notif.message}</p>`;
            }
        }
        dlgText += game.i18n.localize("SFRPG.Notification.Bugs");

        // Display dialog box with the necessary update messages
        const proceed = await foundry.applications.api.DialogV2.prompt({
            window: {title: game.i18n.localize("SFRPG.Notification.Title")},
            content: dlgText,
            position: {width: 650},
            ok: {
                label: game.i18n.localize("SFRPG.Notification.Button")
            }
        });

        // Update notification schema setting of the world
        if (proceed === "ok") {
            game.settings.set("sfrpg", "notificationSchema", systemNotificationSchema);
        }
    }
}
