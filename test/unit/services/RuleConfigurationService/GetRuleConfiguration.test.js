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
    RuleConfigurationsService
} =
require('../../../../services/RuleConfigurationsService');

describe('RuleConfigurationsService.getRuleConfiguration tests', () => {

    it("rejects if rule configuration doesn't exist", (done) => {
        const ruleConfigurationId = uuid.v4();
        const documentDbClient = {
            get() {
                // document not found
                return Promise.reject({
                    statusCode: 404,
                });
            },
        };
        const ruleConfigurationsService = new RuleConfigurationsService(null, {
            documentDbClient,
        });
        ruleConfigurationsService.getRuleConfiguration(ruleConfigurationId, 123)
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

    it('rejects if the rule configuration does not belong to the tenant',
        (done) => {
            const ruleConfigurationId = uuid.v4();
            const documentDbClient = {
                get() {
                    return Promise.resolve({
                        _id: uuid.v4(),
                        _rev: uuid.v4(),
                        rule_configuration_ids: [],
                    });
                },
            };
            const ruleConfigurationsService = new RuleConfigurationsService(null, {
                documentDbClient,
            });
            ruleConfigurationsService.getRuleConfiguration(ruleConfigurationId, 123)
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

    it('resolves if the rule configuration belongs to the tenant', () => {
        const ruleConfigurationId = 'rule_configuration_id';
        const tenantId = 'tenant_id';
        const documentDbClient = {
            get(id) {
                if (id.includes(tenantId)) {
                    return Promise.resolve({
                        _id: id,
                        _rev: uuid.v4(),
                        rule_configuration_ids: [ruleConfigurationId],
                    });
                }
                if (id.includes(ruleConfigurationId)) {
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
        const ruleConfigurationsService = new RuleConfigurationsService(null, {
            documentDbClient,
        });
        return ruleConfigurationsService
            .getRuleConfiguration(ruleConfigurationId, tenantId)
            .then(ruleConfiguration => {
                assert.ok(ruleConfiguration);
                assert.equal(ruleConfiguration._id,
                    `rule_configuration:${ruleConfigurationId}`);
                assert.ok(ruleConfiguration.input_schema_id);
            });
    });
});