/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const chai = require('chai');
const request = require('supertest');
const Cloudant = require('@cloudant/cloudant');
const {
    v4: uuidv4
} = require('uuid');

const {
    expect
} = chai;

const server = require('../../../index');
const config = require('../ConfigTest.js');

require('../LoginTest.js');

let dbClient;
let ruleConfigID1;
let ruleConfigID2;
const fakeTenantID = uuidv4();
const appIDTenantID = 'wellness-tenant-1';

describe('GET /rule_configurations', () => {
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
        // create rule configuration doc with tenant_id of authenticated AppID user
        ruleConfigID1 = uuidv4();
        let ruleConfigDoc = {
            _id: `rule_configuration:${ruleConfigID1}`,
            tenant_id: appIDTenantID,
        };
        await dbClient.insert(ruleConfigDoc);

        // update tenant doc with rule configuration id
        const returnedDoc = await dbClient.get(`tenant:${appIDTenantID}`);
        returnedDoc.rule_configuration_ids.push(ruleConfigID1);
        await dbClient.insert(returnedDoc);

        // create rule config doc with tenant_id not associated with AppID user
        ruleConfigID2 = uuidv4();
        ruleConfigDoc = {
            _id: `rule_configuration:${ruleConfigID2}`,
            tenant_id: fakeTenantID,
        };
        await dbClient.insert(ruleConfigDoc);

        // create fake tenant document (not associated with AppID user)
        const fakeTenantDoc = {
            _id: `tenant:${fakeTenantID}`,
            rule_configuration_ids: [ruleConfigID2],
        };
        await dbClient.insert(fakeTenantDoc);

        // Note: Returns doc if input schema id is included in tenant doc of
        // authenticated user, regardless of tenant_id value in input schema doc.
        // Is this desired behavior?
        // TODO: POST API that checks tenant_id before saving to Cloudant.
    });

    after(async () => {
        // delete rule configuration docs
        let returnedDoc = await dbClient.get(`rule_configuration:${ruleConfigID1}`);
        await dbClient.destroy(
            `rule_configuration:${ruleConfigID1}`, returnedDoc._rev);

        returnedDoc = await dbClient.get(`rule_configuration:${ruleConfigID2}`);
        await dbClient.destroy(
            `rule_configuration:${ruleConfigID2}`, returnedDoc._rev);

        // delete rule configuration id from tenant doc
        returnedDoc = await dbClient.get(`tenant:${appIDTenantID}`);
        const index = returnedDoc.rule_configuration_ids.indexOf(ruleConfigID1);
        returnedDoc.rule_configuration_ids.splice(index, 1);
        await dbClient.insert(returnedDoc);

        // delete fake tenant document
        returnedDoc = await dbClient.get(`tenant:${fakeTenantID}`);
        await dbClient.destroy(`tenant:${fakeTenantID}`, returnedDoc._rev);
    });

    it('get rule configuration', () => {
        return request(server)
            .get(`/rule_configurations/${ruleConfigID1}`)
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`
            })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200);
    });

    it('attempts to get rule configuration, unassociated tenant_id', () => {
        // eslint-disable-next-line max-len
        const expectedMsg = `(${ruleConfigID2}) does not belong to the tenant (${appIDTenantID})`;
        return request(server)
            .get(`/rule_configurations/${ruleConfigID2}`)
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`
            })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(404)
            .then(response => {
                expect(response.text).to.include(expectedMsg);
            });
    });

    it('attempts to get non-existent rule configuration', () => {
        // eslint-disable-next-line max-len
        const expectedMsg = `(nonExistentRuleConfigurationID) does not belong to the tenant (${appIDTenantID})`;
        return request(server)
            .get('/rule_configurations/nonExistentRuleConfigurationID')
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`
            })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(404)
            .then(response => {
                expect(response.text).to.include(expectedMsg);
            });
    });
});