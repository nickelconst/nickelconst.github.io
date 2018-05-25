function getTextWidth(text, font) {
	this.element = document.createElement("canvas");
	this.context = this.element.getContext("2d");
	this.context.font = font;
	return this.context.measureText(text).width
}

async function addMarkers() {
	var county_data_files = [
		"MN-BW"
		,"MN-CO"
		,"MN-JK"
		,"MN-MR"
		,"MN-MU"
		,"MN-NO"
		// ,"MN-PP"
		,"MN-RW"
		// ,"MN-RK"
		,"MN-WW"
		,"IA-CY"
		,"IA-DK"
		,"IA-OA"
		,"IA-OB"
	]
	window.marker_array = [];
	window.twp_marker_array = [];

	// Township names
	var offset = 0;
	for (var i = 0; i < window.twp.length; i++) {
		for (var j = 0; j < window.twp[i].twp.length; j++) {
			var twp = window.twp[i].twp[j];
			var loc = new google.maps.LatLng({
				lat: twp.lat,
				lng: twp.lng
			});
			var l_size = [getTextWidth(twp.name, "bold 16pt Roboto") + 16, 26];
			window.twp_marker_array[offset + j] = new google.maps.Marker({
				position: loc,
				map: window.map,
				label: {
					color: '#000',
					fontFamily: 'Roboto',
					fontSize: 16 * window.devicePixelRatio + 'pt',
					fontWeight: 'bold',
					text: twp.name
				},
				icon: {
					path: "M 0 0 L " + l_size[0] + " 0 " +
						l_size[0] + " " + l_size[1] + " 0 " + l_size[1] + " Z",
					fillOpacity: 1,
					fillColor: '#fff',
					strokeOpacity: 0,
					anchor: {x: l_size[0] / 2, y: l_size[1] / 2},
					labelOrigin: {x: l_size[0] / 2, y: l_size[1] / 2},
					scale: window.devicePixelRatio
				}
			});
			// window.twp_marker_array[offset + j].setZIndex(1);
			window.twp_marker_array[offset + j].setCursor("pointer");
			// makeTwpListener(window.twp_marker_array[offset + j], window.twp[i].cty);
		}
		offset += j;
	}

	// Section numbers
	var marker_array_offset = 0;
	window.reqs = [];
	window.finished_reqs = 0;

	for (var i = 0; i < county_data_files.length; i++) {
		window.reqs[i] = new XMLHttpRequest();
		window.reqs[i].open("GET", ("https://f001.backblazeb2.com/file/nccom-data/" + county_data_files[i]));
		window.reqs[i].responseType = "arraybuffer";

		window.reqs[i].onload = function(e) {
			var dv = new DataView(this.response);
			var lat_off = dv.getUint8(0);
			var lng_off = -(dv.getUint8(1));
			var coords = [];
			for (var j = 0; j < (dv.byteLength - 2) / 4; j++) {
				var lat_d = dv.getInt16(2 + j * 4);
				var lng_d = dv.getInt16(4 + j * 4);
				coords[j] = [lat_off + lat_d / 10000, lng_off + lng_d / 10000];
			}
			for (var j = 0; j < coords.length; j++) {
				loc = new google.maps.LatLng({
					lat: coords[j][0],
					lng: coords[j][1]
				});
				var l_size = String(j % 36 + 1).length * 12 + 4;
				window.marker_array[marker_array_offset + j] = new google.maps.Marker({
					position: loc,
					map: window.map,
					label: {
						color: '#fff',
						fontFamily: 'Roboto, Arial',
						fontSize: 16 * window.devicePixelRatio + "pt",
						fontWeight: 'bold',
						text: "" + (j % 36 + 1)
					},
					icon: {
						path: "M 0 0 L " + l_size + " 0 " + l_size + " 21 0 21 Z",
						fillOpacity: 0.6,
						strokeOpacity: 0,
						anchor: { x: l_size / 2, y: 11 },
						labelOrigin: { x: l_size / 2, y: 11 },
						scale: window.devicePixelRatio
					},
					id: j
				});
				// window.marker_array[marker_array_offset + j].setZIndex(0);
				window.marker_array[marker_array_offset + j].setVisible(false);
				window.marker_array[marker_array_offset + j].setCursor("pointer");
				window.marker_array[marker_array_offset + j].addListener("click", function(e) {
					clickedMarker(e.latLng.lat().toFixed(4) + "," +
								  e.latLng.lng().toFixed(4));
				});
			}
			marker_array_offset += coords.length;
			window.finished_reqs += 1;
			if (window.finished_reqs == county_data_files.length) {
				style("loading_text").display = "none";
				toggleSectionNumbers();
			}
		}

		window.reqs[i].send();
	}
}

function clickedMarker(i) {
	window.open("https://www.google.com/maps/search/?api=1&query=" + i, "_blank");
}

function makeTwpListener(marker, cty) {
	marker.addListener("click", function() {
		window.open("https://www.google.com/maps/search/?api=1&query=" + marker.label.text + "+Township,+" + cty + "+County,+MN", "_blank");
	});
}

window.sectionNumbersVisible = false;

function toggleSectionNumbers() {
	if (window.map.getZoom() > 10) {
		window.sectionNumbersVisible = !window.sectionNumbersVisible;
		for (var i = 0; i < window.marker_array.length; i++) {
			window.marker_array[i].setVisible(window.sectionNumbersVisible && window.map.getBounds().contains(window.marker_array[i].getPosition()));
		}
	}
}