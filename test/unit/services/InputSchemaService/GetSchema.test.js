/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const {
    assert
} = require('chai');
const uuid = require('uuid');
const {
    InputSchemasService
} =
require('../../../../services/InputSchemasService');

describe('InputSchemasService.getSchema tests', () => {

    it("rejects if input schema doesn't exist", (done) => {
        const inputSchemaId = uuid.v4();
        const documentDbClient = {
            get() {
                // document not found
                return Promise.reject({
                    statusCode: 404,
                });
            },
        };
        const inputSchemasService = new InputSchemasService(null, {
            documentDbClient,
        });
        inputSchemasService.getSchema(inputSchemaId, 123)
            .then(() => {
                done(new Error('expected an error'));
            })
            .catch((err) => {
                if (err.status === 404) {
                    done();
                } else {
                    done(new Error('expected err.status to equal 404'));
                }
            });

    });

    it('rejects if the input schema does not belong to the tenant', (done) => {
        const inputSchemaId = uuid.v4();
        const documentDbClient = {
            get() {
                return Promise.resolve({
                    _id: uuid.v4(),
                    _rev: uuid.v4(),
                    input_schema_ids: [],
                });
            },
        };
        const inputSchemasService = new InputSchemasService(null, {
            documentDbClient,
        });
        inputSchemasService.getSchema(inputSchemaId, 123)
            .then(() => {
                done(new Error('expected an error'));
            })
            .catch((err) => {
                if (err.status === 404) {
                    done();
                } else {
                    done(new Error('expected err.status to equal 404'));
                }
            });

    });

    it('resolves if the input schema belongs to the tenant', () => {
        const inputSchemaId = 'input_schema_id';
        const tenantId = 'tenant_id';
        const documentDbClient = {
            get(id) {
                if (id.includes(tenantId)) {
                    return Promise.resolve({
                        _id: id,
                        _rev: uuid.v4(),
                        input_schema_ids: [inputSchemaId],
                    });
                }
                if (id.includes(inputSchemaId)) {
                    return Promise.resolve({
                        _id: id,
                        _rev: uuid.v4(),
                        input_schema_id: uuid.v4(),
                    });
                }
                return Promise.reject({
                    statusCode: 404,
                });
            },
        };
        const inputSchemasService = new InputSchemasService(null, {
            documentDbClient,
        });
        return inputSchemasService.getSchema(inputSchemaId, tenantId)
            .then(ruleConfiguration => {
                assert.ok(ruleConfiguration);
                assert.equal(ruleConfiguration._id, `input_schema:${inputSchemaId}`);
                assert.ok(ruleConfiguration.input_schema_id);
            });
    });
});