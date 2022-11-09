/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const uuid = require('uuid');
const {
    Logger
} = require('dhp-logging-lib');
const {
    HighRiskSymptomDetector
} = require('./HighRiskSymptomDetector');
const {
    HighRiskTravelDetector
} = require('./HighRiskTravelDetector');

const AvailableExtensions = {
    highRiskTravelDetector: 'identify_high_risk_travel_dates',
    highRiskSymptomDetector: 'identify_high_risk_symptom_dates',
};

const DEFAULT_OPTIONS = {
    highRiskTravelDetectorClass: undefined,
    highRiskSymptomDetectorClass: undefined,
};

class ExtensionManager {

    constructor(logger, options = {}) {
        const name = 'ExtensionManager';
        this.logger = logger ? logger.child({
            name
        }) : new Logger({
            name,
            correlationId: uuid.v4(),
        });

        this.options = {};
        this.options = Object.assign(this.options, DEFAULT_OPTIONS);
        this.options = Object.assign(this.options, options);

        const HighRiskTravelDetectorClass = this.options.highRiskTravelDetectorClass || HighRiskTravelDetector;
        const HighRiskSymptomDetectorClass = this.options.highRiskSymptomDetectorClass || HighRiskSymptomDetector;

        this.extensionMap = {
            identify_high_risk_travel_dates: new HighRiskTravelDetectorClass(this.logger),
            identify_high_risk_symptom_dates: new HighRiskSymptomDetectorClass(this.logger),
        };
    }

    getExtension(name) {
        this.logger.info(`Attempting resolve extension '${name}'`);
        const extension = this.extensionMap[name];
        if (!extension) {
            const message = `The extension '${name}' is undefined`;
            this.logger.error(message);
            throw new Error(message);
        } else {
            return extension;
        }
    }
}

module.exports.ExtensionManager = ExtensionManager;
module.exports.ExtensionManagerOptions = DEFAULT_OPTIONS;
module.exports.AvailableExtensions = AvailableExtensions;