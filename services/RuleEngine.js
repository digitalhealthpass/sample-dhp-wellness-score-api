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
const {
    Engine
} = require('json-rules-engine');
const uuid = require('uuid');

const DEFAULT_OPTIONS = {
    engine: undefined,
};

class RuleEngine {

    constructor(logger, options = {}) {
        const name = 'RuleEngine';
        this.logger = logger ? logger.child({
            name
        }) : new Logger({
            name,
            correlationId: uuid.v4(),
        });

        this.options = {};
        this.options = Object.assign(this.options, DEFAULT_OPTIONS);
        this.options = Object.assign(this.options, options);

        this.engine = this.options.engine || new Engine([], {
            allowUndefinedFacts: false,
        });;

        this.engine.on('success', (event, almanac, ruleResult) => {
            this.logger.info(`Fired event: ${JSON.stringify(event)}`);
            this.logger.info(ruleResult);
        });

    }

    /**
     * Add rule to engine
     *
     * @param {[#/components/schemas/Rule]} rules
     * @returns {void}
     */
    addRules(rules = []) {
        this.logger.info(`Adding ${rules.length} rule(s)`);
        rules.forEach(rule => {
            this.engine.addRule(rule);
        });

    }

    /**
     * Set facts for engine run
     * @returns self
     * @param {object} facts
     * @returns {void}
     */
    setFacts(facts = {}) {
        this.logger.info(`Setting ${Object.keys(facts).length} fact(s)`);
        this.facts = facts;
    }

    /**
     * @returns {Promise<number>} score
     */
    run() {
        return new Promise(function run(resolve, reject) {
            this.logger.info('Running the engine');
            const start = new Date().getTime();
            this.engine.run(this.facts)
                .then(results => {
                    this.logger.info('Run completed successfully');
                    resolve(results);
                })
                .catch(err => {
                    const customErr = err;
                    const messageToInspect = err.message.toLowerCase();
                    if (messageToInspect.includes('unknown') ||
                        messageToInspect.includes('invalid')) {
                        customErr.message =
                            `${'Business rule execution failed because of invalid business rules. '}${  err.message}`;
                        customErr.status = 400;
                    }
                    this.logger.error(customErr);
                    this.logger.error('Run failed');
                    reject(customErr);
                })
                .finally(() => {
                    const duration = new Date().getTime() - start;
                    this.logger.info(`Engine run completed in ${duration} ms`);
                });
        }.bind(this));
    }
}

module.exports.RuleEngine = RuleEngine;
module.exports.RuleEngineOptions = DEFAULT_OPTIONS;