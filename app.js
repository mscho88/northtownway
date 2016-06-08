var fs = require('fs');
var ejs = require('ejs');
var http = require('http');
var express = require('express');

var client = require('mysql').createConnection({
	user: 'root',
	password: 'whalstn',
	database: 'northtownway'
});

var app = express();

// var ckStaticsPath = require('node-ckeditor');
app.use(express.bodyParser());
app.use(app.router);
// app.use(express.statics(ckStaticsPath));


var server = http.createServer(app);
server.listen(52273, '0.0.0.0', function(){
	console.log('Server running at http://0.0.0.0:52273');
});

app.get('/', function (request, response) {
	fs.readFile('index.html', 'utf8', function (error, data){
		response.send(data);
	})
})

app.get('/ckeditor', function (request, response) {
	fs.readFile('ckeditor/samples/index.html', 'utf8', function (error, data){
		response.send(data);
	})
})

// app.post('/', function (request, response) {
// 	fs.readFile('HTMLPage.html', 'utf8', function (error, data){
// 		response.send(data);
// 	})
// })

app.get('/insert', function (request, response) {
	fs.readFile('insert.html', 'utf8', function (error, data) {
		response.send(data);
	});
});

app.post('/insert', function (request, response) {
	var body = request.body;

	console.log(request.body);
	console.log(body.title);
	console.log(body.contents);

	client.query('INSERT INTO bbs (category, title, is_new, inquiry_num, like_num, contents) values (?, ?, ?, ?, ?, ?)',
		[body.category, body.title, 1, 0, 0, body.contents],
		function () {
			response.redirect('/insert');
	});
});

