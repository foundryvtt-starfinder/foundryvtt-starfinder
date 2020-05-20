import CheckBonusType from '../closures/check-bonus-type.js';

export default function (engine) {
    engine.closures.add('isCircumstanceBonus', CheckBonusType, { required: ['type'] });
}