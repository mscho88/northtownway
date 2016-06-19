var fs = require('fs');
var ejs = require('ejs');
var http = require('http');
var express = require('express');
var path = require('path');

var client = require('mysql').createConnection({
	user: 'root',
	password: 'Qmffor01',
	database: 'northtownway'
});

var app = express();
app.use(express.bodyParser());
app.use(app.router);
app.use('/css', express.static('public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

var server = http.createServer(app);
server.listen(52273, '0.0.0.0', function(){
	console.log('Server running at http://0.0.0.0:52273');
});

var MAXPOSTPERPAGE = 20;

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
			client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT ?, ?', [(request.param('page') - 1) * MAXPOSTPERPAGE, request.param('page') * MAXPOSTPERPAGE], function (error, results){
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
	// need to send the last page
	// if (request.param('page') == -1){
	// 	fs.readFile('index.html', 'utf8', function (error, data){
	// 		client.query('SELECT COUNT(*) AS count FROM bbs', function (error, results){
	// 			var page_num = Math.ceil(results[0].count / MAXPOSTPERPAGE);
	// 			if (page_num == 1){
	// 				response.redirect('/');
	// 			}else{
	// 				// var data_num = results[0].count % 20;
	// 				client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT ?, ?', [(page_num - 1) * MAXPOSTPERPAGE, page_num * MAXPOSTPERPAGE], function (error, results){
	// 					response.send(ejs.render(data, {data: results, cur_page: page_num, pages: page_num}));
	// 				});
	// 			}
	// 		});
	// 	});
	// }else 
	if (request.param('page') > 0){
		fs.readFile('index.html', 'utf8', function (error, data){
			if (request.param('page') == 1){
				response.redirect('/');
			}else{
				var data_num = 0;
				client.query('SELECT COUNT(*) AS count FROM bbs', function (error, results){
					data_num = results[0].count;
					if (Math.ceil(data_num / MAXPOSTPERPAGE) < request.param('page')){
						response.redirect('/');
					}else{
						client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT ?, ?', [(request.param('page') - 1) * MAXPOSTPERPAGE, request.param('page') * MAXPOSTPERPAGE], function (error, results){
							response.send(ejs.render(data, {data: results, cur_page: request.param('page'), pages: Math.ceil(data_num / MAXPOSTPERPAGE)}));
						});
					}
				});
			}
		});
	}else{
		response.redirect('/');
	}
});

app.get('/post=:id', function (request, response){
	client.query('SELECT COUNT(*) as count FROM user_info WHERE ip = ? && bbs_id = ?', [request.connection.remoteAddress, request.param('id')], function (error, results){
		if (results[0].count == 0){
			client.query('INSERT INTO user_info (ip, bbs_id) VALUES (?, ?)', [request.connection.remoteAddress, request.param('id')], function (error, results){
				if(error){
					console.log('Failed to sync to the database server');
				}else{
					client.query('UPDATE bbs SET inquiry_num = inquiry_num + 1 WHERE id = ?', [request.param('id')], function (error, result){
						if(error){
							console.log('Failed to increase the number of inquiry for the post id = %d', request.param('id'));
						}else{
							console.log('Succeeded to increase the number of inquiry for the post id = %d', request.param('id'));
						}
					});
				}
			});
		}
	});

	fs.readFile('post.html', 'utf8', function (error, data){
		if(error){
			console.log('post.html file either does not exist or is crashed.');
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

