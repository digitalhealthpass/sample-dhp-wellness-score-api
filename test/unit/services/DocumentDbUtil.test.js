/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const assert = require('assert');
const {
    DocumentDbUtil
} =
require('../../../services/DocumentDbUtil');

describe('DocumentDbUtil tests', () => {

    it('strips _id and _rev', () => {

        const document = {
            foo: 'bar',
            _id: '123',
            _rev: '456',
        };

        DocumentDbUtil.stripMetadata(document);

        assert.ok(document.foo);
        assert.ok(!document._id);
        assert.ok(!document._rev);

    });


});