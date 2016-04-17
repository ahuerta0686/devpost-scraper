var request = require('request'),
    cheerio = require('cheerio'),
    Q = require('q'),
    toMarkdown = require('to-markdown');

/*
 * @param hackathon - Subdomain used for a hackathon page on Devpost
 */
var hackathonPagesLength = function (hackathon) {
    var deferred = Q.defer();

    var url = 'http://' + hackathon + '.devpost.com/submissions/search?page=1';
    setTimeout(function () {
    request(url, function (error, response, html) {
        if (error)
            deferred.reject(error);
        else if (response.statusCode != 200)
            deferred.reject(response);
        else {
            var $ = cheerio.load(html);

            // <li> with class "next next_page" is right after the last page number
            // If not matched there is only one page
            var nextPageSelector = $('.next.next_page');
            if (nextPageSelector.length) {
                var lastPageSelector = nextPageSelector.prev();
                var numPages = parseInt(lastPageSelector.text());
                deferred.resolve(numPages);
            }
            else deferred.resolve(1);
        }
    });
    }, 0);

    return deferred.promise;
};

/*
 * @param hackathon - Subdomain used for a hackathon page on Devpost
 * @param page - Page number to scrape
 * @param filters - Any filters to apply in the URL
 */
var hackathonProjects = function (hackathon, page, filters) {
    var deferred = Q.defer();

    var url = 'http://' + hackathon + '.devpost.com/submissions/search?';
    if (page)
        url += 'page=' + page;
    if (Array.isArray(filters)) {
        filters.forEach(function (filter) {
            url += '&' + filter.paramKey + '=' + filter.paramValue;
        });
    }

    setTimeout(function () {
    request(url, function (error, response, html) {
        var data = [];

        if (error)
            deferred.reject(error);
        else if (response.statusCode != 200)
            deferred.reject(response);
        else {
            var $ = cheerio.load(html);

            /*
             * url - URL to software page
             * imageUrl - URL for the preview image
             * title - Project title
             * tagline - Short description under the title
             * teamSize - Number of members shown
             * slug - Idenifier for project
             */
            $('.gallery-item').each(function (index, item) {
                var url = $(item).find('.link-to-software').attr('href');
                var imageUrl = $(item).find('figure > img').attr('src');
                var title = $(item).find('.software-entry-name > h5').text().trim();
                var tagline = $(item).find('.software-entry-name > p').text().trim();
                var numMembers = $(item).find('.user-profile-link').length;
                var numLikes = $(item).find('.like-count').contents().filter(function () {
                    return this.nodeType == 3;
                }).text().trim();
                var numComments = $(item).find('.comment-count').contents().filter(function () {
                    return this.nodeType == 3;
                }).text().trim();

                var slug = url.match(/^.*software\/(.*)\/{0,1}$/)[1];
                data.push({
                    'url': url,
                    'imageUrl': imageUrl,
                    'title': title,
                    'tagline': tagline,
                    'numMembers': numMembers,
                    'numLikes': numLikes,
                    'numComments': numComments,
                    'slug': slug
                });
            });

            deferred.resolve(data);
        }
    });
    }, 0);

    return deferred.promise;
};

/*
 * @param hackathon - Subdomain used for a hackathon page on Devpost
 * @param filters - Any filters to apply in the URL
 */
var hackathonProjectsAll = function (hackathon, filters) {
    var deferred = Q.defer();

    setTimeout(function () {
    hackathonPagesLength(hackathon)
    .then(function (numPages) {
        var promises = [];
        for (var i = 0; i <= numPages; i++)
            promises.push(hackathonProjects(hackathon, i, filters));

        return Q.all(promises);
    })
    .then(function (projectArrays) {
        var data = [];
        projectArrays.forEach(function (projects) {
            data = data.concat(projects);
        });

        deferred.resolve(data);
    })
    .catch(function (error) {
        deferred.reject(error);
    });
    }, 0);

    return deferred.promise;
};

/*
 * @param hackathon - Subdomain used for a hackathon page on Devpost
 */
