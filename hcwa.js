// ----------------------------------------------
//global variable to be access anywhere
var map, geocoder, my_home_marker; 
// initializing Map
function initMap() {
	var center = {lat: -37.81, lng: 144.96};
	geocoder = new google.maps.Geocoder();
	map = new google.maps.Map(document.getElementById('map'), {
		minZoom: 9, 
		maxZoom: 15, 
		zoom: 12,
		center: center
	  });

	load_markers()	// Create markers
	autocomplete ()  // Autocomplete address input field

	// map.addListener('zoom_changed', function() {
	// 	console.log('Zoom: ' + map.getZoom());
	// });	
}


window.onload = function(e){ 
	// Checkboxes options
	const all_categories = ['Speech Pathology', 'Occupational Therapy', 'Psychology', 'ABA Therapy'];

	// Create checkboxes
	all_categories.forEach(function(value) {
	  $("#service-select").append('<label><input type="checkbox" name="filter" class="large" id="'+value+'">  '+value+'</label>');
	});

	// create an object for filterring from list of checkboxes and set everithing to false
	var filters = {}
	all_categories.forEach(function(item) {
		filters[item] = false;
	});

	// on checkbox change: 
	// - change filter value for checkbox (if true to fale, if false to true)
	// - change visibility of markers according to the filters
	$('#service-select > label > input[type=checkbox]').change(function () {
		map_filter(this.id);
		// console.log(filters)
		filter_markers(my_address_loc)
	});

	// change filter value for checkbox (if true to fale, if false to true)
	var map_filter = function(id_val) {
	   if (filters[id_val]) 
		  filters[id_val] = false
	   else
		  filters[id_val] = true
	}		

	// get an array of filter indexes if value set to true
	var get_set_options = function() {
		filter_array = []
		for (option in filters) {
			if (filters[option]) {
				filter_array.push(option)
			}
		}
		return filter_array;
	}

	// on address, radius set and submitted: 
	// - assign variables for use in filtering
	// - change visibility of markers according to the filters
	var my_address_loc, radius
	document.getElementById("distance-submit").addEventListener("click", function(){
		var my_address = document.getElementById('autocomplete').value;
		var r = document.getElementById("distance-select");
		radius = r.options[r.selectedIndex].value;
		geocode_address(my_address, radius, function(loc) {
			my_address_loc = loc;
			filter_markers(my_address_loc)
		});	
	});	

	function get_distance(p1, p2) {
		var R = 6378137; // Earth’s mean radius in meter
		var dLat = rad(p2.lat() - p1.lat());
		var dLong = rad(p2.lng() - p1.lng());
		var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(rad(p1.lat())) * Math.cos(rad(p2.lat())) *
		Math.sin(dLong / 2) * Math.sin(dLong / 2);
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		var d = R * c;
		return d; // returns the distance in meter
	};
	var rad = function(x) {
		return x * Math.PI / 180;
	};
	
	var selected_distance_markers = []
	// Changing visibility of markers according to the filters
	function filter_markers (my_address_loc) {  
		selected_categories = get_set_options()
		var d
		var selected_service_markers = []
		// Filtering by Service Type checkbox options	
		for (i = 0; i < markers.length; i++) {
			marker = markers[i];	
			if (selected_categories.some(r=> marker.category.indexOf(r) >= 0) ||
				selected_categories.length == 0) {
				selected_service_markers.push(marker);
			} 
		}

		selected_distance_markers = []
		// Filterring by address and distance
		for (i = 0; i < selected_service_markers.length; i++) {
			marker = selected_service_markers[i];			
			if (my_address_loc){
				d = get_distance(marker.getPosition(), my_address_loc)
				if(d < radius * 1000){
					selected_distance_markers.push(marker);
				}
			} else{
				selected_distance_markers = selected_service_markers
			}
		}

		//Change display options
		for (i = 0; i < markers.length; i++) {
			marker = markers[i];
			if (selected_distance_markers.includes(marker)) {
				marker.setVisible(true);
			} else {
				marker.setVisible(false);
			}		
		}
		return selected_distance_markers;
	}	

	// open overlay and insert info
	document.getElementById("show-results").addEventListener("click", function(){	
		for (i = 0; i < selected_distance_markers.length; i++) {
			var result_list = document.getElementById("results");
			var provider_div = document.createElement("DIV");
			provider_div.className = 'provider';
			var d = get_distance(selected_distance_markers[i].getPosition(), my_address_loc)
			var distance = '<p><span class="bold">Distance from location: </span>' + (d/1000).toFixed(2) + ' km</p>'
			provider_div.innerHTML = selected_distance_markers[i]['info'] + distance;

			result_list.appendChild(provider_div);
		}
		document.getElementById("results").style.width = "100%";	
	});	

	// close overlay
	$('.close-button').click(function() {
	    var overlay = $(this).parent().attr("id");
	    document.getElementById(overlay).style.width = "0%";
	});

	// print results
	document.getElementById("print").addEventListener("click", function(){	
	     var printContents = document.getElementById('results').innerHTML;
	     var originalContents = document.body.innerHTML;
	     document.body.innerHTML = printContents;
	     window.print();
	     document.body.innerHTML = originalContents;
	});

}	// window.onload closed

