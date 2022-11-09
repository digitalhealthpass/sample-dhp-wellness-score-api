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
const Cloudant = require('@cloudant/cloudant');
const {
    DocumentDbUtil
} = require('./DocumentDbUtil');

const DEFAULT_OPTIONS = {
    documentDbClient: undefined,
    stripDocumentMetadata: false,
};

class InputSchemasService {

    constructor(logger, options = {}) {
        const name = 'InputSchemasService';
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
     * Returns input schema based on id, validating the schema
     * belongs to the specified tenant
     *
     * @param {string} inputSchemaId
     * @param {string} tenantId
     * @returns {#/components/schemas/InputSchema} schema
     */
    getSchema(inputSchemaId, tenantId) {
        this.logger.info(`reading schema:${inputSchemaId} , tenant:${tenantId}`);
        return new Promise(function get(resolve, reject) {
            this.documentDbClient.get(`tenant:${tenantId}`)
                .then(document => {
                    const inputSchemaIds = document.input_schema_ids || [];
                    const validInputSchemaId = _.intersection(inputSchemaIds, [inputSchemaId]).length === 1;
                    if (!validInputSchemaId) {
                        const message =
                            `The requested input schema (${inputSchemaId}) does not belong to the tenant (${tenantId})`;
                        this.logger.error(message);
                        return Promise.reject({
                            status: 404,
                            message
                        });
                    }
                    return this.documentDbClient.get(`input_schema:${inputSchemaId}`);
                })
                .then(document => {
                    let formattedDoc = document;
                    formattedDoc.id = document._id;
                    if (this.options.stripDocumentMetadata === true) {
                        formattedDoc = DocumentDbUtil.stripMetadata(document);
                    }
                    resolve(document);
                })
                .catch(err => {
                    if (err.status) {
                        reject(err);
                    } else if (err.statusCode && err.statusCode === 404) {
                        const message = 'The requested input schema could not be found';
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
                    this.logger.error('Failed to get input schema');
                });
        }.bind(this));
    }

    // TODO
    // eslint-disable-next-line class-methods-use-this, no-unused-vars
    addSchema(body, tenantId) {
        return new Promise((resolve) => {
            const examples = {};
            examples['application/json'] = {
                data: {},
                id: 'id',
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
    deleteSchema(inputSchemaId, tenantId) {
        return new Promise((resolve) => {
            resolve();
        });
    };

    // TODO
    // eslint-disable-next-line class-methods-use-this, no-unused-vars
    getSchemas(tenantId) {
        return new Promise((resolve) => {
            const examples = {};
            examples['application/json'] = {
                input_schemas: [{
                    data: {},
                    id: 'id',
                }, {
                    data: {},
                    id: 'id',
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
    replaceSchema(inputSchemaId, tenantId) {
        return new Promise((resolve) => {
            const examples = {};
            examples['application/json'] = {
                data: {},
                id: 'id',
            };
            if (Object.keys(examples).length > 0) {
                resolve(examples[Object.keys(examples)[0]]);
            } else {
                resolve();
            }
        });
    }
}

module.exports.InputSchemasService = InputSchemasService;