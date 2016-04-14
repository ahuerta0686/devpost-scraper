# Devpost Scraper

Interested in contributing or have feedback? Send me an email at ahuerta0686@gmail.com

This is my first NPM package so I welcome [considerate] feedback.

```javascript
var devpost = require('devpost-scraper');
```

## Get all projects from a hackathon

```javascript
devpost.hackathon.projects.all(hackathon, filters);
```

#### Parameters

* hackathon - Devpost subdomain for hackathon page
* filters - *coming soon*

#### Array of objects returned contains

* url - URL to software page
* imageUrl - Source URL for the preview image
* title - Title of the project
* tagline - Short description of the the project (pitch)
* slug - Part of the URL after "software/"
* numMembers - Number of team members working on the project
* numLikes - Number of likes the project currently has
* numComments - Number of comments / updates the project currently has

## Get all info from a project page

```javascript
devpost.project.findBySlug(slug);
```
