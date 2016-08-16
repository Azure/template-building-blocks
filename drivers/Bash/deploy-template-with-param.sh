#!/bin/bash

usage(){
  echo "Invalid option: -$OPTARG"
  echo "Usage: deploy-template-with-param -n [Resource group name]"
  echo "                                  -l [Resource group location]"
  echo "                                  -t [Template file]"
  echo "                                  -p [Template parameters file]"
  exit 1
}

while getopts ":n:l:f:e:c:" opt; do
  case $opt in
    n)GROUP_NAME=$OPTARG;;
    l)LOCATION=$OPTARG;;
    f)TEMPLATE=$OPTARG;;
    e)PARAMETERS=$OPTARG;;
    *)usage;;
  esac
done

cat $PARAMETERS | tr '\n' ' ' | sed "s/\"customData[^{]*{[^}]*}/$(sed 's:/:\\/:g' updatepattern.txt)/" > parms.json

azure config mode arm
azure group create -n "$GROUP_NAME" -l "$LOCATION" -f $TEMPLATE -e ./parms.json  -v

rm parms.json