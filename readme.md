# ZOMG NOTHING WORKS

## _I'm about to reimplement this project in javascript, with node.js and express, partly to learn the framework better, and also to make it easier for a few friends to work with. As a result, so I'm pushing this to github now, to shame me into finishing it more quickly._

## _do please bear with me while I well… make it work, but hopefully the readme below gives an idea of what I'm trying to build here_





## HereNow - a passive location based way to put an API on a building

So you've heard of Foursqaure, and Gowalla, and you're interested in
location based tools, but you also like Sinatra, and you like the
control that running your own instance of Wordpress or Jekyll affords,
compared to using Blogger.

HereNow is a utility to add an API onto physical spaces by making
educated guesses about who's in physical environment, based on whether
laptops, iPads or smart phones they own are detected on networks serving
the space.

### Why would I care?

In short, HereNow exists to do two things:

1) Give you the abililty to query spaces, to see how busy they are, if
it's worth heading there to catch up with friends.

2) Put an callback API onto that space, so that any kind of arbitrary
GET or POST can be fired in response to you or your friends apppearing
or disappearing on the network, without them needing to check-in with
any app.

I'm guessing you're a developer if you're reading this, so I'm hoping I
don't have to elaborate too deeply on why being able build presence
based mashups is interesting.

### How to install

HereNow is based around three main gems: 

*Sinatra* - for handling HTTP based API calls
*DataMapper* - for providing a lightweight persistence layer
*Titan* - for providing a faily OS agnostic handling of long running daemon processes.*

* That isn't tied to any specific flavour of cron, upstart, runit or startup script on your
*nix flavoured computer.


    git clone ADDRESS

    gem bundle

    herenow start

Once you've got the daemon running you can hit either hit it on port
4000, or if you have control, over DNS, serve it from herenow, inside your
subnet, or http://herenow.in/LOCATION_NAME if you want to setup a way to reach it
quickly without needing to fiddle with DNS too much.

### Using HereNow

The single most important feature of HereNow, is literally being able to
see 'who is Here Now' - both from within a building, and from the
outside, and then taking action based on this information.
