#!/bin/bash
echo Making symbolic links.
scripts_dir=$(pwd)

cd ../scorm/mod1/content/course
ln -s ../../../../content/mod_1_* .
ln -s ../../../../content/shared .
cd $scripts_dir

cd ../scorm/mod2/content/course
ln -s ../../../../content/mod_2_* .
ln -s ../../../../content/shared .
