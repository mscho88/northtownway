var fs = require('fs');
var ejs = require('ejs');
var http = require('http');
var express = require('express');
// var path = require('path');

var client = require('mysql').createConnection({
	user: 'root',
	password: 'whalstn',
	database: 'northtownway'
});

var app = express();
app.use(express.bodyParser());
app.use(app.router);
// Set the path for ckeditor asset
// app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app);
server.listen(52273, '0.0.0.0', function(){
	console.log('Server running at http://0.0.0.0:52273');
});

app.get('/', function (request, response) {
	fs.readFile('index.html', 'utf8', function (error, data){
		response.send(data);
	})
})

app.get('/insert', function (request, response) {
	fs.readFile('insert.html', 'utf8', function (error, data) {
		response.send(data);
	});
});

app.post('/insert', function (request, response) {
	var body = request.body;

	// console.log(request.body);

	// console.log(response.end(JSON.stringify(request.files) + "\n"));
	client.query('INSERT INTO bbs (category, title, is_new, inquiry_num, like_num, contents) values (?, ?, ?, ?, ?, ?)',
		[body.category, body.title, 1, 0, 0, body.contents],
		function () {
			response.redirect('/insert');
	});
});

