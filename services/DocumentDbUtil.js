/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

class DocumentDbUtil {

    static stripMetadata(document) {
        const formattedDoc = document;
        delete formattedDoc._rev;
        delete formattedDoc._id;
        return formattedDoc;
    }
}

module.exports.DocumentDbUtil = DocumentDbUtil;