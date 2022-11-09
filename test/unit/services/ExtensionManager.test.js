/**
 * Digital Health Pass 
 *
 * (c) Copyright Merative US L.P. and others 2020-2022 
 *
 * SPDX-Licence-Identifier: Apache 2.0
 */

const {
    ExtensionManager,
    AvailableExtensions
} = require('../../../services/ExtensionManager');

describe('Extension Manager tests', () => {

    it('advertised extensions are actually available', (done) => {
        const extensionManager = new ExtensionManager();
        Object.keys(AvailableExtensions).forEach(availableExtension => {
            extensionManager.getExtension(
                AvailableExtensions[availableExtension]);
        });
        done();
    });

    it('rejects when an unsupported extension is requested', (done) => {
        const extensionManager = new ExtensionManager();
        try {
            extensionManager.getExtension('foo');
            done(new Error('expected an error'));
        } catch (err) {
            done();
        }
    });

    it('returns injected extensions', (done) => {
        class FakeDetector {
            // eslint-disable-next-line class-methods-use-this
            invoke() {}
        }
        const options = {
            highRiskTravelDetectorClass: FakeDetector,
            highRiskSymptomDetectorClass: FakeDetector,
        };
        const extensionManager = new ExtensionManager(null, options);

        const symptomExtensionPresent = extensionManager
            .getExtension(AvailableExtensions.highRiskSymptomDetector) instanceof options.highRiskSymptomDetectorClass;
        const travelExtensionPresent = extensionManager
            .getExtension(AvailableExtensions.highRiskTravelDetector) instanceof options.highRiskTravelDetectorClass;

        if (symptomExtensionPresent && travelExtensionPresent) {
            done();
        } else {
            done(new Error(
                "injected extensions don't match the returned classes"));
        }
    });
});