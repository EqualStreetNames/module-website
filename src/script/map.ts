'use strict';

import maplibregl, { Map, MapOptions, NavigationControl, ScaleControl } from 'maplibre-gl';
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';

import addBoundary from './map/layers/boundary';
import addRelations from './map/layers/relation';
import addWays from './map/layers/ways';
import addEvents from './map/events';

import { lang, center, zoom, bbox, style, bounds } from './index';
import { theme } from './theme';

export let map: Map;

const API_KEY = process.env.MAPTILER_APIKEY ?? '';
const STYLE_LIGHT = `https://api.maptiler.com/maps/basic-v2-light/style.json?key=${API_KEY}`;
const STYLE_DARK = `https://api.maptiler.com/maps/basic-v2-dark/style.json?key=${API_KEY}`;

export default async function (): Promise<Map> {
  const options: MapOptions = {
    container: 'map',
    hash: true,
    style: typeof style !== 'undefined' ? style : (theme === 'dark' ? STYLE_DARK : STYLE_LIGHT)
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
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${config.query}&format=geojson&polygon_geojson=1&addressdetails=1`);
        const geojson = await response.json();
        for (const feature of geojson.features) {
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: center },
            place_name: feature.properties.display_name,
            properties: feature.properties,
            text: feature.properties.display_name,
            place_type: ['place'],
            center: [feature.bbox[0] + (feature.bbox[2] - feature.bbox[0]) / 2, feature.bbox[1] + (feature.bbox[3] - feature.bbox[1]) / 2]
          });
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
