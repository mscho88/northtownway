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
var urlencode = require('urlencode');

var app = express();
app.use(express.bodyParser());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

var server = http.createServer(app);
app.listen(80);
// server.listen(52273, '0.0.0.0', function(){
// 	console.log("started");
// });


var MAXPOSTPERPAGE = 20;

app.get('/', function (request, response) {
	// This is the first page when an user enters the webpage
	fs.readFile('index.html', 'utf8', function (error, data){
		client.query('SELECT COUNT(*) AS count FROM bbs', function (error, post_num){
			var post_num = post_num[0].count;
			client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT ?', [MAXPOSTPERPAGE], function (error, posts){
				response.send(ejs.render(data, {posts: posts, keyword: null, cur_page: 1, pages: Math.ceil(post_num / MAXPOSTPERPAGE)}));
			});
		});
	});
});

app.get('/search=:keyword&page=:page&post=:id', function (request, response) {
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
		var key = request.param('keyword');
		client.query("SELECT COUNT(*) count FROM bbs WHERE title LIKE '%"+key+"%'", function (error, post_num){
			var post_num = post_num[0].count;
			client.query("SELECT * FROM bbs WHERE title LIKE '%"+key+"%' ORDER BY id DESC LIMIT ?, ?", [(request.param('page') - 1) * MAXPOSTPERPAGE, MAXPOSTPERPAGE], function (error, posts){
				client.query("SELECT * FROM bbs WHERE id = ?", [request.param('id')], function (error, apost){
					client.query('SELECT * FROM reply WHERE bbs_id = ?', [request.param('id')], function (error, replies){
						response.send(ejs.render(data, {posts: posts, post: apost[0], reply: replies, keyword: key, cur_page: request.param('page'), pages: Math.ceil(post_num / MAXPOSTPERPAGE)}))
					});
				});
			});
		});
	});
});

app.get('/search=:keyword&page=:page', function (request, response) {
	fs.readFile('index.html', 'utf8', function (error, data){
		var key = request.param('keyword');
		client.query("SELECT COUNT(*) AS count FROM bbs WHERE title LIKE '%"+key+"%'", function (error, post_num){
			var post_num = post_num[0].count;

			client.query("SELECT * FROM bbs WHERE title LIKE '%"+key+"%' ORDER BY id DESC LIMIT ?, ?", [(request.param('page') - 1) * MAXPOSTPERPAGE, MAXPOSTPERPAGE], function (error, posts){
				if (error){
					console.log("query failed d!!!!");
				}
				client.query('SELECT * FROM reply WHERE bbs_id = ?', [request.param('id')], function (error, replies){
					response.send(ejs.render(data, {posts: posts, reply: replies, keyword: key, cur_page: request.param('page'), pages: Math.ceil(post_num / MAXPOSTPERPAGE)}))
				});
			});
		});
	});
});

app.get('/search=:keyword&post=:id', function (request, response) {
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
		var key = request.param('keyword');
		client.query("SELECT COUNT(*) count FROM bbs WHERE title LIKE '%"+key+"%'", function (error, post_num){
			var post_num = post_num[0].count;

			client.query("SELECT * FROM bbs WHERE title LIKE '%"+key+"%' ORDER BY id DESC LIMIT ?" [MAXPOSTPERPAGE], function (error, posts){
				client.query("SELECT * FROM bbs WHERE id = ?", [request.param('id')], function (error, apost){
					client.query('SELECT * FROM reply WHERE bbs_id = ?', [request.param('id')], function (error, replies){
						response.send(ejs.render(data, {posts: posts, post: apost[0], reply: replies, keyword: key, cur_page: request.param('page'), pages: Math.ceil(post_num / MAXPOSTPERPAGE)}))
					});
				});
			});
		});
	});
});

