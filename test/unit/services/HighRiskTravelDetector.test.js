/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

/* eslint-disable indent */
const {
    assert
} = require('chai');
const {
    HighRiskTravelDetector
} =
require('../../../services/HighRiskTravelDetector');

describe('High Risk Travel Detector tests', () => {

    it('resolves empty list when no travel locations are provided', () => {
        const highRiskTravelDetector = new HighRiskTravelDetector();
        const results = highRiskTravelDetector.invoke([]);

        assert.ok(results);
        assert.equal(0, results.length);

    });

    it('detects high-risk travel to Afghanistan on 2020-08-11', () => {
        const highRiskCountry = 'FOO';
        const countryMap = new Map();
        countryMap.set(highRiskCountry, highRiskCountry);
        const highRiskTravelDetector = new HighRiskTravelDetector(null, {
            highRiskCountries: countryMap,
        });
        const results = highRiskTravelDetector.invoke([{
                country: highRiskCountry,
                departureDate: '2020-08-11T12:33:11.12Z',
            },
            {
                country: ' ',
                departureDate: '2020-08-10T12:33:11.12Z',
            },
            {
                country: ' ',
                departureDate: '2020-08-09T12:33:11.12Z',
            },
        ]);

        assert.ok(results);
        assert.equal(1, results.length);
        assert.equal(results[0].date, '2020-08-11T23:59:59.999Z');

    });

    it('resolves empty list when no high-risk travel is detected', () => {
        const highRiskCountry = 'FOO';
        const countryMap = new Map();
        countryMap.set(highRiskCountry, highRiskCountry);
        const highRiskTravelDetector = new HighRiskTravelDetector(null, {
            highRiskCountries: countryMap,
        });
        const results = highRiskTravelDetector.invoke([{
                country: 'bar',
                departureDate: '2020-08-10T12:33:11.12Z',
            },
            {
                country: 'baz',
                departureDate: '2020-08-09T12:33:11.12Z',
            },
        ]);
        assert.ok(results);
        assert.equal(0, results.length);
    });

    it('rejects when departureDate is not specified', (done) => {
        const highRiskCountry = 'FOO';
        const countryMap = new Map();
        countryMap.set(highRiskCountry, highRiskCountry);
        const highRiskTravelDetector = new HighRiskTravelDetector(null, {
            highRiskCountries: countryMap,
        });
        try {
            highRiskTravelDetector.invoke([{
                country: highRiskCountry,
            }, ]);
            done(new Error('expected an error'));
        } catch (err) {
            done();
        }

    });

});