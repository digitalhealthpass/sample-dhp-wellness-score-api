/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const express = require('express');

const HealthController = require('../controllers/HealthController');
const InputSchemasController = require('../controllers/InputSchemasController');
const RuleConfigurationsController = require('../controllers/RuleConfigurationsController');
const WellnessScoreController = require('../controllers/WellnessScoreController');
const constants = require('../services/Constants');
const authStrategy = require('../middleware/AuthStrategy');

const checkAuthWellnessRead = authStrategy.getAuthStrategy(constants.APP_ID_ROLES.WELLNESS_SCORE_READ);
const checkAuthWellnessWrite = authStrategy.getAuthStrategy(constants.APP_ID_ROLES.WELLNESS_SCORE_WRITE);
const checkAuthCalculateWellness = authStrategy.getAuthStrategy(constants.APP_ID_ROLES.CALCULATE_WELLNESS);

const router = express.Router();

router.get('/health', HealthController.getHealth);

router.get('/input_schemas', checkAuthWellnessRead, InputSchemasController.getSchemas);
router.post('/input_schemas', checkAuthWellnessWrite, InputSchemasController.addSchema);
router.get('/input_schemas/:input_schema_id', checkAuthWellnessRead, InputSchemasController.getSchema);
router.put('/input_schemas/:input_schema_id', checkAuthWellnessWrite, InputSchemasController.replaceSchema);
router.delete('/input_schemas/:input_schema_id', checkAuthWellnessWrite, InputSchemasController.deleteSchema);

router.get('/rule_configurations', checkAuthWellnessRead, RuleConfigurationsController.getRuleConfigurations);
router.post('/rule_configurations', checkAuthWellnessWrite, RuleConfigurationsController.addRuleConfiguration);
router.get(
    '/rule_configurations/:rule_configuration_id',
    checkAuthWellnessRead,
    RuleConfigurationsController.getRuleConfiguration
);
router.put(
    '/rule_configurations/:rule_configuration_id',
    checkAuthWellnessWrite,
    RuleConfigurationsController.replaceRuleConfiguration
);
router.delete(
    '/rule_configurations/:rule_configuration_id',
    checkAuthWellnessWrite,
    RuleConfigurationsController.deleteRuleConfiguration
);
router.post(
    '/rule_configurations/:rule_configuration_id/validation',
    checkAuthCalculateWellness,
    RuleConfigurationsController.validateRuleConfiguration
);

router.post('/calculation', checkAuthCalculateWellness, WellnessScoreController.calculateWellness);

module.exports = router;
