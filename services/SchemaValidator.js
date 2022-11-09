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
const Ajv = require('ajv');
const Cache = require('sacjs');
const Config = require('../config/config');

const cache = Config.enableSchemaCaching ? new Cache({
    algorithm: Config.schemaEvictionAlgorithm,
    size: Config.schemaCacheSize,
}) : undefined;

const SCHEMA_OPTIONS = {
    fast: {
        allErrors: false,
        jsonPointers: true,
        uniqueItems: false,
        format: 'fast',
        cache,
    },
    full: {
        allErrors: true,
        jsonPointers: true,
        uniqueItems: true,
        format: 'full',
        cache,
    },
};

class SchemaValidator {

    constructor(logger) {
        const name = 'SchemaValidator';
        this.logger = logger ? logger.child({
            name
        }) : new Logger({
            name,
            correlationId: uuid.v4(),
        });

        this.validator = new Ajv(SCHEMA_OPTIONS[Config.schemaValidationType]);
    }

    /**
     * Validates input JSON based on JSON schema
     *
     * @param {object} input
     * @param {object} schema
     * @returns {object} validated input
     */
    validate(input, schema) {
        return new Promise(function validate(resolve, reject) {
            let valid = false;
            try {
                this.logger.info('Validating input');
                this.logger.info({
                    input
                });
                valid = this.validator.validate(schema, input);
                if (valid) {
                    this.logger.info('The input complies with the specified schema');
                    resolve(input);
                    return;
                }
                const message = JSON.stringify(this.validator.errors);
                this.logger.error(message);
                this.logger.error('Input does not comply with the specified schema');
                const error = new Error(message);
                error.status = 400;
                reject(error);
                return;
            } catch (err) {
                if (err.message.includes('schema')) {
                    // invalid schema
                    err.status = 400;
                } else {
                    err.status = 500;
                }
                reject(err);
            }
        }.bind(this));
    }

}

module.exports.SchemaValidator = SchemaValidator;