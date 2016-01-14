// config
var pjson = require('./package.json'),
	config = require('./config.json'),

	// dependencies
	restify = require('restify'),
	fs = require('fs'),
	request = require('request'),
	schedule = require('node-schedule'),

	// scripts
	inquire = require('./scripts/inquire.js'),
	h = require('./scripts/helper.js'),

	// variables
	files = {}

init()

// import files
function init() {
	var dataInitPromises = []
	Object.keys(config.files).forEach(function(key) {
		dataInitPromises.push(new Promise(function(resolve) {
			update(resolve, key)
		}))

		if (config.files[key].schedule) {
			schedule.scheduleJob(config.files[key].schedule, function() {
				update(null, key)
			})
		}
	})
	Promise.all(dataInitPromises).then(initServer)
}

function update(resolve, key) {
	if (config.files[key].path) {
		fs.readFile(config.data_dir + config.files[key].path, 'utf8', function(err, data) {
			if (err) throw err
			files[key] = JSON.parse(data)
			if (resolve)
				resolve()
		})
	} else {
		request(config.files[key].url, function(err, resp, body) {
			if (err) throw err
			files[key] = JSON.parse(body)
			if (resolve)
				resolve()
		})
	}
}

function initServer() {
	console.log("bla")
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
}

function anwser(file, geometry, props, options) {
	file = file == " " ? false : file
	geometry = geometry == " " ? false : geometry
	props = props == " " ? false : props
	options = options == " " ? false : options

	if (!file || !config.files[file]) {
		return {
			"code": "ResourceNotFound",
			"message": "invalid file name"
		}
	}

	if (!geometry && !props && !options) {
		return files[file]
	}

	var features = h.getDeepObj(files, file + "." + (config.files[file].level || config.level))

	// this will be changed to allow more complex spatial queries
	if (geometry) {
		var filteredFeatures = []
		features.forEach(function(feature) {
			if (inquire.inquire(geometry,feature.geometry.coordinates)){
				filteredFeatures.push(feature)
			}
		})
		features = filteredFeatures
	}

	if (props) {
		var filteredFeatures = []
		features.forEach(function(feature) {
			if (inquire.inquire(props,feature.properties)){
				filteredFeatures.push(feature)
			}
		})
		features = filteredFeatures
	}

	return features
}

function parseOptions(options) {
	return options
}