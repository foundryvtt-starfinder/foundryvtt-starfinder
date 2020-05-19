import CheckBonusType from '../closures/check-bonus-type.js';

export default function (engine) {
    engine.closures.add('isUntypedBonus', CheckBonusType, { required: ['type'] });
}