import CheckActorType from '../closures/check-actor-type.js';

export default function (engine) {
    engine.closures.add("isNpc", CheckActorType, { required: ['type'] });
}