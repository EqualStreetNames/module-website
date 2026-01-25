'use strict';

import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import maplibregl, { Map, MapOptions, NavigationControl, ScaleControl } from 'maplibre-gl';

import addEvents from './map/events';
import addBoundary from './map/layers/boundary';
import addRelations from './map/layers/relation';
import addWays from './map/layers/ways';

import { bbox, bounds, center, lang, style, zoom } from './index';
import { theme } from './theme';

export let map: Map;

export default async function (): Promise<Map> {
  const options: MapOptions = {
    container: 'map',
    hash: true,
    style: typeof style !== 'undefined' ? style : (theme === 'dark' ? 'https://tiles.openfreemap.org/styles/dark' : 'https://tiles.openfreemap.org/styles/positron')
  };

  if (typeof center !== 'undefined' && typeof zoom !== 'undefined') {
    options.center = center;
    options.zoom = zoom;
  } else {
    options.bounds = bbox || bounds;
    options.fitBoundsOptions = { padding: 50 };
  }

  // Initialize map.
  if (typeof map !== 'undefined') {
    map.remove();
  }
  map = new Map(options);

  // Add controls.
  const nav = new NavigationControl({ showCompass: false });
  map.addControl(nav, 'top-left');

  const scale = new ScaleControl({ unit: 'metric' });
  map.addControl(scale);

  const geocoder = new MaplibreGeocoder({
    forwardGeocode: async (config) => {
            const features = [];
            try {
                const request = `https://nominatim.openstreetmap.org/search?q=${config.query}&format=geojson&polygon_geojson=1&addressdetails=1`;
                const response = await fetch(request);
                const geojson = await response.json();
                for (const feature of geojson.features) {
                    const center = [
                        feature.bbox[0] + (feature.bbox[2] - feature.bbox[0]) / 2,
                        feature.bbox[1] + (feature.bbox[3] - feature.bbox[1]) / 2
                    ];
                    const point = {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: center },
                        place_name: feature.properties.display_name,
                        properties: feature.properties,
                        text: feature.properties.display_name,
                        place_type: ['place'],
                        center
                    };
                    features.push(point);
                }
            } catch (e) {
                console.error(`Failed to forwardGeocode with error: ${e}`);
            }

            return {
                features
            };
        }
  }, { 
    bbox: bbox || bounds,
    enableEventLogging: false,
    language: lang,
    maplibregl
  });
  map.addControl(geocoder);

  map.on('load', () => {
    map.resize();

    // Add GeoJSON sources.
    addRelations(map);
    addWays(map);
    addBoundary(map);

    // Add events
    addEvents(map);
  });

  map.on('idle', () => {
    document.body.classList.add('loaded');
  });

  return map;
}
