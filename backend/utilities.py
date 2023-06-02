from datetime import datetime, timezone
import re

email_regex = re.compile(
    r'([A-Za-z0-9]+[.-_])*[A-Za-z0-9]+@[A-Za-z0-9-]+(\.[A-Z|a-z]{2,})+')

def current_time():
    '''Return current term in SQL datetime format'''
    creation_date = datetime.now(timezone.utc).isoformat(sep=",").split(",")
    date = creation_date[0]
    time = creation_date[1].split(".")[0]
    return (date + " " + time)


def email_is_valid(email):

    if (re.fullmatch(email_regex, email)):
        return True
    return False
