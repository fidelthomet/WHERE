// config
var pjson = require('./package.json')
var config = require('./config.json')
	// dependencies
var restify = require('restify')

var server = restify.createServer({
	name: 'WHERE',
	version: pjson.version
})

server.pre(restify.pre.sanitizePath());

// Unsure if this is needed at some point
// server.use(restify.acceptParser(server.acceptable))
// server.use(restify.queryParser())
// server.use(restify.bodyParser())

// define routes
server.get('/q/:geojson', function(req, res, next) {
	res.send(handleRequest(req.params.geojson))
})

server.get('/q/:geojson/:query', function(req, res, next) {
	res.send(handleRequest(req.params.geojson, parseQuery(req.params.query)))	
})

server.get('/q/:geojson/:query/:options', function(req, res, next) {
	res.send(handleRequest(req.params.geojson, parseQuery(req.params.query), parseOptions(req.params.options)))
})

// init server
server.listen((process.env.PORT || config.port), function() {
	console.log('%s listening at port %s', server.name, (process.env.PORT || config.port))
})

function handleRequest(file, query, options) {
	console.log(file)
	return {
		file: file,
		query: query,
		options: options
	}
}

function parseQuery(query){
	return query
}

function parseOptions(options){
	return options
}
