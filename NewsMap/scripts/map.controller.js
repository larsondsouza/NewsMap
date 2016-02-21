﻿var map = null;

function getMap() {

    map = new Microsoft.Maps.Map(document.getElementById('myMap'),
        {
            credentials: 'AuXytQ8vPwI03MbMU6VqEOqoTo-wdXVBFuIJsLi1SYbnxkiZdKwkvdhMjL1o7FfF',
            showMapTypeSelector: false,
            zoom: 12
        });

    map.setView({ mapTypeId: Microsoft.Maps.MapTypeId.road });

    navigator.geolocation.getCurrentPosition(GetLocation);
    function GetLocation(location) {
        map.setView({ center: new Microsoft.Maps.Location(location.coords.latitude, location.coords.longitude) });
    }

    var viewchangeend = Microsoft.Maps.Events.addHandler(map, 'viewchangeend', function (e) {
        onViewChangeEnd(e);
    });

}

var pushPin = function (lat, long, numberOfNews) {

    var offset = new Microsoft.Maps.Point(0, 5);
    var pushpinOptions = { text: numberOfNews, visible: true, textOffset: offset };
    var pushpin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(lat, long), pushpinOptions);


    var pushpinClick = Microsoft.Maps.Events.addHandler(pushpin, 'click', populateNewsList);

    map.entities.push(pushpin);

};



var populateNewsList = function () {
    addRow();
};

var addRow = function () {
    var div = document.createElement('div');
    div.className = 'row';
    div.innerHTML = 'List item';
    document.getElementById('myList').appendChild(div);
};

var onViewChangeEnd = function (e)
{
    map.entities.clear();
    var latlon = map.getCenter();
    var zoomLevel = map.getZoom();
    var width = map.getWidth();
    var height = map.getHeight();
    var mpp = map.getMetersPerPixel();
    var radiusInKM = (Math.min(width,height) / 2) * (mpp) / (1000);
    var cities = null;
    var citiesType = null;

    console.log("ZOOM: " + + zoomLevel + "HERE");
    // states views
    // zoom 1 - 5 (very zoomed out)
    if(zoomLevel <= 5) {
        cities = getCitiesHighZoom(radiusInKM, latlon.latitude, latlon.longitude);
    }
    else if(zoomLevel > 5 && zoomLevel <=9) {
        citiesType = "cities5000";
        cities = getCitiesLowZoom(radiusInKM, latlon.latitude, latlon.longitude, citiesType);
    }
    else {
        // low level zoom 9-19
        citiesType = "cities1000";
        cities = getCitiesLowZoom(radiusInKM, latlon.latitude, latlon.longitude, citiesType);
    }

    console.log(cities);
    pinCities(cities);
    var news = newsSearch(radiusInKM, latlon.latitude, latlon.longitude);

};

var pinCities = function (cities) {
    for (var i = 0; i < cities.geonames.length; i++) {
        pushPin(cities.geonames[i].lat, cities.geonames[i].lng, "5");
        console.log(cities.geonames[i].lat + " " + cities.geonames[i].lng + " ");
    }

};

var getCitiesLowZoom = function(radius, lat, long, citiesType)
{
    var query = "http:\/\/api.geonames.org\/findNearbyPlaceNameJSON?lat=" + lat + "&lng=" + long + "&radius=" + Math.min(radius,300) + "&cities=" + citiesType + "&username=devKing";
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", query, false ); // false for synchronous request
    xmlHttp.send(null);
    console.log(xmlHttp.responseText);
    var cities = JSON.parse(xmlHttp.responseText);
    return cities;
};

var getCitiesHighZoom = function(radius, lat, long)
{
    var xmlHttp = new XMLHttpRequest();

    // prepare query
    // http://api.geonames.org/citiesJSON?north=46.5657&south=44.26&east=-91.050&west=-95.15&lang=de&username=devKing
    var outReach = 15.0; // 5 lat, lng pts (1 to 2 states out)
    var maxRows = 20; // max cities returned
    // set bounding box to find cities within it
    var north = lat + outReach;
    var south = lat - outReach;
    var east = long + outReach;
    var west = long - outReach;

    query = "http:\/\/api.geonames.org\/citiesJSON?north=" + north + "&south=" + south + "&east=" + east + "&west=" + west + "&maxRows=" + maxRows + "&username=devKing";
    // execute request
    xmlHttp.open( "GET", query, false ); // false for synchronous request
    xmlHttp.send(null);
    console.log(xmlHttp.responseText);

    console.log("Current lat, lng: " + lat + ", " + long + "W: " + west + "E: " + east + "N: " + north + "S: " + south);
    console.log("getting state cities");
    var cities = JSON.parse(xmlHttp.responseText);

    return cities;
};

var newsSearch = function (radius, lat, long) {
    var xmlHttp = new XMLHttpRequest();
    var encodedAuth = btoa("DYRL8vfmzDtLbJmo7+j/S+kZ1D/4j0drk6sZyxBD0wg:DYRL8vfmzDtLbJmo7+j/S+kZ1D/4j0drk6sZyxBD0wg");
    var requestStr = "https:\/\/api.datamarket.azure.com\/Bing\/Search\/News?Query=%27seattle%27&Latitude=" + lat + "&Longitude=" + long + "&$top=100&$format=JSON";
    xmlHttp.open("Get", requestStr, false);
    xmlHttp.setRequestHeader("Authorization", "Basic " + encodedAuth);
    xmlHttp.send(null);
    console.log(xmlHttp.responseText);
    return JSON.parse(xmlHttp.responseText);
};

var cities = function () {
    // Get news from clicked city
};

var navigateToUrl = function(newsTitle) {
    // open tab with URL
};