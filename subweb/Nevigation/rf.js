mapboxgl.accessToken = mapboxAPI.MY_KEY;

// set up map
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/yu-mei/ckam227i04e2l1ika3lhwhtsu', 
    center: [-0.13374,51.52455], // starting position [log, lat]
    zoom: 12 // starting zoom
    });

// call direction API
var direction= new MapboxDirections({
            accessToken: mapboxgl.accessToken,
            unit:'metric',
            profile:'mapbox/cycling',
            controls:{
                profileSwitcher:false
                }
            });

// add direction control
map.addControl(direction ,'top-right');


// add legend of cycle route
var routenames=["Quietways", "Central London Grid", "Cycle Superhighways", "Mini-Hollands"];
var colors = ["#44da69","#f31616","hsl(300, 100%, 50%)","hsl(319, 97%, 56%)"];
var span = document.createElement('span');
span.className ='legendName';
span.innerHTML='Route Type'+'<br>';
legend.appendChild(span);

for (var i=0; i<colors.length;i++){
    var div = document.createElement('div');
    var color=colors[i];
     
    div.innerHTML +=
                '<span style="background:'+color+'"></i>'+
                 '&#160;'+routenames[i]
        
    legend.appendChild(div);
};

var divproposed = document.createElement('div');
divproposed.innerHTML = '<span style="background:hsl(0, 1%, 65%);border-style:dashed">Proposed Route</span>';
div.appendChild(divproposed);                

// legend of air quality
var bands= ['Low','Moderate','High','Very High','No Data'];
var pics = ['low.png','mod.png','high.png','veryhigh.png','nodata.png'];
var airspan =document.createElement('span');
airspan.className = 'airlegend';
airspan.innerHTML = 'Air Quality'+'<br>';
airlegend.appendChild(airspan);
for (var i=0 ; i< bands.length;i++){
    var airdiv = document.createElement('div');
    var pic = pics[i];
    airdiv.innerHTML += '<img src='+pic+'>'+'&#160;'+'&#160;'+bands[i]
    airlegend.appendChild(airdiv);
}




// use user's location as origin
function getLocation(){
    
    if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(success,error);
    }else{
        window.alert("Geolocation is not supproted!")
    }
    
};

// called by getLocation, if it succeeds in getting user's location, then set user's location as orgin
function success(pos) {
  var crd = pos.coords;
  var coor =[]
  coor.push(crd.longitude);
  coor.push(crd.latitude);
  direction.setOrigin(coor);  //using setOrigin API
};

//called by getLocation, when it fails to get the user's location
function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
}




