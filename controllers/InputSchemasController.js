/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const { InputSchemasService } = require('../services/InputSchemasService');

module.exports.getSchema = (req, res) => {
    const inputSchemaID = req.params.input_schema_id;
    const inputSchemasService = new InputSchemasService(req.logger, {
        stripDocumentMetadata: true,
    });

    inputSchemasService
        .getSchema(inputSchemaID, req.tenantId)
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

module.exports.addSchema = (_, res) => {
    res.status(501).json({
        message: 'Not implemented',
    });
};

module.exports.deleteSchema = (_, res) => {
    res.status(501).json({
        message: 'Not implemented',
    });
};

module.exports.getSchemas = (_, res) => {
    res.status(501).json({
        message: 'Not implemented',
    });
};

module.exports.replaceSchema = (_, res) => {
    res.status(501).json({
        message: 'Not implemented',
    });
};
