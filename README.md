# freeswitch-connector

This is a somewhat special purpose interface to freeswitch.
It is designed to use freeswitch as a conference
system, but the concept is very expandibele.

A suitable freeswitch-installation can be found
[here](https://github.com/gidmoth/freeswitch-container).

> #### Contents
> * [API Reference](#api-reference)
>   * [Userfunctions](#userfunctions)
>   * [Functions to maintain the system](#functions-to-maintain-the-system)

## Concept

Depending on your usecase the concept might fit to your needs
or not. It's based on the freeswitch xml files as the single
source of truth. Therefore no other database is used, and the
functinality of freeswitch depends in no way on freeswitch-connector,
even if you use connector to manage your conference-system.

It is also very easy to backup and restore, since everything is
just a bunch of xml-files which are human readable. And you can
recunstruct everything you do filewise with connector easily
from it's internal state, which you can safe as JSON. Also you can
do needed modifications directly in the xml-files and freeswitch-connector
will have no problems with it. With one notable exception, see
[note below](#ghosts-note)

The prize for such advantages is the dependency on a certain
way of expressing the freeswitch configuration in xml files
(in freeswitch you can structure the same config in many different ways in terms
of file layout). Also, freeswitch-connector makes somewhat hardcoded
assumptions on the dialplan-logic and the directory-structure.
[freeswitch-container](https://github.com/gidmoth/freeswitch-container) contains
a working example. The relations should be completely defined in
[config.js](https://github.com/gidmoth/freeswitch-connector/blob/main/connector/config.js)
but this is not battletested.

Here the concept as a diagram:

```
+--------------+--------+
|              | event  +----------------+
|  FREESWITCH  | socket |                +
|              +--------+<---+  representation
+--+-----------+             |   of xmlstate
   | parse xml |             +           +
   +------+----+          reloadxml /    |
   +-^    ^  ^-----+       use esapi     |
   |      |        |         +           |
+--+--+ +-+---+ +--+--+      +---+       |
| xml | | xml | | xml | ...      |       v
+-----+ +--+--+ +-----+          +-------++
   ^-+     ^  +---^              | modesl |
     |     |  |    +-------------+--------+---+
     |     |  |    |                          |
     |     |  |    |     freeswitch+connector |
    ++-----+--+----+    +-------------------+ |
    | generate or  +----+ my representation | |
    | delete files |    |    of xmlstate    | |
    +--------------+    +---------+---------+ |
                   |              |           |
                   |              |           |
+--------------+   +--------------+-----+-----+
|   polycom    +<-----------| fastify / |
| provisioning |       +----+ rest api  |
+--------------+       |    +-+--+------+
+--------------+       |      |  ^
|    verto     +<------+      v  |
| communicator |            +-+--+-+
+--------------+            | USER |
                            +------+
```

As you can see here, connector depends on access to freeswitchs
xml-database and to its eventsocket. You can accomblish this with
connector running on a different host, but don't forget to secure
the eventsocket-connection (by vpn e.g.), and you will need somehow
network-reachable storage of the xml files in that case. It's easier
to just run connector on the same host, and in the same network
namespace as freeswitch.

The representation of the xml config is an in memory JS Object and
gets updatet on every `reloadxml`. But it can also be partially
updatet on more specific events. You can serialize it easily as JSON,
except for some properties which are sets, but those are automatically
managed anyways. All xml-files which are managable by connector can easily
be reproduced from this JSON.

All usercredentials an privilleges for the REST api are derived
from the freeswitch-config, no need to care for extra-users, but
please be aware of all the implications, understand the dialplan,
make the TLS work, and adapt all as necessary for your security-needs.
See the `fasti.apiallow` property in
[config.js](https://github.com/gidmoth/freeswitch-connector/blob/main/connector/config.js).

## API Reference

Connector exposes a REST API to all users in the `fast.apiallow` context.
The other users are just added to freeswitchs directory and provisioned.
To use the API you have to do HttpDigest Auth. For POST Requests you'll
need to send Headers like this:

`curl --digest -u teamuser1:napw --header "Content-Type: application/json" -X POST --data...`

All POST endpoints are validated against a JSON schema, for brevity the
schema is given in the following for each case.

### Userfunctions

#### GET: /api/users

returns JSON with all users like this:

```
{
    "op": "users",
    "info": {
        "total": 8,
        "contexts": {
            "team": 3,
            "friends": 3,
            "public": 2
        }
    },
    "users": [
        {
            "id": "20000",
            "password": "napw",
            "conpin": "2357",
            "context": "team",
            "name": "teamuser1",
            "email": "teamuser1@example.com",
            "polymac": "none"
        }, ...
    ]
}
```

#### GET /api/users/[byid|byname|bycontext|bypolymac]/*yourstring*

Uses the given string to match the userarray against it. The matching
is done with the stringmethod `.startsWith()`. So those Endpoints return an array, if more than one match is found (the given string for a polycom mac may be, e.g.,
`0004f`, which will match all users with polycoms), the array contains more than
one user.

The answers look like this:

`{op: 'users/byid/yourstring', users: [{user},{user}...]}`

#### GET: /api/users/byemail/*yourstring*

The same as the endpoints aboth. But the email property is matched with the
`.includes()` method, to be able to match all users in the same maildomain.
Usage of `@` in `yourstring` is  not tested and not supported.

The answer looks like this:

`{op: 'users/byemail/yourstring', users: [{user},{user}...]}`

#### GET: /api/users/match/*yourstring*

Matches `yourstring` against all emails and all names, checks if any
of them includes your string. The answer looks like this:

`{op: 'users/match/yourstring', namematches: [{user},{user}...], emailmatches: [{user},{user}...]}`

#### POST: /api/users/add

Schema:

```
{
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'gidmoth/userAddSchema',
        body: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    password: { type: 'string' },
                    conpin: { type: 'string' },
                    context: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    polymac: { type: 'string' }
                },
                required: ['name', 'email', 'context'],
                additionalProperties: false
            }
        }
    }
```

As you can see, you can add multiple users at once, as long as
they fit in the dialplan. See
[config.js](https://github.com/gidmoth/freeswitch-connector/blob/main/connector/config.js)
and the example dialplan in
[freeswitch-container](https://github.com/gidmoth/freeswitch-container).

The Answer looks like this:

`{ op: 'users/add', done: [], failed: [] }`

with the done and failed arrays filled or not. Adding a user fails
if no formal email is given, if the name is already taken, or if the
context you try to add him/her does not exists.

Ids, which are the same as the phonenumbers in freeswitch, are assigned
automatically.

#### POST: /api/users/mod

Schema:

```
{
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'gidmoth/userModSchema',
        body: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    password: { type: 'string' },
                    conpin: { type: 'string' },
                    context: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    polymac: { type: 'string' }
                },
                required: ['id'],
                additionalProperties: false
            }
        }
    }
```

Modifies existing users. Only the id is required, all other
values are filled in from the existing user if they are not
provided. Except for the polymac and the password.
The polymac will be set to the default, `none`, if not provided,
and the provisioning for polycom-phones will be deletet. If no
password is provided, a new one will be generated.

If you change a users context, he will get a new id (phonenumber).
If you don't change the context, he/she will keep his/her id.

The answer looks like this:

`{ op: 'users/mod', done: [], failed: [] }`

with users filled in the arrays or not. Modding a user fails if
the id does not exist, or the new email is not a formal email, or
the new context does not exist.

#### POST: /api/users/del

Schema:

```
{
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'gidmoth/userDelSchema',
        body: {
            type: 'array',
            items: {
                type: 'string'
            }
        }
    }
```

Deletes all users by the ids (phonenumbers) given in the array.
All provisioning for those users will also be deleted.

The answer looks like this:

`{ op: 'users/del', done: [], failed: [] }`

with the arrays filled or not. Deleting users fails if the id is not
found.

#### GET: /api/users/rebuild

Rebuilds all userfiles in the directory from the internal xml state.
Useful if you make changes to the userfiles in the
[Templates](https://github.com/gidmoth/freeswitch-connector/blob/main/connector/apis/templates.js).

The answer looks like this:

`{ op: 'users/rebuild', done: [], failed: [] }`

Nothing should fail in this operation, so only the done array should
contain users.

#### GET: /api/users/reprov

Reprovisions all users from the internal xml state.
Useful if you make changes to the userfiles in the
[Templates](https://github.com/gidmoth/freeswitch-connector/blob/main/connector/apis/templates.js).

Answer:

`{ op: 'users/reprov', done: [], failed: [] }`

Nothing should fail in this operation, so only the done array should
contain users.

If you try connector with the
[example freeswitch](https://github.com/gidmoth/freeswitch-container)
you should run this endpoint to provision the users in there.

### Functions to maintain the system

All paths mentioned in the following refer to the defaults as provided
in
[config.js](https://github.com/gidmoth/freeswitch-connector/blob/main/connector/config.js).

#### GET: /api/store/[directory|dialplan|conferences|freeswitch]

Stores a gzipped tar of the requested folder in `/static/store`.
The folders are respectively:

* freeswitch: `/etc-freeswitch` (the path you mountet your freeswitchs configuration)
* dialplan: `/etc-freeswitch/dialplan`
* conferences: `/etc-freeswitch/dialplan/conferences`
* directory: `/etc-freeswitch/directory`

Other folders are not implementet. This is not meant as a backup, but
more to hook in a backup conveniently or to move to a new host with ease.
These are file operations, they don't involve the internal xml state.
So It's also for testing changes in the
[Templates](https://github.com/gidmoth/freeswitch-connector/blob/main/connector/apis/templates.js)
or by hand, and being able to restore with the following endpoint.

#### GET: /api/restore/[directory|dialplan|conferences|freeswitch]

Restores the respective directory in `/etc-freeswitch` from a previously
stored tarball in `/static/store`. After restoring this endpoint causes
a reloadxml in freeswitch and rebuilds the internal xml state of connector
from informations gathered through the eventsocket.

If you do this, don't forget to run `/api/users/reprov` afterwards, or the
provisioningfiles may be inconsistent with the contents of your directory.

___

#### Ghosts Note

Due to a limitation in the way
[fast-xml-parser](https://www.npmjs.com/package/fast-xml-parser)
parses the xml which connector recives from the eventsocket
of freeswitch, maybe a limitation of translating xml data to
JS Objects in general, connector creates ghost-users in the freeswitch
directory on every startup. These files get parsed by freeswitch, but
the users can't register. The're just placeholders for the structure
of the xml, in case all other users get deletet from a context.

It' a design-decision to keep the parsing simple and fast, and therefore
create those dummiefiles on every startup.

The problem in short: If you parse the following xml to JSON:

```xml
<group>
<user id="foo"/>
<user id="bar"/>
<user id="baz"/>
</group>
```

with fast-xml-parser, and the option not to ignore attributes, you get this:

```json
{"group":
    {"user":
        [
            {"@_id":"foo"},
            {"@_id":"bar"},
            {"@_id":"baz"}
        ]
    }
}
```

In other words, the group is holding an object which has a property
user which is holding an array.

But this:

```xml
<group>
<user id="foo"/>
</group>
```

results in the property holding an object:

```json
{"group":
    {"user":
        {"@_\"id\"":"foo"}
    }
}
```

and this:

```xml
<group>
</group>
```

results in a string, and no user-property:

```json
{"group":""}
```

So to keep the parsing simple and fast, I decided to add ghost-users,
for the case the real users drop under 2.

But that's a hack -- any suggestions and pull-requests welcome!
