// Parse query and compare it to given object. Hello Recursion!
var h = require('./helper.js'),
	turf = require('turf')

module.exports.inquireProperties = function(query, obj) {
	return inquireProperties(query, obj)
}

module.exports.inquireGeometry = function(query, obj) {
	return inquireGeometry(query, obj)
}

function inquireProperties(query, obj) {

	// Match balanced parentheses. It's a bit messy.
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

			if (query[i] == "(") {
				paraCount++
			} else if (query[i] == ")") {
				paraCount--
			}
		}

		var q0 = query.substring(0, paraLeft)
		var q1 = inquireProperties(innerQuery, obj)
		var q2 = query.substring(paraRight)

		return inquireProperties(q0 + q1 + q2, obj)
	}

	if (query.split(/&(.+)?/)[1]) {
		return inquireProperties(query.split(/&(.+)?/)[0], obj) && inquireProperties(query.split(/&(.+)?/)[1], obj)
	}
	if (query.split(/\|(.+)?/)[1]) {
		return inquireProperties(query.split(/\|(.+)?/)[0], obj) || inquireProperties(query.split(/\|(.+)?/)[1], obj)
	}
	if (query == "true") {
		return true
	}
	if (query == "false") {
		return false
	}

	var operator = query.match(/(<=|>=|<|>|!\$\$=|!=\$\$|!\$\$|\$\$=|=\$\$|!=\$|!\$=|\$=|=\$|\$\$|!\$|\$|!==|!=|==|=)/)[0]
	var a = h.getDeepObj(obj, query.split(operator)[0])
	var b = query.split(operator)[1]
	var result = false

	switch (operator) {
		case "<=":
			result = (a <= b)
			break
		case ">=":
			result = (a >= b)
			break
		case "<":
			result = (a < b)
			break
		case ">":
			result = (a > b)
			break
		case "!$$":
			result = (a.indexOf(b) == -1)
			break
		case "!$":
			result = ((a + "").toLowerCase().indexOf((b + "").toLowerCase()) == -1)
			break
		case "$$":
			result = (a.indexOf(b) != -1)
			break
		case "$":
			result = ((a + "").toLowerCase().indexOf((b + "").toLowerCase()) != -1)
			break
		case "!==":
			result = (a != b)
			break
		case "!=":
			result = ((a + "").toLowerCase() != (b + "").toLowerCase())
			break
		case "==":
			result = (a == b)
			break
		case "=":
			result = ((a + "").toLowerCase() == (b + "").toLowerCase())
			break
		case "!$$=":
			result = (a.indexOf(b) != 0)
			break
		case "$$=":
			result = (a.indexOf(b) == 0)
			break
		case "!=$$":
			result = (a.indexOf(b) != a.length - b.length)
			break
		case "=$$":
			result = (a.indexOf(b) == a.length - b.length)
			break
		case "!$=":
			result = ((a + "").toLowerCase().indexOf((b + "").toLowerCase()) != 0)
			break
		case "$=":
			result = ((a + "").toLowerCase().indexOf((b + "").toLowerCase()) == 0)
			break
		case "!=$":
			result = ((a + "").toLowerCase().indexOf((b + "").toLowerCase()) != a.length - b.length)
			break
		case "=$":
			result = ((a + "").toLowerCase().indexOf((b + "").toLowerCase()) == a.length - b.length)
			break
	}

	return result
}

