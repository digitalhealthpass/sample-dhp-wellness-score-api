/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

/* eslint-disable no-console */
require('dotenv').config();

const atob = require('atob');
const { ApiBootstrapper } = require('dhp-http-lib');
const http = require('http');
const passport = require('passport');
const path = require('path');

const apiRoutes = require('./routes');

const serverPort = process.env.PORT || 30004;

const bootstrapper = new ApiBootstrapper(path.join(__dirname, 'api/swagger.json'), 'healthpass-wellness-score-api');
const app = bootstrapper.createExpressApp();

app.use(passport.initialize());

// inject the tenant id in the req if it is present in the bearer token
// Note: this middleware needs to be placed before the routes handler so
//       that the tenantID is injected before the request is processed
app.use((req, res, next) => {
    const { logger } = req;
    if (req.headers && req.headers.authorization && req.headers.authorization.includes('Bearer')) {
        try {
            const authorizationHeader = req.headers.authorization;
            const token = authorizationHeader.split(' ')[1];
            const encodedPayload = token.split('.')[1];
            const payload = JSON.parse(atob(encodedPayload));
            const tenantId = payload.tenant_id;
            req.tenantId = tenantId;
            logger.info(`Injected tenant id (${tenantId}) in req`);
        } catch (err) {
            logger.error(err);
            logger.error('Failed to inject tenant id in req');
        }
    }
    next();
});

app.use('/', apiRoutes);

app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'No route found',
        },
    });
});

http.createServer(app).listen(serverPort, () => {
    console.log('The server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/api-docs/', serverPort);
});

module.exports = app;
