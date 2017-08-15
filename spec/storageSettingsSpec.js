describe('storageSettings:', () => {
    let rewire = require('rewire');
    let storageSettings = rewire('../core/storageSettings.js');
    let _ = require('lodash');
    let v = require('../core/validation.js');

    let storageParams = {
        nameSuffix: 'ST',
        count: 2,
        skuType: 'Premium_LRS',
        accounts: ['vm7tt2e6prktm3lst1', 'vm7tt2e6prktm3lst2'],
        managed: false,
        supportsHttpsTrafficOnly: true,
        encryptBlobStorage: true,
        encryptFileStorage: true,
        keyVaultProperties: {
            keyName: 'testkeyname',
            keyVersion: 'testkeyversion',
            keyVaultUri: 'testkeyvaulturi'
        },
        subscriptionId: '3b518fac-e5c8-4f59-8ed5-d70b626f8e10',
        resourceGroupName: 'rs-test6-rg'
    };

    let diagStorageParams = {
        nameSuffix: 'DIAG',
        count: 2,
        skuType: 'Standard_LRS',
        accounts: ['vm7tt2e6prktm3lst1', 'vm7tt2e6prktm3lst2'],
        managed: false,
        supportsHttpsTrafficOnly: true,
        encryptBlobStorage: true,
        encryptFileStorage: true,
        keyVaultProperties: {
            keyName: 'testkeyname',
            keyVersion: 'testkeyversion',
            keyVaultUri: 'testkeyvaulturi'
        },
        subscriptionId: '3b518fac-e5c8-4f59-8ed5-d70b626f8e10',
        resourceGroupName: 'rs-test6-rg'
    };
    describe('merge:', () => {
        describe('storage accounts merge:', () => {
            it('validates valid defaults are applied for storage accounts.', () => {
                let settings = {};

                let mergedValue = storageSettings.storageMerge({settings});
                expect(mergedValue.count).toEqual(1);
                expect(mergedValue.nameSuffix).toEqual('st');
                expect(mergedValue.skuType).toEqual('Premium_LRS');
                expect(mergedValue.managed).toEqual(true);
                expect(mergedValue.supportsHttpsTrafficOnly).toEqual(false);
                expect(mergedValue.encryptBlobStorage).toEqual(false);
                expect(mergedValue.encryptFileStorage).toEqual(false);
                expect(Object.keys(mergedValue.keyVaultProperties).length).toEqual(0);
            });
            it('validates defaults do not override settings.', () => {
                let settings = _.cloneDeep(storageParams);

                let mergedValue = storageSettings.storageMerge({settings});
                expect(mergedValue.count).toEqual(2);
                expect(mergedValue.nameSuffix).toEqual('ST');
                expect(mergedValue.skuType).toEqual('Premium_LRS');
                expect(mergedValue.accounts.length).toEqual(2);
                expect(mergedValue.managed).toEqual(false);
                expect(mergedValue.supportsHttpsTrafficOnly).toEqual(true);
                expect(mergedValue.encryptBlobStorage).toEqual(true);
                expect(mergedValue.encryptFileStorage).toEqual(true);
                expect(Object.keys(mergedValue.keyVaultProperties).length).toEqual(3);
                expect(mergedValue.keyVaultProperties.keyName).toEqual('testkeyname');
                expect(mergedValue.keyVaultProperties.keyVersion).toEqual('testkeyversion');
                expect(mergedValue.keyVaultProperties.keyVaultUri).toEqual('testkeyvaulturi');
            });
            it('validates additional properties in settings are not removed.', () => {
                let settings = {
                    name1: 'test'
                };

                let mergedValue = storageSettings.storageMerge({settings});
                expect(mergedValue.hasOwnProperty('name1')).toEqual(true);
                expect(mergedValue.name1).toEqual('test');
            });
            it('validates missing properties in settings are picked up from defaults.', () => {
                let settings = {
                    skuType: 'Standard_LRS',
                    managed: false,
                    supportsHttpsTrafficOnly: true
                };

                let mergedValue = storageSettings.storageMerge({settings});
                expect(mergedValue.hasOwnProperty('count')).toEqual(true);
                expect(mergedValue.count).toEqual(1);
                expect(mergedValue.nameSuffix).toEqual('st');
                expect(mergedValue.encryptBlobStorage).toEqual(false);
                expect(mergedValue.encryptFileStorage).toEqual(false);
                expect(Object.keys(mergedValue.keyVaultProperties).length).toEqual(0);
            });
        });
        describe('diagnostic storage accounts merge:', () => {
            it('validates valid defaults are applied for storage accounts.', () => {
                let settings = {};

                let mergedValue = storageSettings.diagnosticMerge({settings});
                expect(mergedValue.count).toEqual(1);
                expect(mergedValue.nameSuffix).toEqual('diag');
                expect(mergedValue.skuType).toEqual('Standard_LRS');
                expect(mergedValue.managed).toEqual(false);
                expect(mergedValue.supportsHttpsTrafficOnly).toEqual(false);
                expect(mergedValue.encryptBlobStorage).toEqual(false);
                expect(mergedValue.encryptFileStorage).toEqual(false);
                expect(Object.keys(mergedValue.keyVaultProperties).length).toEqual(0);
            });
            it('validates defaults do not override settings.', () => {
                let settings = _.cloneDeep(diagStorageParams);

                let mergedValue = storageSettings.diagnosticMerge({settings});
                expect(mergedValue.count).toEqual(2);
                expect(mergedValue.nameSuffix).toEqual('DIAG');
                expect(mergedValue.skuType).toEqual('Standard_LRS');
                expect(mergedValue.managed).toEqual(false);
                expect(mergedValue.supportsHttpsTrafficOnly).toEqual(true);
                expect(mergedValue.encryptBlobStorage).toEqual(true);
                expect(mergedValue.encryptFileStorage).toEqual(true);
                expect(Object.keys(mergedValue.keyVaultProperties).length).toEqual(3);
                expect(mergedValue.keyVaultProperties.keyName).toEqual('testkeyname');
                expect(mergedValue.keyVaultProperties.keyVersion).toEqual('testkeyversion');
                expect(mergedValue.keyVaultProperties.keyVaultUri).toEqual('testkeyvaulturi');
            });
            it('validates additional properties in settings are not removed.', () => {
                let settings = {
                    name1: 'test'
                };

                let mergedValue = storageSettings.diagnosticMerge({settings});
                expect(mergedValue.hasOwnProperty('name1')).toEqual(true);
                expect(mergedValue.name1).toEqual('test');
            });
            it('validates missing properties in settings are picked up from defaults.', () => {
                let settings = {
                    skuType: 'Standard_LRS',
                    managed: false,
                    supportsHttpsTrafficOnly: true
                };

                let mergedValue = storageSettings.diagnosticMerge({settings});
                expect(mergedValue.hasOwnProperty('nameSuffix')).toEqual(true);
                expect(mergedValue.nameSuffix).toEqual('diag');
                expect(mergedValue.supportsHttpsTrafficOnly).toEqual(true);
                expect(mergedValue.encryptBlobStorage).toEqual(false);
                expect(mergedValue.encryptFileStorage).toEqual(false);
                expect(Object.keys(mergedValue.keyVaultProperties).length).toEqual(0);
            });
        });
    });
    describe('userDefaults:', () => {
        describe('storage accounts merge:', () => {
            it('validates valid user defaults are applied for storage accounts.', () => {
                let settings = {};

                let defaults = {
                    nameSuffix: 'DST'
                };

                let mergedValue = storageSettings.storageMerge({
                    settings,
                    defaultSettings: defaults });

                expect(mergedValue.count).toEqual(1);
                expect(mergedValue.nameSuffix).toEqual('DST');
                expect(mergedValue.skuType).toEqual('Premium_LRS');
                expect(mergedValue.managed).toEqual(true);
                expect(mergedValue.supportsHttpsTrafficOnly).toEqual(false);
                expect(mergedValue.encryptBlobStorage).toEqual(false);
                expect(mergedValue.encryptFileStorage).toEqual(false);
                expect(Object.keys(mergedValue.keyVaultProperties).length).toEqual(0);
            });
            it('validates user defaults do not override settings.', () => {
                let settings = _.cloneDeep(storageParams);

                let defaults = {
                    nameSuffix: 'DST'
                };

                let mergedValue = storageSettings.storageMerge({
                    settings,
                    defaultSettings: defaults});

                expect(mergedValue.count).toEqual(2);
                expect(mergedValue.nameSuffix).toEqual('ST');
                expect(mergedValue.skuType).toEqual('Premium_LRS');
                expect(mergedValue.accounts.length).toEqual(2);
                expect(mergedValue.managed).toEqual(false);
                expect(mergedValue.supportsHttpsTrafficOnly).toEqual(true);
                expect(mergedValue.encryptBlobStorage).toEqual(true);
                expect(mergedValue.encryptFileStorage).toEqual(true);
                expect(Object.keys(mergedValue.keyVaultProperties).length).toEqual(3);
                expect(mergedValue.keyVaultProperties.keyName).toEqual('testkeyname');
                expect(mergedValue.keyVaultProperties.keyVersion).toEqual('testkeyversion');
                expect(mergedValue.keyVaultProperties.keyVaultUri).toEqual('testkeyvaulturi');
            });
            it('validates additional properties in default settings are not removed.', () => {
                let settings = {};

                let defaults = {
                    name1: 'include'
                };

                let mergedValue = storageSettings.storageMerge({
                    settings,
                    defaultSettings: defaults });

                expect(mergedValue.hasOwnProperty('name1')).toEqual(true);
                expect(mergedValue.name1).toEqual('include');
            });
            it('validates additional properties in settings are neither removed nor overriden by default settings.', () => {
                let settings = {
                    name1: 'test'
                };

                let defaults = {
                    name1: 'do-not-override'
                };

                let mergedValue = storageSettings.storageMerge({
                    settings,
                    defaultSettings: defaults });

                expect(mergedValue.hasOwnProperty('name1')).toEqual(true);
                expect(mergedValue.name1).toEqual('test');
            });
            it('validates missing properties in settings are picked up from user defaults.', () => {
                let settings = {
                    skuType: 'Standard_LRS',
                    managed: false,
                    supportsHttpsTrafficOnly: true
                };

                let defaults = {
                    count: 10
                };

                let mergedValue = storageSettings.storageMerge({
                    settings,
                    defaultSettings: defaults });

                expect(mergedValue.hasOwnProperty('count')).toEqual(true);
                expect(mergedValue.count).toEqual(10);
                expect(mergedValue.nameSuffix).toEqual('st');
                expect(mergedValue.encryptBlobStorage).toEqual(false);
                expect(mergedValue.encryptFileStorage).toEqual(false);
                expect(Object.keys(mergedValue.keyVaultProperties).length).toEqual(0);
            });
        });
        describe('diagnostic storage accounts merge:', () => {
            it('validates valid user defaults are applied for storage accounts.', () => {
                let settings = {};

                let defaults = {
                    nameSuffix: 'DDIAG'
                };

                let mergedValue = storageSettings.diagnosticMerge({
                    settings,
                    defaultSettings: defaults });

                expect(mergedValue.count).toEqual(1);
                expect(mergedValue.nameSuffix).toEqual('DDIAG');
                expect(mergedValue.skuType).toEqual('Standard_LRS');
                expect(mergedValue.managed).toEqual(false);
                expect(mergedValue.supportsHttpsTrafficOnly).toEqual(false);
                expect(mergedValue.encryptBlobStorage).toEqual(false);
                expect(mergedValue.encryptFileStorage).toEqual(false);
                expect(Object.keys(mergedValue.keyVaultProperties).length).toEqual(0);
            });
            it('validates user defaults do not override settings.', () => {
                let settings = _.cloneDeep(diagStorageParams);

                let defaults = {
                    nameSuffix: 'DDIAG'
                };

                let mergedValue = storageSettings.diagnosticMerge({
                    settings,
                    defaultSettings: defaults });

                expect(mergedValue.count).toEqual(2);
                expect(mergedValue.nameSuffix).toEqual('DIAG');
                expect(mergedValue.skuType).toEqual('Standard_LRS');
                expect(mergedValue.managed).toEqual(false);
                expect(mergedValue.supportsHttpsTrafficOnly).toEqual(true);
                expect(mergedValue.encryptBlobStorage).toEqual(true);
                expect(mergedValue.encryptFileStorage).toEqual(true);
                expect(Object.keys(mergedValue.keyVaultProperties).length).toEqual(3);
                expect(mergedValue.keyVaultProperties.keyName).toEqual('testkeyname');
                expect(mergedValue.keyVaultProperties.keyVersion).toEqual('testkeyversion');
                expect(mergedValue.keyVaultProperties.keyVaultUri).toEqual('testkeyvaulturi');
            });
            it('validates additional properties in default settings are not removed.', () => {
                let settings = {};

                let defaults = {
                    name1: 'include'
                };

                let mergedValue = storageSettings.diagnosticMerge({
                    settings,
                    defaultSettings: defaults });

                expect(mergedValue.hasOwnProperty('name1')).toEqual(true);
                expect(mergedValue.name1).toEqual('include');
            });
            it('validates additional properties in settings are neither removed nor overriden by default settings.', () => {
                let settings = {
                    name1: 'test'
                };

                let defaults = {
                    name1: 'do-not-override'
                };

                let mergedValue = storageSettings.diagnosticMerge({
                    settings,
                    defaultSettings: defaults });

                expect(mergedValue.hasOwnProperty('name1')).toEqual(true);
                expect(mergedValue.name1).toEqual('test');
            });
            it('validates missing properties in settings are picked up from user defaults.', () => {
                let settings = {
                    skuType: 'Standard_LRS',
                    managed: false,
                    supportsHttpsTrafficOnly: true
                };

                let defaults = {
                    nameSuffix: 'DDIAG'
                };

                let mergedValue = storageSettings.diagnosticMerge({
                    settings,
                    defaultSettings: defaults });

                expect(mergedValue.hasOwnProperty('nameSuffix')).toEqual(true);
                expect(mergedValue.nameSuffix).toEqual('DDIAG');
                expect(mergedValue.supportsHttpsTrafficOnly).toEqual(true);
                expect(mergedValue.encryptBlobStorage).toEqual(false);
                expect(mergedValue.encryptFileStorage).toEqual(false);
                expect(Object.keys(mergedValue.keyVaultProperties).length).toEqual(0);
            });
        });
    });
    describe('validations:', () => {
        describe('storage validations:', () => {
            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(storageParams);
            });

            describe('nameSuffix:', () => {
                it('validates nameSuffix canot be an empty string.', () => {
                    settings.nameSuffix = '';
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.nameSuffix');

                    settings.nameSuffix = null;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.nameSuffix');

                    settings.nameSuffix = 'test';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('managed:', () => {
                it('validates valid value for managed property is boolean.', () => {
                    settings.managed = 'yes';
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.managed');

                    settings.managed = 'true';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.managed');

                    settings.managed = true;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('skuType:', () => {
                it('validates skuType canot be null or empty string, if managed is false.', () => {
                    settings.skuType = '';
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.skuType');

                    settings.skuType = null;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.skuType');

                    settings.skuType = 'test';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);
                });
                it('validates skuType is ignored if managed is true.', () => {
                    settings.managed = true;

                    settings.skuType = '';
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);

                    settings.skuType = null;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('count:', () => {
                it('validates count is greater than 0, if managed is false.', () => {
                    settings.managed = false;

                    settings.count = 0;
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.count');

                    settings.count = '5';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.count');

                    settings.count = null;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.count');

                    settings.count = 5;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);
                });
                it('validates count is ignored if managed is true.', () => {
                    settings.managed = true;

                    settings.count = 0;
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('supportsHttpsTrafficOnly:', () => {
                it('validates valid value for supportsHttpsTrafficOnly property is boolean.', () => {
                    settings.supportsHttpsTrafficOnly = 'yes';
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.supportsHttpsTrafficOnly');

                    settings.supportsHttpsTrafficOnly = 'true';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.supportsHttpsTrafficOnly');

                    settings.supportsHttpsTrafficOnly = true;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('encryptBlobStorage:', () => {
                it('validates valid value for encryptBlobStorage property is boolean.', () => {
                    settings.encryptBlobStorage = 'yes';
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.encryptBlobStorage');

                    settings.encryptBlobStorage = 'true';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.encryptBlobStorage');

                    settings.encryptBlobStorage = true;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('encryptFileStorage:', () => {
                it('validates valid value for encryptFileStorage property is boolean.', () => {
                    settings.encryptFileStorage = 'yes';
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.encryptFileStorage');

                    settings.encryptFileStorage = 'true';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.encryptFileStorage');

                    settings.encryptFileStorage = true;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('keyvaultproperties:', () => {
                it('validates no error is thrown if keyvaultproperties is not provided or empty object.', () => {
                    settings.keyVaultProperties = null;
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);

                    settings.keyVaultProperties = {};
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);
                });
                it('validates that if keyvaultproperties is not empty than required properties are provided', () => {
                    settings.keyVaultProperties = { test: 'test' };
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(3);
                    expect(result[0].name).toEqual('.keyVaultProperties.keyName');
                    expect(result[1].name).toEqual('.keyVaultProperties.keyVersion');
                    expect(result[2].name).toEqual('.keyVaultProperties.keyVaultUri');

                    settings.keyVaultProperties = {
                        keyName: 'testkeyname',
                        keyVersion: 'testkeyversion',
                        keyVaultUri: 'testkeyvaulturi'
                    };
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.storageValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
        });
        describe('diagnostic storage validations:', () => {
            let settings;
            beforeEach(() => {
                settings = _.cloneDeep(diagStorageParams);
            });

            describe('nameSuffix:', () => {
                it('validates nameSuffix canot be an empty string.', () => {
                    settings.nameSuffix = '';
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.nameSuffix');

                    settings.nameSuffix = null;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.nameSuffix');

                    settings.nameSuffix = 'test';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('managed:', () => {
                it('validates managed property for diagnostic storage cannot be true.', () => {
                    settings.managed = true;
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.managed');

                    settings.managed = false;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('skuType:', () => {
                it('validates skuType canot be null or empty string or premium storage', () => {
                    settings.skuType = '';
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.skuType');

                    settings.skuType = null;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.skuType');

                    settings.skuType = 'Premium_LRS';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.skuType');

                    settings.skuType = 'Standard_LRS';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('count:', () => {
                it('validates count is greater than 0', () => {
                    settings.count = 0;
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.count');

                    settings.count = '5';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.count');

                    settings.count = null;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.count');

                    settings.count = 5;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('supportsHttpsTrafficOnly:', () => {
                it('validates valid value for supportsHttpsTrafficOnly property is boolean.', () => {
                    settings.supportsHttpsTrafficOnly = 'yes';
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.supportsHttpsTrafficOnly');

                    settings.supportsHttpsTrafficOnly = 'true';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.supportsHttpsTrafficOnly');

                    settings.supportsHttpsTrafficOnly = true;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('encryptBlobStorage:', () => {
                it('validates valid value for encryptBlobStorage property is boolean.', () => {
                    settings.encryptBlobStorage = 'yes';
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.encryptBlobStorage');

                    settings.encryptBlobStorage = 'true';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.encryptBlobStorage');

                    settings.encryptBlobStorage = true;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('encryptFileStorage:', () => {
                it('validates valid value for encryptFileStorage property is boolean.', () => {
                    settings.encryptFileStorage = 'yes';
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.encryptFileStorage');

                    settings.encryptFileStorage = 'true';
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(1);
                    expect(result[0].name).toEqual('.encryptFileStorage');

                    settings.encryptFileStorage = true;
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
            describe('keyvaultproperties:', () => {
                it('validates no error is thrown if keyvaultproperties is not provided or empty object.', () => {
                    settings.keyVaultProperties = null;
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(0);

                    settings.keyVaultProperties = {};
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(0);
                });
                it('validates that if keyvaultproperties is not empty than required properties are provided', () => {
                    settings.keyVaultProperties = { test: 'test' };
                    let result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(3);
                    expect(result[0].name).toEqual('.keyVaultProperties.keyName');
                    expect(result[1].name).toEqual('.keyVaultProperties.keyVersion');
                    expect(result[2].name).toEqual('.keyVaultProperties.keyVaultUri');

                    settings.keyVaultProperties = {
                        keyName: 'testkeyname',
                        keyVersion: 'testkeyversion',
                        keyVaultUri: 'testkeyvaulturi'
                    };
                    result = v.validate({
                        settings: settings,
                        validations: storageSettings.diagnosticValidations
                    });
                    expect(result.length).toEqual(0);
                });
            });
        });
    });

    if (global.testConfiguration.runTransform) {
        describe('storage accounts transform:', () => {
            let settings = {
                storageAccounts: {
                    nameSuffix: 'st',
                    count: 2,
                    skuType: 'Premium_LRS',
                    managed: false,
                    accounts: [
                        'vm7tt2e6prktm3lst1',
                        'vm7tt2e6prktm3lst2'
                    ],
                    supportsHttpsTrafficOnly: true,
                    encryptBlobStorage: true,
                    encryptFileStorage: true,
                    keyVaultProperties: {
                        keyName: 'testkeyname',
                        keyVersion: 'testkeyversion',
                        keyVaultUri: 'testkeyvaulturi'
                    },
                    subscriptionId: '3b518fac-e5c8-4f59-8ed5-d70b626f8e10',
                    resourceGroupName: 'rs-test6-rg'
                }
            };
            it('returns empty array if count of existing storage accounts is equal to count property:', () => {
                let result = storageSettings.transform(settings.storageAccounts, settings);
                expect(result.accounts.length).toEqual(0);
            });
            describe('', () =>{
                let param;
                beforeEach(() => {
                    param = _.cloneDeep(settings);
                });

                it('returns empty array if count of existing storage accounts is greater than count property:', () => {
                    param.storageAccounts.accounts = ['A', 'B', 'C'];

                    let result = storageSettings.transform(param.storageAccounts, param);
                    expect(result.accounts.length).toEqual(0);
                });
                it('returns array with storage account to create. length of array is count - no. of existing accounts provided:', () => {
                    param.storageAccounts.accounts = ['A'];

                    let result = storageSettings.transform(param.storageAccounts, param);
                    expect(result.accounts.length).toEqual(1);
                });
                it('converts settings to RP shape', () => {
                    param.storageAccounts.accounts = [];

                    let result = storageSettings.transform(param.storageAccounts, param);
                    expect(_.endsWith(result.accounts[0].name, `${param.storageAccounts.nameSuffix}1`)).toEqual(true);
                    expect(result.accounts[0].kind).toEqual('Storage');
                    expect(result.accounts[0].sku.name).toEqual('Premium_LRS');
                    expect(result.accounts[0].properties.encryption.services.blob.enabled).toEqual(true);
                    expect(result.accounts[0].properties.encryption.services.file.enabled).toEqual(true);
                    expect(result.accounts[0].properties.encryption.keySource).toEqual('Microsoft.Keyvault');
                    expect(result.accounts[0].properties.encryption.keyvaultproperties.keyname).toEqual('testkeyname');
                    expect(result.accounts[0].properties.encryption.keyvaultproperties.keyversion).toEqual('testkeyversion');
                    expect(result.accounts[0].properties.encryption.keyvaultproperties.keyvaulturi).toEqual('testkeyvaulturi');
                    expect(result.accounts[0].properties.supportsHttpsTrafficOnly).toEqual(true);
                    expect(_.endsWith(result.accounts[1].name, `${param.storageAccounts.nameSuffix}2`)).toEqual(true);
                    expect(result.accounts[1].kind).toEqual('Storage');
                    expect(result.accounts[1].sku.name).toEqual('Premium_LRS');
                    expect(result.accounts[1].properties.encryption.services.blob.enabled).toEqual(true);
                    expect(result.accounts[1].properties.encryption.services.file.enabled).toEqual(true);
                    expect(result.accounts[1].properties.encryption.keySource).toEqual('Microsoft.Keyvault');
                    expect(result.accounts[1].properties.encryption.keyvaultproperties.keyname).toEqual('testkeyname');
                    expect(result.accounts[1].properties.encryption.keyvaultproperties.keyversion).toEqual('testkeyversion');
                    expect(result.accounts[1].properties.encryption.keyvaultproperties.keyvaulturi).toEqual('testkeyvaulturi');
                    expect(result.accounts[1].properties.supportsHttpsTrafficOnly).toEqual(true);
                });
                it('if supportsHttpsTrafficOnly is false, RP shape doesnt include it', () => {
                    param.storageAccounts.count = 1;
                    param.storageAccounts.supportsHttpsTrafficOnly = false;
                    param.storageAccounts.accounts = [];

                    let result = storageSettings.transform(param.storageAccounts, param);
                    expect(_.endsWith(result.accounts[0].name, `${param.storageAccounts.nameSuffix}1`)).toEqual(true);
                    expect(result.accounts[0].kind).toEqual('Storage');
                    expect(result.accounts[0].sku.name).toEqual('Premium_LRS');
                    expect(result.accounts[0].properties.encryption.services.blob.enabled).toEqual(true);
                    expect(result.accounts[0].properties.encryption.services.file.enabled).toEqual(true);
                    expect(result.accounts[0].properties.encryption.keySource).toEqual('Microsoft.Keyvault');
                    expect(result.accounts[0].properties.encryption.keyvaultproperties.keyname).toEqual('testkeyname');
                    expect(result.accounts[0].properties.encryption.keyvaultproperties.keyversion).toEqual('testkeyversion');
                    expect(result.accounts[0].properties.encryption.keyvaultproperties.keyvaulturi).toEqual('testkeyvaulturi');
                    expect(result.accounts[0].properties.hasOwnProperty('supportsHttpsTrafficOnly')).toEqual(false);
                });
                it('if encrypt options are false, RP shape doesnt include it', () => {
                    param.storageAccounts.count = 1;
                    param.storageAccounts.supportsHttpsTrafficOnly = true;
                    param.storageAccounts.encryptBlobStorage = false;
                    param.storageAccounts.encryptFileStorage = false;
                    param.storageAccounts.accounts = [];

                    let result = storageSettings.transform(param.storageAccounts, param);
                    expect(_.endsWith(result.accounts[0].name, `${param.storageAccounts.nameSuffix}1`)).toEqual(true);
                    expect(result.accounts[0].kind).toEqual('Storage');
                    expect(result.accounts[0].sku.name).toEqual('Premium_LRS');
                    expect(result.accounts[0].properties.hasOwnProperty('encryption')).toEqual(false);
                    expect(result.accounts[0].properties.supportsHttpsTrafficOnly).toEqual(true);
                });
                it('if supportsHttpsTrafficOnly & ecrypt options are false, properties property is empty object', () => {
                    param.storageAccounts.count = 1;
                    param.storageAccounts.supportsHttpsTrafficOnly = false;
                    param.storageAccounts.encryptBlobStorage = false;
                    param.storageAccounts.encryptFileStorage = false;
                    param.storageAccounts.accounts = [];

                    let result = storageSettings.transform(param.storageAccounts, param);
                    expect(_.endsWith(result.accounts[0].name, `${param.storageAccounts.nameSuffix}1`)).toEqual(true);
                    expect(result.accounts[0].kind).toEqual('Storage');
                    expect(result.accounts[0].sku.name).toEqual('Premium_LRS');
                    expect(result.accounts[0].hasOwnProperty('properties')).toEqual(true);
                    expect(Object.keys(result.accounts[0].properties).length).toEqual(0);
                });
                it('if keyVaultProperties are provided, RP shape include keySource and keyvault properties', () => {
                    param.storageAccounts.count = 1;
                    param.storageAccounts.supportsHttpsTrafficOnly = false;
                    param.storageAccounts.accounts = [];

                    let result = storageSettings.transform(param.storageAccounts, param);
                    expect(_.endsWith(result.accounts[0].name, `${param.storageAccounts.nameSuffix}1`)).toEqual(true);
                    expect(result.accounts[0].kind).toEqual('Storage');
                    expect(result.accounts[0].sku.name).toEqual('Premium_LRS');
                    expect(result.accounts[0].properties.encryption.services.blob.enabled).toEqual(true);
                    expect(result.accounts[0].properties.encryption.services.file.enabled).toEqual(true);
                    expect(result.accounts[0].properties.encryption.keySource).toEqual('Microsoft.Keyvault');
                    expect(result.accounts[0].properties.encryption.keyvaultproperties.keyname).toEqual('testkeyname');
                    expect(result.accounts[0].properties.encryption.keyvaultproperties.keyversion).toEqual('testkeyversion');
                    expect(result.accounts[0].properties.encryption.keyvaultproperties.keyvaulturi).toEqual('testkeyvaulturi');
                    expect(result.accounts[0].properties.hasOwnProperty('supportsHttpsTrafficOnly')).toEqual(false);
                });
                it('if keyVaultProperties are not provided, RP shape include keySource as storage', () => {
                    param.storageAccounts.count = 1;
                    param.storageAccounts.supportsHttpsTrafficOnly = false;
                    param.storageAccounts.keyVaultProperties = {};
                    param.storageAccounts.accounts = [];

                    let result = storageSettings.transform(param.storageAccounts, param);
                    expect(_.endsWith(result.accounts[0].name, `${param.storageAccounts.nameSuffix}1`)).toEqual(true);
                    expect(result.accounts[0].kind).toEqual('Storage');
                    expect(result.accounts[0].sku.name).toEqual('Premium_LRS');
                    expect(result.accounts[0].properties.encryption.services.blob.enabled).toEqual(true);
                    expect(result.accounts[0].properties.encryption.services.file.enabled).toEqual(true);
                    expect(result.accounts[0].properties.encryption.keySource).toEqual('Microsoft.Storage');
                    expect(result.accounts[0].properties.encryption.hasOwnProperty('keyvaultproperties')).toEqual(false);
                    expect(result.accounts[0].properties.hasOwnProperty('supportsHttpsTrafficOnly')).toEqual(false);
                });
            });
        });
    }

    describe('getUniqueString:', () => {
        it('validates that unique string functions is idempotent', () => {
            let getUniqueString = storageSettings.__get__('getUniqueString');

            let result = getUniqueString('test input');
            expect(result).toEqual(getUniqueString('test input'));
        });
        it('validates that unique string functions returns different result for different inputs', () => {
            let getUniqueString = storageSettings.__get__('getUniqueString');

            let result = getUniqueString('test input');
            expect(result).not.toEqual(getUniqueString('test input1'));
        });
        it('validates that unique string return is 13 char long', () => {
            let getUniqueString = storageSettings.__get__('getUniqueString');

            let result = getUniqueString('test input');
            expect(result.length).toEqual(13);
        });
    });
});