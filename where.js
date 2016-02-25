// config
var pjson = require('./package.json'),
	config = require('./config.json'),

	// dependencies
	restify = require('restify'),
	fs = require('fs'),
	request = require('request'),
	schedule = require('node-schedule'),
	turf = require('turf'),

	// scripts
	inquire = require('./scripts/inquire.js'),
	h = require('./scripts/helper.js'),
	docs = require('./scripts/docs.js'),
	TimSort = require('timsort'),


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

	var server = restify.createServer({
		name: 'WHERE',
		version: pjson.version
	})

	// server.pre(restify.pre.sanitizePath());

	// Unsure if this is needed at some point
	// server.use(restify.acceptParser(server.acceptable))
	// server.use(restify.queryParser())
	// server.use(restify.bodyParser())

	server.use(restify.CORS());

	// define routes
	server.get('/q/:geojson', function(req, res) {
		res.send(respond(req.params.geojson))
	})

	server.get('/q/:geojson/:geometry', function(req, res) {
		res.send(respond(req.params.geojson, req.params.geometry))
	})

	server.get('/q/:geojson/:geometry/:props/', function(req, res) {
		res.send(respond(req.params.geojson, req.params.geometry, req.params.props))
	})

	server.get('/q/:geojson/:geometry/:props/:options', function(req, res) {
		res.send(respond(req.params.geojson, req.params.geometry, req.params.props, parseOptions(req.params.options)))
	})

	// send documentation (assuming it's not disabled in config.json)
	if (config.docs) {
		server.get('/', function(req, res) {
			var body = docs.docs(config, files);
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

function respond(file, geometry, props, opts) {
	file = file == " " ? false : file
	geometry = geometry == " " ? false : geometry
	props = props == " " ? false : props
	opts = opts == " " ? false : opts

	if (!file || !config.files[file]) {
		return {
			"code": "ResourceNotFound",
			"message": "invalid file name"
		}
	}

	if (!geometry && !props && !opts) {
		return files[file]
	}

	var features = h.getDeepObj(files, file + "." + (config.files[file].level || config.level))

	var filtered = []
		// this will be changed to allow more complex spatial queries

	features.forEach(function(feature) {
		delete(feature.dist)

		if (geometry && props) {
			if (inquire.inquireGeometry(geometry, feature) && inquire.inquireProperties(props, feature.properties))
				filtered.push(feature)
		} else if (geometry) {
			if (inquire.inquireGeometry(geometry, feature))
				filtered.push(feature)
		} else if (props) {
			if (inquire.inquireProperties(props, feature.properties))
				filtered.push(feature)
		} else {
			filtered.push(feature)
		}
	})

	// apply options
	var userOptions = {},
		options = {}

	h.parseUserOptions(userOptions, (opts || ""))
	h.parseOptions(options, userOptions, config, file)

	
	if (options.dist) {
		var user = turf.point(options.dist.split(","))
		filtered.forEach(function(feature) {
			if (feature.geometry.type == "Point") {
				// feature.properties.dist = getDistanceFromLatLonInM(feature.geometry.coordinates[0], feature.geometry.coordinates[1], user.geometry.coordinates[0], user.geometry.coordinates[1])
				feature.properties.dist = turf.distance(feature, user)
			}
		})
	}
	
	if (options.sortby) {
		// filtered.sort(h.propComparator(options));

		TimSort.sort(filtered, h.propComparator(options))
		// 
		
		// filtered = sort(filtered,options.sortby)
	}
	
	var total = filtered.length

	if (options.limit) {
		filtered = filtered.slice(options.page * options.limit, options.page * options.limit + parseInt(options.limit))
	}

	if (options.properties != -1) {
		if (!options.properties) {
			filtered.forEach(function(feature) {
				feature.properties = {}
			})
		} else {
			filtered.forEach(function(feature) {
				var newProps = {}
				options.properties.split("|").forEach(function(property) {
					newProps[property] = feature.properties[property]
				})
				feature.properties = newProps
			})
		}
	}

	var response = {
		"type": "FeatureCollection",
		"properties": {
			"results": total,
			"limit": options.limit,
			"page": options.page
		},
		"features": filtered
	}

	return response
}

function parseOptions(options) {
	return options
}

function getDistanceFromLatLonInM(lon1, lat1, lon2, lat2) {
	//based on http://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates-shows-wrong

	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2 - lat1); // deg2rad below
	var dLon = deg2rad(lon2 - lon1);
	var a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c * 1000; // Distance in m
	return Math.round(d);
}

function deg2rad(deg) {
	return deg * (Math.PI / 180)
}