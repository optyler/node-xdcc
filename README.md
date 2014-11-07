NODE-XDCC
=========

This fork is based on [another fork that uses stream callbacks](https://github.com/metakirby5/node-sxdcc) rather than writing to a file like in [the original project](https://github.com/pushrax/node-xdcc).

It aims to give more options on the command line and/or by a config file... _Somewhere between common DCC clients and [xdccget.pl](https://github.com/irssi/scripts.irssi.org/blob/gh-pages/scripts/xdccget.pl) script for [irssi](http://www.irssi.org/)_.

TODOs
----

Here is a first list of options that I think will be useful

* Add command line options
	* `--config`: Path to a config file.
	* `--connect-and-join`: Connect to an irc server and join chanel eg: [irc://network.com/channel](irc://network.com/channel).
	* `--download-file`: Input file that describes jobs.
	* `--download-path`: Destination path for downloads.

* Write a packetNumber parser that should parse correctly :
	* `1 2 5`: query files `1, 2, 5`
	* `1,2,5`: query files `1, 2, 5`
	* `1-10`: query files `1, 2, 3, 4, 5, 6, 7, 8, 9, 10`
	* `1-5,10`: query files `1, 2, 3, 4, 5, 10`
	* `1-5 10`: query files `1, 2, 3, 4, 5, 10`
	* `1-5 8-10`: query files `1, 2, 3, 4, 5, 8, 9, 10`

Download and Install
-------

Get the project and install dependencies:

```sh
git clone git@github.com:optyler/node-xdcc.git
cd node-xdcc
npm install
```

Sample job file that asks to download 2 files at a time from 2 distinct bots on the same network/channel :

```json
'jobs' : {
	'parallelTasks': 2,
        'channel' : {
		'uri' : 'irc://network.com/#channel',
		'bot' : {
			'name': 'botName1',
			'packets': '1-5'
            	},
		'bot' : {
			'name': 'botName2',
			'packets': '1-5'
		}
        }
}
```

Usage
-----

```sh
node-xdcc.js [OPTIONS]
```

