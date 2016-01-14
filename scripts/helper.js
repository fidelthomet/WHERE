module.exports.getDeepObj = function(obj, path) {
	return getDeepObj(obj, path)
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