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

var server = http.createServer(app);
server.listen(52273, '0.0.0.0', function(){
	console.log('Server running at http://0.0.0.0:52273');
});

app.get('/', function (request, response) {
	fs.readFile('index.ejs', 'utf8', function (error, data){
		if(error){
			console.log('index.ejs file either does not exist or is crashed.');
		}else{
			var data_num = 0;
			client.query('SELECT COUNT(*) AS count FROM bbs', function (error, results){
				if (error){
					console.log('Could not count the data rows from the database');
				}else{
					data_num = results[0].count;
					client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT 20', function (error, results){
						if(error){
							console.log('Fetching data from the database is unavailable');
						}else{
							response.send(ejs.render(data, {data: results}));
							if (data_num > 20){
								var page_num = data_num / 20;
								console.log(page_num);
								
								response.send(ejs.render(page_num, {page_num: page_num}));
							}
						}
					});
				}
			});
		}
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