function inquireGeometry(query, obj) {

	// Match balanced parentheses. It's a bit messy.
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

			if (query[i] == "(") {
				paraCount++
			} else if (query[i] == ")") {
				paraCount--
			}
		}

		var q0 = query.substring(0, paraLeft)
		var q1 = inquireGeometry(innerQuery, obj)
		var q2 = query.substring(paraRight)

		return inquireGeometry(q0 + q1 + q2, obj)
	}

	if (query.split(/&(.+)?/)[1]) {
		return inquireGeometry(query.split(/&(.+)?/)[0], obj) && inquireGeometry(query.split(/&(.+)?/)[1], obj)
	}
	if (query.split(/\|(.+)?/)[1]) {
		return inquireGeometry(query.split(/\|(.+)?/)[0], obj) || inquireGeometry(query.split(/\|(.+)?/)[1], obj)
	}
	if (query == "true") {
		return true
	}
	if (query == "false") {
		return false
	}

	var expect = true
	if (!query.indexOf("!")) {
		expect = false
		query = query.substring(1)
	}

	var arr = query.split(";")
	var arr2 = []
	arr.forEach(function(item) {
		arr2.push([parseFloat(item.split(",")[0]), parseFloat(item.split(",")[1])])
	})
	var type = "Point"
	var feature
	if (arr2.length == 1) {
		feature = turf.point(arr2[0])
	} else if(arr2.length == 2) {
		type = "LineString"
		feature = turf.linestring(arr2)
	} else {
		type = "Polygon"
		feature = turf.polygon([arr2])
	}

	var result = !expect

	if (obj.geometry.type == "Point" && type == "Point") {
		result = (obj.geometry.coordinates[0] == feature.geometry.coordinates[0] && obj.geometry.coordinates[1] == feature.geometry.coordinates[1])
	}
	if (obj.geometry.type == "Polygon" && type == "Polygon") {
		result = (turf.intersect(obj, feature) != undefined)
	}
	if (obj.geometry.type == "Point" && type == "Polygon") {
		result = (turf.inside(obj, feature))
	}
	if (obj.geometry.type == "Polygon" && type == "Point") {
		result = (turf.inside(feature, obj))
	}

	if (obj.geometry.type == "LineString" && type == "Polygon"){
		result = false
		var linestring = turf.linestring(feature.geometry.coordinates[0])
		if(lineIntersect(linestring.geometry, obj.geometry)){
			result = true
		} else {
			for (var i = 0; i < obj.geometry.coordinates.length; i++) {
				point = turf.point(obj.geometry.coordinates[i])
				if(turf.inside(point, feature)){
					result = true
					break
				}
			}
		}
	}

	if (obj.geometry.type == "Polygon" && type == "LineString"){
		result = false
		var linestring = turf.linestring(obj.geometry.coordinates[0])
		if(lineIntersect(linestring.geometry, feature.geometry)){
			result = true
		} else {
			for (var i = 0; i < feature.geometry.coordinates.length; i++) {
				point = turf.point(feature.geometry.coordinates[i])
				if(turf.inside(point, obj)){
					result = true
					break
				}
			}
		}
	}

	if (obj.geometry.type == "LineString" && type == "LineString"){
		if(lineIntersect(obj.geometry, feature.geometry)){
			result = true
		}
	}
	return (expect == result)

}

// taken from https://github.com/maxogden/geojson-js-utils
function lineIntersect(l1, l2) {
	var intersects = [];
	for (var i = 0; i <= l1.coordinates.length - 2; ++i) {
		for (var j = 0; j <= l2.coordinates.length - 2; ++j) {
			var a1 = {
					x: l1.coordinates[i][1],
					y: l1.coordinates[i][0]
				},
				a2 = {
					x: l1.coordinates[i + 1][1],
					y: l1.coordinates[i + 1][0]
				},
				b1 = {
					x: l2.coordinates[j][1],
					y: l2.coordinates[j][0]
				},
				b2 = {
					x: l2.coordinates[j + 1][1],
					y: l2.coordinates[j + 1][0]
				},
				ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
				ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
				u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
			if (u_b != 0) {
				var ua = ua_t / u_b,
					ub = ub_t / u_b;
				if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
					intersects.push({
						'type': 'Point',
						'coordinates': [a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)]
					});
				}
			}
		}
	}
	if (intersects.length == 0) intersects = false;
	return intersects;
}