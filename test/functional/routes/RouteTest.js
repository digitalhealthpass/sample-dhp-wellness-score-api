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

const server = require('../../../index');

describe('GET /health', () => {
    it('responds with json', () => {
        return request(server)
            .get('/health/')
            .set('Accept', 'application/json')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(200, {
                status: 'UP',
            });
    });
});

describe('GET /api-docs', () => {
    it('responds with swagger', () => {
        return request(server)
            .get('/api-docs')
            .expect('Content-Type', 'text/html; charset=UTF-8')
            .expect(301)
            .then(response => {
                expect(response.text).to.include('docs');
            });
    });
});


describe('POST /fake/route', () => {
    it('responds with HTTP-404', () => {
        return request(server)
            .post('/fake/route')
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(404);
    });
});
