describe('networkInterfaceSettings:', () => {
    let networkInterfaceSettings = require('../core/networkInterfaceSettings.js');
    let _ = require('lodash');
    let v = require('../core/validation.js');

    let buildingBlockSettings = {
        resourceGroupName: 'test-rg',
        subscriptionId: '00000000-0000-1000-A000-000000000000',
        location: 'westus2',
        cloud: {
            suffixes: {
                storageEndpoint: 'core.windows.net'
            }
        }
    };

    let nicParams = {
        isPublic: false,
        subnetName: 'default',
        privateIPAllocationMethod: 'Dynamic',
        publicIPAllocationMethod: 'Dynamic',
        enableIPForwarding: false,
        domainNameLabelPrefix: '',
        dnsServers: [],
        isPrimary: false
    };

    describe('merge:', () => {

        it('validate valid defaults are applied.', () => {
            let settings = [{}];

            let mergedValue = networkInterfaceSettings.merge({ settings,buildingBlockSettings })[0];
            expect(mergedValue.isPublic).toEqual(true);
            expect(mergedValue.isPrimary).toEqual(true);
            expect(mergedValue.hasOwnProperty('subnetName')).toEqual(false);
            expect(mergedValue.privateIPAllocationMethod).toEqual('Dynamic');
            expect(mergedValue.publicIPAllocationMethod).toEqual('Dynamic');
            expect(mergedValue.enableIPForwarding).toEqual(false);
            expect(mergedValue.domainNameLabelPrefix).toEqual('');
            expect(mergedValue.dnsServers.length).toEqual(0);
        });
        it('validate defaults do not override settings.', () => {
            let settings = [{
                isPublic: false,
                isPrimary: true,
                subnetName: 'default1',
                privateIPAllocationMethod: 'Static',
                publicIPAllocationMethod: 'Static',
                enableIPForwarding: true,
                domainNameLabelPrefix: 'test1',
                dnsServers: ['10.0.0.0']
            }];

            let mergedValue = networkInterfaceSettings.merge({ settings,buildingBlockSettings })[0];
            expect(mergedValue.isPublic).toEqual(false);
            expect(mergedValue.isPrimary).toEqual(true);
            expect(mergedValue.subnetName).toEqual('default1');
            expect(mergedValue.privateIPAllocationMethod).toEqual('Static');
            expect(mergedValue.publicIPAllocationMethod).toEqual('Static');
            expect(mergedValue.enableIPForwarding).toEqual(true);
            expect(mergedValue.domainNameLabelPrefix).toEqual('test1');
            expect(mergedValue.dnsServers.length).toEqual(1);
            expect(mergedValue.dnsServers[0]).toEqual('10.0.0.0');
        });
        it('validate additional properties in settings are not removed.', () => {
            let settings = [{
                name1: 'test-as'
            }];

            let mergedValue = networkInterfaceSettings.merge({ settings,buildingBlockSettings })[0];
            expect(mergedValue.hasOwnProperty('name1')).toEqual(true);
            expect(mergedValue.name1).toEqual('test-as');
            expect(mergedValue.isPublic).toEqual(true);
        });
        it('validate missing properties in settings are picked up from defaults.', () => {
            let settings = [{
                isPublic: true,
                enableIPForwarding: true,
                domainNameLabelPrefix: 'test1',
                dnsServers: ['10.0.0.0']
            }];

            let mergedValue = networkInterfaceSettings.merge({ settings,buildingBlockSettings })[0];
            expect(mergedValue.isPublic).toEqual(true);
            expect(mergedValue.isPrimary).toEqual(true);
            expect(mergedValue.privateIPAllocationMethod).toEqual('Dynamic');
            expect(mergedValue.publicIPAllocationMethod).toEqual('Dynamic');
            expect(mergedValue.enableIPForwarding).toEqual(true);
            expect(mergedValue.domainNameLabelPrefix).toEqual('test1');
            expect(mergedValue.dnsServers.length).toEqual(1);
            expect(mergedValue.dnsServers[0]).toEqual('10.0.0.0');
        });
    });
    describe('userDefaults:', () => {

        it('validate valid user defaults are applied.', () => {
            let settings = [{}];

            let defaults = {
                isPublic: false
            };

            let mergedValue = networkInterfaceSettings.merge({
                settings,
                buildingBlockSettings,
                defaultSettings: defaults })[0];
            expect(mergedValue.isPublic).toEqual(false);
            expect(mergedValue.isPrimary).toEqual(true);
            expect(mergedValue.hasOwnProperty('subnetName')).toEqual(false);
            expect(mergedValue.privateIPAllocationMethod).toEqual('Dynamic');
            expect(mergedValue.publicIPAllocationMethod).toEqual('Dynamic');
            expect(mergedValue.enableIPForwarding).toEqual(false);
            expect(mergedValue.domainNameLabelPrefix).toEqual('');
            expect(mergedValue.dnsServers.length).toEqual(0);
        });
        it('validate user defaults do not override settings.', () => {
            let settings = [{
                isPublic: false,
                isPrimary: true,
                subnetName: 'default1',
                privateIPAllocationMethod: 'Static',
                publicIPAllocationMethod: 'Static',
                enableIPForwarding: true,
                domainNameLabelPrefix: 'test1',
                dnsServers: ['10.0.0.0']
            }];

            let defaults = {
                isPublic: true,
                publicIPAllocationMethod: 'Dynamic'
            };

            let mergedValue = networkInterfaceSettings.merge({
                settings,
                buildingBlockSettings,
                defaultSettings: defaults })[0];
            expect(mergedValue.isPublic).toEqual(false);
            expect(mergedValue.isPrimary).toEqual(true);
            expect(mergedValue.subnetName).toEqual('default1');
            expect(mergedValue.privateIPAllocationMethod).toEqual('Static');
            expect(mergedValue.publicIPAllocationMethod).toEqual('Static');
            expect(mergedValue.enableIPForwarding).toEqual(true);
            expect(mergedValue.domainNameLabelPrefix).toEqual('test1');
            expect(mergedValue.dnsServers.length).toEqual(1);
            expect(mergedValue.dnsServers[0]).toEqual('10.0.0.0');
        });
        it('validate additional properties in user defaults are not removed nor override.', () => {
            let settings = [{
                name1: 'test-as'
            }];

            let defaults = {
                name1: 'xyz-test-as'
            };

            let mergedValue = networkInterfaceSettings.merge({
                settings,
                buildingBlockSettings,
                defaultSettings: defaults })[0];
            expect(mergedValue.hasOwnProperty('name1')).toEqual(true);
            expect(mergedValue.name1).toEqual('test-as');
            expect(mergedValue.isPublic).toEqual(true);
        });
        it('validate missing properties in settings are picked up from user defaults.', () => {
            let settings = [{
                isPublic: true,
                enableIPForwarding: true,
                domainNameLabelPrefix: 'test1',
                dnsServers: ['10.0.0.0']
            }];

            let defaults = {
                isPublic: false,
                enableIPForwarding: false,
                domainNameLabelPrefix: 'xyz-test1'
            };

            let mergedValue = networkInterfaceSettings.merge({
                settings,
                buildingBlockSettings,
                defaultSettings: defaults })[0];
            expect(mergedValue.isPublic).toEqual(true);
            expect(mergedValue.isPrimary).toEqual(true);
            expect(mergedValue.privateIPAllocationMethod).toEqual('Dynamic');
            expect(mergedValue.publicIPAllocationMethod).toEqual('Dynamic');
            expect(mergedValue.enableIPForwarding).toEqual(true);
            expect(mergedValue.domainNameLabelPrefix).toEqual('test1');
            expect(mergedValue.dnsServers.length).toEqual(1);
            expect(mergedValue.dnsServers[0]).toEqual('10.0.0.0');
        });
        it('validate dnsServers user defaults (0 settings, 1 default).', () => {
            let settings = [{}];

            let defaults = {
                dnsServers: ['192.168.0.1']
            };

            let mergedValue = networkInterfaceSettings.merge({
                settings,
                buildingBlockSettings,
                defaultSettings: defaults })[0];
            expect(mergedValue.dnsServers.length).toEqual(1);
            expect(mergedValue.dnsServers[0]).toEqual('192.168.0.1');
        });
        it('validate dnsServers user defaults 1 setting, 1 default).', () => {
            let settings = [{
                dnsServers: ['10.0.0.0']
            }];

            let defaults = {
                dnsServers: ['192.168.0.1']
            };

            let mergedValue = networkInterfaceSettings.merge({
                settings,
                buildingBlockSettings,
                defaultSettings: defaults })[0];
            expect(mergedValue.dnsServers.length).toEqual(1);
            expect(mergedValue.dnsServers[0]).toEqual('10.0.0.0');
        });
        it('validate dnsServers user defaults (2 settings, 1 default).', () => {
            let settings = [{
                dnsServers: ['10.0.0.0', '10.0.0.1']
            }];

            let defaults = {
                dnsServers: ['192.168.0.1']
            };

            let mergedValue = networkInterfaceSettings.merge({
                settings,
                buildingBlockSettings,
                defaultSettings: defaults })[0];
            expect(mergedValue.dnsServers.length).toEqual(2);
            expect(mergedValue.dnsServers[0]).toEqual('10.0.0.0');
            expect(mergedValue.dnsServers[1]).toEqual('10.0.0.1');
        });
        it('validate dnsServers user defaults (1 setting, 2 defaults).', () => {
            let settings = [{
                dnsServers: ['10.0.0.0']
            }];

            let defaults = {
                dnsServers: ['192.168.0.1', '192.168.0.2']
            };

            let mergedValue = networkInterfaceSettings.merge({
                settings,
                buildingBlockSettings,
                defaultSettings: defaults })[0];
            expect(mergedValue.dnsServers.length).toEqual(1);
            expect(mergedValue.dnsServers[0]).toEqual('10.0.0.0');
        });
    });
    describe('validations:', () => {
        describe('isPublic:', () => {

            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(nicParams);
            });

            it('validates only boolean values are valid.', () => {
                settings.isPublic = 'yes';
                let result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.isPublic');
            });
            it('valid public IP address', () => {
                settings.isPublic = true;
                settings.location = buildingBlockSettings.location;
                settings.subscriptionId = buildingBlockSettings.subscriptionId;
                settings.resourceGroupName = buildingBlockSettings.resourceGroupName;
                settings = _.castArray(settings);
                let merged = networkInterfaceSettings.merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });
                let results = v.validate({
                    settings: merged,
                    validations: networkInterfaceSettings.validations
                });
                expect(results.length).toEqual(0);
            });
        });
        describe('enableIPForwarding:', () => {
            it('validates only boolean values are valid.', () => {
                let settings = _.cloneDeep(nicParams);
                settings.enableIPForwarding = 'yes';
                let result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.enableIPForwarding');
            });
        });
        describe('isPrimary:', () => {
            it('validates only boolean values are valid.', () => {
                let settings = _.cloneDeep(nicParams);
                settings.isPrimary = 'yes';
                let result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.isPrimary');
            });
        });
        describe('privateIPAllocationMethod:', () => {
            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(nicParams);
            });

            it('validates valid values are Static and Dynamic.', () => {

                settings.privateIPAllocationMethod = 'static';
                let result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.privateIPAllocationMethod');

                settings.privateIPAllocationMethod = null;
                result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.privateIPAllocationMethod');

                settings.privateIPAllocationMethod = '';
                result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.privateIPAllocationMethod');

                settings.privateIPAllocationMethod = 'Dynamic';
                result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(0);
            });
            it('validates if privateIPAllocationMethod is Static, startingIPAddress must be a valid IP address', () => {
                settings.privateIPAllocationMethod = 'Static';
                settings.startingIPAddress = '10.10.10.10';
                let result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(0);
            });
        });
        describe('publicIPAllocationMethod:', () => {
            it('validates valid values are Static and Dynamic.', () => {
                let settings = _.cloneDeep(nicParams);

                settings.publicIPAllocationMethod = 'static';
                let result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.publicIPAllocationMethod');

                settings.publicIPAllocationMethod = null;
                result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.publicIPAllocationMethod');

                settings.publicIPAllocationMethod = '';
                result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.publicIPAllocationMethod');

                settings.publicIPAllocationMethod = 'Static';
                result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(0);

                settings.publicIPAllocationMethod = 'Dynamic';
                result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(0);
            });
        });
        describe('subnetName:', () => {
            it('validate name canot be an empty string.', () => {
                let settings = _.cloneDeep(nicParams);

                settings.subnetName = '';
                let result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.subnetName');

                settings.subnetName = 'test';
                result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(0);

                settings.subnetName = null;
                result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.subnetName');
            });
        });
        describe('dnsServers:', () => {
            it('validates that values are valid ip addresses.', () => {
                let settings = _.cloneDeep(nicParams);

                settings.dnsServers[0] = '10.0.0.0';
                let result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(0);

                settings.dnsServers[0] = 'test';
                result = v.validate({
                    settings: settings,
                    validations: networkInterfaceSettings.validations
                });
                expect(result.length).toEqual(1);
                expect(result[0].name).toEqual('.dnsServers[0]');
            });
        });
    });

    if (global.testConfiguration.runTransform) {
        describe('transform:', () => {
            let vmIndex = 0;
            let settings = {
                name: 'testVM1',
                virtualNetwork: {
                    name: 'test-vnet',
                    subscriptionId: '00000000-0000-1000-A000-000000000000',
                    resourceGroupName: 'test-rg'
                },
                nics: [
                    {
                        isPublic: false,
                        subnetName: 'web',
                        privateIPAllocationMethod: 'Static',
                        publicIPAllocationMethod: 'Dynamic',
                        startingIPAddress: '10.0.1.240',
                        enableIPForwarding: false,
                        domainNameLabelPrefix: '',
                        isPrimary: true,
                        dnsServers: [
                            '10.0.1.240',
                            '10.0.1.242'
                        ],
                        subscriptionId: '00000000-0000-1100-AA00-000000000000',
                        resourceGroupName: 'test-rg'
                    },
                    {
                        isPublic: false,
                        subnetName: 'biz',
                        privateIPAllocationMethod: 'Dynamic',
                        publicIPAllocationMethod: 'Static',
                        enableIPForwarding: true,
                        domainNameLabelPrefix: 'testDomainName',
                        isPrimary: false,
                        dnsServers: [],
                        subscriptionId: '00000000-0000-1100-AA00-000000000000',
                        resourceGroupName: 'test-rg'
                    }
                ]
            };

            describe('',() => {
                let param;
                beforeEach(() => {
                    param = _.cloneDeep(settings);
                });

                it('validates that piblic nics have the publicIPAddress correctly referenced in the Ip configuration', () => {
                    param.nics[0].isPublic = true;
                    param.nics = networkInterfaceSettings.merge({settings: param.nics, buildingBlockSettings});
                    let result = networkInterfaceSettings.transform(param.nics, param, vmIndex);

                    expect(result.nics[0].properties.ipConfigurations[0].properties.publicIPAddress.id).toEqual('/subscriptions/00000000-0000-1100-AA00-000000000000/resourceGroups/test-rg/providers/Microsoft.Network/publicIPAddresses/testVM1-nic1-pip');
                    expect(result.nics[1].properties.ipConfigurations[0].properties.hasOwnProperty('publicIPAddress')).toEqual(false);
                });
                it('validates that only one Ip configuration is created for each nic', () => {
                    param.nics[0].isPublic = true;
                    param.nics = networkInterfaceSettings.merge({settings: param.nics, buildingBlockSettings});
                    let result = networkInterfaceSettings.transform(param.nics, param, vmIndex);

                    expect(result.nics[0].properties.ipConfigurations.length).toEqual(1);
                    expect(result.nics[0].properties.ipConfigurations[0].name).toEqual('ipconfig1');
                    expect(result.nics[1].properties.ipConfigurations.length).toEqual(1);
                    expect(result.nics[1].properties.ipConfigurations[0].name).toEqual('ipconfig1');
                });
                it('validates that for private nics, pips array is empty', () => {
                    param.nics = networkInterfaceSettings.merge({settings: param.nics, buildingBlockSettings});
                    let result = networkInterfaceSettings.transform(param.nics, param, vmIndex);

                    expect(result.pips.length).toEqual(0);
                });
                it('validates that pips are named correctly', () => {
                    param.nics[0].isPublic = true;
                    param.nics = networkInterfaceSettings.merge({settings: param.nics, buildingBlockSettings});
                    let result = networkInterfaceSettings.transform(param.nics, param, vmIndex);

                    expect(result.pips[0].name).toEqual('testVM1-nic1-pip');
                });
                it('validates that publicIPAllocationMethod is correctly assigned in the pips', () => {
                    param.nics[0].isPublic = true;
                    param.nics = networkInterfaceSettings.merge({settings: param.nics, buildingBlockSettings});
                    let result = networkInterfaceSettings.transform(param.nics, param, vmIndex);

                    expect(result.pips[0].properties.publicIPAllocationMethod).toEqual('Dynamic');
                });
            });

            it('validates that total number of nics returned equals number of nics in stamp', () => {
                let result = networkInterfaceSettings.transform(settings.nics, settings, vmIndex);

                expect(result.nics.length).toEqual(2);
            });
            it('validates that nics are named appropriately for each VM', () => {
                let result = networkInterfaceSettings.transform(settings.nics, settings, vmIndex);

                expect(result.nics.length).toEqual(2);
                expect(result.nics[0].name).toEqual('testVM1-nic1');
                expect(result.nics[1].name).toEqual('testVM1-nic2');
            });
            it('validates that primary nics are correctly assigned for each VM', () => {
                let result = networkInterfaceSettings.transform(settings.nics, settings, vmIndex);

                expect(result.nics[0].properties.primary).toEqual(true);
                expect(result.nics[1].properties.primary).toEqual(false);
            });
            it('validates that enableIPForwarding is correctly assigned for each VM', () => {
                let result = networkInterfaceSettings.transform(settings.nics, settings, vmIndex);

                expect(result.nics[0].properties.enableIPForwarding).toEqual(false);
                expect(result.nics[1].properties.enableIPForwarding).toEqual(true);
            });
            it('validates that dnsServers are correctly assigned for each VM', () => {
                let result = networkInterfaceSettings.transform(settings.nics, settings, vmIndex);

                expect(result.nics[0].properties.dnsSettings.dnsServers.length).toEqual(2);
                expect(result.nics[0].properties.dnsSettings.appliedDnsServers.length).toEqual(2);
                expect(result.nics[0].properties.dnsSettings.dnsServers[0]).toEqual('10.0.1.240');
                expect(result.nics[0].properties.dnsSettings.dnsServers[1]).toEqual('10.0.1.242');
                expect(result.nics[0].properties.dnsSettings.appliedDnsServers[0]).toEqual('10.0.1.240');
                expect(result.nics[0].properties.dnsSettings.appliedDnsServers[1]).toEqual('10.0.1.242');

                expect(result.nics[1].properties.dnsSettings.dnsServers.length).toEqual(0);
                expect(result.nics[1].properties.dnsSettings.appliedDnsServers.length).toEqual(0);
            });
            it('validates that privateIPAllocationMethod is correctly assigned in the Ip configuration', () => {
                let result = networkInterfaceSettings.transform(settings.nics, settings, vmIndex);

                expect(result.nics[0].properties.ipConfigurations[0].properties.privateIPAllocationMethod).toEqual('Static');
                expect(result.nics[0].properties.ipConfigurations[0].properties.privateIPAddress).toEqual('10.0.1.240');
                expect(result.nics[1].properties.ipConfigurations[0].properties.privateIPAllocationMethod).toEqual('Dynamic');
                expect(result.nics[1].properties.ipConfigurations[0].properties.hasOwnProperty('privateIPAddress')).toEqual(false);
            });
            it('validates that startingIPAddress is correctly computed', () => {
                let result = networkInterfaceSettings.transform(settings.nics, settings, 5);

                expect(result.nics[0].properties.ipConfigurations[0].properties.privateIPAllocationMethod).toEqual('Static');
                expect(result.nics[0].properties.ipConfigurations[0].properties.privateIPAddress).toEqual('10.0.1.245');
            });
            it('validates that startingIPAddress is correctly computed and rolls over to next octet', () => {
                let result = networkInterfaceSettings.transform(settings.nics, settings, 18);

                expect(result.nics[0].properties.ipConfigurations[0].properties.privateIPAllocationMethod).toEqual('Static');
                expect(result.nics[0].properties.ipConfigurations[0].properties.privateIPAddress).toEqual('10.0.2.2');
            });
            it('validates that subnets are correctly referenced in the Ip configuration', () => {
                let result = networkInterfaceSettings.transform(settings.nics, settings, vmIndex);

                expect(result.nics[0].properties.ipConfigurations[0].properties.subnet.id).toEqual('/subscriptions/00000000-0000-1000-A000-000000000000/resourceGroups/test-rg/providers/Microsoft.Network/virtualNetworks/test-vnet/subnets/web');
                expect(result.nics[1].properties.ipConfigurations[0].properties.subnet.id).toEqual('/subscriptions/00000000-0000-1000-A000-000000000000/resourceGroups/test-rg/providers/Microsoft.Network/virtualNetworks/test-vnet/subnets/biz');
            });
            it('validate default pip settings when missing.', () => {
                let settings = [{
                    isPublic: true
                }];

                let mergedValue = networkInterfaceSettings.merge({settings: settings, buildingBlockSettings: buildingBlockSettings});
                expect(mergedValue[0].publicIpAddress.publicIPAllocationMethod).toEqual('Dynamic');
                expect(mergedValue[0].publicIpAddress.publicIPAddressVersion).toEqual('IPv4');
            });
            it('validate settings overrides pip defaults.', () => {
                let settings = [{
                    name: 'test',
                    isPublic: true,
                    publicIPAllocationMethod: 'Static',
                    publicIPAddressVersion: 'IPv6'
                }];

                let mergedValue = networkInterfaceSettings.merge({settings: settings, buildingBlockSettings: buildingBlockSettings});
                expect(mergedValue[0].publicIpAddress.publicIPAllocationMethod).toEqual('Static');
                expect(mergedValue[0].publicIpAddress.publicIPAddressVersion).toEqual('IPv6');
            });
        });
    }
});