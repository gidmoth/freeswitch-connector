#!/bin/bash

if [ ! -d /connector/node_modules ]
    then
        npm install --prefix /connector/
        echo "node deps installed"
    else
        echo "node_modules found"
fi
