// Parse query and compare it to given object. Hello Recursion!
var h = require('./helper.js')

module.exports.inquire = function(query, obj) {
	return inquire(query, obj)
}

function inquire(query, obj) {

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