var hackathonFilters = function (hackathon) {
    var deferred = Q.defer();

    var url = 'http://' + hackathon + '.devpost.com/submissions';

    setTimeout(function () {
    request(url, function (error, response, html) {
        var data = [];

        if (error)
            deferred.reject(error);
        else if (response.statusCode != 200)
            deferred.reject(response);
        else {
            var $ = cheerio.load(html);

            $('.filter-submissions > .panel > ul > li').each(function (index, item) {
                var filterObj = $(item).find('.checkbox > input');

                data.push({
                    paramKey: filterObj.attr('name'),
                    paramValue: filterObj.attr('value'),
                    text: filterObj.parent().contents().filter(function () {
                        return this.nodeType == 3;
                    }).text()
                });
            });

            deferred.resolve(data);
        }
    });
    }, 0);

    return deferred.promise;
};

/*
 * @param hackathon - Subdomain used for a hackathon page on Devpost
 */
var hackathonFindBySlug = function (hackathon) {
    var deferred = Q.defer();

    var url = 'http://' + hackathon + '.devpost.com';

    setTimeout(function () {
    request(url, function (error, response, html) {
        var data = {};

        if (error)
            deferred.rejct(error);
        else if (response.statusCode != 200)
            deferred.reject(response);
        else {
            var $ = cheerio.load(html);

            /*
             * title - Software title
             * body - Markdown formatted details
             * location - Hackathon location
             * judges
             * judgingCriteria
             * prizeCashValue
             * prizes
             * submissionTime
             */
            var title = $('title').text().match(/^(.*) \| Devpost$/)[1];
            var body = toMarkdown($('#challenge-description').html().trim());

            var locationObj = $('.location');
            var location = {};
            location.name = locationObj.find('p').first().text().trim();
            if (locationObj.find('p > a').length)
                location.address = locationObj.find('p > a').text().trim();

            var judges = [];
            $('.challenge_judge').each(function (index, item) {
                judges.push({
                    avatarUrl: $(item).find('figure > img').attr('src'),
                    name: $(item).find('div > p > strong').text().trim(),
                    title: $(item).find('div > p > i').text().trim()
                });
            });

            var judgingCriteria = [];
            $('#judging-criteria > ul > li').each(function (index, item) {
                judgingCriteria.push({
                    criteria: $(item).find('strong').text().trim(),
                    description: $(item).contents().filter(function () { return this.nodeType == 3 }).text().trim()
                });
            });

            if($('.challenge-register-section > strong').length)
                var prizeCashValue = parseInt($('.challenge-register-section > strong').text().match(/^\$([0-9,]*)/)[1].replace(/,/g, ''));
            var prizes = [];
            $('.prize').each(function (index, item) {
                prizes.push({
                    challenge: $(item).find('h6').text().trim(),
                    winnings: $(item).find('p:nth-of-type(2)').text().trim()
                });
            });

            var datesUrl = url + '/details/dates';
            var submissionTime = {};
            request(datesUrl, function (error, response, html) {
                var $ = cheerio.load(html);

                submissionTime.open = $('table > tbody > tr > td:nth-of-type(2)').first().text().trim();
                submissionTime.close = $('table > tbody > tr > td:nth-of-type(3)').first().text().trim();
                deferred.resolve({
                    title: title,
                    body: body,
                    slug: hackathon,
                    location: location,
                    judges: judges,
                    judgingCriteria: judgingCriteria,
                    prizeCashValue: prizeCashValue,
                    prizes: prizes,
                    submissionTime: submissionTime
                });
            });
        }
    });
    }, 0);

    return deferred.promise;
};

