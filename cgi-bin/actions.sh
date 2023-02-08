#!/bin/bash
if [[ 0 -eq 1 ]]
then
# ../venv/bin/activate
PATH=../venv/bin:$PATH
echo -e "Content-type: text/html\n\n";
echo "<html><body>"
echo "Hello, World.";
echo "<pre>"
env
whoami
which python
pwd
python test.py
echo "</pre></body></html>"
fi
if [[ 0 -eq 1 ]]
then
# ../venv/bin/activate
PATH=../venv/bin:$PATH
python test.py
fi
if [[ 1 -eq 1 ]]
then
PATH=../venv/bin:$PATH
echo -e "Content-type: text/html\n\n";
python actions.py
fi