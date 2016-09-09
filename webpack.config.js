var webpack = require('webpack');

module.exports = {
	context: __dirname, 
	entry: "./entry.js",
	output: {
		path: __dirname + "/dist",
		filename: "bundle.js", 
		sourceMapFilename: "[file].js"
	},
    module: {
		loaders: [
			{
				loader: 'babel-loader',
				exclude: /node_modules/,
				query: {
					presets: ['es2015']
				}
			}
		]
	}, 
	devtool: "source-map"
};