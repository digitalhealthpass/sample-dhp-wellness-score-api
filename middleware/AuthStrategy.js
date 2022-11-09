/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const appIDAuth = require('./AppID');
const constants = require('../services/Constants');

const getAuthStrategy = (role) => {
    let authStrategy;
    if (role === constants.APP_ID_ROLES.WELLNESS_SCORE_READ) {
        authStrategy = appIDAuth.authenticateWellnessScoreRead;
    } else if (role === constants.APP_ID_ROLES.WELLNESS_SCORE_WRITE) {
        authStrategy = appIDAuth.authenticateWellnessScoreWrite;
    } else if (role === constants.APP_ID_ROLES.CALCULATE_WELLNESS) {
        authStrategy = appIDAuth.authenticateCalculateWellness;
    } else {
        authStrategy = appIDAuth.authenticateStandardUser;
    }

    return authStrategy;
};

module.exports = {
    getAuthStrategy,
};
