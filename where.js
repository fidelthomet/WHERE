// config
var pjson = require('./package.json')
var config = require('./config.json')
	// dependencies
var restify = require('restify')
var Lexer = require('lex')
var Parser = require('./scripts/parser.js')

var server = restify.createServer({
	name: 'WHERE',
	version: pjson.version
})


// server.pre(restify.pre.sanitizePath());

// Unsure if this is needed at some point
// server.use(restify.acceptParser(server.acceptable))
// server.use(restify.queryParser())
// server.use(restify.bodyParser())

// define routes
server.get('/q/:geojson', function(req, res) {
	res.send(anwser(req.params.geojson))
})

server.get('/q/:geojson/:geometry', function(req, res) {
	res.send(anwser(req.params.geojson, req.params.geometry))
})

server.get('/q/:geojson/:geometry/:props/', function(req, res) {
	res.send(anwser(req.params.geojson, req.params.geometry, req.params.props))
})

server.get('/q/:geojson/:geometry/:props/:options', function(req, res) {
	res.send(anwser(req.params.geojson, req.params.geometry, req.params.props, parseOptions(req.params.options)))
})

// send documentation (assuming it's not disabled in config.json)
if (config.docs) {
	server.get('/', function(req, res) {


		var body = '<html><body>hello</body></html>';
		res.writeHead(200, {
			'Content-Length': Buffer.byteLength(body),
			'Content-Type': 'text/html'
		});
		res.write(body);
		res.end();
	})
}

// init server
server.listen((process.env.PORT || config.port), function() {
	console.log('%s listening at port %s', server.name, (process.env.PORT || config.port))
})

function anwser(file, geometry, props, options) {
	file = file == " " ? false : file
	geometry = geometry == " " ? false : geometry
	props = props == " " ? false : props
	options = options == " " ? false : options

	console.log(geometry)
	
	return {
		file: file
		// geometry: geometry,
		// props: props,
		// options: options
	}
}

function inquire(query, obj) {
	
	// handle parenthesis
	while (query.match(/\(/)) {
		innerQuery = ""
		paraCount = 0

		var paraLeft = query.search(/\(/)
		var paraRight = 0

		for (var i = paraLeft + 1; i < query.length; i++) {

			if (query[i] == ")" && !paraCount) {
				paraRight = i + 1
				break
			}

			innerQuery += query[i]

			if (query[i] == "(")
				paraCount++
				else if (query[i] == ")")
					paraCount--
		}

		var q0 = query.substring(0, paraLeft)
		var q1 = inquire(innerQuery, obj)
		var q2 = query.substring(paraRight)
		
		return inquire(q0 + q1 + q2, obj)
	}

	if (query.split(/&(.+)?/)[1]) {
		return inquire(query.split(/&(.+)?/)[0], obj) && inquire(query.split(/&(.+)?/)[1], obj)
	}
	if (query.split(/\|(.+)?/)[1]) {
		return inquire(query.split(/\|(.+)?/)[0], obj) || inquire(query.split(/\|(.+)?/)[1], obj)
	}
	if (query == "true") {
		return true
	}
	if (query == "false") {
		return false
	}


	var operator = query.match(/(<=|>=|<|>|!\$\$=|!=\$\$|!\$\$|\$\$=|=\$\$|!=\$|!\$=|\$=|=\$|\$\$|!\$|$|!==|!=|==|=)/)[0]
	
	var a = getDeepObj(obj, query.split(operator)[0])
	
	var b = query.split(operator)[1]

	result = false;
	
	switch (operator) {
		case "<=":
			result = (a <= b)
			break;
		case ">=":
			result = (a >= b)
			break;
		case "<":
			result = (a < b)
			break;
		case ">":
			result = (a > b)
			break;
		case "!$$":
			result = (a.indexOf(b) == -1)
			break;
		case "!$":
			result = ((a+"").toLowerCase().indexOf((b+"").toLowerCase()) == -1)
			break;
		case "$$":
			result = (a.indexOf(b) != -1)
			break;
		case "$":
			result = ((a+"").toLowerCase().indexOf((b+"").toLowerCase()) != -1)
			break;
		case "!==":
			result = (a != b)
			break;
		case "!=":
			result = ((a+"").toLowerCase() != (b+"").toLowerCase())
			break;
		case "==":
			result = (a == b)
			break;
		case "=":
			result = ((a+"").toLowerCase() == (b+"").toLowerCase())
			break;
		case "!$$=":
			result = (a.indexOf(b) != 0)
			break;
		case "$$=":
			result = (a.indexOf(b) == 0)
			break;
		case "!=$$":
			result = (a.indexOf(b) != a.length - b.length)
			break;
		case "=$$":
			result = (a.indexOf(b) == a.length - b.length)
			break;
		case "!$=":
			result = ((a+"").toLowerCase().indexOf((b+"").toLowerCase()) != 0)
			break;
		case "$=":
			result = ((a+"").toLowerCase().indexOf((b+"").toLowerCase()) == 0)
			break;
		case "!=$":
			result = ((a+"").toLowerCase().indexOf((b+"").toLowerCase()) != a.length - b.length)
			break;
		case "=$":
			result = ((a+"").toLowerCase().indexOf((b+"").toLowerCase()) == a.length - b.length)
			break;
	}

	return result
}

function parseProps(props) {
	return props
}

function parseParenthesis(query) {
	//look for the indexes of all opening parenthesis, then look for all the closing ones
}

function parseOptions(options) {
	return options
}

function getDeepObj(obj, path) {
	var splitPath = path.split(/\.(.+)?/)

	if (typeof obj[splitPath[0]] === 'undefined' || obj[splitPath[0]] === null)
		obj[splitPath[0]] = {}

	var deepObj = obj[splitPath[0]]

	if (typeof splitPath[1] === 'undefined')
		return deepObj
	else
		return getDeepObj(deepObj, splitPath[1])
}