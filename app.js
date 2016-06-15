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
	fs.readFile('index.html', 'utf8', function (error, data){
		var data_num = 0;
		client.query('SELECT COUNT(*) AS count FROM bbs', function (error, results){
			data_num = results[0].count;
			client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT 20', function (error, results){
				response.send(ejs.render(data, {data: results, cur_page: 1, pages: Math.ceil(data_num / 20)}));
			});
		});
	});
});

app.get('/page=:page&post=:id', function (request, response){
	fs.readFile('post.html', 'utf8', function (error, data){
		if(error){
			console.log('post.ejs file either does not exist or is crashed.');
		}else{
			client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT ?, ?', [(request.param('page') - 1) * 20, request.param('page') * 20], function (error, results){
				if(error){
					console.log('Fetching data from the database is unavailable');
				}else{
					var data_num = 0;
			
					client.query('SELECT * FROM bbs WHERE id = ?', [request.param('id')],  function (error, apost){
						if (error){
							console.log('Could not fetch the data from the database');
						}else{
							client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT 20', function (error, results){
								response.send(ejs.render(data, {data: results, post: apost[0]}));
							});
						}
					});
					response.send(ejs.render(data, {data: results, cur_page: request.param('page'), pages: request.param('page')}));
				}
			});
		}
	});
});

app.get('/page=:page', function (request, response){
	fs.readFile('index.html', 'utf8', function (error, data){
		if (request.param('page') == 1){
			response.redirect('/');
		}else{
			var data_num = 0;
			client.query('SELECT COUNT(*) AS count FROM bbs', function (error, results){
				data_num = results[0].count;
				client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT ?, ?', [(request.param('page') - 1) * 20, request.param('page') * 20], function (error, results){
					response.send(ejs.render(data, {data: results, cur_page: request.param('page'), pages: Math.ceil(data_num / 20)}));
				});
			});
		}
	});
});

app.get('/post=:id', function (request, response){
	fs.readFile('post.html', 'utf8', function (error, data){
		if(error){
			console.log('post.ejs file either does not exist or is crashed.');
		}else{
			var data_num = 0;
			
			client.query('SELECT * FROM bbs WHERE id = ?', [request.param('id')],  function (error, apost){
				if (error){
					console.log('Could not fetch the data from the database');
				}else{
					client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT 20', function (error, results){
						response.send(ejs.render(data, {data: results, post: apost[0]}));
					});
				}
			});
		}
	});
});

// new commment
app.get('/insert', function (request, response) {
	fs.readFile('insert.html', 'utf8', function (error, data) {
		response.send(data);
	});
});

app.post('/insert', function (request, response) {
	var body = request.body;

	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + "-" + (currentdate.getMonth() + 1) + "-" + (currentdate.getDate())  + " "
				+ currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();

	console.log("Body : ");
	console.log(body);
	console.log("Date and Time" + datetime);
	client.query('INSERT INTO bbs (category, title, is_new, inquiry_num, like_num, contents, time) values (?, ?, ?, ?, ?, ?, ?)',
		[body.category, body.title, 1, 0, 0, body.contents, datetime],
		function () {
			response.redirect('/insert');
	});
});

