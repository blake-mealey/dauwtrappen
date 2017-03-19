#!/usr/bin/env bash
##!/bin/bash

if [ -e ./setu_db.sh ]; then
  echo "Wrong directory! run in the models directory!"
  exit
fi

node database.js
#node sample-data.js
node dndn-scraper.js
