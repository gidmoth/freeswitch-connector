#!/bin/bash

# check users:
curl --digest -u teamuser1:napw https://fcos.c8h10n4o2.news/api/users

# add users:
curl --digest -u teamuser1:napw --header "Content-Type: application/json" -X POST --data '[{"name": "stefan", "context": "team", "email": "foo@bar.baz", "polymac": "0004f21c5a98"}]' https://fcos.c8h10n4o2.news/api/users/add


