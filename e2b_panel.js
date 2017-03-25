'use strict';

const PRINTER_IP = '192.168.11.4';
const HOST_IP = '192.168.11.89';

process.on('uncaughtException', function(err) {
  console.log('====uncaughtException====');
  console.log(err.messaage);
  console.log(err.stack);
  console.log('=========================');
});


function e2b() {

  const dgram = require('dgram');
  const udpServer = dgram.createSocket('udp4');

  const net = require('net');
  const Scannar = require('./scan.js').Scanner;

  udpServer.on('error', (err) => {
    console.log(`UDP server error:\n${err.stack}`);
    udpServer.close();
  });

  udpServer.on('message', (msg, rinfo) => {
  //  console.log(`UDP server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
  // console.log(msg);
  // console.log(rinfo);
    regist(msg);
  });

  udpServer.on('listening', () => {
    var address = udpServer.address();
    console.log('UDP server listening to %j', address);
  });

  udpServer.bind(2968, function onConnected() {
    udpServer.addMembership('239.255.255.253');
  });

function regist(msg) {
  var headder = '\u0002\u0007\u0000\u0000\uFFFF\u0000\u0000\u0000\u0000\u0000\u0000\uFFFF\u0000\u0002\u0065\u006e\u0000\u0000\u0000\uFFFF';
  var message = '(ClientName=COPY),(IPAddress=' + HOST_IP + '),(EventPort=2968)' + '\u0000';
  var buffer = new Buffer(headder + message, 'ascii');
  buffer[4] = message.length + 20;
  buffer[11] = msg[11];
  buffer[19] = message.length;
//  console.log(buffer);
//  console.log(buffer.length);
  udpServer.send(buffer, 0, buffer.length, 2968, PRINTER_IP);
}

var tcpServer2968 = net.createServer();  
tcpServer2968.on('connection', handleConnection2968);
tcpServer2968.listen(2968, function() {  
  console.log('TCP server listening to %j', tcpServer2968.address());
});


function handleConnection2968(conn) {  
  var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
  console.log('new client connection from %s', remoteAddress);

  var uid = '';
  var scanId = '';

  conn.on('data', onConnData);
  conn.once('close', onConnClose);
  conn.on('error', onConnError);

  function onConnData(d) {
    var s = d.toString();
    console.log('connection data from %s', remoteAddress);
//    console.log('connection data from %s: %s', remoteAddress, s);
    var reUid = /x-uid: (.+)/g;
    var resultUid = reUid.exec(s);
//    console.log(resultUid);
    if (resultUid != null) {
      uid = resultUid[1];
      console.log('uid: %s', uid);
    }

    var reScanId = /<PushScanIDIn>(..)/g;
    var resultScanId = reScanId.exec(s);
//    console.log(resultScanId);
    if (resultScanId != null) {
      scanId = resultScanId[1];
      console.log('ScanId: %s', scanId);
    }

    if (uid == '' || scanId == '') return;


    var res = ok_response(uid);
//    console.log(res);
    conn.write(res);
    
    var options = {'device': 'epson2:net:192.168.11.4'};
    if (scanId == '01') {
      options.mode = 'Color';
    } else if (scanId == '02') {
      options.mode = 'Gray';
    } else if (scanId == '03') {
      options.mode = 'Lineart';
      console.log(options);
    }
    copy(options);

  }

  function onConnClose() {
    console.log('connection from %s closed', remoteAddress);
  }

  function onConnError(err) {
    console.log('Connection %s error: %s', remoteAddress, err.message);
    console.log(err.stack);
  }
}

function copy(options) {
  var s = new Scannar(options);
  s.scan(
    function(err, code) {
      console.dir(err);
      console.dir(code);
    }
  );
}


const CRLF = "\u000d\u000a";

function ok_response(uid) {
  return 'HTTP/1.0 200 OK'+ CRLF +
'Server : Epson Net Scan Monitor/2.0' + CRLF +
'Content-Type : application/octet-stream' + CRLF +
'Content-Length : 276' + CRLF +
'x-protocol-name : Epson Network Service Protocol' + CRLF +
'x-protocol-version : 2.00' + CRLF +
'x-uid : ' + uid + CRLF +
'x-status : 0001' + CRLF +
'' + CRLF +
'<?xml version="1.0" ?>' + CRLF +
'<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">' + CRLF +
'  <s:Body>' + CRLF +
'    <p:PushScanResponse xmlns:p="http://schema.epson.net/EpsonNet/Scan/2004/pushscan">' + CRLF +
'      <StatusOut>OK</StatusOut>' + CRLF +
'    </p:PushScanResponse>' + CRLF +
'  </s:Body>' + CRLF +
'</s:Envelope>' + CRLF;
}


/*
setTimeout(function () {
  udpServer.close();
  tcpServer2968.close();
}, 60000);
*/

};

