_I'm about to reimplement this project in javascript, with node.js and express, partly to learn the framework better, and also to make it easier for a few friends to work with. As a result, so I'm pushing this to github now, to shame me into finishing it more quickly._

_do please bear with me while I well… make it work, but hopefully the readme below gives an idea of what I'm trying to build here_

## HereNow - a passive location based way to put an API on a building

HereNow is a utility to add an API onto physical spaces by making educated guesses about who's in physical environment, based on whether laptops, iPads or smart phones they own are detected on networks serving the space at given moment. 

##### Right now, the assumption here is that a space only has one wifi point, and here now only serves one network.

### Why would I care?

In short, HereNow lets you do two things, which I don't see an easy way to do currently, without relying on every device having GPS tracking, and phone home to google/apple/$tech_giant each time.

It lets you:

1) Query a number of spaces you have an existing relationship with (your office, a coworking space, your own home), to see if there's anyone in them, or crucially if people you know are there.

2) Put an callback API onto that space, so that any kind of arbitrary GET or POST can be fired in response your or someone you know being around, without them needing to manually do this themselves (i.e. let me set an auto-checkin on foursquare when I walk into a space, or run my own set of predefined events when I enter or leave). 

I'm guessing you're a developer if you're reading this, so I'm hoping I don't have to elaborate too deeply on why being able build presence based mashups is interesting.

### How to install

HereNow uses node.js (sorry Sam), and `arp` and `nmap`, two commandline tools that exist on the *nix style operating systems.

#### On a mac:

You should alreadu have `arp` on any version of OS X up to Lion (I'm not sure about Mountain Lion yet)

To get nmap, homebrew is your friend:

    brew install nmap

#### On linux

Assuming you're on Debian/Ubuntu if you're using Linux, `arp` you probably have too, but you may need to fetch `aptitude `:

    sudo aptitude install nmap

From there, you should be able to just use npm from within the app, to fetch all the relevant modules for javascript:

    npm install


### How to use HereNow

HereNow uses `nmap` and `arp` to populate a list of _Devices_, that are then matched to _Owners_.

When you run the Herenow app, and visit the server it will maintain a list of Owners currently in a given space, that is updated whenever someone leaves or enters, and make this list available at a given url accessible from outside the space too.

*Note - you can only see the full list of devices when inside the building yourself. From the outside, you can only see the list of users.*

_insert picture here of list of people, and their gravatars in one group, then a collapsible list of machines, and a collapsible list of unknown devices_

If you prefer to see this information over an API, you can hit the same url, but appending with the suffix `/owners`, to get a json array of the people listed, with a timestamp of the request made.

If you know they are in the space, you can also fetch just the json representation of that single owner, like so:

    GET /owners/:username.json



### Key concepts for Herenow

#### Devices

You can think of anything with a network signature as being a device - an iPad, an Android phone, a laptop, or shared Printer, etc.

You might think of the json representing them like so:

    { 
      mac:
      ip:
      first_appeared:
      owner:
      guid:
      status:
    }

#### Owners

You can think of an Owner as a either a Person, or a bucket for grouping devices into like "Unknown" (devices which we don't know anything about ), or "Handy shared machines" (having a shared printer on the network doesn't really signify any one person being present, but it is known).

As you get a better idea of what devices are on a network, and whose they are, the `unknown` bucket is likely to become smaller.

Again, if you were think of them in json, they'd like a bit like this:

    {
      name:
      username:
      devices: (an array, keyed on their guid)
      email_address:
      gravatar:
      status:
    }

#### Matching devices to owners 

The single most important feature of HereNow, is literally being able to see 'who is Here Now' - both from within a building, and from the outside, and then taking action based on this information.

If you're connecting to the Herenow server inside the building, you can associate devices with other owners, by POSTing, to the user resource that represents that user, with an array of uuid's of devices to associate with them. Devices can only ever belong to one owner, so POSTing a device to one owner will remove them from any others.

    POST /owners/:username

    POST /owners/mrchrisadams

To remove the device from the user, make a DELETE call to that nested device under the user resource.

    DELETE /owners/:username/:guid

    DELETE /owners/mrchrisadadams/A8e32RkfQ44eAA8e32RkfQ44eAA8e32RkfQ44eA

This has the affect of associating the device with `unknown` bucket once again, so it can be reassigned to someone else.



### How HereNow works

There are three components that keep an upto date list of owners and devices. An `nmap` call fills the arp cache on a given network, with mac addresses and coresponding ip addresses. A subsequent call to `arp` then fetches this cache, and the main Herenow app, checks the cache against the current list of devices stored in redis, based on their mac address.

#### If new devices exist in the arp cache

a) the new device is created and the relevant details stored in redis, and a `new device` event is triggered

b) the device is recognised as belonging to a current owner, and `status:online` event is triggered for that device.

Alternatively…

#### If a device no longer exists in the cache after being discovered once before:

A `status:offline` event is triggered for the device. 

If this is the only online device associated with an owner, then that owner is removed from the current list of visible owners for the space, and an appropriate `owner offline` event is triggered for any browser clients that are connected.

### API summary

#### Endpoints

    GET owners
    GET owners/:username

From within the network:

    POST    owners/:username/:device_guid
    GET     owners/:username/:device_guid
    DELETE  owners/:username/:device_guid

#### Events

Devices

    status:online
    status:offline

Owner

    owner:online
    owner:offline
    owner:updated