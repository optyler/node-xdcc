/*
 * author: Mozilla
 * link: http://www-archive.mozilla.org/projects/rt-messaging/chatzilla/irc-urls.html
 * link: http://lxr.mozilla.org/mozilla/source/extensions/irc/js/lib/irc.js#3553
 * description: Off the top of my head, here is the syntax of an irc: url, as implemented in ChatZilla. This syntax is derived from the draft RFC, "irc: URL scheme" by Mandar Mirashi, August 29, 1996.
 * return an object that describes the irc url scheme as follow 
{
  "spec": "irc://irc.toto.net/#chan",
  "scheme": "irc",
  "host": "irc.toto.net",
  "target": "#chan",
  "port": 6667,
  "msg": "",
  "pass": null,
  "key": null,
  "charset": null,
  "needpass": false,
  "needkey": false,
  "isnick": false,
  "isserver": true
} 
*/


function parseIRCURL(url)
{
    var specifiedHost = "";

    var rv = new Object();
    rv.spec = url;
    rv.scheme = url.split(":")[0];
    rv.host = null;
    rv.target = "";
    rv.port = (rv.scheme == "ircs" ? 9999 : 6667);
    rv.msg = "";
    rv.pass = null;
    rv.key = null;
    rv.charset = null;
    rv.needpass = false;
    rv.needkey = false;
    rv.isnick = false;
    rv.isserver = false;

    if (url.search(/^(ircs?:\/?\/?)$/i) != -1)
        return rv;

    /* split url into <host>/<everything-else> pieces */
    var ary = url.match(/^ircs?:\/\/([^\/\s]+)?(\/[^\s]*)?$/i);
    if (!ary || !ary[1])
    {
        dd("parseIRCURL: initial split failed");
        return null;
    }
    var host = ary[1];
    var rest = arrayHasElementAt(ary, 2) ? ary[2] : "";

    /* split <host> into server (or network) / port */
    ary = host.match(/^([^\:]+)(\:\d+)?$/);
    if (!ary)
    {
        dd("parseIRCURL: host/port split failed");
        return null;
    }

    specifiedHost = rv.host = ary[1].toLowerCase();
    if (arrayHasElementAt(ary, 2))
    {
        rv.isserver = true;
        rv.port = parseInt(ary[2].substr(1));
    }
    else
    {
        if (specifiedHost.indexOf(".") != -1)
            rv.isserver = true;
    }

    if (rest)
    {
        ary = rest.match(/^\/([^\?\s\/,]*)?\/?(,[^\?]*)?(\?.*)?$/);
        if (!ary)
        {
            dd("parseIRCURL: rest split failed ``" + rest + "''");
            return null;
        }

        rv.target = arrayHasElementAt(ary, 1) ? ecmaUnescape(ary[1]) : "";

        if (rv.target.search(/[\x07,\s]/) != -1)
        {
            dd("parseIRCURL: invalid characters in channel name");
            return null;
        }

        var params = arrayHasElementAt(ary, 2) ? ary[2].toLowerCase() : "";
        var query = arrayHasElementAt(ary, 3) ? ary[3] : "";

        if (params)
        {
            params = params.split(",");
            while (params.length)
            {
                var param = params.pop();
                // split doesn't take out empty bits:
                if (param == "")
                    continue;
                switch (param)
                {
                    case "isnick":
                        rv.isnick = true;
                        if (!rv.target)
                        {
                            dd("parseIRCURL: isnick w/o target");
                            /* isnick w/o a target is bogus */
                            return null;
                        }
                        break;

                    case "isserver":
                        rv.isserver = true;
                        if (!specifiedHost)
                        {
                            dd("parseIRCURL: isserver w/o host");
                            /* isserver w/o a host is bogus */
                            return null;
                        }
                        break;

                    case "needpass":
                    case "needkey":
                        rv[param] = true;
                        break;

                    default:
                        /* If we didn't understand it, ignore but warn: */
                        dd("parseIRCURL: Unrecognized param '" + param +
                           "' in URL!");
                }
            }
        }

        if (query)
        {
            ary = query.substr(1).split("&");
            while (ary.length)
            {
                var arg = ary.pop().split("=");
                /*
                 * we don't want to accept *any* query, or folks could
                 * say things like "target=foo", and overwrite what we've
                 * already parsed, so we only use query args we know about.
                 */
                switch (arg[0].toLowerCase())
                {
                    case "msg":
                        rv.msg = ecmaUnescape(arg[1]).replace("\n", "\\n");
                         break;

                    case "pass":
                        rv.needpass = true;
                        rv.pass = ecmaUnescape(arg[1]).replace("\n", "\\n");
                        break;

                    case "key":
                        rv.needkey = true;
                        rv.key = ecmaUnescape(arg[1]).replace("\n", "\\n");
                        break;

                    case "charset":
                        rv.charset = ecmaUnescape(arg[1]).replace("\n", "\\n");
                        break;
                }
            }
        }
    }

    return rv;
}

function arrayHasElementAt(ary, i)
{
    return typeof ary[i] != "undefined";
}

function ecmaUnescape(str)
{
    function replaceEscapes(seq)
    {
        var ary = seq.match(/([\da-f]{1,2})(.*)|u([\da-f]{1,4})/i);
        if (!ary)
            return "<ERROR>";

        var rv;
        if (ary[1])
        {
            // two digit escape, possibly with cruft after
            rv = String.fromCharCode(parseInt(ary[1], 16)) + ary[2];
        }
        else
        {
            // four digits, no cruft
            rv = String.fromCharCode(parseInt(ary[3], 16));
        }

        return rv;
    };

    // Replace the escape sequences %X, %XX, %uX, %uXX, %uXXX, and %uXXXX with
    // the characters they represent, where X is a hexadecimal digit.
    // See section B.2.2 of ECMA-262 rev3 for more information.
    return str.replace(/%u?([\da-f]{1,4})/ig, replaceEscapes);
}

module.exports = {
	parse: parseIRCURL
}
