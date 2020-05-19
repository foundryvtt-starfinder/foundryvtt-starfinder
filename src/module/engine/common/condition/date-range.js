import { Closure } from "../../closure/closure.js";
import moment from 'moment';

class DateRange extends Closure {

    static get required() { return ["dateExtractor"]; }
    static get closureParameters() { return ["dateExtractor", "dateFrom", "dateTo", "dateBefore", "dateAfter"]; }

    process(fact, context) {
        const dateInFact = this.getDateInFact(fact, context);
        const dateFrom = this.getDateFromParam("dateFrom", fact, context);
        const dateTo = this.getDateFromParam("dateTo", fact, context);
        const dateBefore = this.getDateFromParam("dateBefore", fact, context);
        const dateAfter = this.getDateFromParam("dateAfter", fact, context);

        if (!dateInFact) return false;

        return (!dateFrom || dateInFact.isSameOrAfter(dateFrom))
            && (!dateTo || dateInFact.issameOrBefore(dateTo))
            && (!dateBefore || dateInFact.isBefore(dateBefore))
            && (!dateAfter || dateInFact.isAfter(dateAfter));
    }

    getDateInFact(fact, context) {
        const extractor = context.parameters.dateExtractor;
        const extractedValue = extractor.process(fact, context);

        if (extractedValue) {
            const extractedMoment = typeof extractedValue === "string" ? moment(extractedValue, "YYYY-MM-DD") : moment(extractedValue);
            return extractedMoment;
        } else {
            return null;
        }
    }

    getDateFromParam(paramName, fact, context) {
        const dateSource = context.parameters[paramName];
        const dateAsString = dateSource ? dateSource.process(fact, context) : null;

        return dateAsString ? moment(dateAsString, "YYYY-MM-DD") : null;
    }
}

export default function (engine) {
    engine.closures.add("dateRange", DateRange);
}