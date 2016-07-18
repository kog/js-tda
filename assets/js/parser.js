window.Parser = function (file) {
    var dumps = [];
    var currentDump;

    this.getDumps = function () {
        return dumps;
    };

    function parse() {
        var index = 0;
        var dumpLines = file.split('\n');
        var currentThread;
        var inOwnableSynchronizers = false;

        dumpLines.forEach(function parseLine(rawLine) {
            // We'll use the date stamps to delineate between multiple dumps in a file. It would really be nice if there
            // was some sort of standard for this...
            if (rawLine.match(/\d+-\d+-\d+ \d\d:\d\d:\d\d/)) {
                createDump(rawLine);
            }
            else {
                var line = rawLine.trim();

                if (line.length) {
                    // The next line after a date marker is the type of dump.
                    if (line.startsWith('Full thread dump')) {
                        // If someone handed us a dump missing a header, we'll just have to go with a placeholder name.
                        if (currentDump == undefined) {
                            createDump('Unnamed Dump')
                        }
                        
                        currentDump.dumpType = rawLine;
                    }

                    // If the line starts with a quote, it's the start of a new thread
                    else if (line.startsWith("\"")) {
                        inOwnableSynchronizers = false;

                        currentThread = new Thread(index++, rawLine);
                        currentDump.threads.push(currentThread);
                    }

                    // We're not going to do anything with stack frames, or the Thread.state. We're going to pull the
                    // latter out of the name of the thread, like TDA does.
                    else if (line.startsWith('at') || line.startsWith('java.lang.Thread.State')) {
                        currentThread.stack.push(rawLine);
                    }

                    // The only way to know that following lines are synchronizers is to keep some state here.
                    else if (line == 'Locked ownable synchronizers:') {
                        inOwnableSynchronizers = true;
                    }

                    // This line is some sort of interaction with a monitor. We'll keep some extra stats on this.
                    else if (line.startsWith('-')) {
                        if (!inOwnableSynchronizers) {
                            currentThread.stack.push(rawLine);
                            markState(currentThread, rawLine);
                        } else {
                            // TDA actually ignores the synchronizers, merely printing them in the stack trace. We'll store ours
                            // in a separate stack so that we don't try and linkify them: we may not be able to tell a synchronizer
                            // from a monitor we actually care about... Also makes display easier.
                            currentThread.lockedOwnableSynchronizers.push(rawLine);
                        }
                    }

                    // Write down the JNI ref count for anyone curious.
                    else if (line.startsWith('JNI global references: ')) {
                        currentDump.jniGlobalReferences = parseInt(line.split(':')[1]);
                    }

                    // TODO: add heap usage parsing. Maybe add another tab to UI for this info?

                    // Otherwise, log that bad boy.
                    else {
                        console.log('Unparsed dump line: ' + rawLine);
                    }
                } else {
                    // If we've hit a blank line, we're in-between threads and should figure out which monitors were involved.
                    if (currentThread != undefined) {
                        classifyMonitors(currentThread);
                    }
                }
            }
        });

        // Thread dumps end abruptly sometimes, so if we haven't seen this thread already, let's make sure to classify all our monitors.
        if (currentThread != undefined) {
            classifyMonitors(currentThread);
        }

        function createDump(name) {
            currentDump = new Dump(name);
            dumps.push(currentDump);
        }

        function markState(thread, line) {
            var matches = /- (.*) (<.*>) (\(.*\))/.exec(line);
            var state = matches[1].trim();
            var monitor = findOrCreateMonitor(matches[2], matches[3]);
            var action = 'locking';

            if (state == 'waiting on' || state == 'parking to wait for') {
                thread.sleeping = true;
                action = (state == 'waiting on') ? 'sleeping' : 'locking';
            } else if (state == 'waiting to lock') {
                thread.waiting = true;
                action = 'waiting';
            } else if (state == 'locked') {
                thread.locking = true;
            }

            markThreadForMonitor(monitor, currentThread, action);
        }

        function findOrCreateMonitor(address, description) {
            var element = currentDump.findMonitor(address);

            if (!element) {
                element = new Monitor(address, description);
                currentDump.monitors.push(element);
            }

            return element;
        }

        function markThreadForMonitor(monitor, thread, state) {
            var element = monitor.findOrCreateMonitorThreadRelationship(thread);

            element[state] = true;
            monitor.counts[state] += 1;
        }

        function classifyMonitors(thread) {
            if (thread.sleeping) {
                addThreadToCollectionIfUnique(thread, currentDump.sleeping);
            }

            if (thread.waiting) {
                addThreadToCollectionIfUnique(thread, currentDump.waiting);
            }

            if (thread.locking) {
                addThreadToCollectionIfUnique(thread, currentDump.locking);
            }

            // Sort each of our monitors' thread references for easily telling what locks a given monitor.
            for (var i = 0; i < currentDump.monitors.length; i++) {
                currentDump.monitors[i].threads.sort(function(lhs, rhs) {
                    return rhs.locking && !rhs.sleeping && !rhs.waiting
                })
            }
        }

        function addThreadToCollectionIfUnique(thread, collection) {
            // Since we're generally parsing this from end to end, checking the last item for dupes should be enough...
            if (collection.length == 0 || collection[collection.length - 1].threadId != thread.threadId) {
                collection.push(thread);
            }
        }
    }

    parse();
};

