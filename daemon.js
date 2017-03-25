'use strict';

const PID_FILE = '/var/run/e2b_panel.pid';

var p = require('process');
var f = require('fs');
var e2b = require('./e2b_panel.js').E2B;

var cmd = p.argv[2];
if (cmd == 'start') {
  console.log('start');
  f.writeFile(PID_FILE, p.pid);
  e2b();
} else if (cmd == 'stop') {
  console.log('stop');
  var pid = f.readFileSync(PID_FILE, 'utf-8');
  console.log('pid=%s', pid);
  process.kill(pid);
}


