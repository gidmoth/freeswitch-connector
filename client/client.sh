#!/bin/bash

# check users:
curl --insecure -u teamuser1:napw https://localhost:3000/api/users

# add users:
curl --insecure -u teamuser1:napw --header "Content-Type: application/json" --request POST --data '[{"name": "foo", "context": "team", "email": "foo@bar.baz"}, {"name": "teamuser1", "context": "friends", "email": "hans@dampf.de"}, {"name": "lula", "context": "public", "email": "sis@doinet.com", "polymac": "funnymac"}, {"name": "stefan", "context": "team", "email": "my@mail.com", "password": "schumpeter"}, {"name": "anina", "context": "team", "email": "keineemail"}, {"name": "barbaz", "email": "foo@bar.baz", "context": "gibtsmich?"}]' https://localhost:3000/api/users/add


