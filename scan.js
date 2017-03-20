'use strict';

var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fs = require('fs');

//var options = {}

function Scanner(options) {
  this.device = options.device;
  this.mode = options.mode || 'Color';
  this.resolution = options.resolution || 150;
  this.format = options.format || 'tiff';
  this.gamma = options.gamma || '[0]0-[32]0-[32]0-[49]76-[73]119-[110]164-[165]214-[220]255-[255]255';
  this.filename = options.filename || 'out.tiff';
}

Scanner.prototype.scan = function(cb) {
  console.error('Scanner#scan');
  var args = [
    '-d ' + wrap(this.device),
    '--mode ' + this.mode,
    '--resolution ' + this.resolution,
    '--format=' + this.format,
    '--red-gamma-table ' + this.gamma,
    '--green-gamma-table ' + this.gamma,
    '--blue-gamma-table ' + this.gamma
  ];

  var cmd = 'scanimage ' + args.join(' ');
  var options = {
    'cwd': './'
  }

  var scanimage = exec(cmd + ' > ' + this.filename, options, this.scan_handler);
//  var scanimage = exec(cmd + ' | lp', options, this.scan_handler);

}

Scanner.prototype.scan_hadler = function(err, stdout, stderr) {
  console.error('Scanner#scan_handler');
  if (err) {
    console.error(err);
  } else {
//    this.print(function(err) {})
  }
}

Scanner.prototype.print = function(cb) {
  console.error('Scanner#print');
  var lp = exec('lp ' + this.filename, options,
    function(err, stdout, stderr) {
      if (err) {
        console.error(err);
      } else {
      }
    }
  );
}


function wrap(str) {
  return '\'' + str + '\'';
}


exports.Scanner = Scanner;

