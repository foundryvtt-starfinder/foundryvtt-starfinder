import CheckItemType from "../closures/check-item-type.js";

export default function(engine) {
    engine.closures.add("isItemType", CheckItemType, { required: ['type'] });
}
