exports.getBuildingBlocks = ({application, baseUri}) => {
    let _ = application.require('lodash');
    return [
        {
            type: 'Template',
            process: require('./templateSettings')(application).process,
            defaultsFilename: 'templateSettings.json',
            template: _.join([baseUri, 'extensions/templates/templates.json'], '/'),
            deploymentName: 'tmp'
        }
    ];
};