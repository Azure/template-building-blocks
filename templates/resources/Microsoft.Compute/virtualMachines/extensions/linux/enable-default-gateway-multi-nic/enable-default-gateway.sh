#!/bin/bash

firstLine=true
routeTableIndex=2
while IFS= read -r line; do
        if [[ "$firstLine" = true ]]
        then
                defaultGatewayIp=$(echo $line | awk '/default/ { print $3 }')
                defaultGatewayIpPrefix=$(echo $defaultGatewayIp | awk -F: '{split($1,a,"."); print a[1]"."a[2]"."a[3];}')
                firstLine=false

                printf 'Default gateway: %s\n' "$defaultGatewayIp"
                printf 'Default gateway prefix: %s\n' "$defaultGatewayIpPrefix"
        fi

        ethernetIp=$(echo $line | awk '/src/ { print $9 }')

        if [[ ! -z $ethernetIp ]]
        then
                printf 'Ethernet ip: %s\n' "$ethernetIp"
                ethernetIpPrefix=$(echo $ethernetIp | awk -F: '{split($1,arr,"."); print arr[1]"."arr[2]"."arr[3];}')
                if [[ $ethernetIpPrefix != $defaultGatewayIpPrefix ]]
                then
                        newGateway=${ethernetIpPrefix}".1"
                        interfaceType=$(echo $line | awk '{ print $2 }')
                        interfaceName=$(echo $line | awk '{ print $3 }')
                        printf 'New gateway to add: %s %s\n' "$newGateway" "$restOfSuffix"

                        # Add a new routing table
                        rTable="rt$routeTableIndex"
                        ((routeTableIndex++))
                        echo "1 $rTable" >>/etc/iproute2/rt_tables
                        printf 'New route table: %s\n' "$rTable"

                        # Grab subnet address
                        #subnetIp=$(ip -o -f inet addr show | awk '/scope global eth1/ {print $4}')
                        subnetPrefix=$(echo $line | awk '{ print $1 }')

                        # Compose route commands
                        routeAddCommand1="ip route add $subnetPrefix $interfaceType $interfaceName src $ethernetIp table $rTable"
                        routeAddCommand2="ip route add default via $newGateway $interfaceType $interfaceName table $rTable"

                        # Compose rule commands
                        ruleAddCommand1="ip rule add from $ethernetIp/32 table $rTable"
                        ruleAddCommand2="ip rule add to $ethernetIp/32 table $rTable"

                        printf 'Commands to execute:\n'
                        printf '%s\n' "$routeAddCommand1"
                        printf '%s\n' "$routeAddCommand2"
                        printf '%s\n' "$ruleAddCommand1"
                        printf '%s\n' "$ruleAddCommand2"

                        eval $routeAddCommand1
                        eval $routeAddCommand2
                        eval $ruleAddCommand1
                        eval $ruleAddCommand2
                fi
        fi

done < <(ip route)
