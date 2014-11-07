#!/usr/bin/env node

var irc = require('irc'),
    sxdcc = require('../lib/sxdcc'),
    parseIRCURL = require('../lib/parseIRCURL'),
    fs = require('fs'),
    nconf = require('nconf'),
    ProgressBar = require('progress');

/**
 * generate random nickname
 */
function generateNickname() {
	return 'opty-' + Math.random().toString(36).substr(7, 3);
}

/**
 * parse command line and configuration file
 */
nconf.argv({
	// required
	'nickname' : {
		describe: 'nickname to use for the connection',
		default: generateNickname()
	},
	'uri' : {
		describe: 'irc uri to connect to (eg: irc://irc.otaku-irc.fr/#Marvel_World',
		demand: true
	},
	'bot' : {
		describe: 'bot name to query packs from',
		demand: true
	},
	'pack' : {
		describe: 'pack to download from bot',
		demand: true
	},
	// optional
	'threads' : {
		describe: 'specify how much parallel download you can do if you required packs from several bots',
		default: 2
	}
})
.file({ file: './config.json' });

var user = nconf.get('nickname');
var bot = nconf.get('bot');
var pack = nconf.get('pack');
var parsedURI = parseIRCURL.parse(nconf.get('uri'));
var channels = [ parsedURI.target ];
var progress;

console.log('Connecting...');

var client = new irc.Client(parsedURI.host, user, {
  channels: channels,
  userName: user,
  realName: user
}).on('join', function(channel, nick, message) {

  if (nick !== user) return;
  console.log('Joined', channel);

  var progress,
      last = 0;

  sxdcc(client, bot, pack, 0, function(err, conn) {
    if (err) {
      console.log(err);
      return;
    }
    conn.on('connect', function(meta) {
      console.log('Connected: ' + meta.ip + ':' + meta.port);
      progress = new ProgressBar('Downloading... [:bar] :percent, :etas remaining', {
        incomplete: ' ',
        total: meta.filesize,
        width: 20
      });
      this.pipe(fs.createWriteStream(meta.filename));
    })

    .on('progress', function(recieved) {
      progress.tick(recieved - last);
      last = recieved;
    })

    .on('error', function(err) {
      console.log('XDCC ERROR: ' + JSON.stringify(err));
    });
  });
})

.on('error', function (err) {
    console.log("IRC ERROR: " + JSON.stringify(err));
})

.on('notice', function(from, to, message) {
  if (to == user && from == bot) {
    console.log("[notice]", message);
  }
});
