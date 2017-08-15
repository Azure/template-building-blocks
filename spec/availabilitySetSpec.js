describe('availabilitySetSettings:', () => {
    let availabilitySetSettings = require('../core/availabilitySetSettings.js');
    let _ = require('lodash');
    let v = require('../core/validation.js');

    let availabilitySetParams = {
        name: 'test-as',
        platformFaultDomainCount: 3,
        platformUpdateDomainCount: 5
    };

    describe('merge:', () => {
        it('validate valid defaults are applied.', () => {
            let settings = {};

            let mergedValue = availabilitySetSettings.merge({settings});
            expect(mergedValue.platformFaultDomainCount).toEqual(3);
            expect(mergedValue.platformUpdateDomainCount).toEqual(5);
        });
        it('validate defaults do not override settings.', () => {
            let settings = {
                platformFaultDomainCount: 10,
                platformUpdateDomainCount: 11,
                name: 'test-as'
            };

            let mergedValue = availabilitySetSettings.merge({settings});
            expect(mergedValue.platformFaultDomainCount).toEqual(10);
            expect(mergedValue.platformUpdateDomainCount).toEqual(11);
            expect(mergedValue.name).toEqual('test-as');
        });
        it('validate additional properties in settings are not removed.', () => {
            let settings = {
                name1: 'test-as'
            };

            let mergedValue = availabilitySetSettings.merge({settings});
            expect(mergedValue.hasOwnProperty('name1')).toBeTruthy();
            expect(mergedValue.name1).toEqual('test-as');
        });
        it('validate missing properties in settings are picked up from defaults.', () => {
            let settings = {
                platformFaultDomainCount: 10
            };

            let mergedValue = availabilitySetSettings.merge({settings});
            expect(mergedValue.hasOwnProperty('platformUpdateDomainCount')).toEqual(true);
            expect(mergedValue.platformUpdateDomainCount).toEqual(5);
        });
    });
    describe('userDefaults:', () => {
        it('validate valid user defaults are applied.', () => {
            let settings = {};

            let defaults = {
                platformFaultDomainCount: 12
            };

            let mergedValue = availabilitySetSettings.merge({settings, defaultSettings: defaults});
            expect(mergedValue.platformFaultDomainCount).toEqual(12);
            expect(mergedValue.platformUpdateDomainCount).toEqual(5);
        });
        it('validate user defaults do not override settings.', () => {
            let settings = {
                platformFaultDomainCount: 10,
                platformUpdateDomainCount: 11,
                name: 'test-as'
            };

            let defaults = {
                platformFaultDomainCount: 12,
                platformUpdateDomainCount: 12,
                name: 'xyz-test-as'
            };

            let mergedValue = availabilitySetSettings.merge({settings, defaultSettings: defaults});
            expect(mergedValue.platformFaultDomainCount).toEqual(10);
            expect(mergedValue.platformUpdateDomainCount).toEqual(11);
            expect(mergedValue.name).toEqual('test-as');
        });
        it('validate additional properties in default settings are neither removed nor overriden.', () => {
            let settings = {
                name1: 'test-as'
            };

            let defaults = {
                name1: 'xyz-test-as'
            };

            let mergedValue = availabilitySetSettings.merge({settings, defaultSettings: defaults});
            expect(mergedValue.hasOwnProperty('name1')).toBeTruthy();
            expect(mergedValue.name1).toEqual('test-as');
        });
        it('validate missing properties in default settings are picked up from defaults.', () => {
            let settings = {
                platformFaultDomainCount: 10
            };

            let defaults = {
                platformFaultDomainCount: 12
            };

            let mergedValue = availabilitySetSettings.merge({settings, defaultSettings: defaults});
            expect(mergedValue.hasOwnProperty('platformUpdateDomainCount')).toEqual(true);
            expect(mergedValue.platformUpdateDomainCount).toEqual(5);
        });
        it('validate merge lets override user defaults.', () => {
            let settings = {
                platformFaultDomainCount: 10,
            };

            let defaults = {
                platformUpdateDomainCount: 11,
                platformFaultDomainCount: 11
            };

            let mergedValue = availabilitySetSettings.merge({settings: settings, defaultSettings: defaults});
            expect(mergedValue.platformFaultDomainCount).toEqual(10);
            expect(mergedValue.platformUpdateDomainCount).toEqual(11);
        });
    });
    describe('validations:', () => {
        let settings;
        beforeEach(() => {
            settings = _.cloneDeep(availabilitySetParams);
        });

        describe('platformFaultDomainCount:', () => {
            it('validate platformFaultDomainCount values can be between 1-3.', () => {
                settings.platformFaultDomainCount = 0;
                let result = v.validate({
                    settings: settings,
                    validations: availabilitySetSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.platformFaultDomainCount');

                settings.platformFaultDomainCount = 3;
                result = v.validate({
                    settings: settings,
                    validations: availabilitySetSettings.validations
                });
                expect(result.length).toEqual(0);

                settings.platformFaultDomainCount = 5;
                result = v.validate({
                    settings: settings,
                    validations: availabilitySetSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.platformFaultDomainCount');

                settings.platformFaultDomainCount = '5';
                result = v.validate({
                    settings: settings,
                    validations: availabilitySetSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.platformFaultDomainCount');
            });
        });
        describe('platformUpdateDomainCount:', () => {
            it('validate platformUpdateDomainCount values can be between 1-20.', () => {
                settings.platformUpdateDomainCount = 0;
                let result = v.validate({
                    settings: settings,
                    validations: availabilitySetSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.platformUpdateDomainCount');

                settings.platformUpdateDomainCount = 20;
                result = v.validate({
                    settings: settings,
                    validations: availabilitySetSettings.validations
                });
                expect(result.length).toEqual(0);

                settings.platformUpdateDomainCount = 50;
                result = v.validate({
                    settings: settings,
                    validations: availabilitySetSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.platformUpdateDomainCount');

                settings.platformUpdateDomainCount = '5';
                result = v.validate({
                    settings: settings,
                    validations: availabilitySetSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.platformUpdateDomainCount');
            });
        });
        describe('name:', () => {
            it('validate name canot be an empty string.', () => {
                settings.name = '';
                let result = v.validate({
                    settings: settings,
                    validations: availabilitySetSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.name');

                settings.name = 'test';
                result = v.validate({
                    settings: settings,
                    validations: availabilitySetSettings.validations
                });
                expect(result.length).toEqual(0);

                settings.name = null;
                result = v.validate({
                    settings: settings,
                    validations: availabilitySetSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.name');
            });
        });
    });

    if (global.testConfiguration.runTransform) {
        describe('transform:', () => {
            let settings = {
                storageAccounts: {
                    count: 2,
                    managed: false
                },
                availabilitySet: {
                    useExistingAvailabilitySet: false,
                    platformFaultDomainCount: 3,
                    platformUpdateDomainCount: 5,
                    name: 'test-as'
                }
            };
            it('converts settings to RP shape', () => {
                let result = availabilitySetSettings.transform(settings.availabilitySet, settings);
                expect(result.availabilitySet[0].name).toEqual('test-as');
                expect(result.availabilitySet[0].properties.platformFaultDomainCount).toEqual(3);
                expect(result.availabilitySet[0].properties.platformUpdateDomainCount).toEqual(5);
            });
            it('adds a managed property to properties only if storage accounts are managed', () => {
                let result = availabilitySetSettings.transform(settings.availabilitySet, settings);
                expect(result.availabilitySet[0].properties.hasOwnProperty('managed')).toEqual(false);

                let param = _.cloneDeep(settings);
                param.storageAccounts.managed = true;

                result = availabilitySetSettings.transform(param.availabilitySet, param);
                expect(result.availabilitySet[0].properties.hasOwnProperty('managed')).toEqual(true);
            });
        });
    }
});