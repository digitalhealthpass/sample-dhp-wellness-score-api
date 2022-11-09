/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const { WellnessScoreService } = require('../services/WellnessScoreService');

module.exports.calculateWellness = (req, res) => {
    const wellnessScoreService = new WellnessScoreService(req.logger);
    wellnessScoreService
        .calculateWellness(req.body, req.tenantId)
        .then((response) => {
            res.status(200).json(response);
        })
        .catch((err) => {
            if (err.status) {
                const body = {
                    message: err.message,
                };
                if (err.errors) {
                    body.errors = err.errors;
                }
                res.status(err.status).json(body);
            } else {
                res.status(500).json({
                    message: 'An unexpected error occurred.',
                });
            }
        });
};
