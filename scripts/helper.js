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
	if (option.indexOf("&")==-1) {
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
	options.page = (userOptions.page + 1 || config.files[file].options.page + 1 || config.options.page + 1) - 1
	options.sortby = (userOptions.sortby || config.files[file].options.sortby || config.options.sortby)
	if (options.sortby == -1) {
		options.sortby = false
	}
	options.params = (userOptions.params || config.files[file].options.params || config.options.params)
	options.desc = (userOptions.desc || config.files[file].options.desc || config.options.desc)
}

function propComparator(options) {
	return function(a, b) {
		var dir = options.desc ? -1 : 1
		a = getDeepObj(a, "properties."+options.sortby)
		b = getDeepObj(b, "properties."+options.sortby)
		if (a == b)
			return 0
		return a < b ? -1 * dir : 1 * dir
	}
}