#!/bin/bash
# 1: create necessary environment variables
export sql_pass="qwerty" && export SIO_SECRET="secretstuff2"
export usr_name=$(whoami)
# 2a: cd into the backend folder then refresh your profile so that the newly created variables are live
# 2b: Activate the the virtual environment called bacckend-env
# 2c: We use gunicorn as a reverse proxy to the eventlet worker class
## gunicorn  -k gevent -w 1 app:app
gunicorn --preload -b :5000 --worker-class eventlet -w 1 --threads=4 wsgi:app