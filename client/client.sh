#!/bin/bash

# check users:
curl --insecure -u teamuser1:napw https://localhost:3000/api/users

# add users:
curl --insecure -u teamuser1:napw --header "Content-Type: application/json" --request POST --data '[{"name": "foo", "context": "team", "email": "foo@bar.baz"}, {"name": "teamuser1", "context": "friends", "email": "hans@dampf.de"}, {"name": "lula", "context": "public", "email": "sis@doinet.com", "polymac": "funnymac"}, {"name": "stefan", "context": "team", "email": "my@mail.com", "password": "schumpeter"}, {"name": "anina", "context": "team", "email": "keineemail"}, {"name": "barbaz", "email": "foo@bar.baz", "context": "gibtsmich?"}]' https://localhost:3000/api/users/add

# cleaner:
curl -u teamuser1:napw --header "Content-Type: application/json" -X POST --data '[{"name": "stefan", "context": "team", "email": "foo@bar.baz", "polymac": "0004f21c5a98"}]' https://fcos.c8h10n4o2.news/api/users/add


