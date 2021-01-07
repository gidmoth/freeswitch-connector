#!/bin/bash

# check users:
curl --digest -u teamuser1:napw https://fcos.c8h10n4o2.news/api/users

# add users:
curl --digest -u teamuser1:napw --header "Content-Type: application/json" -X POST --data '[{"name": "stefan", "context": "team", "email": "foo@bar.baz", "polymac": "0004f21c5a98"}, {"name": "friendstefan", "context": "friends",  "email": "gidoramothra@gmail.com", "polymac": "0004f2145497"}]' https://fcos.c8h10n4o2.news/api/users/add

# del users:
curl --digest -u teamuser1:napw --header "Content-Type: application/json" -X POST --data '[22001, 20001]' https://fcos.c8h10n4o2.news/api/users/del

# moduser:
curl --digest -u teamuser1:napw --header "Content-Type: application/json" -X POST --data '[{"name": "stefan", "context": "public", "email": "gidoramothra@gmail.com", "polymac": "0004f21c5a98"}]' https://fcos.c8h10n4o2.news/api/users/mod


# check tls:
curl [ --sslv3, --tlsv1.0, --tlsv1.1, --tlsv1.2 ] --digest -u stefan:GY780Lti3u https://fcos.c8h10n4o2.news/api/users|json_reformat

