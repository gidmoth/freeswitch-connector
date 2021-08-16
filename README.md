# freeswitch-connector

**WARNING: This is under developement  at the moment:**
**The README is outdated. Please use only  if you understand**
**the code. This Warning will disapear as soon as that changes.**

## About

This project aims to build an easy to setup and use conference system with freeswitch as a backend. It spreads through this repository, the [connector repository](https://github.com/gidmoth/connector) and the repository for an example web client, [fsconcli](https://github.com/gidmoth/fsconcli).

This repository provides a suitable freeswitch configuration and some common information on concept and usage, it's best to start here if you want to try freeswitch-connector.

## Concept

### How it works

The concept is based on the abstraction of event loops. Freeswitch, nodejs and phones -- be it soft- or hardware -- may be considered as event loops. That means after startup they react to- and emit events, and their internal states are results of that events.

As a nodejs application [connector](https://github.com/gidmoth/connector) is just a special configuration of an event loop, and, running in another js engine, that also holds for [fsconcli](https://github.com/gidmoth/fsconcli), the example web-phone. The idea is to relate those event loops to propagate a consistent state and form a conference system for the clients.

Freeswitchs state on startup is derived from its configuration and the primary source of configuration is a bunch of xml files. That's a simple and maintainable sort of database and it doesn't require network for freeswitch to read and parse it. Connector, the middleware, uses freeswitchs interface to itself as an event loop, the event socket, to derive a functional abstraction of the parsed configuration as one part of its own internal state, the `xmlState`. Connector then uses this state to provide http-access to the information therein.

In this manner the accounts for the http-access are derived from the accounts in freeswitchs directory. Using the configuration in this repository freeswitch separates user privilleges in three contexts: team, friends, and public. Through http connector provides resricted and read-only access to the `xmlState` to users in freeswitchs friends and public contexts. And it provides full access and the possibility to change the directory and the dialplan to users in the team context.

As a team user you can do changes through http POST requests with json formated data. Connector will parse that data, make the respective changes by writing or deleting xml files in freeswitchs directory or dialplan, and cause a `reloadxml` through the event socket. When that finishes, connector will rebuild the `xmlState` as on startup, through requests on the event socket. This way connectors internal state does not differ from freeswitch's apart from the abstraction, only successfully parsed xml forms connectors state. Through this interface team users can manage users and conferences.

As `xmlState` is implemented as an EventEmitter, it will then fire the notification that it is new. Connector then propagates this notification through a WebSocket, and clients can react by renewing their own information on what conferences and peers are available on the system (sending http-requests).

The second part of connectors internal state is the `liveState`. That is also implemented as an EventEmitter and holds a functional abstraction of freeswitchs internal state concerning conferences and registrations. This is also derived through eventsocket requests on startup, but maintained by just listening to events.

Through the WebSocket that connector provides, clients can access the information in the `liveState`. Again, the privillege separation on the Websocket follows the context-separation in freeswitch (is derived from the `xmlState`). Upon connection clients can get a copy of the whole state by sending a request as json-formatet utf-8 through the WebSocket. Other than that, only changes to the `liveState` are propagated to all clients, and it's recommended for clients to keep track of theese changes and update their own information accordingly. (You could write a client that requests the whole state periodically, but that's not a good solution since the `liveState` changes frequently and it would produce unneccesary traffic on cost of the bandwith available for the actual calls).

Clients with accouts in the friends and team contexts can also use the Websocket to do some conference controlling, muting and unmuting users, control recording and some other things. Connector will parse the respective json formated requests from those clients, do according requests on freeswitchs eventsocket, update it's `liveState` as the results appear on the eventsocket, and propagate the changes through the WebSocket.

### Clients

The [example client](https://github.com/gidmoth/fsconcli) uses the react framework to keep it's own abstractions of the states connector deliveres and connect a js-phone to the conference system according to the credentials the user provides. But the Information connector provides to autheticated clients is sufficient to connect any phone to the underlaying freeswitch and track the state of conferencing. So you could write your own client to fit your needs as you like, or use any other SIP conformant client. Freeswitch as configured with the files in this repository will support SIP connections through TLS (tcp), like most phones do, and through a WebSocket (different from the WebSocket connector provides), to support browsers (or other clients) utilizing WebRTC for media streaming.

### Provisioning

As the name suggests freeswitch-connector also tries to help to connect to freeswitch. Besides the already mentioned things it also does provisioning derived from its `xmlState` and some templates. Without modification it will do so for Linphone and, if a Polycom-MAC is provided for a user, also for Polycom phones running the ucs version 4.0.15. A user can use his/her credentials to point Linphone or a Polycom to the provisioning url. Which by default are https://user:pass@your.web.origin/poycom and https://user:pass@your.web.origin/linphone. Connector provides the files according to the logins.

team and friends users get some of the conference controls provided through connectors WebSocket server through the dtmf they can send with their phones. And the provisioning includes a directory of all conferences for them to use.


