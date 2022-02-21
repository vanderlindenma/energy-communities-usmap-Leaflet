// // // Projection

var proj = d3.geo.albersUsa()
  // .translate([0, 0])
  .scale(.5);

var AlbersProjection = {
  project: function(latLng) {
    var point = proj([latLng.lng, latLng.lat]);
    return point ? 
        new L.Point(point[0], point[1]) : 
	    	new L.Point(0, 0);
  },
  unproject: function(point) {
    var latLng = proj.invert([point.x, point.y]);
    return new L.LatLng(latLng[1], latLng[0]);
  }
}

var AlbersCRS = L.extend({}, L.CRS, {
  projection: AlbersProjection,
  transformation: new L.Transformation(1, 0, 1, 0),
  infinite: true
});

// // // Map

var map = L.map('map', {
    crs: AlbersCRS,
    minZoom: 2,
    maxZoom: 9
  }).setView([37.8, -96], 3);

// // // Counties outline

var customLayer = L.geoJson(null, {
    // http://leafletjs.com/reference.html#geojson-style
    style: function(feature) {
        return { weight: 0.5,
                 fill : 0,
                 opacity : 0.4
                 };
    }
});

omnivore.topojson('https://unpkg.com/us-atlas@3.0.0/counties-10m.json',
                  null,
                  customLayer).addTo(map);

// // // Bubbles

// Color palette
function palette(min, max) {
  const d = (max-min)/4;
  return d3.scale.threshold()
  .range(['#008c00', '#61c600', '#ff9567', '#ff0000'])
  .domain([min + d*1,min + d*2,min + d*3]);
};

function color_from_pal(value, min, max){
  const pal = palette(min,max);
  var where = 4 - _.sum(pal.domain().map(d => value < d))
  return pal.range()[where-1]
}

// Circle marker
function geojsonMarkerOptions(rad, col) {
    
    var geojsonMarkerOptions = {
        radius: rad,
        fillColor: col,
        color: "",
        weight: 0.5,
        opacity: 0.7,
        fillOpacity: 0.6
    };

    return geojsonMarkerOptions
};

// // // Data Layers

var sizes = ["cpr", "opr", "ngp"];
var sizes_names = {cpr : "Coal production",
                   opr : "Oil production", 
                   ngp : "Natural gas production"};
var colrs = ["ecd", "bdg", "rur"];
var colrs_names = {ecd : "Economic status",
                   bdg : "% with less than Bachelor's Degree", 
                   rur : "Rurality"};

var data_layers = {};

// Tooltips

function onEachFeature(feature, layer) {
  // does this feature have a property named popupContent?
  if (feature.properties && feature.properties.popupContent) {
      layer.bindPopup(feature.properties.popupContent);
  }
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
} // comma number formatting

for(const s of sizes){
  for(const c of colrs){
    data_layers[s +"_scaled" + "_" + c] = L.geoJSON(counties_data, {
      filter: function(feature, layer) {
                  return feature.properties[s] > 0.000001;
              },
      pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, 
                                geojsonMarkerOptions(
                                  feature.properties[s+"_scaled"]*30,
                                  color_from_pal(
                                    feature.properties[c],
                                    feature.properties[c+"_min"],
                                    feature.properties[c+"_max"]
                                  ))).bindPopup(
                                    feature.properties["cou"] + "<br>" +
                                    sizes_names[s] + " : " + 
                                    numberWithCommas(Math.round(feature.properties[s]*100)/100) +
                                    "<br>" +
                                    colrs_names[c] + " : " + 
                                    numberWithCommas(Math.round(feature.properties[c]*100)/100)
                                    ).on('mouseover', function (e) {
                                      this.openPopup();
                                  }).on('mouseout', function (e) {
                                    this.closePopup();
                                });
      }
  });
  }
}

// // // Interaction with selectors

var size = $('#size').val();
var colr = $('#colr').val();

map.addLayer(data_layers[size + "_" + colr])

function update_size() {
  size = $('#size').val();
  Object.values(data_layers).forEach(val => map.removeLayer(val));;
  map.addLayer(data_layers[size + "_" + colr]);
}

function update_colr() {
  colr = $('#colr').val();
  Object.values(data_layers).forEach(val => map.removeLayer(val));;
  map.addLayer(data_layers[size + "_" + colr]);
}









