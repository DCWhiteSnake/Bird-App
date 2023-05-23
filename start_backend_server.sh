#!/bin/bash
cd backend && gunicorn --thread 50 app:app