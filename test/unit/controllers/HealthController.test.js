/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const res = require('express/lib/response');

const healthController = require('../../../controllers/HealthController');

const {
    expect
} = chai;
const sandbox = sinon.createSandbox();
chai.use(sinonChai);

// example unit test of health controller
describe('Test health controller', () => {
    before(() => {
        sandbox.stub(res, 'json');
    });

    afterEach(() => {
        sandbox.reset();
    });

    after(() => {
        sandbox.restore();
    });

    it('should return status UP', () => {
        const mockReq = {};

        healthController.getHealth(mockReq, res);
        expect(res.json).to.have.been.calledOnceWith({
            status: 'UP',
        });
    });
});