map.on('load', function () {


// add existed cycle Route layer   
map.addLayer({
    id:'existedLayer',
    type: 'line',
    source: {
                type: 'vector',
                url: 'mapbox://yu-mei.6h68rgdn' 
                    },
    'source-layer': 'Active_Travel_Zone_GIS_layers-bzc47o', // name of tilesets
    'layout': {
                'visibility': 'visible'
                    },
     paint:{
         'line-color':[   // set different colors for different routes
      "match", ["string", ["get", "Type"]],
        "Quietways",
        "#44da69",
        "Central London Grid",
        "#f31616",
        "Cycle Superhighways",
        "hsl(300, 100%, 50%)",
        "Mini-Hollands",
        "hsl(319, 97%, 56%)",
        "hsl(0, 0%, 0%)"
      ],
         'line-width': 3,
         'line-opacity': 0.5
     },
    filter:["==",'Status','Existing']
});    

// add proposed cycle route layer
map.addLayer({
    id:'proposedLayer',
    type: 'line',
    source: {
                type: 'vector',
                url: 'mapbox://yu-mei.6h68rgdn' 
                    },
    'source-layer': 'Active_Travel_Zone_GIS_layers-bzc47o', // name of tilesets
    'layout': {
                'visibility': 'visible'
                    },
     paint:{
         'line-color':"hsl(0, 1%, 65%)"
      ,
         'line-width':3 ,
         'line-opacity': 0.8,
         'line-dasharray':[1, 0.5]
     },
    filter:["==",'Status','Proposed']
}); 

// create a popup variable 
var popup = new mapboxgl.Popup({
closeButton: false,
closeOnClick: false
});

    
    
// when mouseover of existed route layer, show popup of the route name
map.on('mouseover', 'existedLayer', function(e) {
    
map.getCanvas().style.cursor = 'pointer';

popup
.setLngLat(e.lngLat)
.setHTML(e.features[0].properties.Route_Name)
.addTo(map);
    
});
 
 
// close popup of existed route layer when it leaves.
map.on('mouseleave', 'existedLayer', function() {

map.getCanvas().style.cursor = '';
popup.remove();
}); 
    
//when mouseover of proposed route layer, show popup of the route name   
map.on('mouseover', 'proposedLayer', function(e) {

map.getCanvas().style.cursor = 'pointer';

popup
.setLngLat(e.lngLat)
.setHTML(e.features[0].properties.Route_Name)
.addTo(map);
    
});

// close popup of proposed route layer when it leaves.
map.on('mouseleave', 'proposedLayer', function() {

map.getCanvas().style.cursor = '';
popup.remove();
}); 
  
// add Bike Sharing Points
// access Tfl API to get bike points
var bikeurl = "Https://api.tfl.gov.uk/BikePoint?app_id="+TflAPI.app_id+"&app_key="+TflAPI.api_key
var reqbike = new XMLHttpRequest();
reqbike.responseType = 'json';
reqbike.open('GET', bikeurl, true);
reqbike.onload  = function() {
    var bikeResponse = reqbike.response; //get response of the dataset
    //var bikePoint=[];
    var bikePoints=[];
    var bikeStatus= [];
    for (var i=0 ; i<bikeResponse.length;i++){
        var bikelon = bikeResponse[i].lon;
        var bikelat = bikeResponse[i].lat;
        var bikeName = bikeResponse[i].commonName;
        var bikeDock = bikeResponse[i].additionalProperties[8].value;//number of docks
        var bikeBike = bikeResponse[i].additionalProperties[6].value;//number of bikes
        var bikeSpace = bikeResponse[i].additionalProperties[7].value;//number of empty docks 
        bikePoints.push({'coords':[bikelon,bikelat],'Name':bikeName,'Dock':bikeDock,'Bike':bikeBike,'Space':bikeSpace});// push lon and lat into an array
        //bikeStatus.push({"Name":bikeName,"Dock":bikeDock,"Bike":bikeBike,"Space":bikeSpace});
       
    }        
 //   console.log(bikePoints)
    bikePoints.forEach(function(marker){
        var markers = document.createElement('div');
        markers.className = 'markers in';
        //markers.id = 'marker';
        markers.style.content="url('point.png')";
        markers.style.width = 15+"px";
        markers.style.height = 18+"px";

        var markerPopup= new mapboxgl.Marker(markers)
        .setLngLat(marker.coords)
        .setPopup(new mapboxgl.Popup() // add popups
            .setHTML('<b>Name: </b>' + marker.Name + '<br><b>Docks: </b>' + marker.Dock + '<br><b>Bikes: </b>'
                    +marker.Bike+'<br><b>Empty Space </b>'+marker.Space))
        .addTo(map);
        
        const element = markerPopup.getElement();
element.id = 'markerPopup'
// hover event listener
element.addEventListener('mouseenter', () => markerPopup.togglePopup());
element.addEventListener('mouseleave', () => markerPopup.togglePopup());
        
});
  
    
          };
    reqbike.send();   


// add Air Quality stations    
var airurl = 'http://api.erg.kcl.ac.uk/AirQuality/Hourly/MonitoringIndex/GroupName=London/Json';
var reqair = new XMLHttpRequest(); 
reqair.responseType='json';
reqair.open('GET', airurl, true);
reqair.onload  = function() {
    var airresponse = reqair.response;//get response of the air quality dataset
    //console.log(airresponse);
    var localAuth = airresponse.HourlyAirQualityIndex.LocalAuthority;
    var sites = [];
    var airinfo = [];
    for (var i = 0; i<localAuth.length; i++){
        
        sites.push(localAuth[i].Site)
        
    };
    console.log(sites)
    for(var q=0 ; q<sites.length; q++){
       if (q == 1 || q ==12 ||q ==17 ||q ==24 || q ==30 ){
        continue;}// these arrays are null, so vant be looped
    for (var j=0 ; j<sites[q].length; j++){
         
            var datetime= sites[q][j]['@BulletinDate'];
            var airlon = sites[q][j]['@Longitude'];
            var airlat = sites[q][j]['@Latitude'];
            var sitename =sites[q][j]['@SiteName'];
            var species = sites[q][j]['Species']
            
            var type=[];
            for (var l=0; l< species.length; l++){
                type += species[l]['@SpeciesCode']+' Index: '+species[l]['@AirQualityIndex']+' Band: '+species[l]['@AirQualityBand']+'<br>'
                var band = species[0]['@AirQualityBand'];
            }
            airinfo.push({'Coords':[airlon,airlat],
                          'Sitename':sitename,
                          'DateTime':datetime,
                          'Species':type,
                          'Band':band
                          })
        }};
    
    console.log(airinfo)
    
// air quality markers
    airinfo.forEach(function(air){
        var airpoints = document.createElement('div');
        airpoints.className = 'air in';
        //airpoints.id = 'air';
        airpoints.style.content=getCol(air.Band);
        airpoints.style.width = 20+"px";
        airpoints.style.height = 20+"px";
        airpoints.style.border = 1 + "px";
        

        var airPopup= new mapboxgl.Marker(airpoints)
        .setLngLat(air.Coords)
        .setPopup(new mapboxgl.Popup() // add popups
            .setHTML('<b>Name: </b>' + air.Sitename + '<br><b>Date&Time: </b>' + air.DateTime + '<br><b>Type: </b>'
                    +'<br>'+air.Species))
        .addTo(map);
        
        const airelement = airPopup.getElement();
airelement.id = 'airPopup'
// hover event listener
airelement.addEventListener('mouseenter', () => airPopup.togglePopup());
airelement.addEventListener('mouseleave', () => airPopup.togglePopup());
        
});
    
    
    
};
reqair.send();
 
// get smiles     
function getCol(value){
           return value == 'Low' ? 'url(low.png)' :
                  value == 'Moderate'   ? 'url(mod.png)':
                  value == 'High' ? 'url(high.png)' :
                  value == 'Very High' ? 'url(veryhigh.png)' :
                                'url(nodata.png)';
       };  
    
  
    
    
// get coordinates of every steps, and distance
direction.on('route', function(e){
    var routes = e.route[0].legs[0].steps;
    //console.log(routes);
    var coords = [];
    var distance = [0];
    var dist=0;
    //distance.push(0);
    for (var i =0; i< routes.length; i++){
       var coord = routes[i].intersections[0].location;
       coords.push(coord);
       
       dist += parseFloat(routes[i].distance); //covert string distance to float
       distance.push(dist);   //distance increment array
    }
    

     
    
    // request elevtion api
    var latlon = "";
    var lat ="";
    var lon = "";
    var l;
    
    // loop for the coordinates array
    for ( l=0 ;  l< coords.length; l++ ){
        
            lon = coords[l][0] +',' ;
            lat = coords[l][1] +',';
        
        latlon += lat+lon;
    };
    
    latlon=latlon.substring(0, latlon.length - 1);
    //console.log(latlon);
    //getEle(latlon);
    
    //function getEle(e){   
    var url = 'https://api.airmap.com/elevation/v1/ele/?points='+ latlon ;
               
    var req = new XMLHttpRequest();
    req.responseType = 'json';
        req.open('GET', url, true);
        req.onload  = function() {
        
            var jonResponse = req.response;
            
            var elevation = jonResponse.data;
            
            // call d3 chart to show elevation profile
            eleProfile(distance, elevation);
            
            //console.log(distance);
              
        };
         req.send();   
    //};

});
  

});
    
