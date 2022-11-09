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
const { v4: uuidv4 } = require('uuid');

const { expect } = chai;

const server = require('../../../index');
const config = require('../ConfigTest.js');

require('../LoginTest.js');

let dbClient;
let schemaID1;
let schemaID2;
const fakeTenantID = uuidv4();
const appIDTenantID = 'wellness-tenant-1';

describe('GET /input_schemas', function getSchemasTest() {
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
        schemaID1 = uuidv4();
        let inputSchemaDoc = {
            _id: `input_schema:${schemaID1}`,
            tenant_id: appIDTenantID,
        };
        await dbClient.insert(inputSchemaDoc);

        // update tenant doc with input schema id
        const returnedDoc = await dbClient.get(`tenant:${appIDTenantID}`);
        returnedDoc.input_schema_ids.push(schemaID1);
        await dbClient.insert(returnedDoc);

        // create input schema doc with a tenant_id not associated with AppID user
        schemaID2 = uuidv4();
        inputSchemaDoc = {
            _id: `input_schema:${schemaID2}`,
            tenant_id: fakeTenantID,
        };
        await dbClient.insert(inputSchemaDoc);

        // create fake tenant document (not associated with AppID user)
        const fakeTenantDoc = {
            _id: `tenant:${fakeTenantID}`,
            input_schema_ids: [schemaID2],
        };
        await dbClient.insert(fakeTenantDoc);

        // Note: Returns doc if input schema id is included in tenant doc of
        // authenticated user, regardless of tenant_id value in input schema doc.
        // Is this desired behavior?
        // TODO: POST API that checks tenant_id before saving to Cloudant.
    });

    after(async () => {
        // delete input schema docs
        let returnedDoc = await dbClient.get(`input_schema:${schemaID1}`);
        await dbClient.destroy(`input_schema:${schemaID1}`, returnedDoc._rev);

        returnedDoc = await dbClient.get(`input_schema:${schemaID2}`);
        await dbClient.destroy(`input_schema:${schemaID2}`, returnedDoc._rev);

        // delete input schema id from tenant doc
        returnedDoc = await dbClient.get(`tenant:${appIDTenantID}`);
        const index = returnedDoc.input_schema_ids.indexOf(schemaID1);
        returnedDoc.input_schema_ids.splice(index, 1);
        await dbClient.insert(returnedDoc);

        // delete fake tenant document
        returnedDoc = await dbClient.get(`tenant:${fakeTenantID}`);
        await dbClient.destroy(`tenant:${fakeTenantID}`, returnedDoc._rev);
    });

    it('get input schema', () => {
        return request(server)
            .get(`/input_schemas/${schemaID1}`)
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200);
    });

    it('attempts to get input schema, unassociated tenant_id', () => {
        // eslint-disable-next-line max-len
        const expectedMsg = `(${schemaID2}) does not belong to the tenant (${appIDTenantID})`;
        return request(server)
            .get(`/input_schemas/${schemaID2}`)
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(404)
            .then((response) => {
                expect(response.text).to.include(expectedMsg);
            });
    });

    it('attempts to get non-existent input schema', () => {
        // eslint-disable-next-line max-len
        const expectedMsg = `(nonExistentInputSchemaID) does not belong to the tenant (${appIDTenantID})`;
        return request(server)
            .get('/input_schemas/nonExistentInputSchemaID')
            .set('Accept', 'application/json')
            .set({
                Authorization: `Bearer ${config.token}`,
            })
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(404)
            .then((response) => {
                expect(response.text).to.include(expectedMsg);
            });
    });
});
