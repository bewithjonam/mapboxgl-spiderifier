# mapboxgl-spiderifier
Spiderify markers on mapbox-gl using marker overlays. Note it does not create the spiderfication in the canvas but on a overlay on top of the canvas. This uses mapboxgl.Marker to create markers and spider legs.

Spiral/Circle positioning logic taken from and credits goes to https://github.com/jawj/OverlappingMarkerSpiderfier.

## Sample: 
 - https://bewithjonam.github.io/mapboxgl-spiderifier/docs/sample.html

## All Examples:
 - https://bewithjonam.github.io/mapboxgl-spiderifier/docs/index.html

## Usage:
```js
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    center: [-74.50, 40],
    zoom: 9
  }),
  spiderfier = new MapboxglSpiderfier(map, {
  	onClick: function(e, marker){
    	console.log(marker);
    },
    markerWidth: 40,
    markerHeight: 40,
  });

  
map.on('style.load', function() {
  var markers = [{id: 0}, {id: 1}, {id: 2}, {id: 3}, {id: 4}];
  
  spiderfier.spiderfy(e.lngLat, markers);
});

map.on('click', function(){
  spiderfier.unspiderfy();
})
```

## Doc
```js
new MapboxglSpiderfier(map, options)
```
  Constructs a mapboxgl spiderifier.
  * map => mapbox gl map object.
  * options
    - markerWidth: number
    - markerHeight: number
    - onClick: function(clickEvent, markerObject, markerElement)
    
```js
  spiderfier.spiderfy(latLng, markerArray);
```
  Spiderfies and displays given markers on the specified lat lng.
  * latLng => new mapboxgl.LngLat(-122.420679, 37.772537); OR [-122.420679, 37.772537];
  * markerArray => array of plain objects.
    
```js
  spiderfier.unspiderfy();
```
  Unspiderfies markers, if any spiderfied already.
  
  
## TODO:
  * Ability for custom html marker for marker icons/text.
  * Animation on spiderfy/unspiderfy
