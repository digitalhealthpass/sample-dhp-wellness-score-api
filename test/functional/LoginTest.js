/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const chai = require('chai');
const request = require('supertest');

const {
    expect
} = chai;

const config = require('./ConfigTest');

describe('Valid Login', function validLoginTest() {
    this.timeout(5000);
    it('Should return a 200, valid user', (done) => {
        const path = '/login';
        const body = {
            username: 'wellness@poc.com',
            password: 'testing123',
        };
        request(process.env.SECURITY_API)
            .post(path)
            .send(body)
            .end((err, res) => {
                if (err) throw err;
                expect(200);
                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('access_token');
                expect(res.body.access_token).to.not.be.empty;
                config.token = res.body.access_token;
                done();
            });
    });
});
