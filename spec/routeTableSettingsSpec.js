describe('routeTableSettings', () => {
    let rewire = require('rewire');
    let routeTableSettings = rewire('../core/routeTableSettings.js');
    let _ = require('lodash');
    let validation = require('../core/validation.js');

    describe('isValidNextHop', () => {
        let isValidNextHop = routeTableSettings.__get__('isValidNextHop');

        it('undefined', () => {
            expect(isValidNextHop()).toEqual(false);
        });

        it('null', () => {
            expect(isValidNextHop(null)).toEqual(false);
        });

        it('empty', () => {
            expect(isValidNextHop('')).toEqual(false);
        });

        it('whitespace', () => {
            expect(isValidNextHop(' ')).toEqual(false);
        });

        it('invalid spacing', () => {
            expect(isValidNextHop(' VirtualNetworkGateway ')).toEqual(false);
        });

        it('invalid casing', () => {
            expect(isValidNextHop('virtualnetworkgateway')).toEqual(false);
        });

        it('invalid value', () => {
            expect(isValidNextHop('NOT_VALID')).toEqual(false);
        });

        it('VirtualNetworkGateway', () => {
            expect(isValidNextHop('VirtualNetworkGateway')).toEqual(true);
        });

        it('VnetLocal', () => {
            expect(isValidNextHop('VnetLocal')).toEqual(true);
        });

        it('Internet', () => {
            expect(isValidNextHop('Internet')).toEqual(true);
        });

        it('HyperNetGateway', () => {
            expect(isValidNextHop('HyperNetGateway')).toEqual(true);
        });

        it('None', () => {
            expect(isValidNextHop('None')).toEqual(true);
        });

        it('IPAddress', () => {
            expect(isValidNextHop('127.0.0.1')).toEqual(true);
        });
    });

    describe('validate', () => {
        let merge = routeTableSettings.__get__('merge');
        let validate = routeTableSettings.__get__('validate');
        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-vnet-rg',
            location: 'westus'
        };
        let testSetttings = {
            name: 'my-route-table',
            virtualNetworks: [
                {
                    name: 'my-virtual-network',
                    subnets: [
                        'biz',
                        'web'
                    ]
                }
            ],
            routes: [
                {
                    name: 'route1',
                    addressPrefix: '10.0.1.0/24',
                    nextHop: 'VnetLocal'
                },
                {
                    name: 'route2',
                    addressPrefix: '10.0.2.0/24',
                    nextHop: '192.168.1.1'
                }
            ],
            tags: {}
        };

        let settings = _.cloneDeep(testSetttings);
        beforeEach(() => {
            settings = _.cloneDeep(testSetttings);
        });

        it('vnet location cannot be different', () => {
            settings.virtualNetworks[0].location = 'centralus';
            settings = _.castArray(settings);
            let merged = merge({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });
            let errors = validate(merged);
            expect(errors.length).toEqual(1);
        });
        it('vnet subscription cannot be different', () => {
            settings.virtualNetworks[0].subscriptionId = '00000000-0000-1000-A000-000000000000';
            settings = _.castArray(settings);
            let merged = merge({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });
            let errors = validate(merged);
            expect(errors.length).toEqual(1);
        });
        it('empty vnet validation is valid', () => {
            settings.virtualNetworks = [];
            let merged = merge({
                settings: settings,
                buildingBlockSettings: buildingBlockSettings
            });
            let errors = validate(merged);
            expect(errors.length).toEqual(0);
        });
    });

    describe('validations', () => {
        let routeTableSettingsValidations = routeTableSettings.__get__('routeTableSettingsValidations');

        describe('virtualNetworkValidations', () => {
            let virtualNetworkValidations = routeTableSettingsValidations.virtualNetworks;
            let virtualNetworkSettings = [
                {
                    name: 'my-virtual-network',
                    subnets: ['web', 'biz']
                }
            ];

            it('empty array', () => {
                let errors = validation.validate({
                    settings: [],
                    validations: virtualNetworkValidations
                });

                expect(errors.length).toEqual(0);
            });

            describe('', () => {
                let settings;
                beforeEach(() => {
                    settings = _.cloneDeep(virtualNetworkSettings);
                });

                it('name undefined', () => {
                    delete settings[0].name;

                    let errors = validation.validate({
                        settings: settings,
                        validations: virtualNetworkValidations
                    });

                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('[0].name');
                });

                it('subnets undefined', () => {
                    delete settings[0].subnets;

                    let errors = validation.validate({
                        settings: settings,
                        validations: virtualNetworkValidations
                    });

                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('[0].subnets');
                });

                it('subnets empty', () => {
                    settings[0].subnets = [];

                    let errors = validation.validate({
                        settings: settings,
                        validations: virtualNetworkValidations
                    });

                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('[0].subnets');
                });

                it('subnets empty string', () => {
                    settings[0].subnets = [''];

                    let errors = validation.validate({
                        settings: settings,
                        validations: virtualNetworkValidations
                    });

                    expect(errors.length).toEqual(1);
                    expect(errors[0].name).toEqual('[0].subnets[0]');
                });
            });
        });

        describe('routeValidations', () => {
            let routeValidations = routeTableSettingsValidations.routes;

            let valid = {
                name: 'name',
                addressPrefix: '10.0.0.1/24',
                nextHop: 'VirtualNetworkGateway'
            };

            let invalid;
            beforeEach(() => {
                invalid = _.cloneDeep(valid);
            });

            it('name undefined', () => {
                delete invalid.name;
                let errors = validation.validate({
                    settings: [invalid],
                    validations: routeValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].name');
            });

            it('addressPrefix undefined', () => {
                delete invalid.addressPrefix;
                let errors = validation.validate({
                    settings: [invalid],
                    validations: routeValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].addressPrefix');
            });

            it('nextHop undefined', () => {
                delete invalid.nextHop;
                let errors = validation.validate({
                    settings: [invalid],
                    validations: routeValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('[0].nextHop');
            });
        });

        describe('routeTableSettingsValidations', () => {
            let routeTableSettings = {
                name: 'my-route-table',
                virtualNetworks: [
                    {
                        name: 'my-virtual-network',
                        subnets: [
                            'biz',
                            'web'
                        ]
                    }
                ],
                routes: [
                    {
                        name: 'route1',
                        addressPrefix: '10.0.1.0/24',
                        nextHop: 'VnetLocal'
                    },
                    {
                        name: 'route2',
                        addressPrefix: '10.0.2.0/24',
                        nextHop: '192.168.1.1'
                    }
                ],
                tags: {}
            };

            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(routeTableSettings);
            });

            it('name undefined', () => {
                delete settings.name;
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.name');
            });

            it('virtualNetwork empty', () => {
                settings.virtualNetworks = [];
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(0);
            });

            it('routes undefined', () => {
                delete settings.routes;
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.routes');
            });

            it('routes null', () => {
                settings.routes = null;
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.routes');
            });

            it('routes empty', () => {
                settings.routes = [];
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.routes');
            });

            it('duplicate route name', () => {
                settings.routes[1].name = 'route1';
                let errors = validation.validate({
                    settings: settings,
                    validations: routeTableSettingsValidations
                });

                expect(errors.length).toEqual(1);
                expect(errors[0].name).toEqual('.routes');
            });
        });
    });

    describe('merge', () => {
        let merge = routeTableSettings.__get__('merge');
        let routeTableSettingsDefaults = routeTableSettings.__get__('ROUTETABLE_SETTINGS_DEFAULTS');

        let routeTable = {
            name: 'my-route-table',
            virtualNetworks: [
                {
                    name: 'my-virtual-network',
                    subnets: [
                        'biz',
                        'web'
                    ]
                }
            ],
            routes: [
                {
                    name: 'route1',
                    addressPrefix: '10.0.1.0/24',
                    nextHopType: 'VnetLocal'
                },
                {
                    name: 'route2',
                    addressPrefix: '10.0.2.0/24',
                    nextHopType: 'VirtualAppliance',
                    nextHopIpAddress: '192.168.1.1'
                }
            ]
        };

        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg',
            location: 'westus2'
        };

        it('defaults merged', () => {
            let result = merge({
                settings: {},
                buildingBlockSettings: buildingBlockSettings
            });

            expect(result.virtualNetworks.length).toEqual(0);
            expect(result.routes.length).toEqual(routeTableSettingsDefaults.routes.length);
            expect(result.tags).toEqual(routeTableSettingsDefaults.tags);
        });

        describe('', () => {
            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(routeTable);
            });

            it('virtualNetworks undefined', () => {
                delete settings.virtualNetworks;
                let merged = merge({settings, buildingBlockSettings});
                expect(merged.virtualNetworks.length).toBe(0);
            });

            it('virtualNetworks null', () => {
                settings.virtualNetworks = null;
                let merged = merge({settings, buildingBlockSettings});
                expect(merged.virtualNetworks.length).toBe(0);
            });

            it('virtualNetworks present', () => {
                let merged = merge({settings, buildingBlockSettings});
                expect(merged.virtualNetworks[0].name).toBe('my-virtual-network');
            });

            it('routes undefined', () => {
                delete settings.routes;
                let merged = merge({settings, buildingBlockSettings});
                expect(merged.routes.length).toBe(0);
            });

            it('routes null', () => {
                settings.routes = null;
                let merged = merge({settings, buildingBlockSettings});
                expect(merged.routes.length).toBe(0);
            });

            it('routes present', () => {
                let merged = merge({settings, buildingBlockSettings});
                expect(merged.routes[0].name).toBe('route1');
            });

            it('setupResources', () => {
                let result = merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.location).toEqual(buildingBlockSettings.location);

                expect(result.virtualNetworks[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.virtualNetworks[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.virtualNetworks[0].location).toEqual(buildingBlockSettings.location);
            });
        });
    });

    describe('userDefaults', () => {
        let merge = routeTableSettings.__get__('merge');
        let routeTableSettingsDefaults = routeTableSettings.__get__('ROUTETABLE_SETTINGS_DEFAULTS');

        let routeTable = {
            name: 'my-route-table',
            virtualNetworks: [
                {
                    name: 'my-virtual-network',
                    subnets: [
                        'biz',
                        'web'
                    ]
                }
            ],
            routes: [
                {
                    name: 'route1',
                    addressPrefix: '10.0.1.0/24',
                    nextHopType: 'VnetLocal'
                },
                {
                    name: 'route2',
                    addressPrefix: '10.0.2.0/24',
                    nextHopType: 'VirtualAppliance',
                    nextHopIpAddress: '192.168.1.1'
                }
            ]
        };

        let buildingBlockSettings = {
            subscriptionId: '00000000-0000-1000-8000-000000000000',
            resourceGroupName: 'test-rg',
            location: 'westus2'
        };

        it('defaults merged with empty user-defaults', () => {
            let result = merge({
                settings: {},
                buildingBlockSettings: buildingBlockSettings,
                defaultSettings: {}
            });

            expect(result.virtualNetworks.length).toEqual(0);
            expect(result.routes.length).toEqual(routeTableSettingsDefaults.routes.length);
            expect(result.tags).toEqual(routeTableSettingsDefaults.tags);
        });

        describe('', () => {
            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(routeTable);
            });

            it('virtualNetworks undefined with user-defaults', () => {
                delete settings.virtualNetworks;
                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: {
                        name: 'default-route-table',
                    }});
                expect(merged.name).toBe(settings.name);
                expect(merged.virtualNetworks.length).toBe(0);
            });

            it('virtualNetworks null with user-defaults', () => {
                settings.virtualNetworks = null;
                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: {
                        name: 'default-route-table',
                        virtualNetworks: null
                    }});
                expect(merged.virtualNetworks.length).toBe(0);
            });

            it('virtualNetworks present with user-defaults', () => {
                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: {
                        name: 'default-route-table',
                        virtualNetworks: [
                            {
                                name: 'default-virtual-network',
                                subnets: [
                                    'biz',
                                    'web'
                                ]
                            }
                        ]
                    }});
                expect(merged.virtualNetworks.length).toBe(1);
                expect(merged.virtualNetworks[0].name).toBe('my-virtual-network');
            });

            it('routes undefined with user-defaults', () => {
                delete settings.routes;
                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: {
                        name: 'default-route-table'
                    }});
                expect(merged.routes.length).toBe(0);
            });

            it('routes null with user-defaults', () => {
                settings.routes = null;
                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: {
                        name: 'default-route-table',
                        routes: null
                    }});
                expect(merged.routes.length).toBe(0);
            });

            it('routes present with user-defaults', () => {
                let merged = merge({
                    settings,
                    buildingBlockSettings,
                    defaultSettings: {
                        name: 'default-route-table',
                        routes: [
                            {
                                name: 'defaultroute1',
                                addressPrefix: '10.0.1.0/24',
                                nextHopType: 'VnetLocal'
                            },
                            {
                                name: 'defaultroute2',
                                addressPrefix: '10.0.2.0/24',
                                nextHopType: 'VirtualAppliance',
                                nextHopIpAddress: '192.168.1.1'
                            }
                        ]
                    }});
                expect(merged.routes.length).toBe(2);
                expect(merged.routes[0].name).toBe('route1');
                expect(merged.routes[1].name).toBe('route2');
            });

            it('setupResources with empty user-defaults', () => {
                let result = merge({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings,
                    defaultSettings: {}
                });

                expect(result.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.location).toEqual(buildingBlockSettings.location);

                expect(result.virtualNetworks[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.virtualNetworks[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.virtualNetworks[0].location).toEqual(buildingBlockSettings.location);
            });
        });
    });

    if (global.testConfiguration.runTransform) {
        describe('transform', () => {
            let routeTable = [
                {
                    name: 'my-route-table',
                    virtualNetworks: [
                        {
                            name: 'my-virtual-network',
                            subnets: [
                                'biz',
                                'web'
                            ]
                        }
                    ],
                    routes: [
                        {
                            name: 'route1',
                            addressPrefix: '10.0.1.0/24',
                            nextHop: 'VnetLocal'
                        },
                        {
                            name: 'route2',
                            addressPrefix: '10.0.2.0/24',
                            nextHop: '192.168.1.1'
                        }
                    ],
                    tags: {}
                }
            ];

            let buildingBlockSettings = {
                subscriptionId: '00000000-0000-1000-8000-000000000000',
                resourceGroupName: 'test-rg',
                location: 'westus'
            };

            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(routeTable);
            });

            it('single route table', () => {
                let result = routeTableSettings.process({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result.resourceGroups.length).toEqual(1);
                expect(result.resourceGroups[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroups[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.resourceGroups[0].location).toEqual(buildingBlockSettings.location);

                expect(result.parameters.routeTables.length).toEqual(1);
                let settingsResult = result.parameters.routeTables[0];
                expect(settingsResult.hasOwnProperty('id')).toEqual(true);
                expect(settingsResult.name).toEqual(settings[0].name);
                expect(settingsResult.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(settingsResult.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(settingsResult.location).toEqual(buildingBlockSettings.location);

                expect(settingsResult.properties.routes.length).toEqual(2);
                let routesResult = settingsResult.properties.routes;
                expect(routesResult[0].name).toEqual(settings[0].routes[0].name);
                expect(routesResult[0].properties.addressPrefix).toEqual(settings[0].routes[0].addressPrefix);
                expect(routesResult[0].properties.nextHopType).toEqual(settings[0].routes[0].nextHop);
                expect(routesResult[1].name).toEqual(settings[0].routes[1].name);
                expect(routesResult[1].properties.addressPrefix).toEqual(settings[0].routes[1].addressPrefix);
                expect(routesResult[1].properties.nextHopType).toEqual('VirtualAppliance');
                expect(routesResult[1].properties.nextHopIpAddress).toEqual(settings[0].routes[1].nextHop);

                expect(result.parameters.subnets.length).toEqual(2);
                expect(result.parameters.subnets[0].id.endsWith('my-virtual-network/subnets/biz')).toEqual(true);
                expect(result.parameters.subnets[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.parameters.subnets[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.parameters.subnets[0].location).toEqual(buildingBlockSettings.location);
                expect(result.parameters.subnets[0].virtualNetwork).toEqual(settings[0].virtualNetworks[0].name);
                expect(result.parameters.subnets[0].name).toEqual(settings[0].virtualNetworks[0].subnets[0]);
                expect(result.parameters.subnets[1].id.endsWith('my-virtual-network/subnets/web')).toEqual(true);
                expect(result.parameters.subnets[1].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.parameters.subnets[1].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.parameters.subnets[0].location).toEqual(buildingBlockSettings.location);
                expect(result.parameters.subnets[1].virtualNetwork).toEqual(settings[0].virtualNetworks[0].name);
                expect(result.parameters.subnets[1].name).toEqual(settings[0].virtualNetworks[0].subnets[1]);
            });

            it('route table with no virtual networks', () => {
                delete settings[0].virtualNetworks;
                let result = routeTableSettings.process({
                    settings: settings,
                    buildingBlockSettings: buildingBlockSettings
                });

                expect(result.resourceGroups.length).toEqual(1);
                expect(result.resourceGroups[0].subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(result.resourceGroups[0].resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(result.resourceGroups[0].location).toEqual(buildingBlockSettings.location);

                expect(result.parameters.routeTables.length).toBe(1);
                let settingsResult = result.parameters.routeTables[0];
                expect(settingsResult.hasOwnProperty('id')).toBe(true);
                expect(settingsResult.name).toEqual(settings[0].name);
                expect(settingsResult.resourceGroupName).toEqual(buildingBlockSettings.resourceGroupName);
                expect(settingsResult.subscriptionId).toEqual(buildingBlockSettings.subscriptionId);
                expect(settingsResult.location).toEqual(buildingBlockSettings.location);

                expect(settingsResult.properties.routes.length).toBe(2);
                let routesResult = settingsResult.properties.routes;
                expect(routesResult[0].name).toEqual(settings[0].routes[0].name);
                expect(routesResult[0].properties.addressPrefix).toEqual(settings[0].routes[0].addressPrefix);
                expect(routesResult[0].properties.nextHopType).toEqual(settings[0].routes[0].nextHop);
                expect(routesResult[1].name).toEqual(settings[0].routes[1].name);
                expect(routesResult[1].properties.addressPrefix).toEqual(settings[0].routes[1].addressPrefix);
                expect(routesResult[1].properties.nextHopType).toEqual('VirtualAppliance');
                expect(routesResult[1].properties.nextHopIpAddress).toEqual(settings[0].routes[1].nextHop);

                expect(result.parameters.subnets.length).toEqual(0);
            });

            it('test settings validation errors', () => {
                delete settings[0].name;
                expect(() => {
                    routeTableSettings.process({
                        settings: settings,
                        buildingBlockSettings: buildingBlockSettings
                    });
                }).toThrow();
            });

            it('test building blocks validation errors', () => {
                let bbSettings = _.cloneDeep(buildingBlockSettings);
                delete bbSettings.subscriptionId;
                expect(() => {
                    routeTableSettings.process({
                        settings: settings,
                        buildingBlockSettings: bbSettings
                    });
                }).toThrow();
            });
        });
    }
});