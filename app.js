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
app.use(express.bodyParser());
app.use(app.router);

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

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
							var pages = Math.ceil(data_num / 20);
							response.send(ejs.render(data, {data: results, page_num: pages}));
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
	var datetime = currentdate.getFullYear() + "-" + currentdate.getMonth() + 1 + "-" + (currentdate.getDate())  + " "
				+ currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();

	console.log(body + datetime);
	client.query('INSERT INTO bbs (category, title, is_new, inquiry_num, like_num, contents, time) values (?, ?, ?, ?, ?, ?, ?)',
		[body.category, body.title, 1, 0, 0, body.contents, datetime],
		function () {
			response.redirect('/insert');
	});
});

