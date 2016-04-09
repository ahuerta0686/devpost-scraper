var request = require('request'),
    cheerio = require('cheerio');

var url = 'http://bitcamp15.devpost.com/submissions';

module.exports = {
    submissions = function (hackathon, page, filters) {
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

                return data;
            }
        });
    }
}

// request(url, function (error, response, html) {
//     var data = [];
//     if (!error) {
//         var $ = cheerio.load(html);

//         $('.gallery-item').each(function (index, element) {
//             var link = $( $(element).find('.link-to-software') ).attr('href');
//             var image = $( $(element).find('figure > img') ).attr('src');
//             var title = $( $(element).find('figcaption > div > h5') ).text().trim();
//             var desc = $( $(element).find('figcaption > div > p') ).text().trim();
//             var teamSize = $(element).find('.user-profile-link').length;
//             data.push({
//                 'url': link,
//                 'imageUrl': image,
//                 'title': title,
//                 'description': desc,
//                 'teamSize': teamSize
//             });
//         });

//         console.log(data);
//     }
// });