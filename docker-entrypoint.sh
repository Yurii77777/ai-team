#!/bin/bash
yarn build
yarn typeorm:migration-run
yarn start:dev
