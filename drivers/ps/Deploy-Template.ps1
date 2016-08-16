param(
  [parameter(Mandatory=$true)]$SubscriptionName,
  [parameter(Mandatory=$true)]$ResourceGroupName,
  [parameter(Mandatory=$true)]$Location,
  [parameter(Mandatory=$true)]$DeploymentName,
  [parameter(Mandatory=$true)]$TemplateUri,
  [parameter(Mandatory=$true)]$TemplateParametersUri
)

# Login to Azure and select your subscription
Login-AzureRmAccount
Select-AzureRmSubscription -SubscriptionName $SubscriptionName | Out-Null

################################################################################################################
# Make sure that the following parameters match the ones in the template if you're using existing infrastructure

#$ResourceGroupName='myapp-rg'
#$DeploymentName='myapp-rg-dep'
#$Location='West US'

$resourceGroup = Get-AzureRmResourceGroup -Name $ResourceGroupName -Location $Location | Out-Null
if ($resourceGroup -eq $null) {
  # We need to create the resource group
  $resourceGroup = New-AzureRmResourceGroup -Name $ResourceGroupName -Location $Location
}


# Template and parameters file URIs
#$TemplateUri = 'https://raw.githubusercontent.com/mspnp/blueprints/kirpas/buildingblocks/ARMBuildingBlocks/ARMBuildingBlocks/Templates/buildingBlocks/vnet-n-subnet/azuredeploy.json'
#$templateParamUri='https://raw.githubusercontent.com/mspnp/blueprints/kirpas/buildingblocks/ARMBuildingBlocks/ARMBuildingBlocks/Templates/buildingBlocks/vnet-n-subnet/scenarios/azuredeploy.parameters.json'

$result = Test-AzureRmResourceGroupDeployment -ResourceGroupName $resourceGroup.ResourceGroupName -TemplateUri $TemplateUri -TemplateParameterUri $TemplateParametersUri

# Test-AzureRmResourceGroupDeployment returns a list of PSResourceManagerError objects, so a count of 0 is all clear signal!
if ($result.Count -eq 0) {
  New-AzureRmResourceGroupDeployment -Name $DeploymentName -ResourceGroupName $resourceGroup.ResourceGroupName -TemplateUri $TemplateUri -TemplateParameterUri $TemplateParametersUri
}
else{
  $($result)
}
