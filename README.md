JS-TDA - A browser-based rewrite of Java's Thread Dump Analyzer
=============
[![Build Status](https://travis-ci.org/kog/js-tda.svg?branch=master)](https://travis-ci.org/kog/js-tda)

What is this?
--
JS-TDA is what the name implies: a browser-based JavaScript reimplementation of the original [Java Thread Dump Analyzer](https://java.net/projects/tda) by Ingo Rockel. Given a log file with one or more standard Sun JDK dump files, JS-TDA will provide users the ability to figure out what their Java app is actually doing.

**Thread dump: thread expanded, tooltip on dump name**

![Thread Dump](https://github.com/kog/js-tda/raw/master/docs/js-tda-dump-index.png)

**Monitor view: monitor expanded, tooltip on long monitor name**

![Monitor View](https://github.com/kog/js-tda/raw/master/docs/js-tda-monitor-view.png)

Why
--
I've been using TDA for a long, long time. It's a fantastic, no frills utility that helps me figure out what a given process is up to. I've worked at a number of larger companies where, for a number of reasons, we'd wind up with production issues. Given that I have experience with production troubleshooting I tend to be the person my org calls at 0200 when "production is down."

A few months ago I was seconded to another team and someone came by claiming that my adopting team's code was completely awful, and that it was stuck in some sort of deadlock (fast forward: the nasty fellow complaining actually wrote the offending code... whoops...). After mediating the ensuing argument, I eventually got ops to give me a thread dump of what it was doing. That's when I realized that TDA didn't support Java 8 dumps.

I spent some time nosing around the TDA forums and mailing lists and noticed that the last release had been in [2010](https://java.net/projects/tda/lists/announce/archive/2010-02/message/0). At the time the project looked dead. I also ran across the cool [Spotify TDA](https://github.com/spotify/threaddump-analyzer), but the wasn't really what I wanted. I realize there are other tools than TDA, such as the [IBM thread analyzer](https://www.ibm.com/developerworks/community/groups/service/html/communityview?communityUuid=2245aa39-fa5c-4475-b891-14c205f7333c) and [Samurai](http://samuraism.jp/samurai/en/index.html). But damnit, I like TDA.

I considered forking TDA, but I imagine there are probably issues with assigning IP, not to mention handling releases. More importantly the code is old, written in a particular style, and has a lot of nuances that I'd have to understand in order to not break the established userbase. The technology works, but it has also suffered from bitrot. At this point I thought about writing a new TDA, using a more modern set of tools.

Looking at the TDA source, as well as the Spotify analyzer I realized that writing my own dump parser wouldn't be particularly difficult (since they did all the hard work...). Web development has come a long way, to the point where I could easily write a "serverless" page, doing all the parsing and rendering on the client using JavaScript. This is important, because usually employers don't want you handing out their thread dumps...

What about TDA 2.3?
--
Yeah, so funny story... Three months ago when I originally decided to write JS-TDA, I did my due dilligence and it looked like TDA was about as dead as possible. I spent a month, maybe six weeks, fleshing out JS-TDA in my "spare time." And just when I'm doing my first push to GitHub and am writing my README, I go to the java.net project page to grab links. That's when I noticed that Ingo Rockel moved TDA to [GitHub](https://github.com/irockel/tda), and released [2.3](https://github.com/irockel/tda/releases/tag/2.3) - the first release in six years - *four days ago.* Great minds think alike?

Why bother releasing JS-TDA then? Well, it's done and it works. It's useful to me, and it was a great learning experience. I can hit it from anywhere with a browser, and I know that it will keep the confidentiality of whatever dump I'm dissecting. Since I wrote it I can also add whatever features I want. And who knows, maybe one day one of my admiring fans will get me my dream job...

OK, so the actual TDA is older and more mature. It has features JS-TDA doesn't, and dollars to donuts, Ingo knows a lot more about this stuff than I do. Go use the actual TDA. Unless, of course, you need something web-based, or want my sweet, sweet UI. Or maybe I'll come up with a cool idea you need.

Using it
--
 * Run the latest build, hosted via [GitHub user pages](https://kog.github.io/js-tda/)
 * Using a dist package from [GitHub releases](https://github.com/kog/js-tda/releases)
 * Grab the source and build it (see below)

Build Instructions
--
Like all the new web stuff, you're going to need a few things:
 * [Node.js](https://nodejs.org/en/) - the build chain is unfortunately Node browser-based
 * [Bower](https://bower.io/) - for dependency management
 * [Gulp](http://gulpjs.com/) - the build tool

 Once you have the toolchain installed, you're going to want to do the following:
 ```sh
npm install && bower install && gulp
 ```

 This will grab all the NPM modules, grab all the Bower dependencies and then call Gulp to do all the building and packaging. Artifacts will be in the newly created `dist` directory:

 ```
 ├───debug                                         
 │   │   index.html                                
 │   │   js-tda.css                                
 │   │   js-tda.js                                 
 │   │                                             
 │   └───fonts                                     
 │           glyphicons-halflings-regular.eot      
 │           glyphicons-halflings-regular.svg      
 │           glyphicons-halflings-regular.ttf      
 │           glyphicons-halflings-regular.woff     
 │           glyphicons-halflings-regular.woff2    
 │                                                 
 └───release                                       
     │   index.html                                
     │   js-tda.min.css                            
     │   js-tda.min.js                             
     │                                             
     └───fonts                                     
             glyphicons-halflings-regular.eot      
             glyphicons-halflings-regular.svg      
             glyphicons-halflings-regular.ttf      
             glyphicons-halflings-regular.woff     
             glyphicons-halflings-regular.woff2    
 ```

The "debug" build uses non-minified JS/CSS, and the "release" build uses minified assets. There are no external dependencies, just open the appropriate `index.html` in your browser.
