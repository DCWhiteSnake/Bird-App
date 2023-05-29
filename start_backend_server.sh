#!/bin/bash
# 1: create necessary environment variables
export sql_pass="qwerty" && export SIO_SECRET="secretstuff2"
export usr_name=$(whoami)
# 2a: cd into the backend folder then refresh your profile so that the newly created variables are live
# 2b: Activate the the virtual environment called bacckend-env
# 2c: We use gunicorn because of its support for Websockets. Why are we using 50 theads, I don't know tbh.
cd backend && gunicorn -b 127.0.0.1:5000 --worker-class eventlet -w 1 wsgi:app