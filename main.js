var request = require('request'),
    cheerio = require('cheerio'),
    Q = require('q');

var url = 'http://bitcamp15.devpost.com/submissions';

var numPages = function (hackathon) {
    var deferred = Q.defer();

    var url = 'http://' + hackathon + '.devpost.com/submissions/search?page=1';
    request(url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);
            var pages = $( $('.next.next_page').prev() ).text();
            var pagesInt = parseInt(pages);
            if (Number.isInteger(pagesInt)) {
                deferred.resolve(pagesInt);
            }
            else {
                deferred.reject("Error: Not a number");
            }
        }
        else {
            deferred.reject("Error: Not a valid hackathon");
        }
    });

    return deferred.promise;
};

var hackathonPage = function (hackathon, page, filters) {
        var deferred = Q.defer();

        var url = 'http://' + hackathon + '.devpost.com/submissions/search?';
        if (page != undefined) {
            url += "page=" + page;
        }

        request(url, function (error, response, html) {
            var data = [];
            if (!error) {
                var $ = cheerio.load(html);
                $('.gallery-item').each(function (index, element) {
                    var link = $( $(element).find('.link-to-software') ).attr('href');
                    var image = $( $(element).find('figure > img') ).attr('src');
                    var title = $( $(element).find('figcaption > div > h5') ).text().trim();
                    var desc = $( $(element).find('figcaption > div > p') ).text().trim();
                    var teamSize = $(element).find('.user-profile-link').length;
                    data.push({
                        'url': link,
                        'imageUrl': image,
                        'title': title,
                        'description': desc,
                        'teamSize': teamSize
                    });
                });

                deferred.resolve(data);
            }
            else {
                deferred.reject(error);
            }
        });

        return deferred.promise;
    }

var hackathonProjectsAll = function (hackathon) {
    var deferred = Q.defer();

    // var baseUrl = 'http://' + hackathon + '.devpost.com/submissions/search?page=';
    numPages(hackathon)
    .then(
        function successCallback(numPages) {
            var promises = [];
            for (var i = 1; i <= numPages; i++) {
                promises.push(hackathonPage(hackathon, i));
            }
            Q.all(promises)
            .then(
                function successCallback(data) {
                    var output = [];
                    data.forEach(function (projects) {
                        output = output.concat(projects);
                    });
                    deferred.resolve(output);
                },
                function errorCallback(error) {
                    deferred.reject("ERROR");
                });
        },
        function errorCallback(error) {
            deferred.reject(error);
        });

    return deferred.promise;
};

hackathonAll('bitcamp15')
.then(
    function successCallback(data) {
        console.log(data);
    },
    function errorCallback(error) {
        console.log(error);
    });

module.exports = {
    hackathon: {
        projects: {
            all: hackathonProjectsAll
        }
    },
    submissions: function (hackathon, page, filters) {
        var deferred = Q.defer();

        var url = 'http://' + hackathon + '.devpost.com/submissions/search?';
        if (page != undefined) {
            url += "page=" + page;
        }

        request(url, function (error, response, html) {
            var data = [];
            if (!error) {
                var $ = cheerio.load(html);
                $('.gallery-item').each(function (index, element) {
                    var link = $( $(element).find('.link-to-software') ).attr('href');
                    var image = $( $(element).find('figure > img') ).attr('src');
                    var title = $( $(element).find('figcaption > div > h5') ).text().trim();
                    var desc = $( $(element).find('figcaption > div > p') ).text().trim();
                    var teamSize = $(element).find('.user-profile-link').length;
                    data.push({
                        'url': link,
                        'imageUrl': image,
                        'title': title,
                        'description': desc,
                        'teamSize': teamSize
                    });
                });

                deferred.resolve(data);
            }
            else {
                deferred.reject(error);
            }
        });

        return deferred.promise;
    }
}