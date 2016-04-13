var request = require('request');

var requestFn = function () {
	request('//devpost.com', function (error, response, html) {
		console.log("Hello from inside request()");
		return html;
	});

	console.log("Hello from requestFn");
};

requestFn();