/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const uuid = require('uuid');

const factMap = new Map();
// TODO: set fact entries

module.exports = {
    tenantId: 'fake-tenant-id',
    ruleConfiguration: {
        id: uuid.v4(),
        _rev: uuid.v4(),
        input_schema_id: uuid.v4(),
        pre_processing: undefined,
        extensions: {
            filter_high_risk_travel: false,
            identify_high_risk_symptom_dates: false,
        },
        facts: [],
        rules: [],
    },
    inputSchema: {
        id: uuid.v4(),
        _rev: uuid.v4(),
    },
    factMap,
    ruleEngine: {
        results: {
            events: [{
                type: 1,
                params: {
                    data: undefined,
                },
            }, ],
        },
    },
    input: {
        foo: 55,
    },
};