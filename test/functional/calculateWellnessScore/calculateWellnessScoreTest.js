/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

/* eslint-disable indent */
const chai = require('chai');
const request = require('supertest');
const Cloudant = require('@cloudant/cloudant');
const { v4: uuidv4 } = require('uuid');

const { expect } = chai;

const server = require('../../../index');
const config = require('../ConfigTest.js');

const testInputSchema = require('../../../testdata/input-schema');
const testRuleConfiguration = require('../../../testdata/rule-configuration');

require('../LoginTest.js');

let dbClient;
let schemaID;
let ruleConfigID;
const appIDTenantID = 'wellness-tenant-1';

// eslint-disable-next-line max-lines-per-function
describe('POST /calculation', function calculateScoreTest() {
    this.timeout(5000);
    before(async () => {
        dbClient = new Cloudant({
            url: process.env.CLOUDANT_URL,
            plugins: {
                iamauth: {
                    iamApiKey: process.env.CLOUDANT_API_KEY,
                },
            },
        }).use(process.env.CLOUDANT_DATABASE);
    });

    before(async () => {
        // create input schema doc with tenant_id of authenticated AppID user
        schemaID = uuidv4();
        testInputSchema._id = `input_schema:${schemaID}`;
        testInputSchema.tenant_id = appIDTenantID;
        await dbClient.insert(testInputSchema);

        // create rule config doc with tenant_id of authenticated AppID user
        ruleConfigID = uuidv4();
        testRuleConfiguration._id = `rule_configuration:${ruleConfigID}`;
        testRuleConfiguration.tenant_id = appIDTenantID;
        testRuleConfiguration.input_schema_id = schemaID;
        await dbClient.insert(testRuleConfiguration);

        // update tenant doc with input schema id and rule config id
        const returnedDoc = await dbClient.get(`tenant:${appIDTenantID}`);
        returnedDoc.input_schema_ids.push(schemaID);
        returnedDoc.rule_configuration_ids.push(ruleConfigID);
        await dbClient.insert(returnedDoc);
    });

    after(async () => {
        // delete input schema doc
        let returnedDoc = await dbClient.get(`input_schema:${schemaID}`);
        await dbClient.destroy(`input_schema:${schemaID}`, returnedDoc._rev);

        // delete rule config doc
        returnedDoc = await dbClient.get(`rule_configuration:${ruleConfigID}`);
        await dbClient.destroy(`rule_configuration:${ruleConfigID}`, returnedDoc._rev);

        // delete input schema id and rule config id from tenant doc
        returnedDoc = await dbClient.get(`tenant:${appIDTenantID}`);
        let index = returnedDoc.input_schema_ids.indexOf(schemaID);
        returnedDoc.input_schema_ids.splice(index, 1);
        index = returnedDoc.rule_configuration_ids.indexOf(ruleConfigID);
        returnedDoc.rule_configuration_ids.splice(index, 1);
        await dbClient.insert(returnedDoc);
    });

    it('calculate wellness score, score = 5', () => {
        const diagnosisDate = new Date();

        const score5Input = {
            rule_configuration_id: ruleConfigID,
            input: {
                diagnoses: [
                    {
                        date: diagnosisDate.toISOString(),
                        condition: {
                            name: 'covid-19',
                        },
                        result: 'positive',
                        source: 'healthcare-provider',
                    },
                ],
                risks: [],
                symptoms: [],
                vital_signs: [],
                travel: [],
                wellness_scores: [],
            },
        };

        return request(server)
            .post('/calculation')
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .send(score5Input)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .then((response) => {
                expect(response.text).to.include('"score":5');
            });
    });

    it('calculate wellness score, score = 4', () => {
        const symptomDate = new Date();

        const score4Input = {
            rule_configuration_id: ruleConfigID,
            input: {
                diagnoses: [],
                risks: [],
                symptoms: [
                    {
                        date: symptomDate.toISOString(),
                        type: {
                            name: 'difficulty breathing',
                        },
                        source: 'survey',
                    },
                    {
                        date: symptomDate.toISOString(),
                        type: {
                            name: 'chills',
                        },
                        source: 'survey',
                    },
                    {
                        date: symptomDate.toISOString(),
                        type: {
                            name: 'fever',
                        },
                        source: 'survey',
                    },
                    {
                        date: symptomDate.toISOString(),
                        type: {
                            name: 'cough',
                        },
                        source: 'survey',
                    },
                ],
                vital_signs: [],
                travel: [],
                wellness_scores: [],
            },
        };

        return request(server)
            .post('/calculation')
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .send(score4Input)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .then((response) => {
                expect(response.text).to.include('"score":4');
            });
    });

    it('calculate wellness score, score = 3', () => {
        const travelDate = new Date();

        const score3Input = {
            rule_configuration_id: ruleConfigID,
            input: {
                diagnoses: [],
                risks: [],
                symptoms: [],
                vital_signs: [],
                travel: [
                    {
                        country: 'AF',
                        departureDate: travelDate.toISOString(),
                        source: 'survey',
                    },
                ],
                wellness_scores: [],
            },
        };

        return request(server)
            .post('/calculation')
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .send(score3Input)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .then((response) => {
                expect(response.text).to.include('"score":3');
            });
    });

    it('calculate wellness score, score = 2', () => {
        const exposureDate = new Date();
        const score2Input = {
            rule_configuration_id: ruleConfigID,
            input: {
                diagnoses: [],
                risks: [
                    {
                        date: exposureDate.toISOString(),
                        type: 'symptom-exposure',
                        source: 'contact-tracing',
                    },
                ],
                symptoms: [],
                vital_signs: [],
                travel: [],
                wellness_scores: [],
            },
        };

        return request(server)
            .post('/calculation')
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .send(score2Input)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .then((response) => {
                expect(response.text).to.include('"score":2');
            });
    });

    it('calculate wellness score, score = 1', () => {
        const diagnosisDate = new Date();

        const score1Input = {
            rule_configuration_id: ruleConfigID,
            input: {
                diagnoses: [
                    {
                        date: diagnosisDate.toISOString(),
                        condition: {
                            name: 'covid-19',
                        },
                        result: 'negative',
                        source: 'healthcare-provider',
                    },
                ],
                risks: [],
                symptoms: [],
                vital_signs: [],
                travel: [],
                wellness_scores: [],
            },
        };
        return request(server)
            .post('/calculation')
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .send(score1Input)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .then((response) => {
                expect(response.text).to.include('"score":1');
            });
    });

    it('calculate wellness score, invalid input', () => {
        const invalidInput = {
            rule_configuration_id: ruleConfigID,
            input: {
                diagnoses: ['invalid'],
                risks: [],
                symptoms: [],
                vital_signs: [],
                travel: [],
                wellness_scores: [],
            },
        };
        return request(server)
            .post('/calculation')
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .send(invalidInput)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(400)
            .then((response) => {
                expect(response.text).to.include('should be object');
            });
    });

    it('calculate wellness score, empty required fields', () => {
        const emptyInput = {
            rule_configuration_id: ruleConfigID,
            input: {
                diagnoses: [],
                risks: [],
                symptoms: [],
                vital_signs: [],
                travel: [],
                wellness_scores: [],
            },
        };
        // returns default score
        return request(server)
            .post('/calculation')
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .send(emptyInput)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200)
            .then((response) => {
                expect(response.text).to.include('"score":2');
            });
    });

    it('calculate wellness score, missing required input field', () => {
        const invalidInput = {
            rule_configuration_id: ruleConfigID,
            input: {
                diagnoses: [],
                risks: [],
                symptoms: [],
                vital_signs: [],
                travel: [],
            },
        };

        return request(server)
            .post('/calculation')
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .send(invalidInput)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(400)
            .then((response) => {
                expect(response.text).to.include("should have required property 'wellness_scores'");
            });
    });

    it('attempt to calculate wellness score, empty rule_configuration_id', () => {
        const emptyInput = {
            rule_configuration_id: '',
            input: {
                diagnoses: [],
                risks: [],
                symptoms: [],
                vital_signs: [],
                travel: [],
                wellness_scores: [],
            },
        };
        // eslint-disable-next-line max-len
        const expectedErrorMsg = `The requested rule configuration () does not belong to the tenant (${appIDTenantID})`;

        return request(server)
            .post('/calculation')
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .send(emptyInput)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(404)
            .then((response) => {
                expect(response.text).to.include(expectedErrorMsg);
            });
    });

    it('attempt to calculate wellness score, empty request body', () => {

        return request(server)
            .post('/calculation')
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .send({})
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(404);
    });
});
