/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const uuid = require('uuid');
const fromEntries = require('object.fromentries');
const {
    Logger
} = require('dhp-logging-lib');
const _ = require('lodash');
const {
    RuleConfigurationsService
} = require('./RuleConfigurationsService');
const {
    InputSchemasService
} = require('./InputSchemasService');
const {
    FactGenerator
} = require('./FactGenerator');
const {
    RuleEngine
} = require('./RuleEngine');
const {
    SchemaValidator
} = require('./SchemaValidator');
const Messages = require('../config/messages');

const DEFAULT_OPTIONS = {
    ruleConfigurationsService: undefined,
    inputSchemasService: undefined,
    factGenerator: undefined,
    ruleEngine: undefined,
    schemaValidator: undefined,
    cache: undefined,
};

class WellnessScoreService {

    constructor(logger, options = {}) {

        const name = 'WellnessScoreService';
        this.logger = logger ? logger.child({
            name
        }) : new Logger({
            name,
            correlationId: uuid.v4(),
        });

        this.options = {};
        this.options = Object.assign(this.options, DEFAULT_OPTIONS);
        this.options = Object.assign(this.options, options);

        this.ruleConfigurationsService = this.options.ruleConfigurationsService ||
            new RuleConfigurationsService(this.logger);
        this.inputSchemasService = this.options.inputSchemasService ||
            new InputSchemasService(this.logger);
        this.factGenerator = this.options.factGenerator ||
            new FactGenerator(this.logger);
        this.ruleEngine = this.options.ruleEngine || new RuleEngine(this.logger);
        this.schemaValidator = this.options.schemaValidator ||
            new SchemaValidator(this.logger);

    }

    /**
     * Calculates wellness score based on input and specified
     * rule configuration
     *
     * @param { #/components/schemas/WellnessCalculationRequest } body
     * @returns { #/components/schemas/WellnessCalculationResponse }
     */
    // eslint-disable-next-line max-lines-per-function
    calculateWellness(body, tenantId) {
        // eslint-disable-next-line max-lines-per-function
        return new Promise(function calculate(resolve, reject) {
            const start = new Date().getTime();
            if (!body) {
                const message = 'Body cannot be empty';
                this.logger.error(message);
                reject({
                    status: 400,
                    message,
                });
                return;
            }

            if (!tenantId) {
                const message = 'Invalid tenant id';
                this.logger.error(message);
                reject({
                    status: 403,
                    message,
                });
                return;
            }

            // 1. get rule configuration by id (body.rule_configuration_id)
            this.ruleConfigurationsService.getRuleConfiguration(body.rule_configuration_id, tenantId)
                .then(ruleConfig => {
                    this.logger.info(`Using rule configuration ${ruleConfig.id}, revision ${ruleConfig._rev}`);
                    // 2. get input schema by id (ruleConfig.input_schema_id)
                    return Promise.all([
                        this.inputSchemasService.getSchema(
                            ruleConfig.input_schema_id, tenantId),
                        Promise.resolve(ruleConfig),
                    ]);
                })
                .then(([inputSchema, ruleConfig]) => {
                    this.logger.info(`Using input schema ${inputSchema.id}, revision ${inputSchema._rev}`);
                    // 3. validate input (body.input) based on schema (inputSchema.data)
                    return Promise.all([
                        this.schemaValidator.validate(body.input, inputSchema.data),
                        Promise.resolve(ruleConfig),
                    ]);
                })
                .then(([validatedInput, ruleConfig]) => {
                    // 4. generate facts using factGenerator
                    return Promise.all([
                        this.factGenerator.generateMap(ruleConfig.pre_processing,
                            ruleConfig.extensions, ruleConfig.facts,
                            validatedInput),
                        Promise.resolve(ruleConfig),
                    ]);
                })
                .then(([factMap, ruleConfig]) => {
                    // 5. convert map to object (required for the rule engine we are
                    //    using, see https://github.com/CacheControl/json-rules-engine)
                    this.logger.info('Converting fact map to object');
                    if (!Object.fromEntries) {
                        fromEntries.shim();
                    }
                    const facts = Object.fromEntries(factMap);
                    // 6. set facts
                    this.ruleEngine.setFacts(facts);
                    // 7. Add rules (ruleConfig.rules)
                    this.ruleEngine.addRules(ruleConfig.rules);
                    // 8. run engine
                    return this.ruleEngine.run();
                })
                .then(results => {
                    // 9. Interpret results
                    let score;
                    if (!results || !results.events || results.events.length === 0) {
                        // no scores explicitly apply, default to 2
                        score = 2;
                    } else if (results.events.length > 1) {
                        // take the highest score if multiple events fire
                        const scores = _.reverse(_.sortBy(results.events.map(event => event.type)));
                        // eslint-disable-next-line prefer-destructuring
                        score = scores[0];
                    } else if (results.events[0].type === undefined) {
                        const message = 'The rules are invalid, as they did not resolve' +
                            ' to a score';
                        this.logger.error(message);
                        reject({
                            status: 400,
                            message,
                        });
                        return;
                    } else {
                        score = results.events[0].type;
                    }

                    const description = Messages.scores[score];

                    resolve({
                        score,
                        description,
                    });
                })
                .catch(err => {
                    const message = 'Failed to calculate wellness score';
                    this.logger.error(err);
                    this.logger.error(message);
                    const response = {
                        status: 500,
                        message,
                    };

                    if (err.status && err.message) {
                        response.status = err.status;
                        response.errors = [{
                            errorCode: err.status,
                            message: err.message,
                        }, ];
                    } else if (err.message) {
                        response.trace = err.message;
                    }
                    reject(response);
                })
                .finally(() => {
                    const elapsedTime = new Date().getTime() - start;
                    this.logger.info(`Operation completed in ${elapsedTime} ms`);
                });
        }.bind(this));
    }
}

module.exports.WellnessScoreService = WellnessScoreService;
module.exports.WellnessScoreOptions = DEFAULT_OPTIONS;
