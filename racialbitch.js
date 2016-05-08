/*
* @Author: Zleub
* @Date:   2016-05-05 13:16:32
* @Last Modified by:   Zleub
* @Last Modified time: 2016-05-08 14:43:38
*/

const fs = require('fs');
const http = require('http')
const https = require('https')
const querystring = require('querystring')
const child_process = require('child_process')

recast = {
	"developer_token":	process.argv[2],
	"request_token":	"93951591f42f1db5243e6336c0846851",
	"user_name":		"Zleub",
	"user_slug":		"zleub",
	"bot_name":			"RacialBitch",
	"bot_slug":			"racialbitch"
}

var HTTPrequest = (option, data, fn) => {
	var req = http.request(option, (res) => {
		var body = ''

		console.warn('statusCode: ', res.statusCode);
		res.on('data', (d) => body += d)
		res.on('end', (d) => {
			if (fn) fn(body)
		})
	})

	req.on('error', (e) => console.error(e))

	req.write(querystring.stringify(data))
	req.end()
}

var HTTPSrequest = (option, data, fn) => {
	var req = https.request(option, (res) => {
		var body = ''

		console.warn('statusCode: ', res.statusCode);
		res.on('data', (d) => body += d)
		res.on('end', (d) => {
			if (fn) fn(body)
		})
	})

	req.on('error', (e) => console.error(e))

	req.write(querystring.stringify(data))
	req.end()
}

var basicRequest = (recast) => (option, path) => (fn) =>
	HTTPSrequest({
		host: (option.host || 'api.recast.ai'),
		port: (option.port || 443),
		headers: (option.headers || {
			"Authorization": "Token " + recast.developer_token
		}),
		method: (option.method || 'GET'),
		path: (option.path || '/v1/users/' + recast.user_slug + '/bots/' + recast.bot_slug + (path|| ''))
	}, option.body, fn)


var recastRequest = basicRequest (recast)
var getRacialBitch = recastRequest ({})
var saveRacialBitch = () => getRacialBitch ((d) => fs.writeFile('racialbitch.json', d))

var getIntent = (intent) => recastRequest ({}, '/workflows/core/intents/' + intent)
var saveIntent = (intent) => getIntent (intent) ( (data) => {
		fs.writeFile(intent + '_intent.json', JSON.stringify( JSON.parse(data).results) )
	})

var putExpression = (intent, expression) => {
	recastRequest ({
		method: 'POST',
		body: {
			source: expression
		}
	}, '/workflows/core/intents/' + intent + '/expressions') ()
}

var Text = (text) => {
	recastRequest ({
		path: '/v1/request',
		method: 'POST',
		headers: {
			"Authorization": "Token " + recast.request_token
		},
		body: {
			text: text
		}
	}) ()
}

var DeleteLogs = () => recastRequest ({}, '/logs') ( (e) =>
	JSON.parse(e).results.map( e =>
		recastRequest ({
			method: 'DELETE'
		}, '/logs/' + e.id) ()
	)
)

var DeleteIntentExpressions = (intent) => getIntent (intent) ( (e) =>
	JSON.parse(e).results.expressions.map( e => {
		recastRequest ({
			method: 'DELETE'
		}, '/workflows/core/intents/' + intent + '/expressions/' + e.id) ()
	})
)

var syncExec = (array) => {
	var item = array.pop()
	if (item)
		item()
	setTimeout(() => syncExec(array), 50)
}

var test = (data) => {
	try {
		data.toString().match(/<EX>([^<]+)<\/EX>/g)
		.map( e => e.replace(/<(.+)>(.+)<\/\1>/, '$2') )
		.map( e => Text(e) )
	}
	catch (e) {}
}

DeleteLogs()
DeleteIntentExpressions ('anthropology')
// saveRacialBitch()
// saveIntent('racial')

// Text("Hello World !")
// fs.readdir('./sample_xml', (err, files) => {
// 	files.map( (f) => {
// 			fs.readFile('./sample_xml/' + f, (err, data) => {
// 				test(data)
// 			})
// 		}
// 	)
// })


// var t = []
// for(var ch = 'a'.charCodeAt(0); ch <= 'z'.charCodeAt(0); ch++ ) {
// 	HTTPrequest({
// 		host: 'www.webref.org',
// 		path: '/anthropology/' + String.fromCharCode(ch) + '.htm',
// 		method: 'GET'
// 	}, undefined, (data) => data.match(/>(.+)<\/a><\/font>/g).map( (e) => t.push( {fn : putExpression, arg : ['anthropology', e.match(/>(.+)<\/a>/)[1]]} )))
// }

// var makeField = (t) => {
// 	var item = t.pop()
// 	if (item) {
// 		console.log(item)
// 		item.fn(item.arg[0], item.arg[1])
// 		setTimeout( () => makeField(t), 500)
// 	}
// }

// setTimeout( () => makeField(t), 500)
