import "@client/global.mjs";
import Canvas from "@client/canvas/board.mjs";
import { SFRPG as CONFIGSFRPG } from "./module/config";

// This file and the majority of our "typing" is based off of the work of ChaosOS:
// https://github.com/MetaMorphic-Digital/draw-steel/blob/develop/draw-steel.d.ts
// Copyright 2024 MetaMorphic Digital (MIT License; see LICENSE)

declare global {
    // not a real extension of course but simplest way for this to work with the intellisense.
    /**
     * A simple event framework used throughout Foundry Virtual Tabletop.
     * When key actions or events occur, a "hook" is defined where user-defined callback functions can execute.
     * This class manages the registration and execution of hooked callback functions.
     */
    class Hooks extends foundry.helpers.Hooks { }
    const fromUuid = foundry.utils.fromUuid;
    const fromUuidSync = foundry.utils.fromUuidSync;

    /**
    * The singleton game canvas
    */
    const canvas: Canvas;

    /**
     * Runtime configuration settings for Foundry VTT which exposes a large number of variables which determine how
     * aspects of the software behaves.
     *
     * Unlike the CONST analog which is frozen and immutable, the CONFIG object may be updated during the course of a
     * session or modified by system and module developers to adjust how the application behaves.
     * @module CONFIG
     */
    declare namespace CONFIG {
        var SFRPG: typeof CONFIGSFRPG
    }

}
