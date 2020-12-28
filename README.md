# freeswitch-connector

This is a somewhat special purpose interface to freeswitch.
It is designed to use freeswitch as a conference
system, but the concept is very expandibele.

A suitable freeswitch-installation can be found
[here](https://github.com/gidmoth/freeswitch-container).

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
will have no problems with it.

The prize for such advantages is the dependency on a certain
way of expressing the freeswitch configuration in xml files
(in freeswitch you can structure the same config in many different ways in terms
of file layout). Also, freeswitch-connector makes somewhat hardcoded
assumptions on the dialplan-logic and the directory-structure.
[freeswitch-container](https://github.com/gidmoth/freeswitch-container) contains
a working example.

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
be reproduced from this JSON file.

All usercredentials an privilleges for the REST api are derived
from the freeswitch-config, no need to care for extra-users, but
please be aware of all the implications, understand the dialplan,
make the TLS work, and adapt all as necessary for your security-needs.


