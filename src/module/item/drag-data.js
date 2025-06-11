export function extendDragData() {
    document.body.addEventListener("dragstart", (event) => {
        const { dataTransfer, target } = event;
        if (!(dataTransfer && target instanceof HTMLAnchorElement)) return;

        if (target.classList.contains("content-link")) {
            const data = JSON.parse(dataTransfer.getData("text/plain"));
            if (data?.type !== "Item") return;

            // Add origin data to effects
            const messageId = target.closest("li.chat-message")?.dataset.messageId;
            const message = game.messages.get(messageId ?? "");
            if (!message) return;

            const actor = getDocumentClass("ChatMessage").getSpeakerActor(message.speaker);
            if (!actor) return;
            const roll = message.rolls.at(-1);

            data.context = {
                origin: {
                    actorUuid: actor.uuid,
                    itemUuid: message.flags?.sfrpg?.item ?? null
                },
                roll: roll
                    ? {
                        total: roll.total
                    }
                    : null
            };

            dataTransfer.setData("text/plain", JSON.stringify(data));
        }
    });
}
