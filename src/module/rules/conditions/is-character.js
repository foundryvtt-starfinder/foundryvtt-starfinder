import CheckActorType from '../closures/check-actor-type.js';

export default function (engine) {
    engine.closures.add("isCharacter", CheckActorType, { required: ['type'] });
}