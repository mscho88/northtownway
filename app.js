var fs = require('fs');
var ejs = require('ejs');
var http = require('http');
var express = require('express');
// var path = require('path');
// var format = require('date-format');

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

var counter = 0;
function Post(id, title, contents){
	this.id = id;
	this.title = title;
	this.contents = contents;
}

app.get('/', function (request, response) {
	fs.readFile('index.html', 'utf8', function (error, data){
		client.query('SELECT * FROM bbs', function (error, results){
			// console.log(response.render('title', {itmes : rows}));
			response.send(ejs.render(data, {data: results}));
		});
		// response.send(data);
	});
});

app.get('/insert', function (request, response) {
	fs.readFile('insert.html', 'utf8', function (error, data) {
		response.send(data);
	});
});

app.post('/insert', function (request, response) {
	var body = request.body;

	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + "-" + currentdate.getDate() + "-" + (currentdate.getMonth()+1)  + " "
				+ currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();

	console.log(datetime)
	// console.log(response.end(JSON.stringify(request.files) + "\n"));
	client.query('INSERT INTO bbs (category, title, is_new, inquiry_num, like_num, contents, time) values (?, ?, ?, ?, ?, ?, ?)',
		[body.category, body.title, 1, 0, 0, body.contents, datetime],
		function () {
			response.redirect('/insert');
	});
});

