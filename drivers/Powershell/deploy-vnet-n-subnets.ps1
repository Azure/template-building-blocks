#
# Deploys a vnet and subnets in a resource group creating a 3 tier IaaS architecture
#

# Login to Azure and select your subscription
Login-AzureRmAccount
Select-AzureRmSubscription -SubscriptionName 'Pnp Networking'

################################################################################################################
# Make sure that the following parameters match the ones in the template if you're using existing infrastructure

$resourceGroupName='myapp-rg'
$deploymentName='myapp-rg-dep'
$location='West US'

# Create new resource group
New-AzureRmResourceGroup -Name $resourceGroupName -Location $location

# Template and parameters file URIs
$templateUri = 'https://raw.githubusercontent.com/mspnp/blueprints/kirpas/buildingblocks/ARMBuildingBlocks/ARMBuildingBlocks/Templates/buildingBlocks/vnet-n-subnet/azuredeploy.json'
$templateParamUri='https://raw.githubusercontent.com/mspnp/blueprints/kirpas/buildingblocks/ARMBuildingBlocks/ARMBuildingBlocks/Templates/buildingBlocks/vnet-n-subnet/scenarios/azuredeploy.parameters.json'

$result = Test-AzureRmResourceGroupDeployment -ResourceGroupName $resourceGroupName -TemplateUri $templateUri -TemplateParameterUri $templateParamUri

# Test-AzureRmResourceGroupDeployment returns a list of PSResourceManagerError objects, so a count of 0 is all clear signal!
if($result.Count -eq 0){
	New-AzureRmResourceGroupDeployment -Name $deploymentName -ResourceGroupName $resourceGroupName -TemplateUri $templateUri -TemplateParameterUri $templateParamUri -Verbose
}else{
    $result
}
