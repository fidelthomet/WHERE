# WHERE? GeoJSON -> API

*Where?* turns static GeoJSON files into queryable APIs. This is particularly useful for filtering huge datasets by location and/or properties.

Have a look at the [demo application](http://where.ft0.ch/) to see how it works.

## Features
- makes GeoJSON FeatureCollections queryable (supports spatial and property-based queries)
- returns valid GeoJSON
- supports local and hosted GeoJSON files
- supports multiple GeoJSON files
- supports cron-like scheduling to update datasets
- Generates API-Documentation (mostly) automaticly

## Getting Started
These instructions describe how to run *Where?* on your local machine for development and testing. See deploy on Heroku for notes on how to deploy the project.

### Prerequisites
*Where?* requieres Node.js. If you don’t have it yet, go download and install [Node.js](https://nodejs.org/en/download/).

### Installing
Grab a copy of *Where?*, open your Terminal (or other Command Line Interface), `cd` into the directory and install the dependencies using npm:
	npm install
To test the application run this command:
	node where.js

## Configuration
Open `config.json` to set up *Where?* according to your needs.

| Property | Description |
| --- | --- |
| `port` | Sets server port (may be overwritten by environment variable `PORT`). Default: `65432` |
| `data_dir` | directory for local GeoJSON-files. Default: `data/` |
| `level` | path to FeatureCollection in GeoJSON file structure (may be overwritten in file specific properties). Default: `features` |
| `options` | default options for queries and server responses. (may be overwritten in file specific options) |
| `options.limit` | number of results per request. Default `20` |
| `options.maxlimit` | maximal number of results per request (may not be overwritten by options set in request). Use `-1` to lift limit. Default: `100` |
| `options.page` | page of query results. Default: `0`|
| `options.sortby` | Property to sort query results by. Use `-1` to skip sorting. Default: -1 |
| `options.desc` | Sorting order. Default: `false` (ascending) |
| `options.properties` | `|`-seperated list of feature-properties to return. Use `-1` to return all properties. Default: `-1` |
| `files` | Queryable files. Each file is described in an object, while the object-key serves as a unique identifier (referencing many and/or huge JSON files, may result in high memory-consumption) |
| `files[key]` | file specific properties. |
| `files[key].url` | url to hosted JSON file (for local files use `files[key].path` instead) |
| `files[key].path` | path to local JSON file (for hosted files use `files[key].url` instead) |
| `files[key].level` | overwrites `level` |
| `files[key].schedule` | Automatically update datasets at specified schedule. Takes a Cron-style string (e.g. `* 10 3 * * 3` to update the file every Wednesday at 03:10 am). [Read more](https://github.com/node-schedule/node-schedule#cron-style-scheduling) |
| `files[key].options` | overwrites `options` |
| `docs` | Enables API documentation. Default: `true` |
| `title` | Page title used in documentation. Default: `WHERE? API Documentation` |
| `description` | API-Description used in documentation |
| `hostname` | Hostname used in documentation. E.g. `http://example.com` |
| `examples` | Query examples shown in documentation |
| `examples[?].url` | Query |
| `examples[?].description` | Descritption |

## Deploy on Heroku
Deployment on Heroku is done in a few steps:
1. Fork your own copy of this repository to your account
2. Modify `config.json` to fit your needs
3. Sign in to [Heroku](https://www.heroku.com)
4. Create a new App
5. Choose an App Name and Runtime Selection
6. Under **Deployment Method** choose GitHub
7. Connect Heroku with your GitHub Account
8. Select the repository
9. Under **Manual Deploy** choose your Branch and click on **Deploy Branch**
10. Wait
11. Done

## Licence
Copyright 2016 Fidel Thomet
Licensed under the [MIT License](http://opensource.org/licenses/MIT).