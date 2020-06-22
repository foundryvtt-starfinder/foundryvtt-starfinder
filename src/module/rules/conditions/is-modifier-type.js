import CheckModifierType from '../closures/check-modifier-type.js';

export default function (engine) {
    engine.closures.add('isModifierType', CheckModifierType, { required: ['type'] });
}