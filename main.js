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
};

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

var projectFindBySlug = function (projectSlug) {
    var deferred = Q.defer();

    var url = 'http://devpost.com/software/' + projectSlug;
    request(url, function (error, response, html) {
        if (!error) {
            var $ = cheerio.load(html);

            var detailsObj = $('#app-details-left > div:nth-of-type(2)');
            var builtWithObj = $('.cp-tag');
            var slidesObj = $('.software_photo_image');
            var teamMembersObj = $('.software-team-member');
            var hackathonObj = $('.software-list-with-thumbnail').html();

            var projectDetails = [];
            $(detailsObj).children().each(function (index, element) {
                if (index % 2 == 0) {
                    projectDetails.push({heading: $(element).text(), text: ''});
                }
                else {
                    projectDetails[projectDetails.length - 1].text = $(element).text();
                }
            });

            var projectTags = [];
            $(builtWithObj).each(function (index, element) {
                projectTags.push($(element).text());
            });

            var projectImages = [];
            $(slidesObj).each(function (index, element) {
                projectImages.push($(element).attr('src'));
            });

            var projectMembers = [];
            $(teamMembersObj).each(function (index, element) {
                projectMembers.push({
                    avatarUrl: $(element).find('.software-member-photo').attr('src'),
                    name: $(element).find('.user-profile-link').text()
                });
            });

            var projectEvent = {};
            projectEvent.imageUrl = $(hackathonObj).find('.software-list-thumbnail > a > img').attr('src');
            projectEvent.name = $(hackathonObj).find('.software-list-content > p > a').text();
            projectEvent.serviceId = $(hackathonObj).find('.software-list-content > p > a').attr('href');

            var re = /https{0,1}:\/\/(.*)\.devpost\.com\//;
            projectEvent.serviceId = projectEvent.serviceId.match(re)[1];

            deferred.resolve({
                details: projectDetails,
                tags: projectTags,
                images: projectImages,
                members: projectMembers,
                event: projectEvent
            });

        }
        else {
            deferred.reject(error);
        }
    });

    return deferred.promise;
};

module.exports = {
    hackathon: {
        projects: {
            all: hackathonProjectsAll
        }
    },
    project: {
        findBySlug: projectFindBySlug
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