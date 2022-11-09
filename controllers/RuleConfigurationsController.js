/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const { RuleConfigurationsService } = require('../services/RuleConfigurationsService');
const { WellnessScoreService } = require('../services/WellnessScoreService');
const { InputSchemasService } = require('../services/InputSchemasService');

module.exports.getRuleConfiguration = (req, res) => {
    const ruleConfigurationID = req.params.rule_configuration_id;
    const ruleConfigurationsService = new RuleConfigurationsService(req.logger, {
        stripDocumentMetadata: true,
    });

    ruleConfigurationsService
        .getRuleConfiguration(ruleConfigurationID, req.tenantId)
        .then((response) => {
            res.status(200).json(response);
        })
        .catch((err) => {
            const status = err.status || 500;
            const message = err.message || 'An unexpected error occurred.';
            res.status(status).json({
                message,
            });
        });
};

module.exports.validateRuleConfiguration = (req, res) => {
    const { logger, tenantID } = req;
    const ruleConfigurationID = req.params.rule_configuration_id;
    const testSuiteID = req.query.test_suite_id;

    const ruleConfigurationsService = new RuleConfigurationsService(logger);
    const inputSchemasService = new InputSchemasService(logger);
    const wellnessScoreService = new WellnessScoreService(logger, {
        ruleConfigurationsService,
        inputSchemasService,
    });

    const response = {};

    logger.info(`Preparing to validate rule configuration (${ruleConfigurationID}) of tenant (${tenantID})`);

    const start = new Date().getTime();

    // get test suite
    ruleConfigurationsService
        .getRuleConfiguration(ruleConfigurationID, tenantID)
        .then((ruleConfiguration) => {
            return Promise.all([
                Promise.resolve(ruleConfiguration),
                inputSchemasService.getSchema(ruleConfiguration.input_schema_id, tenantID),
            ]);
        })
        .then(([ruleConfiguration, inputSchema]) => {
            response.version_info = {
                rule_configuration: {
                    id: ruleConfiguration._id.split(':')[1],
                    revision: ruleConfiguration._rev,
                },
                input_schema: {
                    id: inputSchema._id.split(':')[1],
                    revision: inputSchema._rev,
                },
            };
            const versionInfo = JSON.stringify(response.version_info);
            logger.info(`Populated preliminary version metadata for test run: ${versionInfo}`);
            logger.info(`Getting test suite (${testSuiteID})`);
            return ruleConfigurationsService.getTestSuite(testSuiteID, tenantID);
        })
        .then(async (testSuite) => {
            logger.info(`Retrieved test suite ${testSuiteID}`);
            response.version_info.test_suite = {
                id: testSuite._id.split(':')[1],
                revision: testSuite._rev,
            };

            const testCases = testSuite.test_cases || [];
            const results = [];

            // eslint-disable-next-line guard-for-in, no-restricted-syntax
            for (const index in testCases) {
                const testCase = testCases[index];
                const result = {
                    id: testCase.id,
                    name: testCase.name,
                    passed: false,
                    reason: null,
                    expected_score: testCase.expected_score,
                    actual_score: null,
                    input: testCase.input,
                };

                try {
                    // eslint-disable-next-line no-await-in-loop
                    const wellness = await wellnessScoreService.calculateWellness(
                        {
                            rule_configuration_id: ruleConfigurationID,
                            input: testCase.input,
                        },
                        tenantID
                    );
                    result.actual_score = wellness.score;
                    result.passed = testCase.expected_score === result.actual_score;
                    if (!result.passed) {
                        result.reason = 'The resulting score did not match the expected score';
                    }
                } catch (err) {
                    result.passed = false;
                    result.reason = err.message;
                }
                results.push(result);
            }
            return Promise.resolve(results);
        })
        .then((results) => {
            response.test_cases = results;
            res.status(200).json(response);
        })
        .catch((err) => {
            res.status(500).json({
                message: 'An unexpected error occurred',
                errors: [
                    {
                        errorCode: 500,
                        message: err.message,
                    },
                ],
            });
        })
        .finally(() => {
            const elapsedTime = new Date().getTime() - start;
            logger.info(`Completed validation in ${elapsedTime} ms`);
        });
};

module.exports.addRuleConfiguration = (_, res) => {
    res.status(501).json({
        message: 'Not implemented',
    });
};

module.exports.deleteRuleConfiguration = (_, res) => {
    res.status(501).json({
        message: 'Not implemented',
    });
};

module.exports.getRuleConfigurations = (_, res) => {
    res.status(501).json({
        message: 'Not implemented',
    });
};

module.exports.replaceRuleConfiguration = (_, res) => {
    res.status(501).json({
        message: 'Not implemented',
    });
};
