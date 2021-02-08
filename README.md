# mapboxgl-spiderifier

Spiderify markers on mapbox-gl using marker overlays. Note it does not create the spiderfication in the canvas but on a overlay on top of the canvas. This uses mapboxgl.Marker to create markers and spider legs.

Spiral/Circle positioning logic taken from and credits goes to https://github.com/jawj/OverlappingMarkerSpiderfier.

## Examples:
 - https://bewithjonam.github.io/mapboxgl-spiderifier/docs/index.html

## Note:
Mapboxgl-js has exposed getClusterLeaves/getClusterChildren (from supercluster) in version [v0.47.0](https://github.com/mapbox/mapbox-gl-js/releases/tag/v0.47.0). Thereby, now we can get the features within a cluster from mapboxgl and spiderfy them using this library.

## Usage:

#### Simple Spiderfication of features
```js
var features = [
  {id: 0, type: 'car', color: 'red'},
  {id: 1, type: 'bicycle', color: '#ff00ff'},
  {id: 2, type: 'bus', color: 'blue'},
  {id: 3, type: 'cab', color: 'orange'},
  {id: 4, type: 'train', color: 'red'}
];
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    center: [-74.50, 40],
    zoom: 9
  });

var spiderifier = new MapboxglSpiderifier(map, {
  	onClick: function(e, spiderLeg){
    	console.log('Clicked on ', spiderLeg);
    },
    markerWidth: 40,
    markerHeight: 40,
  });

map.on('style.load', function() {
  spiderifier.spiderfy([-74.50, 40], features);
});

map.on('click', function(){
  spiderifier.unspiderfy();
});
```
### Getting features in a cluster from mapboxgl and spiderfying them
Refer [Example 3](https://bewithjonam.github.io/mapboxgl-spiderifier/docs/example-mapbox-gl-cluster-spiderfy.html)
```
map.on('style.load', function() {
  map.on('click', mouseClick);
});

function mouseClick(e) {
  var features = map.queryRenderedFeatures(e.point, {
      layers: [<<id of the layer containing the cluster>>]
    });

  spiderifier.unspiderfy();
  if (!features.length) {
    return;
  } else {
    map.getSource(<<source Id of the source containing the cluster>>).getClusterLeaves(
      features[0].properties.cluster_id,
      100,
      0,
      function(err, leafFeatures){
        if (err) {
          return console.error('error while getting leaves of a cluster', err);
        }
        var markers = _.map(leafFeatures, function(leafFeature){
          return leafFeature.properties;
        });
        spiderifier.spiderfy(features[0].geometry.coordinates, markers);
      }
    );
  }
}

```

#### Custom Pins With popup:
```js
var spiderifier = new MapboxglSpiderifier(map, {
    customPin: true,
    initializeLeg: function(spiderLeg) {
      var $spiderPinCustom = $('<div>', {class: 'spider-point-circle'});

      $(spiderLeg.elements.pin).append($spiderPinCustom);
      $spiderPinCustom.css({
        'width': '10px',
        'height':'10px',
        'margin-left': '-5px',
        'margin-top': '-5px',
        'background-color': spiderLeg.feature.color,
        'opacity': 0.8
      });

      var popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: MapboxglSpiderifier.popupOffsetForSpiderLeg(spiderLeg)
      });

      popup.setHTML('Feature type is ' + spiderLeg.feature.type);
      spiderLeg.mapboxMarker.setPopup(popup);

      $(spiderLeg.elements.container)
        .on('mouseenter', function(){
          popup.addTo(map);
        })
        .on('mouseleave', function(){
          popup.remove();
        });
    }
  })
```

## Doc

#### Options
```js
new MapboxglSpiderifier(map, options)
```

  Constructs a mapboxgl spiderifier.
  - `map` *(mapbox gl map mandatory)*.
  - `options` *(object optional)*
    - `options.animate` **(boolean default: false)**
    - `options.animationSpeed` **(number default: 200)** number in milliseconds (animation speed)
    - `options.circleSpiralSwitchover` **(number default: 9)** number of markers till which the spider will
      be circular and beyond this threshold, it will spider in spiral.
    - `options.customPin` **(boolean default: false)**
    - `options.initializeLeg` **(function)** function to provide a custom marker/popup for markers
      - argument1 spiderLeg
    - `options.onClick` **(function)**
      - argument1 clickEvent
      - argument2 spiderLeg


**spiderLeg** Passed in options.initializeLeg/options.onClick(callbacks) and in
spideifier.each (iterator) function.
```
  {
    feature: <object>,
    elements: {
      container: <DomElement>,
      line: <DomElement>,
      pin: <DomElement>,
    },
    mapboxMarker: <mapboxgl.Marker instance>,
    params:{
      x: <number horizontal offset of pin from the center of spider>,
      y: <number vertical offset of pin from the center of spider>,
      angle: <number angle of line from the center of spider>,
      legLength: <number leg line length>,
      index: <number index of spider leg>
    }
  }
```

#### Functions:
  - ```each(function(spiderLeg) {...} )``` Iterates over the currently spiderfied legs.
    -  ```function(spiderLeg)``` Function gets called once for every spider leg.
  - ```spiderfy(latLng, features)``` Spiderfies and displays given markers on the specified lat lng.
    - ```latLng```  new mapboxgl.LngLat(-122.420679, 37.772537); OR [-122.420679, 37.772537];
    - ```features``` array of plain objects.
  - ```unspiderfy()``` Unspiderfies markers, if any spiderfied already.

  - ```MapboxglSpiderifier.popupOffsetForSpiderLeg(spiderLeg)``` returns an offset object that can be
  passed to mapboxgl's popup so that the popup will be positioned next to the pin rather than the center
  of the spider.

## ChangeLog:

1.0.8 -
  - MapboxglSpiderfier -> MapboxglSpider***i***fier ;)
  - options.initializeMarker(markerObject) -> options.initializeLeg(spiderLeg)
```js
  // Old:
  initializeMarker(markerObject) {
    // markerObject => {
    //   marker: {...}, // changed to feature
    //   elements: {
    //     parent: <...>,
    //     line: <...>,
    //     marker: <...>, // changed to pin
    //   },
    //   "mapboxMarker":{...},
    //   "spiderParam":{
    //     "x":-4.373587244338389,
    //     "y":14.3482310622655,
    //     "angle":1.8666666666666667,
    //     "legLength":15,
    //     "index":0
    //   }
    // }
    // ...
  }
  // New:
  initializeLeg(spiderLeg) {
    // spiderLeg => {
    //   feature: {...},
    //   elements: {
    //     container: <...>,
    //     line: <...>,
    //     pin: <...>,
    //   },
    //   "mapboxMarker":{...},
    //   "params":{
    //     "x":-4.373587244338389,
    //     "y":14.3482310622655,
    //     "angle":1.8666666666666667,
    //     "legLength":15,
    //     "index":0
    //   }
    // }
    // ...
  }

  // Old
  // .spidered-marker
  // | - .line-div
  // | - .icon-div

  // New
  // .spider-leg
  // | - .spider-leg-line
  // | - .spider-leg-pin

  Moving ./lib/mapbox-gl-spiderifier.css to ./index.css
  Moving ./lib/mapbox-gl-spiderifier.js to ./index.js
```
