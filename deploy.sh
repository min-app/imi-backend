#!/usr/bin/env bash
git submodule init
git submodule update --remote
cd ./src/lib
cnpm i
cd ../../