exports.e2b = e2b;

// (ip.src == 192.168.11.4 || ip.dst == 192.168.11.4) && tcp.port == 2968

/*
プリンターからの送信データ
OLD:02:06:00:00:5c:20:00:00:00:00:00:01:00:02:65:6e:00:00:00:1c:73:65:72:76:69:63:65:3a:4e:65:74:53:63:61:6e:4d:6f:6e:69:74:6f:72:2d:61:67:65:6e:74:00:08:50:49:44:20:30:38:42:35:00:1e:43:6c:69:65:6e:74:4e:61:6d:65:2c:49:50:41:64:64:72:65:73:73:2c:45:76:65:6e:74:50:6f:72:74:00:00
NEW:02 06 00 00 5c 20 00 00 00 00 00 0f 00 02 65 6e 00 00 00 1c 73 65 72 76 69 63 65 3a 4e 65 74 53 63 61 6e 4d 6f 6e 69 74 6f 72 2d 61 67 65 6e 74 00 08 ... >
NEW:02 06 00 00 5c 20 00 00 00 00 00 0f 00 02 65 6e 00 00 00 1c 73 65 72 76 69 63 65 3a 4e 65 74 53 63 61 6e 4d 6f 6e 69 74 6f 72 2d 61 67 65 6e 74 00 08 ... >
*/

/*
02:07:00:00:56:00:00:00:00:00:00:01:00:02:65:6e:00:00:00:41:28:43:6c:69:65:6e:74:4e:61:6d:65:3d:4d:41:53:41:52:55:2d:50:43:29:2c:28:49:50:41:64:64:72:65:73:73:3d:31:39:32:2e:31:36:38:2e:31:31:2e:35:30:29:2c:28:45:76:65:6e:74:50:6f:72:74:3d:32:39:36:38:29:00
02:07:00:00:56:00:00:00:00:00:00:01:00:02:65:6e:00:00:00:41:28:43:6c:69:65:6e:74:4e:61:6d:65:3d:4d:41:53:41:52:55:2d:50:43:29:2c:28:49:50:41:64:64:72:65:73:73:3d:31:39:32:2e:31:36:38:2e:31:31:2e:35:30:29:2c:28:45:76:65:6e:74:50:6f:72:74:3d:32:39:36:38:29:00
*/

/*
ORG:ac18265c71f9001fd0978278080045000072026e000080110000c0a80b32c0a80b04fd130b98005e97f60207000056000000000000010002656e0000004128436c69656e744e616d653d4d41534152552d5043292c284950416464726573733d3139322e3136382e31312e3530292c284576656e74506f72743d323936382900
FAK:ac18265c71f98857ee654e920800450000725e88400040114445c0a80b59c0a80b040b980b98005e981d0207000056000000000000010002656e0000004128436c69656e744e616d653d4d41534152552d5043292c284950416464726573733d3139322e3136382e31312e3839292c284576656e74506f72743d323936382900
*/