// d3 chart main function   
function eleProfile(distance, elevation){
    data = [];
    
    for (var i =0; i<elevation.length; i++){
        data.push({x:distance[i],y:elevation[i]});
    };
   
    
    
    var meter=distance[(distance.length)-1];
   
    //console.log(km);
    var svg = d3.select('#chartContainer')
                .style("background-color", "#f7fafa");
     
    
    //Remove any previously generated chart content.
    svg.selectAll('*').remove();

    var width = svg.attr('width');
        var height = svg.attr('height');
    var margins = {
            top: 40,
            right: 20,
            bottom: 40,
            left: 50
        };
    
    var xRange = d3.scaleLinear().range([margins.left, width - margins.right])
            .domain([d3.min(data, function (d) {
                return d.x;
            }), d3.max(data, function (d) {
                return d.x;
            })]);

    var yRange = d3.scaleLinear().range([height - margins.top, margins.bottom])
            .domain([d3.min(data, function (d) {
                return d.y;
            }), d3.max(data, function (d) {
                return d.y;
            })]);

    //Create the x-axis.
    svg.append('g')
            .attr('transform', 'translate(0,' + (height - margins.bottom) + ')')
            .call(d3.axisBottom(xRange));

    svg.append('text')
            .attr('x', width/2)
            .attr('y', height-10)
            .style('text-anchor', 'middle')
            .text('Distance (m)');

    //Create the y-axis.
    svg.append('g')
            .attr('transform', 'translate(' + (margins.left) + ',0)')
            .call(d3.axisLeft(yRange));


    
        var lineFunc = d3.line()
              .x(function (d) {
                  return xRange(d.x);
              })
              .y(function (d) {
                  return yRange(d.y);
              });
       
        //Create the elvation profile line.
        svg.append('svg:path')
            .attr('d', lineFunc(data))
            .attr('stroke', 'blue')
            .attr('stroke-width', 2)
            .attr('fill', 'none');
    
   
    var focus = svg.append("g")                                
    .style("display", "none");
    
    
    data.forEach(function(d){
        d.x=d.x;
        d.y= +d.y;
     });
    
    //append x dash line
    focus.append("line")
        .attr("class","x")
        .style("stroke", "blue")
        .style("stroke-dasharray","3,3")
        .style("opacity",0.5)
        .attr("y1",0)
        .attr("y2",height);
    
    //append y dash line
    focus.append("line")
        .attr("class","y")
        .style("stroke", "blue")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("x1", width)
        .attr("x2", width);
    
    // append circle
    focus.append("circle")                                 
        .attr("class", "y")                                
        .style("fill", "none")                             
        .style("stroke", "blue")                           
        .attr("r", 4);                                     
    
    
    // append value at intersection
    focus.append("text")
        .attr("class", "y1")
        .style("stroke", "white")
        .style("stroke-width", "3.5px")
        .style("opacity", 0.8)
        .attr("dx", 8)
        .attr("dy", "-.3em");
    focus.append("text")
        .attr("class", "y2")
        .attr("dx", 8)
        .attr("dy", "-.3em");
    
    // place the date at the intersection
    focus.append("text")
        .attr("class", "y3")
        .style("stroke", "white")
        .style("stroke-width", "3.5px")
        .style("opacity", 0.8)
        .attr("dx", 8)
        .attr("dy", "1em");
    focus.append("text")
        .attr("class", "y4")
        .attr("dx", 8)
        .attr("dy", "1em");
    
    
    // append the rectangle to capture mouse               
    svg.append("rect")                                     
        .attr("width", width)                              
        .attr("height", height)                            
        .style("fill", "none")                             
        .style("pointer-events", "all")                    
        .on("mouseover", function() { focus.style("display", null); })
        .on("mouseout", function() { focus.style("display", "none"); })
        .on("mousemove", mousemove);                       

     var bisectx = d3.bisector(function(d) { return d.x; }).left; 
    
    function mousemove() {                                 
        var x0 = xRange.invert(d3.mouse(this)[0]),              
            i = bisectx(data, x0, 1),                   
            d0 = data[i - 1],                              
            d1 = data[i],                                  
            d = x0 - d0.x > d1.x - x0 ? d1 : d0;     

        focus.select("circle.y")                           
            .attr("transform",                             
                  "translate(" + xRange(d.x) + "," +         
                                 yRange(d.y) + ")");
        
        
        focus.select("text.y1")
		    .attr("transform",
		          "translate(" + xRange(d.x) + "," +
		                         yRange(d.y) + ")")
		    .text("Height: "+d.y +"m");

		focus.select("text.y2")
		    .attr("transform",
		          "translate(" + xRange(d.x) + "," +
		                         yRange(d.y) + ")")
		    .text("Height: "+d.y +"m");

		focus.select("text.y3")
		    .attr("transform",
		          "translate(" + xRange(d.x) + "," +
		                         yRange(d.y) + ")")
		    .text("Distance: " + (d.x).toFixed(2) + " m ");

		focus.select("text.y4")
		    .attr("transform",
		          "translate(" + xRange(d.x) + "," +
		                         yRange(d.y) + ")")
		    .text("Distance: " + (d.x).toFixed(2)+ " m ");

		focus.select(".x")
		    .attr("transform",
		          "translate(" + xRange(d.x) + "," +
		                         yRange(d.y) + ")")
		               .attr("y2", height - yRange(d.y));

		focus.select(".y")
		    .attr("transform",
		          "translate(" + width * -1 + "," +
		                         yRange(d.y) + ")")
		               .attr("x2", width + width);
        
    
    };
   
    
    
        svg.append('text')
            .attr('x', -(height / 2))
            .attr('y', 15)
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'middle')
            .text('Elevation (m)');
    
        svg.append('text')
            .attr('x', width/2)
            .attr('y', 25)
            .style('text-anchor', 'middle')
            .style("font-size", "20px")
            .text('Elevation Profile');
        
        svg.append('text')
            .attr('x', width-80)
            .attr('y', 25)
            .style('text-anchor', 'middle')
            .style("font-size", "13px")
            .text('Calories Burned: '+Math.round(meter/1000*30)+ ' Cal');
    
        
        svg.append('text')
            .attr('x', width-63)
            .attr('y', 43)
            .style('text-anchor', 'middle')
            .style("font-size", "13px")
            .text('CO2 Cut: '+ Math.round(meter/1000*21*9) + ' g');
    

    

}; 
    