app.get('/search=:keyword', function (request, response) {
	var key = request.param('keyword');
	fs.readFile('index.html', 'utf8', function (error, data){
		client.query("SELECT COUNT(*) count FROM bbs WHERE title LIKE '%"+key+"%'", function (error, post_num){
			var post_num = post_num[0].count;
			client.query("SELECT * FROM bbs WHERE title LIKE '%"+key+"%' ORDER BY id DESC LIMIT 20", function (error, posts){
				response.send(ejs.render(data, {posts: posts, keyword: key, cur_page: 1, pages: Math.ceil(post_num / 20)}));
			});
		});
	});
});

app.get('/page=:page&post=:id', function (request, response){
	fs.readFile('post.html', 'utf8', function (error, data){
		client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT ?, ?', [(request.param('page') - 1) * MAXPOSTPERPAGE, MAXPOSTPERPAGE], function (error, posts){
			// var post_num = 0;
			client.query('SELECT COUNT(*) AS count FROM bbs', function (error, post_count){
				var post_num = post_count[0].count;
				client.query('SELECT * FROM bbs WHERE id = ?', [request.param('id')],  function (error, apost){
					client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT 20', function (error, results){
						client.query('SELECT * FROM reply WHERE bbs_id = ?', [request.param('id')], function (error, replies){
							response.send(ejs.render(data, {posts: posts, keyword: null, reply: replies, cur_page: request.param('page'), pages: Math.ceil(post_num / MAXPOSTPERPAGE), post: apost[0]}));
						});
					});
				});
			});
			// response.send(ejs.render(data, {data: results, cur_page: request.param('page'), pages: request.param('page')}));
		});
	});
});

app.get('/page=:page', function (request, response){
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
						client.query('SELECT * FROM bbs ORDER BY id DESC LIMIT ?, ?', [(request.param('page') - 1) * MAXPOSTPERPAGE, MAXPOSTPERPAGE], function (error, results){
							response.send(ejs.render(data, {posts: results, keyword: null, cur_page: request.param('page'), pages: Math.ceil(data_num / MAXPOSTPERPAGE)}));
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
								response.send(ejs.render(data, {posts: results, keyword: null, post: apost[0], reply: replies, cur_page: 1, pages: Math.ceil(data_num / MAXPOSTPERPAGE)}));
							});
						});
					});
				}
			});
		}
	});
});

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
				client.query('UPDATE bbs SET reply_num = reply_num + 1 WHERE id = ?', [post_id], function (error, results){
					response.redirect(request.get('referer'));
				});
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
		[post_id, request.body.name, request.body.password, request.body.contents, datetime, request.connection.remoteAddress, request.body.reply_id, request.body.dimension, 02],
		function (error, results){
			if(error){
				console.log(error);
			}else{
				client.query('UPDATE bbs SET reply_num = reply_num + 1 WHERE id = ?', [post_id], function (error, results){
					response.redirect(request.get('referer'));
				});
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
		if(result[0].count != 0){
			console.log("ip address (%s) liked the same reply id = %d", request.connection.remoteAddress, request.body.reply_id);
		} else if (result[0].count == 0){
			client.query('INSERT INTO user_info (ip, bbs_id, reply_like_id) VALUES (?, ?, ?)', [request.connection.remoteAddress, post_id, request.body.reply_id], function (error, result){
				if(error){
					console.log('Failed to like the reply id = ', request.body.reply_id);
				}else{
					client.query('UPDATE reply SET like_num = like_num + 1 WHERE id = ?', [request.body.reply_id], function (error, result){
						if (error){
							console.log("Failed to update increase like number for reply id = %d", request.body.reply_id);
						}else{
							response.redirect(request.get('referer'));
						}
					});
				}
			});
		}
	});
});

app.post('/post=:id', function (request, response){
	if (request.body.search == ""){
		response.redirect('/');
	}else if (request.body.search != null){
		response.redirect('/search=' + urlencode(request.body.search));
	}
});

app.post('/page=:page', function (request, response){
	if (request.body.search == ""){
		response.redirect('/');
	}else if (request.body.search != null){
		response.redirect('/search=' + urlencode(request.body.search));
	}
});

app.post('/page=:page&post=:id', function (request, response){
	if (request.body.search == ""){
		response.redirect('/');
	}else if (request.body.search != null){
		response.redirect('/search=' + urlencode(request.body.search));
	}
});

