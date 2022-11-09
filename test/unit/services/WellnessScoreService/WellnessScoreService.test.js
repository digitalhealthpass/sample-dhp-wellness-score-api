/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const assert = require('assert');
const {
    WellnessScoreService
} = require('../../../../services/WellnessScoreService');
const Messages = require('../../../../config/messages');
const testData = require('./test_data/resolves_with_score_of_1');

describe('Wellness Score Service tests', () => {

    it('rejects when tenant id is not specified', () => {

        const ruleConfigurationsService = {};
        const inputSchemasService = {};
        const factGenerator = {};
        const ruleEngine = {};
        const schemaValidator = {};

        const wellnessScoreService = new WellnessScoreService(null, {
            ruleConfigurationsService,
            inputSchemasService,
            factGenerator,
            ruleEngine,
            schemaValidator,
        });

        return wellnessScoreService.calculateWellness({})
            .then(() => {
                throw new Error('expected an error');
            })
            .catch((err) => {
                assert.equal(err.status, 403);
            });


    });

    it('resolves with score of 1', () => {
        const ruleConfigurationsService = {
            getRuleConfiguration() {
                return Promise.resolve(testData.ruleConfiguration);
            },
        };
        const inputSchemasService = {
            getSchema() {
                return Promise.resolve(testData.inputSchema);
            },
        };
        const factGenerator = {
            generateMap() {
                return Promise.resolve(testData.factMap);
            },
        };
        const ruleEngine = {
            addRules() { },
            setFacts() { },
            run() {
                return Promise.resolve(testData.ruleEngine.results);
            },
        };
        const schemaValidator = {
            validate() {
                return Promise.resolve(testData.input);
            },
        };
        const wellnessScoreService = new WellnessScoreService(null, {
            ruleConfigurationsService,
            inputSchemasService,
            factGenerator,
            ruleEngine,
            schemaValidator,
        });

        return wellnessScoreService.calculateWellness({}, testData.tenantId)
            .then((result) => {
                assert.equal(result.score, 1);
                assert.equal(result.description, Messages.scores[1]);
            })
            .catch((err) => {
                throw new Error(JSON.stringify(err));
            });


    });

});