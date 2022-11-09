/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const {
    Logger
} = require('dhp-logging-lib');
const uuid = require('uuid');
const _ = require('lodash');

const highRiskSymptomCombinations =
    require('../config/highRiskSymptomCombinations');

const DEFAULT_OPTIONS = {
    /**
     * {[[string]]} A list of symptom combinations, each represented
     * by a list of strings, lower-case
     */
    highRiskSymptomCombinations: undefined,
};

class HighRiskSymptomDetector {
    constructor(logger, options) {
        const name = 'HighRiskSymptomDetector';
        this.logger = logger ? logger.child({
            name
        }) : new Logger({
            name,
            correlationId: uuid.v4(),
        });

        this.options = {};
        this.options = Object.assign(this.options, DEFAULT_OPTIONS);
        this.options = Object.assign(this.options, options);

        this.highRiskSymptomCombinations = this.options.highRiskSymptomCombinations || highRiskSymptomCombinations;
    }

    invoke(symptoms) {
        if (!symptoms || symptoms.length === 0) {
            this.logger.warn('No symptoms provided. Returning an empty list');
            return [];
        }

        this.logger.info('Identifying days on which a high-risk combination of symptoms was present');
        const symptomMap = new Map();

        // group symptoms by date
        symptoms.forEach(symptom => {
            if (!symptom || !symptom.type || !symptom.type.name || !symptom.date) {
                const message = `Invalid symptom specified: ${JSON.stringify(symptom)}`;
                this.logger.error(message);
                const error = new Error(message);
                error.status = 400;
                throw error;
            }

            const symptomType = symptom.type;
            let symptomTypeName = symptomType.name;
            const symptomDateTime = symptom.date;

            let reportedDate;
            try {
                // eslint-disable-next-line prefer-destructuring
                reportedDate = symptomDateTime.split('T')[0];
                symptomTypeName = symptomTypeName.trim().toLowerCase();
            } catch (err) {
                const message = 'Failed to parse symptom date or type';
                this.logger.error(err);
                this.logger.error(message);
                err.status = 400;
                throw err;
            }

            // map symptom to date
            this.logger.info(
                `Symptom (${symptomTypeName}) reported on ${reportedDate}`);
            if (!symptomMap.has(reportedDate)) {
                symptomMap.set(reportedDate, [symptomTypeName]);
            } else {
                symptomMap.get(reportedDate).push(symptomTypeName);
            }
        });

        const highRiskSymptomDates = [];
        // For each date, determine whether any of the specified high-risk
        // combinations of symptoms were present
        symptomMap.forEach((symptomList, date) => {
            this.highRiskSymptomCombinations.forEach(highRiskSymptomList => {
                const intersectingSymptoms = _.intersection(symptomList, highRiskSymptomList);
                if (intersectingSymptoms.length === highRiskSymptomList.length) {
                    // all high risk symptoms are present in the symptom list for
                    // the given date
                    this.logger.info('High-risk symptom combination detected on ' +
                        `${date}. High-risk symptom combination: ` +
                        `${JSON.stringify(highRiskSymptomList)}, reported ` +
                        `symptoms: ${symptomList}`);
                    highRiskSymptomDates.push({
                        date: `${date  }T23:59:59.999Z`,
                    });
                }
            });
        });

        return highRiskSymptomDates;
    }
}

module.exports.HighRiskSymptomDetector = HighRiskSymptomDetector;