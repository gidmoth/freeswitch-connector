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

## Installation

### OCI Container / Docker

The following examples use podman as a container build/runtime. You can safely replace all occurraces of `podman` with `docker` if you use docker instead.

You can either use this repository to build your own OCI Image:

```
git clone https://github.com/gidmoth/freeswitch-connector
cd freeswitch-connector
podman build -t myname/fscon:local .
```

Or you can use the image from docker.io. The latest tag is `0.0.8`:

```
podman pull docker.io/gidmoth/fscon:0.0.8
```

Either way, this will result in your local imagestore containing a copy of a single image containing everything needed to run freeswitch-connector and its example-client. If you choose to run the parts separately or want to create your own client, please refer to the rest of the docs and/or modify the Dockerfile as you want it.

#### Configuration

The container from this image should be configured by environment variables. A default set of the configurable variables is built into the image and those are meant to be overwritten during container creation. [This script](https://github.com/gidmoth/freeswitch-connector/blob/main/entrypoint.d/03-localvars.sh), which gets called by the entrypoint, will generate a `vars.xml` for freeswitch from the environment, and [this](https://github.com/gidmoth/connector/blob/main/config.js) will use the environment to provide values for the connector middleware.

The script to generate the `vars.xml` will also genarate an empty file in `/etc/freeswitch` with the name `localvars`. If you want to overwrite `vars.xml` later on, just delete this file and start the container with the updated environment, `vars.xml` will only be overwritten if `localvars` is not found. The `config.js` for connector does not require such a workaround since it can reference the shell environment directly.

The hard part is TLS, so it gets it's own section; see below. For the following example it is assumed that you use letsencrypt and your `privkey.pem` and `fullchain.pem` are ready to use in a volume named `certbot_etc-letsencrypt` under the path `/live/host.example.com`. Using mostly the default values, and assuming your fqdn is `host.example.com`, you could then start your container with a service file like this:

```
[Unit]
Description=freeswitch-connector
Wants=network.target
After=network-online.target

[Service]
ExecStartPre=-/usr/bin/podman rm fscon
ExecStart=/usr/bin/podman run \
	--env CRYPTDOM=host.example.com \
	--env DOMAIN_NAME=host.example.com \
	--env DOMAIN=host.example.com \
	--env INTERNAL_TLS_ONLY=true \
	--env CONHOSTNAME=host.example.com \
	-v certbot_etc-letsencrypt:/etc-letsencrypt \
	--name=fscon \
	--network=host \
	gidmoth/fscon:0.0.8
ExecStop=/usr/bin/podman stop fscon
ExecStopPost=/usr/bin/podman rm fscon

[Install]
WantedBy=multi-user.target default.target
```

Host networking is recommended: the freeswitch install in the image is by no means prepared to handle NAT.

For a reference to all available environment variables and their default values please look into the [Dockerfile](https://github.com/gidmoth/freeswitch-connector/blob/main/Dockerfile).

Normally you would also want to keep `/etc/freeswitch` in a volume, as well as `/static` and `/recordings`, which contain things you don't want to be lost on every restart. So you should also mount those as named volumes like so in your service file:

```
ExecStart=/usr/bin/podman run \
	...
	-v certbot_etc-letsencrypt:/etc-letsencrypt \
    -v fscon_etc-freeswitch:/etc/freeswitch \
    -v fscon_static:/static \
    -v fscon_recordings:/recordings \
	...
	gidmoth/fscon:0.0.8
```

Now you can navigate to your new conference system in the browser. The default user is `defaultuser` and his pw is `napw`. If you want to change this before startup please do so in the [directory file](https://github.com/gidmoth/freeswitch-connector/blob/main/etc-freeswitch/directory/team/20000.xml) before building the container. To change after startup you should create a new user in the team context, login as the new user, and then delete the defaultuser. Doing it another way will probably lock you out of your new system.

##### TLS

Among the scripts `entrypoint.sh` will source by default is [`02-letsencrypt-cert-load.sh`](https://github.com/gidmoth/freeswitch-connector/blob/main/entrypoint.d/02-letsencrypt-cert-load.sh). That's an example script to use a key / cert pair from letsencrypt for freeswitchs tls on SIP and WebSocket. As you can see, it also references an environment variable, `$CRYPTDOM`, and uses it to build the path where it expects the files from letsencrypt to be present. Since certificates need updating from time to time the example script employs the same logic as the script for `vars.xml` for updating. In case you use letsencrypt you could use this script unmodified as follows.

First, get your key / cert pair from letsencrypt and put them in a named volume in your container runtime:

```
podman run --rm -it --name certbot \
  --volume=certbot_var-lib-letsencrypt:/var/lib/letsencrypt \
  --volume=certbot_etc-letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --manual --preferred-challenges=dns \
  --email foo@bar.baz \
  --server https://acme-v02.api.letsencrypt.org/directory \
  --agree-tos \
  -d host.example.com
```

You'll have to run this interactively since the domain-verification requires your input, also you want to copypaste the verification-code to form the right dns entry for your domain, here: `host.example.com`. You should give your real email address here to get notified when your cert expires. When that happens simply run the same command to get a renewed cert.

Second, mount the same named volume to the freeswitch-connector container, and set the `$CRYPTDOM` variable to the name of your domain (to get the path right). This may look like so:

```
podman run \
	--env CRYPTDOM=host.example.com \
    ...
	-v certbot_etc-letsencrypt:/etc-letsencrypt \
	...
	gidmoth/fscon:0.0.8
```

Connector, as configured in the provided Image, will use the same directory as freeswitch to get his key / cert pair, so there's no extra attention required.

To recopy a renewed / changed certificate from letsencrypt, just remove `/etc/freeswitch/workingcerts` and restart the container, the [example script](https://github.com/gidmoth/freeswitch-connector/blob/main/entrypoint.d/02-letsencrypt-cert-load.sh) will run again.

If you use another certificate authority it may be harder. First, you should disable the example-script:

`mv 02-letsencrypt-cert-load.sh 02-letsencrypt-cert-load.sh.disabled`

What you'll have to do then is to ensure freeswitch and connector find the right files for their TLS in `/etc/freeswitch/tls`. I had success with a key / cert from comodo after downloading the intermediate signing cert doing the following:

First, copy your key to `/etc/freeswitch/tls/privkey.pem`

In my case, my cert was named `host_example_com.crt`. The intermediates were named `SectigoRSADomainValidationSecureServerCA.crt`, and `USERTrustRSAAAACA.crt`, and the comodo root was named `AAACertificateServices.crt`.

I copied all to `/etc/freeswitch/tls` and did the following:

```
cat host_example_com.crt SectigoRSADomainValidationSecureServerCA.crt USERTrustRSAAAACA.crt > chain.pem
cp host_example_com.crt cert.pem
cat chain.pem AAACertificateServices.crt > fullchain.pem
cat cert.pem  privkey.pem fullchain.pem > wss.pem
cat fullchain.pem privkey.pem  >  agent.pem
cat chain.pem  > cafile.pem
```

That worked for me. Please consult the freeswitch docs for further information.

### Bare metal

TODO