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
const clone = require('rfdc')({
    proto: false,
    circles: false
});
const jsonPath = require('jsonpath');
const nodeEval = require('node-eval');

const {
    ExtensionManager
} = require('./ExtensionManager');
const {
    InputPreProcessor
} = require('./InputPreProcessor');
const Config = require('../config/config');

const DEFAULT_OPTIONS = {
    extensionManager: undefined,
    inputPreProcessor: undefined,
};

class FactGenerator {

    constructor(logger, options = {}) {
        const name = 'FactGenerator';
        this.logger = logger ? logger.child({
            name
        }) : new Logger({
            name,
            correlationId: uuid.v4(),
        });

        this.options = {
            ...DEFAULT_OPTIONS,
            ...options
        };

        this.extensionManager = this.options.extensionManager || new ExtensionManager(this.logger);
        this.inputPreProcessor = this.options.inputPreProcessor || new InputPreProcessor(this.logger);
    }

    /**
     *
     * @param {#/components/schemas/InputPreProcessingConfig}
     * preProcessingConfig
     * @param {#/components/schemas/FactResolutionExtension} extensionConfig
     * @param {[#/components/schemas/Fact]} factSpecifications
     * @param {object} input
     * @returns {Promise<Map>} map with fact names as keys and the derived
     * values as the values
     */
    generateMap(preProcessingConfig, extensionConfig = {}, factSpecifications = [], input) {
        const start = new Date().getTime();
        return new Promise((resolve, reject) => {
            this._preProcessInput(preProcessingConfig, input)
                .then(preProcessedInput => {
                    return this._resolveFacts(extensionConfig, factSpecifications, preProcessedInput);
                })
                .then(factMap => {
                    this.logger.info('Fact map generated');
                    resolve(factMap);
                })
                .catch(err => {
                    const message = 'Failed to generate fact map';
                    this.logger.error(err);
                    this.logger.error(message);
                    reject(err);
                })
                .finally(() => {
                    const elapsedTime = new Date().getTime() - start;
                    this.logger.info(`Fact generation completed in ${elapsedTime} ms`);
                });
        });
    }

    /**
     *
     * @param {#/components/schemas/InputPreProcessingConfig} preProcessingConfig
     * @param {*} input
     * @returns {Promise<object>} pre-processed input
     */
    _preProcessInput(preProcessingConfig, input) {
        return new Promise((resolve, reject) => {
            if (!preProcessingConfig) {
                const message = 'Invalid pre-processing config';
                this.logger.error(message);
                const error = new Error(message);
                error.status = 400;
                reject(error);
                return;
            }
            if (!input || Object.keys(input).length === 0) {
                const message = 'Invalid input';
                this.logger.error(message);
                const error = new Error(message);
                error.status = 400;
                reject(error);
                return;
            }

            // clone input
            let inputCopy = clone(input);

            try {
                // run each pre-processor
                Object.keys(preProcessingConfig).forEach(command => {
                    const config = preProcessingConfig[command];
                    if (config.enabled) {
                        inputCopy = this.inputPreProcessor
                            .run(command, preProcessingConfig[command].targets, inputCopy);
                    } else {
                        this.logger.warn(`Command "${command}" is disabled in the config - skipping the operation`);
                    }
                });
            } catch (err) {
                const message = 'Failed to pre-process input';
                this.logger.error(err);
                this.logger(message);
                reject(new Error(message));
            }

            resolve(inputCopy);
        });
    }

    /**
     *
     * @param {*} extensionConfig
     * @param {*} factSpecifications
     * @param {*} input
     * @returns {Promise<Map>} map with fact names as keys and the derived
     * values as the values
     */

    _resolveFacts(_, factSpecifications = [], input) {
        return new Promise((resolve, reject) => {
            this.logger.info('Resolving facts');
            const facts = new Map();

            if (!factSpecifications || factSpecifications.length === 0) {
                this.logger.warn('No fact specifications provided. Returning an empty map');
                resolve(facts);
                return;
            }
            if (!input) {
                const message = 'Cannot generate facts from empty input';
                this.logger.error(message);
                const error = new Error(message);
                error.status = 400;
                reject(error);
                return;
            }

            // update references to extensions in fact specification expressions
            const updatedFactSpecificationString = JSON.stringify(factSpecifications)
                // eslint-disable-next-line no-useless-escape
                .replace(/extension\.([^\(]+)\(([^\)]+)\)/g,
                    (match, command, param) => {
                        return `extensionManager.getExtension('${command}').invoke(${param})`;
                    });
            const updatedFactSpecifications = JSON.parse(updatedFactSpecificationString);

            try {
                updatedFactSpecifications.forEach(factSpecification => {
                    const {
                        name
                    } = factSpecification;
                    let value = facts.get(name);
                    if (!value) {
                        value = this._resolveFact(factSpecification, input, facts);
                        facts.set(name, value);
                    }
                });
                resolve(facts);
                return;
            } catch (err) {
                this.logger.error(err);
                this.logger.error('Failed to resolve facts');
                reject(err);
            }
        });
    }


    /**
     *
     * @param {#/components/schemas/Fact} factSpecification
     * @param {object} input
     * @param {map} existingFacts
     * @returns {*} resolved value
     */
    // eslint-disable-next-line complexity
    _resolveFact(factSpecification, input, existingFacts = new Map()) {
        if (!factSpecification || !factSpecification.name) {
            const error = new Error('Invalid fact specification');
            error.status = 400;
            throw error;
        } else if (!input) {
            const error = new Error('Invalid input');
            error.status = 400;
            throw error;
        }

        const selectors = factSpecification.selectors || [];
        const {
            expression
        } = factSpecification;

        this.logger.info(`Attempting to resolve fact ${factSpecification.name}`);

        // reject if the expression implies that there should be
        // selectors and none are present
        if (selectors.length === 0 && expression &&
            expression.includes(Config.factResolutionSelectionPlaceholder)) {
            const message = `Failed to resolve fact (${factSpecification.name}). The expression` +
                ' references selection output but no selectors are ' +
                `specified: ${expression}`;
            this.logger.error(message);
            const error = new Error(message);
            error.status = 400;
            throw error;
        }

        let selectionResult;
        if (selectors.length > 0) {
            // apply jsonpath selectors
            selectionResult = selectors.reduce((accumulator, currentValue) => {
                return jsonPath.query(accumulator, currentValue);
            }, input);

            if (selectionResult.length === 1 && selectionResult[0].length >= 0) {
                // account for a nested array when jsonpath targets a list with no
                // filter criteria
                // eslint-disable-next-line prefer-destructuring
                selectionResult = selectionResult[0];
            }

            this.logger.info(`Selection result: ${JSON.stringify(selectionResult)} `);
        }

        // determine final value
        let factValue;

        if (!expression) {
            factValue = selectionResult;
        } else {
            // inject selection result into expression
            const updatedExpression = expression
                .replace(new RegExp(`${Config.factResolutionSelectionPlaceholder}`, 'g'), 'selectionResult');

            // evaluate the expression
            const context = {
                selectionResult,
                extensionManager: this.extensionManager,
                _,
            };

            // add existing facts to context
            existingFacts.forEach((value, key) => {
                context[key] = value;
            });

            factValue = nodeEval(updatedExpression, null, context);
        }

        return factValue;
    }
}

module.exports.FactGenerator = FactGenerator;
module.exports.FactGeneratorOptions = DEFAULT_OPTIONS;