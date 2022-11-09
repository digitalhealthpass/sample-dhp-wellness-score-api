/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

/* eslint-disable indent */
const assert = require('assert');
const {
    SchemaValidator
} =
require('../../../services/SchemaValidator');

describe('Schema Validator tests', () => {

    it('rejects when schema is not an object', (done) => {
        const schemaValidator = new SchemaValidator();
        schemaValidator.validate({
                foo: 'bar'
            }, [])
            .then(() => {
                done('expected an error');
            })
            .catch(() => {
                done();
            });
    });

    it('resolves input when the input complies with schema', () => {
        const input = {
            foo: 'bar',
        };
        const schemaValidator = new SchemaValidator();
        return schemaValidator.validate(input, {
                properties: {
                    foo: {
                        type: 'string',
                        enum: [
                            'bar',
                        ],
                    },
                },
            })
            .then(validatedInput => {
                assert.deepEqual(input, validatedInput);
            });
    });

    it('rejects when the input does not comply with schema', (done) => {
        const input = {
            foo: 'bar',
        };
        const schemaValidator = new SchemaValidator();
        schemaValidator.validate(input, {
                properties: {
                    foo: {
                        type: 'string',
                        enum: [
                            'baz',
                        ],
                    },
                },
            })
            .then(() => {
                done(new Error('expected an error'));
            })
            .catch(() => {
                done();
            });
    });
});