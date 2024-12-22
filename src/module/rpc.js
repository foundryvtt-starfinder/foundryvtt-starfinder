export class RPC {
    constructor() {
        this.callbacks = {};
        this.messageBuffer = [];
        this.initialized = false;
    }

    static initialize() {
        RPC.rpc._initialize();
    }

    _initialize() {
        if (!this.initialized) {
            game.socket.on('system.sfrpg', (data) => {
                RPC.rpc._handleMessage(data);
            });
            this.initialized = true;

            if (this.messageBuffer.length > 0) {
                for (let messageData of this.messageBuffer) {
                    game.socket.emit('system.sfrpg', messageData);
                }
                this.messageBuffer = null;
            }
        }
    }

    static sendMessage(eventName, ...args) {
        RPC.rpc._sendMessage(eventName, args);
    }

    _sendMessage(eventName, ...args) {
        let messageData = {
            recipient: null,
            sender: game.user.id,
            eventName: eventName,
            data: args
        };

        if (this.initialized) {
            game.socket.emit('system.sfrpg', messageData);
        } else {
            this.messageBuffer.push(messageData);
        }
    }

    static sendMessageTo(recipient, eventName, payload) {
        return RPC.rpc._sendMessageTo(recipient, eventName, payload);
    }

    _sendMessageTo(recipient, eventName, payload) {
        let messageData = {
            recipient: recipient,
            sender: game.user.id,
            eventName: eventName,
            payload: payload
        };

        // console.log(`Sending message:\n${JSON.stringify(messageData)}`);

        /** Sending to GM, local user is GM, send to self always succeeds. */
        if (recipient === "gm" && game.user.isGM) {
            this._handleMessage(messageData);
            return 'successMessageHandled';
        }

        /** Sending to self, send to self always succeeds. */
        if (recipient === game.user.id) {
            this._handleMessage(messageData);
            return 'successMessageHandled';
        }

        if (this.initialized) {
            let recipientIsActive = false;
            if (recipient === "gm") {
                for (const user of game.users.contents) {
                    if (user.isGM && user.active) {
                        recipientIsActive = true;
                        break;
                    }
                }
            } else {
                const recipientUser = game.users.get(recipient);
                recipientIsActive = recipientUser?.active || false;
            }

            if (recipientIsActive) {
                game.socket.emit('system.sfrpg', messageData);
                return 'successMessageSent';
            } else {
                return 'errorRecipientNotAvailable';
            }
        } else {
            this.messageBuffer.push(messageData);
            return 'successMessagePending';
        }
    }

    /**
     * Register a callback method for a specific event name.
     * @param {*} eventName The event to register a callback for.
     * @param {*} target The target setting for this callback, must be either 'gm', for messages only for the GMs, 'player', for messages for any player other than the GMs, 'local', for messages for the local user, or 'any', for any target.
     * @param {*} callback The callback function to register, format is (data) { }, no return value is expected, can be async.
     */
    static registerCallback(eventName, target, callback) {
        RPC.rpc._registerCallback(eventName, target, callback);
    }

    _registerCallback(eventName, target, callback) {
        let acceptedTargets = ["gm", "player", "local", "any"];
        if (!acceptedTargets.includes(target)) {
            throw `Invalid target specified (${target}) registering event '${eventName}'! Value must be ${acceptedTargets.join(',')}.`;
        }

        let callbackItem = {
            callback: callback,
            target: target
        };
        if (eventName in this.callbacks) {
            this.callbacks[eventName] = this.callbacks[eventName].push(callbackItem);
        } else {
            this.callbacks[eventName] = [callbackItem];
        }
    }

    /**
     * Unregisters a callback method for a specific event name.
     * @param {*} eventName The event to unregister a callback from.
     * @param {*} callback The callback function to remove from the register.
     */
    static unregisterCallback(eventName, callback) {
        RPC.rpc._unregisterCallback(eventName, callback);
    }

    _unregisterCallback(eventName, callback) {
        if (eventName in this.callbacks) {
            this.callbacks[eventName] = this.callbacks[eventName].filter(x => x.callback !== callback);
            if (this.callbacks.length === 0) {
                delete this.callbacks[eventName];
            }
        }
    }

    async _handleMessage(data) {
        // console.log(`Received a message (${data.eventName}), recipient is ${data.recipient}`);
        if (data.recipient) {
            if (data.recipient === "gm") {
                if (!game.user.isGM) {
                    // console.log(`> Message meant for GM, rejecting message.`);
                    return false;
                }
            } else if (data.recipient !== game.user.id) {
                // console.log(`> Recipient ID mismatch, rejecting message.`);
                return false;
            }
        }

        // console.log(`> Handling it.`);
        let wasHandled = false;
        let handlers = this.callbacks[data.eventName];
        if (handlers) {
            const filteredCallbacks = [];
            for (let callback of handlers) {
                if ((callback.target === "gm" && game.user.isGM)
                    || (callback.target === "player" && !game.user.isGM)
                    || (callback.target === "local" && data.recipient === game.user.id)
                    || callback.target === "any") {
                    filteredCallbacks.push(callback.callback(data));
                }
            }
            if (filteredCallbacks.length > 0) {
                await Promise.all(filteredCallbacks);
                wasHandled = true;
            }
        }

        if (!wasHandled) {
            console.log(`> Failed to handle RPC call for '${data.eventName}'`);
        }
    }
}

RPC.rpc = new RPC();
