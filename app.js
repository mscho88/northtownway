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
	console.log('Server running at http://127.0.0.1:52273');
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
	// Increase the number of inquiry on the selected post and save the inquiry number for each ip address.
	client.query('SELECT COUNT(*) as count FROM user_info WHERE ip = ? && bbs_id = ?', [request.connection.remoteAddress, request.param('id')], function (error, results){
		if (results[0].count == 0){
			client.query('INSERT INTO user_info (ip, bbs_id) VALUES (?, ?)', [request.connection.remoteAddress, request.param('id')], function (error, results){
				if(error){
					console.log('Failed to sync to the database server');
				}else{
					client.query('UPDATE bbs SET inquiry_num = inquiry_num + 1 WHERE id = ?', [request.param('id')], function (error, results){
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
					client.query('SELECT COUNT(*) AS count FROM bbs', function (error, results){
						var data_num = results[0].count;

						client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT 20', function (error, results){
							client.query('SELECT * FROM reply WHERE bbs_id = ?', [request.param('id')], function (error, replies){
								response.send(ejs.render(data, {data: results, post: apost[0], reply: replies, cur_page: 1, pages: Math.ceil(data_num / MAXPOSTPERPAGE)}));
							});
						});
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

// app.post('/', function (request, response) {
// 	console.log(request.body.search);
// 	fs.readFile('index.html', 'utf8', function (error, data) {
		
// 	});
// });

app.post('/post_like', function (request, response){
	if (request.body.url != "/"){
		var url = request.body.url.split("/")[1].split("&");
		// console.log(url);
		var post_num = null;
		var page_num = null;
		for(var i = 0; i < url.length; i++){
			if (url[i].split("=")[0] == "post"){
				post_num = url[i].split("=")[1];
			}else if (url[i].split("=")[0] == "page"){
				page_num = url[i].split("=")[1];
			}
		}
		client.query('SELECT COUNT(*) as count FROM user_info WHERE ip = ? && bbs_like_id = ?', [request.connection.remoteAddress, parseInt(post_num)], function (error, results){
			if (error){
				console.log("Cannot find the post id = %d", parseInt(post_num));
			}else{
				var data_num = results[0].count;

				if(data_num == 0){
					client.query('INSERT INTO user_info (ip, bbs_like_id) VALUES (?, ?)', [request.connection.remoteAddress, parseInt(post_num)], function (error, results){

						client.query('UPDATE bbs SET like_num = like_num + 1 WHERE id = ?', [parseInt(post_num)], function (error, result){
							if(!error){
								console.log("Client likes the post, id = %d", parseInt(post_num));
							}
						});
					});
				}

			}
		});

		fs.readFile('post.html', 'utf8', function (error, data){
			if (parseInt(post_num) != null && page_num != null){

			}else if (parseInt(post_num) != null && page_num == null){
				response.redirect('/post=' + parseInt(post_num));
				// response.redirect(request.get('referer'));
			}else{
				response.redirect('/');
			}
		});
	}else{
		response.redirect('/');
	}
});

app.post('/reply', function (request, response){
	var url = request.body.url.split("/")[1].split("&");
	var post_id = 0;
	var page_id = 0;
	for(var i = 0; i < url.length; i++){
		if (url[i].split("=")[0] == "post"){
			post_id = url[i].split("=")[1];
		}else if (url[i].split("=")[0] == "page"){
			page_id = url[i].split("=")[1];
		}
	}

	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + "-" + (currentdate.getMonth() + 1) + "-" + (currentdate.getDate())  + " "
				+ currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();

	client.query('INSERT INTO reply (bbs_id, name, password, contents, time, ip, dimension, like_num) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
		[post_id, request.body.name, request.body.password, request.body.contents, datetime, request.connection.remoteAddress, 0, 0],
		function (error, results){
			if(error){
				console.log(error);
			}else{
				response.redirect(request.get('referer'));
			}
	});
});

app.post('/replyofreply', function (request, response){
	var url = request.body.url.split("/")[1].split("&");
	var post_id = 0;
	var page_id = 0;
	for(var i = 0; i < url.length; i++){
		if (url[i].split("=")[0] == "post"){
			post_id = url[i].split("=")[1];
		}else if (url[i].split("=")[0] == "page"){
			page_id = url[i].split("=")[1];
		}
	}

	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + "-" + (currentdate.getMonth() + 1) + "-" + (currentdate.getDate())  + " "
				+ currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();

	client.query('INSERT INTO reply (bbs_id, name, password, contents, time, ip, reply_id, dimension, like_num) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[post_id, request.body.name, request.body.password, request.body.contents, datetime, request.connection.remoteAddress, request.body.reply_id, request.body.dimension, 0],
		function (error, results){
			if(error){
				console.log(error);
			}else{
				response.redirect(request.get('referer'));
			}
	});
});

app.post('/likeReply', function (request, response){
	var url = request.body.url.split("/")[1].split("&");
	var post_id = 0;
	var page_id = 0;
	for(var i = 0; i < url.length; i++){
		if (url[i].split("=")[0] == "post"){
			post_id = url[i].split("=")[1];
		}else if (url[i].split("=")[0] == "page"){
			page_id = url[i].split("=")[1];
		}
	}

	
	client.query('SELECT COUNT(*) AS count FROM user_info WHERE ip = ? && reply_like_id = ?', [request.connection.remoteAddress, request.body.reply_id], function (error, result){
		if (result[0].count == 0){
			client.query('UPDATE reply SET like_num = like_num + 1 WHERE id = ?', [request.body.reply_id], function (error, result){
				if (!error){
					response.redirect(request.get('referer'));
				}
			});
		}
	});
});

app.post('/', function(request, response){
	var key = request.body.search;

	var query = "select * from bbs where title like '%"+key+"%'";
	client.query(query, function (err, rows){
		console.log(rows);
		response.write(JSON.stringify(rows));
		response.end();
	});

	// client.getConnection( function (err, connection){
	// 	console.log("hello");
	// 	if(err){
	// 		connection.release();
	// 	}else{
	// 		var query = ;
	// 		console.log(query);
	// 		client.query(String(query), function (err,rows){
	// 			connection.release();
	// 			if(!err) {
	// 				if(rows.length > 0){
	// 					res.write(JSON.stringify(rows));
	// 					res.end();
	// 				}else{
	// 					rows=[];
	// 					res.write(JSON.stringify(rows));
	// 					res.end();
	// 				} 
	//         	} else {
	// 				console.log("Query failed");  
	// 			}        
	// 		});
	// 	}
	// });  
});
