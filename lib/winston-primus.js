//noinspection SpellCheckingInspection
/**
 *
 * A generic websocket transport for winston based on primus
 *
 * ### License
 *
 * Copyright (c) 2013-2014 Yoovant by Marcello Gesmundo. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above
 *      copyright notice, this list of conditions and the following
 *      disclaimer in the documentation and/or other materials provided
 *      with the distribution.
 *    * Neither the name of Yoovant nor the names of its
 *      contributors may be used to endorse or promote products derived
 *      from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

var http      = require('http')
  , Primus_   = require('primus')
  , util      = require('util')
  , winston   = require('winston')
  , common    = require('winston/lib/winston/common')
  , Transport = winston.Transport;

//
// ### function Primus (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Primus transport object responsible
// for push log messages and metadata using primus messages
//
var Primus = exports.Primus = function (options) {
  options = options || {};

  Transport.call(this, options);

  this.level = options.level || 'debug';
  this.timestamp = (options.timestamp !== 'undefined' ? options.timestamp : false);
  this.host = options.host || '127.0.0.1';
  this.port = options.port || 4000;
  this.transformer = options.transformer || 'websockets';
  this.pathname = options.pathname || '/winston';
  this.parser = options.parser || 'json';

  this.Socket = Primus_.createSocket({
    transformer: this.transformer,
    pathname: '/winston',
    parser: this.parser
  });

  // set client without connection
  this.client = new this.Socket(util.format('http://%s:%d', this.host, this.port), {
    strategy: ['online, timeout, disconnect']
  });
};

util.inherits(Primus, Transport);

Primus.prototype.name = 'primus';

//
// Define a getter so that `winston.transports.Primus`
// is available and thus backwards compatible.
//
winston.transports.Primus = Primus;

//
// ### function log (level, msg, [meta], [callback])
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} **Optional** Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
Primus.prototype.log = function (level, msg, meta, callback) {
  if (this.silent) {
    if (callback) {
      callback(null, true);
    }
    return ;
  }

  var self = this
    , output = common.log({
      colorize: false,
      json: true,
      level: level,
      message: msg,
      meta: meta,
      timestamp: self.timestamp
  });

  self.client.write(JSON.parse(output));

  //
  // Emit the `logged` event immediately because the event loop
  // will not exit until `process.stdout` has drained anyway.
  //
  self.emit('logged');
  if (callback) {
    callback(null, true);
  }
};
