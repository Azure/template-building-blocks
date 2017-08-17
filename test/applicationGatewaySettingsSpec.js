describe('applicationGatewaySettings:', () => {
    let rewire = require('rewire');
    let applicationGatewaySettings = rewire('../src/core/applicationGatewaySettings.js');
    let v = require('../src/core/validation.js');
    let _ = require('lodash');

    let buildingBlockSettings = {
        subscriptionId: '00000000-0000-1000-8000-000000000000',
        resourceGroupName: 'test-vnet-rg',
        location: 'westus'
    };

    let fixBlockSettingsAfterMerge = (merged) => {
        //TO DO: would be set by VM or scaleSet, must be fixed if appGateway makes it to a stand alone (root) object
        merged.frontendIPConfigurations[0].publicIpAddress.subscriptionId = '00000000-0000-1000-8000-000000000000';
        merged.frontendIPConfigurations[0].publicIpAddress.resourceGroupName = 'test-vnet-rg';
        merged.frontendIPConfigurations[0].publicIpAddress.location = 'westus';
    };

    describe('valid validations:', () => {
        it('validate valid defaults are applied.', () => {
            let merged = applicationGatewaySettings.merge({
                settings: {},
                buildingBlockSettings: buildingBlockSettings
            });

            fixBlockSettingsAfterMerge(merged);

            let result = v.validate({
                settings: merged,
                validations: applicationGatewaySettings.validations
            });
            expect(result.length).toEqual(0);
        });

        it('sku validations', () => {
            let skuValidations = applicationGatewaySettings.__get__('skuValidations');
            let testSettings = {
                sku: {
                    name: 'Standard_Small',
                    tier: 'Standard',
                    capacity: 2
                }
            };
            let result = v.validate({
                settings: testSettings.sku,
                validations: skuValidations
            });
            expect(result.length).toEqual(0);
        });
    });
    describe('validations', () => {
        let skuValidations = applicationGatewaySettings.__get__('skuValidations');

        let mergeAndValidate = (settings, buildingBlockSettings) => {
            let merged = applicationGatewaySettings.merge({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });
            //TO DO: would be set by VM or scaleSet, must be fixed if appGateway makes it to a stand alone (root) object
            fixBlockSettingsAfterMerge(merged);
            return v.validate({
                settings: merged,
                validations: applicationGatewaySettings.validations
            });
        };

        let testSettings = {
            sku: {
                name: 'Standard_Small',
                tier: 'Standard',
                capacity: 2
            },
            frontendIPConfigurations: [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public'
                }
            ],
            httpListeners: [
                {
                    name: 'appGatewayHttpListener',
                    frontendIPConfigurationName: 'appGatewayFrontendIP',
                    frontendPortName: 'appGatewayFrontendPort',
                    protocol: 'Http',
                    requireServerNameIndication: false
                }
            ],
            backendHttpSettingsCollection: [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 80,
                    protocol: 'Https',
                    cookieBasedAffinity: 'Disabled',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: true,
                    requestTimeout: 30,
                    probeName: 'p1'
                }
            ],
            backendAddressPools: [
                {
                    name: 'appGatewayBackendPool',
                    backendAddresses: [
                        {
                            fqdn: 'www.contoso.com'
                        }
                    ]
                }
            ],
            urlPathMaps: [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: ['/path'],
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ],
            requestRoutingRules: [
                {
                    name: 'rule1',
                    ruleType: 'Basic',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ],
            frontendPorts: [
                {
                    name: 'appGatewayFrontendPort',
                    port: 80
                }
            ]
        };
        let settings;
        beforeEach(() => {
            settings = _.cloneDeep(testSettings);
        });

        it('sku name validation', () => {
            settings.sku.name = 'invalid';
            let result = v.validate({
                settings: settings.sku,
                validations: skuValidations
            });
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.name');
        });
        it('sku tier validation', () => {
            settings.sku.tier = 'invalid';
            let result = v.validate({
                settings: settings.sku,
                validations: skuValidations
            });
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.tier');
        });

        it('gatewayIPConfigurations subnet must be provided', () => {
            settings.gatewayIPConfigurations = [ { name: 'appGatewayIpConfig' } ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.gatewayIPConfigurations[0].subnetName');
        });
        it('frontendIPConfigurations cannot have 2 internal', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Internal'
                },
                {
                    name: 'testfec',
                    applicationGatewayType: 'Internal',
                    internalApplicationGatewaySettings: {
                        subnetName: 'biz'
                    }
                }
            ];
            let merged = applicationGatewaySettings.merge({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });
            let result = v.validate({
                settings: merged,
                validations: applicationGatewaySettings.validations
            });
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.frontendIPConfigurations');
        });
        it('frontendIPConfigurations cannot have 2 public', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public'
                },
                {
                    name: 'testfec',
                    applicationGatewayType: 'Public'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.frontendIPConfigurations');
        });
        it('frontendIPConfigurations cannot have more than 2', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public'
                },
                {
                    name: 'testfec',
                    applicationGatewayType: 'Internal',
                    internalApplicationGatewaySettings: {
                        subnetName: 'biz'
                    }
                },
                {
                    name: 'sdfdsf',
                    applicationGatewayType: 'Public'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.frontendIPConfigurations');
        });
        it('valid frontendIPConfigurations', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public'
                },
                {
                    name: 'testfec',
                    applicationGatewayType: 'Internal',
                    internalApplicationGatewaySettings: {
                        subnetName: 'biz'
                    }
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('frontendIPConfigurations can have only one internal', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Internal',
                    internalApplicationGatewaySettings: {
                        subnetName: 'biz'
                    }
                }
            ];
            let merged = applicationGatewaySettings.merge({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });
            let result = v.validate({
                settings: merged,
                validations: applicationGatewaySettings.validations
            });
            expect(result.length).toEqual(0);
        });
        it('frontendIPConfigurations can have only one public', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('valid frontendPorts', () => {
            settings.frontendPorts = [
                {
                    name: 'appGatewayFrontendPort',
                    port: 80
                },
                {
                    name: 'list1-http1',
                    port: 81
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('frontendPorts port must be between 0 and 65535', () => {
            settings.frontendPorts = [
                {
                    name: 'appGatewayFrontendPort',
                    port: 187569
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.frontendPorts[0].port');
        });
        it('valid backendHttpSettingsCollection port must be between 0 and 65535', () => {
            settings.backendHttpSettingsCollection = [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 80,
                    protocol: 'Http',
                    cookieBasedAffinity: 'Disabled',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: true,
                    requestTimeout: 30,
                    probeName: 'p1'
                },
                {
                    name: 'test-settings',
                    port: 80,
                    protocol: 'Http',
                    cookieBasedAffinity: 'Enabled',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: true,
                    requestTimeout: 20,
                    probeName: 'p2'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('backendHttpSettingsCollection port must be between 0 and 65535', () => {
            settings.backendHttpSettingsCollection = [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 800234,
                    protocol: 'Http',
                    cookieBasedAffinity: 'Disabled',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: true,
                    requestTimeout: 30,
                    probeName: 'p1'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.backendHttpSettingsCollection[0].port');
        });
        it('backendHttpSettingsCollection protocol must be Http or Https', () => {
            settings.backendHttpSettingsCollection = [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 80,
                    protocol: 'invalid',
                    cookieBasedAffinity: 'Disabled',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: true,
                    requestTimeout: 30,
                    probeName: 'p1'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.backendHttpSettingsCollection[0].protocol');
        });
        it('backendHttpSettingsCollection probeEnabled must be boolean', () => {
            settings.backendHttpSettingsCollection = [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 80,
                    protocol: 'Https',
                    cookieBasedAffinity: 'Disabled',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: 'invalid',
                    requestTimeout: 30,
                    probeName: 'p1'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.backendHttpSettingsCollection[0].probeEnabled');
        });
        it('backendHttpSettingsCollection probeEnabled must be boolean', () => {
            settings.backendHttpSettingsCollection = [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 80,
                    protocol: 'Https',
                    cookieBasedAffinity: 'Disabled',
                    pickHostNameFromBackendAddress: 'invalid',
                    probeEnabled: true,
                    requestTimeout: 30,
                    probeName: 'p1'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.backendHttpSettingsCollection[0].pickHostNameFromBackendAddress');
        });
        it('backendHttpSettingsCollection cookieBasedAffinity must be enabled or disabled', () => {
            settings.backendHttpSettingsCollection = [
                {
                    name: 'appGatewayBackendHttpSettings',
                    port: 80,
                    protocol: 'Https',
                    cookieBasedAffinity: 'invalid',
                    pickHostNameFromBackendAddress: false,
                    probeEnabled: true,
                    requestTimeout: 30,
                    probeName: 'p1'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.backendHttpSettingsCollection[0].cookieBasedAffinity');
        });

        it('valid httpListeners', () => {
            settings.httpListeners = [
                {
                    name: 'appGatewayHttpListener',
                    frontendIPConfigurationName: 'appGatewayFrontendIP',
                    frontendPortName: 'appGatewayFrontendPort',
                    protocol: 'Http',
                    requireServerNameIndication: false
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('httpListeners frontendIPConfigurationName must match one in frontendIPConfigurations', () => {
            settings.frontendIPConfigurations = [
                {
                    name: 'appGatewayFrontendIP',
                    applicationGatewayType: 'Public'
                }
            ];
            settings.httpListeners = [
                {
                    name: 'appGatewayHttpListener',
                    frontendIPConfigurationName: 'invalid',
                    frontendPortName: 'appGatewayFrontendPort',
                    protocol: 'Http',
                    requireServerNameIndication: false
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.httpListeners[0].frontendIPConfigurationName');
        });
        it('httpListeners frontendPortName must match one in frontendPorts', () => {
            settings.httpListeners = [
                {
                    name: 'appGatewayHttpListener',
                    frontendIPConfigurationName: 'appGatewayFrontendIP',
                    frontendPortName: 'invalid',
                    protocol: 'Http',
                    requireServerNameIndication: false
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.httpListeners[0].frontendPortName');
        });
        it('httpListeners requireServerNameIndication must be boolean', () => {
            settings.httpListeners = [
                {
                    name: 'appGatewayHttpListener',
                    frontendIPConfigurationName: 'appGatewayFrontendIP',
                    frontendPortName: 'appGatewayFrontendPort',
                    protocol: 'Http',
                    requireServerNameIndication: 'invalid'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.httpListeners[0].requireServerNameIndication');
        });
        it('httpListeners protocol must be Http or Https', () => {
            settings.httpListeners = [
                {
                    name: 'appGatewayHttpListener',
                    frontendIPConfigurationName: 'appGatewayFrontendIP',
                    frontendPortName: 'appGatewayFrontendPort',
                    protocol: 'invalid',
                    requireServerNameIndication: false
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.httpListeners[0].protocol');
        });

        it('urlPathMaps valid settings', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: [
                                '/bar'
                            ],
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('urlPathMaps invalid defaultBackendAddressPoolName', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'invalid',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: [
                                '/bar'
                            ],
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].defaultBackendAddressPoolName');
        });
        it('urlPathMaps invalid defaultBackendHttpSettingName', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'invalid',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: [
                                '/bar'
                            ],
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].defaultBackendHttpSettingName');
        });
        it('urlPathMaps invalid backendAddressPoolName', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: [
                                '/bar'
                            ],
                            backendAddressPoolName: 'invalid',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].pathRules[0].backendAddressPoolName');
        });
        it('urlPathMaps invalid backendHttpSettingName', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: [
                                '/bar'
                            ],
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'invalid'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].pathRules[0].backendHttpSettingName');
        });
        it('urlPathMaps pathRules cannot be undefined', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].pathRules');
        });
        it('urlPathMaps pathRules cannot be empty', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: []
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].pathRules');
        });
        it('urlPathMaps paths cannot be undefined', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].pathRules');
        });
        it('urlPathMaps at leas one path must be specified', () => {
            settings.urlPathMaps = [
                {
                    name: 'pb-rule1',
                    defaultBackendAddressPoolName: 'appGatewayBackendPool',
                    defaultBackendHttpSettingName: 'appGatewayBackendHttpSettings',
                    pathRules: [
                        {
                            name: 'p2',
                            paths: [],
                            backendAddressPoolName: 'appGatewayBackendPool',
                            backendHttpSettingName: 'appGatewayBackendHttpSettings'
                        }
                    ]
                }
            ];

            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.urlPathMaps[0].pathRules');
        });
        it('valid requestRoutingRules', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'Basic',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(0);
        });
        it('requestRoutingRules name must be specified', () => {
            settings.requestRoutingRules = [
                {
                    ruleType: 'Basic',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.requestRoutingRules[0].name');
        });
        it('requestRoutingRules a valid httpListenerName must be specified', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'Basic',
                    httpListenerName: 'invalid',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.requestRoutingRules[0].httpListenerName');
        });
        it('requestRoutingRules a valid backendAddressPoolName must be specified', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'Basic',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'invalid',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.requestRoutingRules[0].backendAddressPoolName');
        });
        it('requestRoutingRules a valid backendHttpSettingName must be specified', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'Basic',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'invalid'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.requestRoutingRules[0].backendHttpSettingName');
        });
        it('requestRoutingRules ruleType must be Basic or PathBasedRouting', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'invalid',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.requestRoutingRules[0].ruleType');
        });
        it('requestRoutingRules when ruleType is PathBasedRouting urlPathMapName must be specified', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'PathBasedRouting',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings'
                }
            ];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(1);
            expect(result[0].name).toEqual('.requestRoutingRules[0].urlPathMapName');
        });

        it('requestRoutingRules when ruleType is PathBasedRouting urlPathMaps must be specified', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'PathBasedRouting',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings',
                    urlPathMapName: 'foo'
                }
            ];
            delete settings.urlPathMaps;
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(2);
            expect(result[0].name).toEqual('.requestRoutingRules[0].ruleType');
        });
        it('requestRoutingRules when ruleType is PathBasedRouting urlPathMaps must be at least one', () => {
            settings.requestRoutingRules = [
                {
                    name: 'rule1',
                    ruleType: 'PathBasedRouting',
                    httpListenerName: 'appGatewayHttpListener',
                    backendAddressPoolName: 'appGatewayBackendPool',
                    backendHttpSettingName: 'appGatewayBackendHttpSettings',
                    urlPathMapName: 'foo'
                }
            ];
            settings.urlPathMaps = [];
            let result = mergeAndValidate(settings, buildingBlockSettings);
            expect(result.length).toEqual(2);
            expect(result[0].name).toEqual('.requestRoutingRules[0].ruleType');
        });

    });

    if (global.testConfiguration.runTransform) {
        describe('process:', () => {

        });
    }
});