// Create markers
var markers = []
var marker, count;
function load_markers(){
// 	iconS_service = [null, icon1, icon2];  // No such thing as zoom level 0. A global variable or define within object.
// marker.setIcon(zoomIcons[map.getZoom()]);

	icon_service = {
		url: 'https://www.autismawareness.com.au/wp-content/themes/lc_theme/img/logo.png', 
		scaledSize: new google.maps.Size(30, 30), // scaled size
		origin: new google.maps.Point(0,0), // origin
		anchor: new google.maps.Point(0, 15) // anchor
	}
	var marker_info = ""
	for (count = 0; count < DATA.length; count++) {
		var address = DATA[count]["Location"];
		var lat = DATA[count]["latitude"];
		var lon = DATA[count]["longitude"];
		var googleID = DATA[count]["google_place_id"];
		var organisation = DATA[count]["Organisation"];
		var categories = DATA[count]["Services Offered"];
		var services = DATA[count]["Services Offered"];

		var phoneNumbers = '';
		var cell = DATA[count]["Contact Number"].replace("['",'').replace("']",'').replace("', '",'-');
		// getting phone numbers into links
		cell.split('-').forEach(function(element) {
			phoneNumbers += '<a href="tel:' +element+ '">'+element+'</a>   ';
		});
		
		// show get directions if address is set
		if (address.includes('Mobile')){
			var directions = "Call to organise a visit"
		} else {
			var directions = '<a href="https://www.google.com/maps/search/?api=1&query=Google&query_place_id=' + 
				googleID + '">Get Directions</a>'
		}
		// This info will be used for info window AND will be stored in the 
		// marker for use in print results
			
		marker_info = '<h3 style="font-weight:700;">' + organisation + '</h3>' +
				'<p><span class="bold">Address: </span>' + address + '</p>' +
				'<p><span class="bold">Services: </span>' + services + '</p>' +
				'<p><span class="bold">Phone Numbers: </span>' + phoneNumbers + '</p>' +
				'<p>' + directions + '</p>'

		marker = new google.maps.Marker({
			position: new google.maps.LatLng(lat, lon),
			map: map,
			title: organisation,
			category: categories,
			icon: icon_service,
			info: marker_info
		});
		markers.push(marker);

		// add info window for each marker
		var infowindow =  new google.maps.InfoWindow({});
		// HAVE NO IDEA WHY variable marker_info doesn't properly work fo infowindow.setContent.....
		//---------------------------
		google.maps.event.addListener(marker, 'click', (function (marker, count) {

			var services = DATA[count]["Services Offered"];
			return function () {
				infowindow.setContent(
					'<h3 style="font-weight:700;">' + organisation + '</h3>' +
					'<p><span class="bold">Address: </span>' + address + '</p>' +
					'<p><span class="bold">Services: </span>' + services + '</p>' +
					'<p><span class="bold">Phone Numbers: </span>' + phoneNumbers + '</p>' +
					'<p>' + directions + '</p>');
				infowindow.open(map, marker);
			}
		})(marker, count));
	}
	console.log('markers count: ' + count)	
}

// Autocomplete address input field
var autocomplete;
function autocomplete (){
	autocomplete = new google.maps.places.Autocomplete(
	(document.getElementById('autocomplete')), {
		types: ['geocode']
	});
}

var my_home_markerS =[]
var my_home_circleS =[]
function geocode_address (address, radius, callback){
	var loc
	geocoder.geocode({'address': address}, function(results, status) {
		if (status === 'OK') {
			map.setCenter(results[0].geometry.location);          	

			deleteCircles(my_home_circleS);
			if (radius < 100){
				addCircle(results[0].geometry.location, radius, my_home_circleS);
			}	

			deleteMarkers(my_home_markerS);
			addMarker(results[0].geometry.location, my_home_markerS);
			// can add additional info tomarker
			// marker.info = "info";

		    loc = results[0].geometry.location
            callback(loc); 
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
	});
}

function deleteMarkers(markers_array) {
	if (markers_array.length > 0){
		for (var i = 0; i < markers_array.length; i++ ) {
			markers_array[i].setMap(null);
		}		
		markers_array.length = 0;
	}
}

function addMarker(location, out_markers_array) {
	var marker = new google.maps.Marker({
	  position: location,
	  animation: google.maps.Animation.DROP,
	  map: map
	});
	out_markers_array.push(marker);
}

function deleteCircles(circles_array) {
	if (circles_array.length > 0){
		for (var i = 0; i < circles_array.length; i++ ) {
			circles_array[i].setMap(null);
			console.log(circles_array[i])
		}		
		circles_array.length = 0;
	}
}

function addCircle(location, radius, out_circles_array) {
	circle = new google.maps.Circle({
		strokeColor: '#90EE90',
		strokeOpacity: 0.8,
		strokeWeight: 2,
		fillColor: '#90EE90',
		fillOpacity: 0.3,
		map: map,
		center: location,
		radius: Number(radius)*1000
	});	
	out_circles_array.push(circle);
}

