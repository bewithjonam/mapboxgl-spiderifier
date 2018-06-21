(function(root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory(require('mapbox-gl'));
  } else if (typeof define === 'function' && define.amd) {
    define(['MapboxglSpiderifier'], factory);
  } else  {
    root.MapboxglSpiderifier = factory(root.mapboxgl);
  }
}(this, function(mapboxgl) {
  function MapboxglSpiderifier(map, userOptions) {
    var util = {
        each: eachFn,
        map: mapFn,
        mapTimes: mapTimesFn,
        eachTimes: eachTimesFn
      },
      NULL_FUNCTION = function () {},
      options = {
        animate: false, // to animate the spiral
        animationSpeed: 0, // animation speed in milliseconds
        customPin: false, // If false, sets a default icon for pins in spider legs.
        initializeLeg: NULL_FUNCTION,
        onClick: NULL_FUNCTION,
        // --- <SPIDER TUNING Params>
        // circleSpiralSwitchover: show spiral instead of circle from this marker count upwards
        //                        0 -> always spiral; Infinity -> always circle
        circleSpiralSwitchover: 9,
        circleFootSeparation: 25, // related to circumference of circle
        spiralFootSeparation: 28, // related to size of spiral (experiment!)
        spiralLengthStart: 15, // ditto
        spiralLengthFactor: 4, // ditto
        // ---
      },
      twoPi = Math.PI * 2,
      previousSpiderLegs = [];

    for (var attrname in userOptions) {
      options[attrname] = userOptions[attrname];
    }

    // Public:
    this.spiderfy = spiderfy;
    this.unspiderfy = unspiderfy;
    this.each = function (callback) {
      util.each(previousSpiderLegs, callback);
    };

    // Private:
    function spiderfy(latLng, features) {
      var spiderLegParams = generateSpiderLegParams(features.length);
      var spiderLegs;

      unspiderfy();

      spiderLegs = util.map(features, function (feature, index) {
        var spiderLegParam = spiderLegParams[index];
        var elements = createMarkerElements(spiderLegParam, feature);
        var mapboxMarker;
        var spiderLeg;

        mapboxMarker = new mapboxgl.Marker(elements.container)
          .setLngLat(latLng);

        spiderLeg = {
          feature: feature,
          elements: elements,
          mapboxMarker: mapboxMarker,
          param: spiderLegParam
        };

        options.initializeLeg(spiderLeg);

        elements.container.onclick = function (e) {
          options.onClick(e, spiderLeg);
        };

        return spiderLeg;
      });

      util.each(spiderLegs.reverse(), function (spiderLeg) {
        spiderLeg.mapboxMarker.addTo(map);
      });

      if (options.animate) {
        setTimeout(function () {
          util.each(spiderLegs.reverse(), function (spiderLeg, index) {
            spiderLeg.elements.container.className = (spiderLeg.elements.container.className || '').replace('initial', '');
            spiderLeg.elements.container.style['transitionDelay'] = ((options.animationSpeed / 1000) / spiderLegs.length * index) + 's';
          });
        });
      }

      previousSpiderLegs = spiderLegs;
    }

    function unspiderfy() {
      util.each(previousSpiderLegs.reverse(), function (spiderLeg, index) {
        if (options.animate) {
          spiderLeg.elements.container.style['transitionDelay'] = ((options.animationSpeed / 1000) / previousSpiderLegs.length * index) + 's';
          spiderLeg.elements.container.className += ' exit';
          setTimeout(function () {
            spiderLeg.mapboxMarker.remove();
          }, options.animationSpeed + 100); //Wait for 100ms more before clearing the DOM
        } else {
          spiderLeg.mapboxMarker.remove();
        }
      });
      previousSpiderLegs = [];
    }

    function generateSpiderLegParams(count) {
      if (count >= options.circleSpiralSwitchover) {
        return generateSpiralParams(count);
      } else {
        return generateCircleParams(count);
      }
    }

    function generateSpiralParams(count) {
      var legLength = options.spiralLengthStart,
        angle = 0;
      return util.mapTimes(count, function (index) {
        var pt;
        angle = angle + (options.spiralFootSeparation / legLength + index * 0.0005);
        pt = {
          x: legLength * Math.cos(angle),
          y: legLength * Math.sin(angle),
          angle: angle,
          legLength: legLength,
          index: index
        };
        legLength = legLength + (twoPi * options.spiralLengthFactor / angle);
        return pt;
      });
    }

    function generateCircleParams(count) {
      var circumference = options.circleFootSeparation * (2 + count),
        legLength = circumference / twoPi, // = radius from circumference
        angleStep = twoPi / count;

      return util.mapTimes(count, function (index) {
        var angle = index * angleStep;
        return {
          x: legLength * Math.cos(angle),
          y: legLength * Math.sin(angle),
          angle: angle,
          legLength: legLength,
          index: index
        };
      });
    }

    function createMarkerElements(spiderLegParam) {
      var containerElem = document.createElement('div'),
        pinElem = document.createElement('div'),
        lineElem = document.createElement('div');

      containerElem.className = 'spider-leg-container' + ( options.animate ? ' animate initial ' : ' ');
      lineElem.className = 'spider-leg-line';
      pinElem.className = 'spider-leg-pin' + (options.customPin ? '' : ' default-spider-pin');

      containerElem.appendChild(lineElem);
      containerElem.appendChild(pinElem);

      containerElem.style['margin-left'] = spiderLegParam.x + 'px';
      containerElem.style['margin-top'] = spiderLegParam.y + 'px';

      lineElem.style.height = spiderLegParam.legLength + 'px';
      // lineElem.style.transform = 'rotate(' + (2*Math.PI - spiderLegParam.angle) +'rad)';
      lineElem.style.transform = 'rotate(' + (spiderLegParam.angle - Math.PI / 2) + 'rad)';

      return { container: containerElem, line: lineElem, pin: pinElem };
    }

    // Utility
    function eachFn(array, iterator) {
      var i = 0;
      if (!array || !array.length) {
        return [];
      }
      for (i = 0; i < array.length; i++) {
        iterator(array[i], i);
      }
    }

    function eachTimesFn(count, iterator) {
      if (!count) {
        return [];
      }
      for (var i = 0; i < count; i++) {
        iterator(i);
      }
    }

    function mapFn(array, iterator) {
      var result = [];
      eachFn(array, function (item, i) {
        result.push(iterator(item, i));
      });
      return result;
    }

    function mapTimesFn(count, iterator) {
      var result = [];
      eachTimesFn(count, function (i) {
        result.push(iterator(i));
      });
      return result;
    }
  }

  // Returns Offset option for mapbox poup, so that the popup for pins in the spider
  // appears next to the pin, rather than at the center of the spider.
  // offset: <number> Offset of the popup from the pin.
  MapboxglSpiderifier.popupOffsetForSpiderLeg = function popupOffsetForSpiderLeg(spiderLeg, offset){
    var pinOffsetX = spiderLeg.param.x;
    var pinOffsetY = spiderLeg.param.y;

    offset = offset || 0;
    return {
      'top': offsetVariant([0, offset], pinOffsetX, pinOffsetY),
      'top-left': offsetVariant([offset,offset], pinOffsetX, pinOffsetY),
      'top-right': offsetVariant([-offset,offset], pinOffsetX, pinOffsetY),
      'bottom': offsetVariant([0, -offset], pinOffsetX, pinOffsetY),
      'bottom-left': offsetVariant([offset, -offset], pinOffsetX, pinOffsetY),
      'bottom-right': offsetVariant([-offset, -offset], pinOffsetX, pinOffsetY),
      'left': offsetVariant([offset, -offset], pinOffsetX, pinOffsetY),
      'right': offsetVariant([-offset, -offset], pinOffsetX, pinOffsetY)
    };
  };

  function offsetVariant(offset, variantX, variantY) {
    return [offset[0]+ (variantX || 0), offset[1]+ (variantY || 0)];
  }

  return MapboxglSpiderifier;
}));
