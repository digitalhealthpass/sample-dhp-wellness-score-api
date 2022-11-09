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
const Cloudant = require('@cloudant/cloudant');
const uuid = require('uuid');
const _ = require('lodash');
const {
    DocumentDbUtil
} = require('./DocumentDbUtil');

const DEFAULT_OPTIONS = {
    documentDbClient: undefined,
    stripDocumentMetadata: false,
};

class RuleConfigurationsService {

    constructor(logger, options = {}) {
        const name = 'RuleConfigurationService';
        this.logger = logger ? logger.child({
            name
        }) : new Logger({
            name,
            correlationId: uuid.v4(),
        });

        this.options = {};
        this.options = Object.assign(this.options, DEFAULT_OPTIONS);
        this.options = Object.assign(this.options, options);

        this.documentDbClient = this.options.documentDbClient || new Cloudant({
            url: process.env.CLOUDANT_URL,
            plugins: {
                iamauth: {
                    iamApiKey: process.env.CLOUDANT_API_KEY,
                },
            },
        }).use(process.env.CLOUDANT_DATABASE);
    }

    /**
     * Returns rule configuration by id, validating the rule config
     * belongs to the specified tenant
     *
     * @param {string} ruleConfigurationId
     * @param {string} tenantId
     * @returns {#/components/schemas/RuleConfiguration} rule configuration
     */
    getRuleConfiguration(ruleConfigurationId, tenantId) {
        this.logger.info(`reading rule_configuration:${ruleConfigurationId} , tenant:${tenantId}`);

        return new Promise(function getConfig(resolve, reject) {
            this.documentDbClient.get(`tenant:${tenantId}`)
                .then(document => {
                    const ruleConfigurationIds = document.rule_configuration_ids || [];
                    const validRuleConfigurationId = _.intersection(ruleConfigurationIds,
                        [ruleConfigurationId]).length === 1;
                    if (!validRuleConfigurationId) {
                        const message = 'The requested rule configuration ' +
                            `(${ruleConfigurationId}) does not belong to the tenant (${tenantId})`;
                        this.logger.error(message);
                        return Promise.reject({
                            status: 404,
                            message
                        });
                    }
                    return this.documentDbClient
                        .get(`rule_configuration:${ruleConfigurationId}`);
                })
                .then(document => {
                    let formattedDoc = document;
                    formattedDoc.id = document._id;
                    if (this.options.stripDocumentMetadata === true) {
                        formattedDoc = DocumentDbUtil.stripMetadata(document);
                    }
                    resolve(formattedDoc);
                })
                .catch(err => {
                    if (err.status) {
                        reject(err);
                    } else if (err.statusCode && err.statusCode === 404) {
                        const message = 'The requested rule configuration could not be found in DB';
                        this.logger.error(message);
                        reject({
                            status: 404,
                            message
                        });
                    } else {
                        this.logger.error(err);
                        reject({
                            status: 500,
                            message: err.message
                        });
                    }
                    this.logger.error('Failed to get rule configuration');
                });
        }.bind(this));
    }

    /**
     * Returns test suite by id, validating the test suite
     * belongs to the specified tenant
     *
     * @param {string} testSuiteId
     * @param {string} tenantId
     * @returns {#/components/schemas/TBD} test suite
     */
    getTestSuite(testSuiteId, tenantId) {
        return new Promise(function getSuite(resolve, reject) {
            this.documentDbClient.get(`tenant:${tenantId}`)
                .then(document => {
                    const testSuiteIds = document.test_suite_ids || [];
                    const validTestSuiteId = _.intersection(testSuiteIds,
                        [testSuiteId]).length === 1;
                    if (!validTestSuiteId) {
                        const message = 'The requested test suite ' +
                            `(${testSuiteId}) does not belong to the tenant (${tenantId})`;
                        this.logger.error(message);
                        return Promise.reject({
                            status: 404,
                            message
                        });
                    }
                    return this.documentDbClient
                        .get(`test_suite:${testSuiteId}`);
                })
                .then(document => {
                    let formattedDoc = document;
                    formattedDoc.id = document._id;
                    if (this.options.stripDocumentMetadata === true) {
                        formattedDoc = DocumentDbUtil.stripMetadata(document);
                    }
                    resolve(formattedDoc);
                })
                .catch(err => {
                    if (err.status) {
                        reject(err);
                    } else if (err.statusCode && err.statusCode === 404) {
                        const message = 'The requested testSuite could not be found';
                        this.logger.error(message);
                        reject({
                            status: 404,
                            message
                        });
                    } else {
                        this.logger.error(err);
                        reject({
                            status: 500,
                            message: err.message
                        });
                    }
                    this.logger.error('Failed to get rule configuration');
                });
        }.bind(this));
    }

    // TODO
    // eslint-disable-next-line class-methods-use-this, no-unused-vars
    addRuleConfiguration(body, tenantId) {
        return new Promise((resolve) => {
            const examples = {};
            examples['application/json'] = {
                input_schema_id: 'input_schema_id',
                rule_set: {},
                id: 'id',
                facts: [{
                    path: 'path',
                    name: 'name',
                    description: 'description',
                    generator: 'generator',
                }, {
                    path: 'path',
                    name: 'name',
                    description: 'description',
                    generator: 'generator',
                }],
            };
            if (Object.keys(examples).length > 0) {
                resolve(examples[Object.keys(examples)[0]]);
            } else {
                resolve();
            }
        });
    };

    // TODO
    // eslint-disable-next-line class-methods-use-this, no-unused-vars
    deleteRuleConfiguration(ruleConfigurationId, tenantId) {
        return new Promise((resolve) => {
            resolve();
        });
    }

    // TODO
    // eslint-disable-next-line class-methods-use-this, no-unused-vars
    getRuleConfigurations(tenantId) {
        return new Promise((resolve) => {
            const examples = {};
            examples['application/json'] = {
                rule_configurations: [{
                    input_schema_id: 'input_schema_id',
                    rule_set: {},
                    id: 'id',
                    facts: [{
                        path: 'path',
                        name: 'name',
                        description: 'description',
                        generator: 'generator',
                    }, {
                        path: 'path',
                        name: 'name',
                        description: 'description',
                        generator: 'generator',
                    }],
                }, {
                    input_schema_id: 'input_schema_id',
                    rule_set: {},
                    id: 'id',
                    facts: [{
                        path: 'path',
                        name: 'name',
                        description: 'description',
                        generator: 'generator',
                    }, {
                        path: 'path',
                        name: 'name',
                        description: 'description',
                        generator: 'generator',
                    }],
                }],
            };
            if (Object.keys(examples).length > 0) {
                resolve(examples[Object.keys(examples)[0]]);
            } else {
                resolve();
            }
        });
    }

    // TODO
    // eslint-disable-next-line class-methods-use-this, no-unused-vars
    replaceRuleConfiguration(body, ruleConfigurationId, tenantId) {
        return new Promise((resolve) => {
            const examples = {};
            examples['application/json'] = {
                input_schema_id: 'input_schema_id',
                rule_set: {},
                id: 'id',
                facts: [{
                    path: 'path',
                    name: 'name',
                    description: 'description',
                    generator: 'generator',
                }, {
                    path: 'path',
                    name: 'name',
                    description: 'description',
                    generator: 'generator',
                }],
            };
            if (Object.keys(examples).length > 0) {
                resolve(examples[Object.keys(examples)[0]]);
            } else {
                resolve();
            }
        });
    }
}

module.exports.RuleConfigurationsService = RuleConfigurationsService;