/*
プリンターとの登録の送受信 OLD
PRINTER->PC
02:06:00:00:5c:20:00:00:00:00:00:01:00:02:65:6e:00:00:00:1c:73:65:72:76:69:63:65:3a:4e:65:74:53:63:61:6e:4d:6f:6e:69:74:6f:72:2d:61:67:65:6e:74:00:08:50:49:44:20:30:38:42:35:00:1e:43:6c:69:65:6e:74:4e:61:6d:65:2c:49:50:41:64:64:72:65:73:73:2c:45:76:65:6e:74:50:6f:72:74:00:00
PC->PRINTER
02:07:00:00:56:00:00:00:00:00:00:01:00:02:65:6e:00:00:00:41:28:43:6c:69:65:6e:74:4e:61:6d:65:3d:4d:41:53:41:52:55:2d:50:43:29:2c:28:49:50:41:64:64:72:65:73:73:3d:31:39:32:2e:31:36:38:2e:31:31:2e:35:30:29:2c:28:45:76:65:6e:74:50:6f:72:74:3d:32:39:36:38:29:00
*/

/*
プリンターとの登録の送受信 2017/03/19
PRINTER->PC
02:06:00:00:5c:20:00:00:00:00:00:1c:00:02:65:6e:00:00:00:1c:73:65:72:76:69:63:65:3a:4e:65:74:53:63:61:6e:4d:6f:6e:69:74:6f:72:2d:61:67:65:6e:74:00:08:50:49:44:20:30:38:42:35:00:1e:43:6c:69:65:6e:74:4e:61:6d:65:2c:49:50:41:64:64:72:65:73:73:2c:45:76:65:6e:74:50:6f:72:74:00:00
02:06:00:00:5c:20:00:00:00:00:00:1c:00:02:65:6e:00:00:00:1c:73:65:72:76:69:63:65:3a:4e:65:74:53:63:61:6e:4d:6f:6e:69:74:6f:72:2d:61:67:65:6e:74:00:08:50:49:44:20:30:38:42:35:00:1e:43:6c:69:65:6e:74:4e:61:6d:65:2c:49:50:41:64:64:72:65:73:73:2c:45:76:65:6e:74:50:6f:72:74:00:00
PC->PRINTER
02:07:00:00:56:00:00:00:00:00:00:1c:00:02:65:6e:00:00:00:41:28:43:6c:69:65:6e:74:4e:61:6d:65:3d:4d:41:53:41:52:55:2d:50:43:29:2c:28:49:50:41:64:64:72:65:73:73:3d:31:39:32:2e:31:36:38:2e:31:31:2e:35:30:29:2c:28:45:76:65:6e:74:50:6f:72:74:3d:32:39:36:38:29:00
02:07:00:00:56:00:00:00:00:00:00:1c:00:02:65:6e:00:00:00:41:28:43:6c:69:65:6e:74:4e:61:6d:65:3d:4d:41:53:41:52:55:2d:50:43:29:2c:28:49:50:41:64:64:72:65:73:73:3d:31:39:32:2e:31:36:38:2e:31:31:2e:35:30:29:2c:28:45:76:65:6e:74:50:6f:72:74:3d:32:39:36:38:29:00
*/

/*
PROTOCOL:TCP,PORT:2968

POST /PushScan HTTP/1.0
Content-Type: application/octet-stream
Content-Length: 306
x-protocol-name: Epson Network Service Protocol
x-protocol-version: 2.00
x-uid: 3

<?xml version="1.0" ?>
 <s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
  <s:Body>
   <p:PushScan xmlns:p="http://schema.epson.net/EpsonNet/Scan/2004/pushscan">
    <ProductNameIn>PID 08B5</ProductNameIn>
    <IPAddressIn>C0A80B04</IPAddressIn>
    <PushScanIDIn>01</PushScanIDIn>
  </p:PushScan>
 </s:Body>
</s:Envelope>
*/

/*
HTTP/1.0 200 OK
Server : Epson Net Scan Monitor/2.0
Content-Type : application/octet-stream
Content-Length : 276
x-protocol-name : Epson Network Service Protocol
x-protocol-version : 2.00
x-uid : 2
x-status : 0001

<?xml version="1.0" ?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
  <s:Body>
    <p:PushScanResponse xmlns:p="http://schema.epson.net/EpsonNet/Scan/2004/pushscan">
      <StatusOut>OK</StatusOut>
    </p:PushScanResponse>
  </s:Body>
</s:Envelope>

*/



