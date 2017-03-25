#!/bin/sh

APP_HOME='/home/masaru/pj/node/e2b_panel'
NPM='/home/masaru/pj/node/nvm/versions/node/v4.3.1/bin/npm'

cd $APP_HOME
exec $NPM $1
