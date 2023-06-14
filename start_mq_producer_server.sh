#!/bin/bash
# 1: Start the rabbit MQ producer app used to store tweets in db
cd backend/mq_prod && source ../.venv/bin/activate && python tweet_producer.py