app.post('/search=:keyword', function (request, response){
	if (request.body.search == ""){
		response.redirect('/');
	}else if (request.body.search != null){
		response.redirect('/search=' + urlencode(request.body.search));
	}
});

app.post('/post:=id', function (request, response){
	if (request.body.search == ""){
		response.redirect('/');
	}else if (request.body.search != null){
		response.redirect('/search=' + urlencode(request.body.search));
	}
});

app.post('/', function (request, response){
	// If the given key-word is an empty string, redirect to the main page. Otherwise, proceed to the search page.
	if (request.body.search == ""){
		response.redirect('/');
	}else if (request.body.search != null){
		response.redirect('/search=' + urlencode(request.body.search));
	}
});

app.get('/insert&post=:id', function (request, response){
	fs.readFile('insert.html', 'utf8', function (error, data){
		client.query('SELECT * FROM bbs WHERE id = ?', [request.param('id')], function (error, apost){
			response.send(ejs.render(data, {insert: 1, post: apost}));
		});
	});
});

app.post('/insert&post=:id', function (request, response){
	var body = request.body;

	var currentdate = new Date(); 
	var datetime = currentdate.getFullYear() + "-" + (currentdate.getMonth() + 1) + "-" + (currentdate.getDate())  + " "
				+ currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds();

	console.log("Body : ");
	console.log(body);
	console.log("Date and Time" + datetime);
	client.query('SELECT * FROM bbs WHERE id = ?', [request.param('id')], function (error, apost){
		client.query('UPDATE bbs SET category = ?, title = ?, is_new = ?, inquiry_num = ?, like_num = ?, contents = ?, time = ?, reply_num = ? WHERE id = ?',
			[body.category, body.title, apost[0].is_new, apost[0].inquiry_num, apost[0].like_num, body.contents, datetime, 0, request.param('id')],
			function () {
				response.redirect('/post=' + request.param('id'));
		});
	});
});
	

app.get('/insert', function (request, response) {
	fs.readFile('insert.html', 'utf8', function (error, data) {
		response.send(ejs.render(data, {insert: null}));
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
	client.query('INSERT INTO bbs (category, title, is_new, inquiry_num, like_num, contents, time, reply_num) values (?, ?, ?, ?, ?, ?, ?, ?)',
		[body.category, body.title, 1, 0, 0, body.contents, datetime, 0],
		function () {
			response.redirect('/insert');
	});
});


// CASES
/*
	CHECK LIST
	DONE	CASE 0 : 	USER FIRSTLY ENTERED INDEX.HTML
	
	DONE 	CASE 1 : 	USER CLICKS A POST ON PAGE 1
	DONE	CASE 1.1 : 	USER CLICKS A DIFFERENT PAGE ON THE POST SELECTED ABOVE
	DONE	CASE 1.2 : 	USER CLICKS A DIFFERENT POST ON THE POST SELECTED ABOVE
	DONE	CASE 1.3 : 	USER SEARCHES A POST ON THE POST SELECTED ABOVE
	
	DONE	CASE 2 : 	USER CLICKS A POST ON PAGE 2 OR ABOVE
	CASE 2.1 : 	USER CLICKS A DIFFERENT PAGE ON THE POST SELECTED ABOVE
	CASE 2.2 : 	USER CLICKS A DIFFERENT POST ON THE POST SELECTED ABOVE
	CASE 2.3 : 	USER SEARCHES A POST ON THE POST SELECTED ABOVE

	DONE	CASE 3 : 	USER SEARCHES A POST ON PAGE 1
	CASE 3.1 : 	USER CLICKS A POST FROM THE SEARCHED POSTS
	CASE 3.2 : 	USER CLICKS A DIFFERENT PAGE FROM THE SEARCHED POSTS
	CASE 3.3 : 	USER CLICKS A POST FROM THE SEARCHED POSTS ON A DIFFERENT PAGE
	
	CASE 4 : USER SERACHES A POST ON PAGE 2 OR ABOVE
*/