function Dump(dumpDate) {
    this.date = dumpDate;
    this.dumpType = 'unknown';
    this.jniGlobalReferences = 0;

    this.threads = [];
    this.sleeping = [];
    this.waiting = [];
    this.locking = [];
    this.monitors = [];

    this.findMonitor = function(address) {
        return this.monitors.find(function(monitor) {
            return monitor.address == address;
        });
    };
}

function Thread(index, line) {
    // Keep a synthetic index so we can uniquely identify a thread within a given dump.
    this.index = index;

    // Track this for our monitor matching.
    this.sleeping = false;
    this.waiting = false;
    this.locking = false;

    this.rawLine = line;

    var endOfThreadName = line.lastIndexOf("\"");
    this.name = line.substr(line.indexOf("\"") + 1, endOfThreadName - 1);

    // Masking off the thread name makes it a lot easier to parse the rest of the line...
    var restOfLine = line.substr(endOfThreadName);

    this.id = parseInt(getMatchOrDefault(restOfLine, / #(\d+) /, undefined)) || undefined;
    this.daemon = restOfLine.indexOf('daemon') > 0;
    this.priority = parseInt(getMatchOrDefault(restOfLine, / prio=(\d+) /, undefined)) || undefined;
    this.osPriority = parseInt(getMatchOrDefault(restOfLine, / os_prio=(\d+) /, undefined)) || undefined;
    this.threadId = getMatchOrDefault(restOfLine, / tid=(\S+) /, undefined);
    this.nativeId = getMatchOrDefault(restOfLine, / nid=(\S+) /, undefined);
    this.state = getMatchOrDefault(restOfLine, / nid=\S+ ([^\[]*)/, undefined).trim();
    this.addressRange = getMatchOrDefault(restOfLine, /(\[.*])$/, undefined);

    this.stack = [];
    this.lockedOwnableSynchronizers = [];

    function getMatchOrDefault(string, regex, defaultValue) {
        var match = regex.exec(string);
        return (match === null) ? defaultValue : match[1];
    }
}

function Monitor(address, description) {
    this.address = address;
    this.description = description;
    this.threads = [];
    this.counts = {'sleeping': 0, 'locking': 0, 'waiting': 0};

    this.findOrCreateMonitorThreadRelationship = function(thread) {
        var element = this.threads.find(function(relationship) {
            return relationship.thread.index == thread.index;
        });

        if (element == undefined) {
            element = new MonitorThreadRelationship(thread);
            this.threads.push(element);
        }

        return element;
    }
}

function MonitorThreadRelationship(thread) {
    this.thread = thread;
    this.sleeping = false;
    this.waiting = false;
    this.locked = false;
}