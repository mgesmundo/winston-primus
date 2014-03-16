# winston-primus

This is a generic websocket Transport for [winston][2] based on [primus][1]. Thanks to Primus you can change your websocket library without changes your application.

## Installation

Install `winston-primus` as usual:

    $ npm install winston-primus

## Options

When you add `winston-primus` to your [winston][2] logger, you can provide this options:

* __level__: (Default: 'debug') Required log level
* __host__: (Default: 127.0.0.1) Remote host of the websocket logging endpoint
* __port__: (Default: 4000) Remote port of the websocket logging endpoint
* __timestamp__: (Default: false) Boolean flag indicating if we should add a timestamp to the output. If function is specified, its return value will be used instead of timestamps.
* __transformer__: (Default: 'websocket') The transformer used by Primus
* __pathname__: (Default: '/winston') The URL namespace that Primus can own
* __parser__: (Default: 'json') Message encoder for all communication

## Usage

To use this plugin you must have a websocket logging endpoint (server) and at least a logger (client).

### Server

Create your own server use this simple example:

    // dependencies
    var http      = require('http')
      , Primus    = require('primus')
      , winston   = require('winston');

    // create the server
    var server = http.createServer(function (req, res) {
      res.end();  // empty response
    });

    // create a customized Console Transport
    var consoleTransport = new winston.transports.Console({
      level: 'debug',
      colorize: true,
      timestamp: false
    });

    // create new Logger
    var logger = new (winston.Logger)({
      transports: [
        consoleTransport // add other Transport types if you need
      ],
      exitOnError: true
    });

    // wait for incoming logs
    var primus = new Primus(server, {
      transformer: 'websockets',
      pathname: '/winston'
    });

    primus.on('connection', function connection(spark) {
      logger.info('new connection from %s:%s', spark.address.ip, spark.address.port);

      spark.on('data', function data(packet) {
        logger.log(packet.level, packet);
      });
    });

    server.listen(4000, '127.0.0.1');

    logger.info('server started');

Save as _server.js_ and start the server:

    $ node server.js

    info: server started

### Client

Into the client simply add `winston-primus` as new Transport to your [winston][2] instance:

    var winston = require('winston');
    var Primus = require('winston-primus').Primus;
    winston.add(Primus, { level: 'debug', timestamp: new Date() });
    winston.info('Debug text only message');
    winston.info('Debug exented message', { custom: 'Test Object Log Message', error: false });
    winston.log('info', 'Test Log Message', { anything: 'This is metadata' });

Save as _client.js_ and start it:

    $ node client.js

    info: Test Log Message anything=This is metadata

Now in your previous terminal session (that when the server is running) you see this new lines:

    info: new connection from 127.0.0.1:50025
    debug:  level=debug, message=Debug text only message, timestamp=2014-03-16T07:23:47.009Z
    debug:  custom=Test Object Log Message, error=false, level=debug, message=Debug exented message, timestamp=2014-03-16T07:23:47.010Z
    info:  anything=This is metadata, level=info, message=Test Log Message, timestamp=2014-03-16T07:23:47.011Z

Note that into the client terminal you see only the _info_ message whereas into the server terminal you see all messages because the server has a customized level of the Console Transport.

For more information please refer to [winston][2] and [primus][1] documentations.

## Run Tests

Like other Transport plugins, all of the winston-primus tests are written in vows, and designed to be run with npm.

    $ npm test



[1]: https://npmjs.org/package/primus
[2]: https://npmjs.org/package/winston
