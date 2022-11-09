/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

// get health of application
exports.getHealth = (req, res) => {
    res.json({
        status: 'UP',
    });
};
