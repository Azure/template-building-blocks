describe('virtualMachineScaleSetSettings:', () => {
    let virtualMachineScaleSetSettings = require('../core/virtualMachineScaleSetSettings.js');
    let v = require('../core/validation');
    let _ = require('lodash');
    let testSettings = {
        name: 'scaleSet1',
        upgradePolicy: 'Automatic',
        overprovision: true,
        singlePlacementGroup: true
    };
    let buildingBlockSettings = {
        resourceGroupName: 'test-rg',
        subscriptionId: '00000000-0000-1000-A000-000000000000',
        location: 'westus2'
    };
    let validate = (settings) => {
        return v.validate({
            settings: settings,
            validations: virtualMachineScaleSetSettings.validations
        });
    };
    describe('validations:', () => {

        it('valid configuration', () => {
            let merged = virtualMachineScaleSetSettings.merge({
                settings: testSettings,
                buildingBlockSettings: buildingBlockSettings
            });
            let results = validate(merged);
            expect(results.length).toEqual(0);
        });

        describe('', () => {
            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(testSettings);
            });

            it('name must be provided', () => {
                delete settings.name;
                let merged = virtualMachineScaleSetSettings.merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
                let results = validate(merged);
                expect(results.length).toEqual(1);
                expect(results[0].name).toEqual('.name');

                settings.name = null;
                merged = virtualMachineScaleSetSettings.merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
                results = validate(merged);
                expect(results.length).toEqual(1);
                expect(results[0].name).toEqual('.name');

                settings.name = '';
                merged = virtualMachineScaleSetSettings.merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
                results = validate(merged);
                expect(results.length).toEqual(1);
                expect(results[0].name).toEqual('.name');
            });
            it('invalid upgradePolicy', () => {
                settings.upgradePolicy = 'invalid';
                let merged = virtualMachineScaleSetSettings.merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
                let results = validate(merged);
                expect(results.length).toEqual(1);
                expect(results[0].name).toEqual('.upgradePolicy');
            });
            it('overprovision must be boolean', () => {
                settings.overprovision = 'invalid';
                let merged = virtualMachineScaleSetSettings.merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
                let results = validate(merged);
                expect(results.length).toEqual(1);
                expect(results[0].name).toEqual('.overprovision');
            });
            it('singlePlacementGroup must be boolean', () => {
                settings.singlePlacementGroup = 'invalid';
                let merged = virtualMachineScaleSetSettings.merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
                let results = validate(merged);
                expect(results.length).toEqual(1);
                expect(results[0].name).toEqual('.singlePlacementGroup');
            });
        });
    });
});