import { SFRPG } from "../../../config.js";

export default function (engine) {
    engine.closures.add("calculateDroneSkills", (fact, context) => {
        const data = fact.data;

        // TODO: Implement enabling skills from skill unit drone mods.

        let skillkeys = Object.keys(data.skills);
        for (let skill of skillkeys) {
            if (data.skills[skill].enabled) {
                data.skills[skill].mod = data.skills[skill].value + data.skills[skill].ranks;
            } else {
                data.skills[skill].mod = 0;
            }
        }

        return fact;
    }, { required: ["stackModifiers"], closureParameters: ["stackModifiers"] });
}