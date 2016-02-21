var map = null;

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

var getRadiusInKM = function () {
    var width = map.getWidth();
    var height = map.getHeight();
    var mpp = map.getMetersPerPixel();
    return (Math.min(width, height) / 2) * (mpp) / (1000);
};
var onViewChangeEnd = function (e)
{
    map.entities.clear();
    var latlon = map.getCenter();
    var zoomLevel = map.getZoom();
    var radiusInKM = getRadiusInKM();
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

};

var pinCities = function (cities) {
    for (var i = 0; i < cities.geonames.length; i++) {
        asyncPushPin(cities.geonames[i].lat, cities.geonames[i].lng, cities.geonames[i].name);
        console.log(cities.geonames[i].lat + " " + cities.geonames[i].lng + " ");
    }

};

var pushPin = function (lat, long, cityName) {
    var offset = new Microsoft.Maps.Point(0, 5);
    var news = newsSearch(lat, long, cityName);
    var newsCount = "" + news.d.results.length + "";
    var pushpinOptions = { text: newsCount, visible: true, textOffset: offset };
    var pushpin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(lat, long), pushpinOptions);
    var populateNewsList = function () {
        newsList(cityName, news);
    };
    var pushpinClick = Microsoft.Maps.Events.addHandler(pushpin, 'click', populateNewsList);
    map.entities.push(pushpin);
};


var newsSearch = function (lat, long, cityName) {
    var xmlHttp = new XMLHttpRequest();
    var encodedAuth = btoa("DYRL8vfmzDtLbJmo7+j/S+kZ1D/4j0drk6sZyxBD0wg:DYRL8vfmzDtLbJmo7+j/S+kZ1D/4j0drk6sZyxBD0wg");
    var requestStr = "https:\/\/api.datamarket.azure.com\/Bing\/Search\/News?Query=%27" + cityName + "%27&Latitude=" + lat + "&Longitude=" + long + "&$top=10&$format=JSON";
    xmlHttp.open("Get", requestStr, false);
    xmlHttp.setRequestHeader("Authorization", "Basic " + encodedAuth);
    xmlHttp.send(null);
    console.log(xmlHttp.responseText);
    return JSON.parse(xmlHttp.responseText);
};

var newsList = function (cityName, news) {

    var list = document.getElementById('myList');
    var cityDiv = document.createElement('div');
    var newsTitle = "";
    var newsUrl = "";
    var newsDesc = "";
    list.innerHTML = "";
    cityDiv.className = 'row';
    cityDiv.stylepadding = '10px 10px 10px 10px';
    cityDiv.innerHTML = "<h1>News for: "+cityName+"</h1>";
    list.appendChild(cityDiv);
    for (var i = 0; i < news.d.results.length; i++)
    {
        newsTitle = JSON.stringify(news.d.results[i].Title);
        newsUrl = JSON.stringify(news.d.results[i].Url);
        newsDesc = JSON.stringify(news.d.results[i].Description);
        var newsDiv = document.createElement('div');
        newsDiv.className = 'row';
        newsDiv.style.padding = '10px 10px 10px 10px';
        //newsDiv.style.backgroundColor = '#ffa500';
        newsDiv.innerHTML = "<a target=\"_blank\" href=" + newsUrl
            + ">" + newsTitle.substring(1,newsTitle.length-1) + "</a><br>"+"<span><font size=\"2\">"+newsDesc+"</font></span>";
        list.appendChild(newsDiv);
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

var navigateToUrl = function(city) {
    // open tab with URL
};

var asyncPushPin = function (lat, long, cityName) {
    var offset = new Microsoft.Maps.Point(0, 5);
    var pushpinOptions = { text: " ", visible: true, textOffset: offset };
    var pushpin = new Microsoft.Maps.Pushpin(new Microsoft.Maps.Location(lat, long), pushpinOptions);
    asyncNewsSearch(lat, long, cityName, pushpin);
    map.entities.push(pushpin);

};

var asyncNewsSearch = function (lat, long, cityName, pushpin) {
    var xmlhttp = new XMLHttpRequest();
    var encodedAuth = btoa("DYRL8vfmzDtLbJmo7+j/S+kZ1D/4j0drk6sZyxBD0wg:DYRL8vfmzDtLbJmo7+j/S+kZ1D/4j0drk6sZyxBD0wg");
    var requestStr = "https:\/\/api.datamarket.azure.com\/Bing\/Search\/News?Query=%27" + cityName + "%27&Latitude=" + lat + "&Longitude=" + long + "&$top=10&$format=JSON";
    xmlhttp.open("Get", requestStr, true);
    xmlhttp.setRequestHeader("Authorization", "Basic " + encodedAuth);
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState !== XMLHttpRequest.DONE) {
            return;
        }
        if (xmlhttp.status !== 200) {
            return;
        }

        var news = JSON.parse(xmlhttp.responseText);
        var newsCount = "" + news.d.results.length + "";

        var populateNewsList = function () {
            newsList(cityName, news);
        };

        var pushpinClick = Microsoft.Maps.Events.addHandler(pushpin, 'click', populateNewsList);

        var offset = new Microsoft.Maps.Point(0, 5);
        var pushpinOptions = { text: newsCount, visible: true, textOffset: offset };
        pushpin.setOptions(pushpinOptions);

    };
    xmlhttp.send();
};