var hackathonSearch = function (query) {
    var deferred = Q.defer();

    var url = 'http://devpost.com/hackathons?search=' + query + '&challenge_type=all&sort_by=Recently+Added';

    setTimeout(function () {
    request(url, function (error, response, html) {
        var data = [];

        if (error)
            deferred.reject(error);
        else if (response.statusCode != 200)
            deferred.reject(response);
        else {
            var $ = cheerio.load(html);

            $('.challenge-listing').each(function (index, item) {
                data.push({
                    title: $(item).find('.title').text().trim(),
                    description: $(item).find('.challenge-description').text().trim(),
                    imageUrl: $(item).find('.challenge-logo > img').attr('src'),
                    slug: $(item).find('a').attr('href').match(/^http:\/\/(.*)\.devpost.com.*/)[1]
                });
            });

            deferred.resolve(data);
        }
    });
    }, 0);

    return deferred.promise;
};

/*
 * @param slug - Text that follows "software/" in a Devpost project URL
 */
var projectFindBySlug = function (slug) {
    var deferred = Q.defer();

    var url = 'http://devpost.com/software/' + slug;

    setTimeout(function () {
    request(url, function (error, response, html) {
        var data = {};

        if (error)
            deferred.reject(error);
        else if (response.statusCode != 200)
            deferred.reject(response);
        else {
            var $ = cheerio.load(html);

            /*
             * title - Software title
             * tagline - Short description / pitch under title
             * slides - array containing images and captions
             * body - markdown formatted details pane
             * tags - array of tags used for project
             * links - array of additional software links
             * event - event submitted to with image and name
             * winnings - prizes won at event
             * team - array of team members with url for avatar, username, and full name
             */
            var title = $('#app-title').text();
            var tagline = $('#software-header').find('p').text().trim();

            var slides = [];
            var gallery = $('#gallery');
            if (gallery.length) {
                
                gallery.find('ul > li').each(function (index, item) {
                    slides.push({
                        imageUrl: $(item).find('.software_photo_image').attr('src'),
                        caption: $(item).find('p > i').text().trim()
                    });
                });
            }

            var body = {};
            if (gallery.length)
                body = $('#app-details-left > div:nth-of-type(2)').html().trim();
            else
                body = $('#app-details-left > div:nth-of-type(1)').html().trim();

            var tags = [];
            $('#built-with > ul > li').each(function (index, item) {
                var tag = $(item).find('.cp-tag');
                tags.push({
                    text: tag.text(),
                    recognized: tag.hasClass('recognized-tag')
                });
            });

            var links = [];
            $('.app-links > ul > li').each(function (index, item) {
                links.push({
                    text: $(item).find('a > span').text(),
                    url: $(item).find('a').attr('href')
                });
            });

            var event = {};
            var eventObj = $('.software-list-with-thumbnail > li');
            event = {
                imageUrl: eventObj.find('.software-list-thumbnail > a > img').attr('src'),
                title: eventObj.find('.software-list-content > p').text().trim(),
                slug: eventObj.find('.software-list-content > p > a').attr('href').match(/https{0,1}:\/\/(.*)\.devpost\.com\//)[1]
            };

            var winnings = [];
            $('.winner').each(function (index, item) {
                winnings.push( $(item).parent().contents().filter(function () {
                    return this.nodeType == 3;
                }).text().trim() );
            });

            var team = [];
            $('.software-team-member').each(function (index, item) {
                team.push({
                    avatarUrl: $(item).find('div > figure > a > img').attr('src'),
                    username: $(item).find('div > figure > a > img').attr('alt'),
                    fullName: $(item).find('div > a.user-profile-link').text().trim()
                });
            });

            data = {
                title: title,
                tagline: tagline,
                slug: slug,
                slides: slides,
                body: toMarkdown(body),
                tags: tags,
                links: links,
                event: event,
                winnings: winnings,
                team: team
            };

            deferred.resolve(data);
        }
    });
    }, 0);

    return deferred.promise;
};

module.exports = {
    hackathon: {
        search: hackathonSearch,
        findBySlug: hackathonFindBySlug,
        filters: {
            all: hackathonFilters
        },
        projects: {
            all: hackathonProjectsAll
        },
        pages: {
            length: hackathonPagesLength
        }
    },
    project: {
        findBySlug: projectFindBySlug
    }
}