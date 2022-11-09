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
const highRiskCountries = require('../config/highRiskCountries');

const DEFAULT_OPTIONS = {
    /**
     * {map} ISO 3166-1 codes of high-risk countries, uppercase
     */
    highRiskCountries: undefined,
};

class HighRiskTravelDetector {
    constructor(logger, options = {}) {
        const name = 'HighRiskTravelDetector';
        this.logger = logger ? logger.child({
            name
        }) : new Logger({
            name,
            correlationId: uuid.v4(),
        });

        this.options = {};
        this.options = Object.assign(this.options, DEFAULT_OPTIONS);
        this.options = Object.assign(this.options, options);

        this.highRiskCountries = this.options.highRiskCountries ||
            highRiskCountries;

    }

    /**
     * Returns dates on which there was high-risk travel
     *
     * @param {[object]} travelLocations
     * see #/components/schemas/FactResolutionExtension,
     * identify_high_risk_travel_dates
     * @returns {[object]} A list of objects with a single attribute (date)
     */
    invoke(travelLocations) {
        if (!travelLocations || travelLocations.length === 0) {
            this.logger.warn(
                'No travel locations provided. Returning an empty list');
            return [];

        }

        const dateMap = new Map();
        const highRiskTravelDates = [];
        this.logger.info('Identifying days on which high-risk travel ended');
        travelLocations.forEach(travelLocation => {
            if (!travelLocation || !travelLocation.country ||
                !travelLocation.departureDate) {
                const message = `Invalid travel location specified: ${JSON.stringify(travelLocation)}`;
                this.logger.error(message);
                const error = new Error(message);
                error.status = 400;
                throw error;

            }
            const country = travelLocation.country.trim().toUpperCase();
            if (this.highRiskCountries.has(country)) {
                const reportedDateTime = travelLocation.departureDate;
                let reportedDate;
                try {
                    // eslint-disable-next-line prefer-destructuring
                    reportedDate = reportedDateTime.split('T')[0];
                } catch (err) {
                    const message = 'Failed to parse travel departureDate';
                    this.logger.error(err);
                    this.logger.error(message);
                    err.status = 400;
                    throw err;

                }
                this.logger.info(
                    `High-risk travel detected on ${reportedDate}`);
                if (!dateMap.has(reportedDate)) {
                    dateMap.set(reportedDate, reportedDate);
                    highRiskTravelDates.push({
                        date: `${reportedDate  }T23:59:59.999Z`,
                    });
                }
            }
        });

        return highRiskTravelDates;
    }
}

module.exports.HighRiskTravelDetector = HighRiskTravelDetector;
module.exports.HighRiskTravelDetectorOptions = DEFAULT_OPTIONS;