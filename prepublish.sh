#!/bin/sh
# Spotetrack / prepublish.sh
# prepublish script for Spotetrack
# (c) 2014 David (daXXog) Volm ><> + + + <><
# Released under Apache License, Version 2.0:
# http://www.apache.org/licenses/LICENSE-2.0.html  
#################################################

if [ ! -f com-npm-install ]; then
	node make
	rm npm-debug.log >> /dev/null
	mv spotetrack.js ../.tmp.js
	mv spotetrack.h ../.tmp.h
else
	rm com-npm-install
fi