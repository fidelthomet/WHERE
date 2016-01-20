module.exports.getDeepObj = function(obj, path) {
	return getDeepObj(obj, path)
}

module.exports.parseUserOptions = function(options, option) {
	return parseUserOptions(options, option)
}

module.exports.parseOptions = function(options, userOptions, config, file) {
	return parseOptions(options, userOptions, config, file)
}

module.exports.propComparator = function(options) {
	return propComparator(options)
}

module.exports.flattenObject = function(obj, flatten) {
	return flattenObject(obj, flatten)
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

function parseUserOptions(options, option) {
	if (option.indexOf("&") == -1) {
		options[option.split(/=(.+)?/)[0]] = option.split(/=(.+)?/)[1]
	} else {
		parseUserOptions(options, option.split(/&(.+)?/)[0])
		parseUserOptions(options, option.split(/&(.+)?/)[1])
	}
}

function parseOptions(options, userOptions, config, file) {
	options.limit = (userOptions.limit || config.files[file].options.limit || config.options.limit)
	var maxlimit = config.files[file].options.limit || config.options.maxlimit
	if (options.limit > maxlimit && maxlimit != -1) {
		options.limit = maxlimit
	}
	options.page = (+userOptions.page + 1 || +config.files[file].options.page + 1 || +config.options.page + 1) - 1
	options.sortby = (userOptions.sortby || config.files[file].options.sortby || config.options.sortby)
	if (options.sortby == -1) {
		options.sortby = false
	}
	options.properties = (userOptions.properties || config.files[file].options.properties || config.options.properties)
	options.desc = (userOptions.desc || config.files[file].options.desc || config.options.desc)
	options.dist = (userOptions.dist || config.files[file].options.dist || config.options.dist)
}

function propComparator(options) {
	return function(a, b) {
		var dir = options.desc ? -1 : 1
		a = getDeepObj(a, "properties." + options.sortby)
		b = getDeepObj(b, "properties." + options.sortby)
		if (a == b)
			return 0
		return a < b ? -1 * dir : 1 * dir
	}
}

function flattenObject(obj, flatten) {
	var toReturn = {}

	for (var i in obj) {
		if (!obj.hasOwnProperty(i)) continue

		if ((typeof obj[i]) == 'object' && !Array.isArray(obj[i])) {
			var flatObject = flattenObject(obj[i])
			for (var x in flatObject) {
				if (!flatObject.hasOwnProperty(x)) continue

				flatten == "append" ? toReturn[i + '.' + x] = flatObject[x] : toReturn[x] = flatObject[x]
			}
		} else {
			toReturn[i] = obj[i]
		}
	}
	return toReturn
}