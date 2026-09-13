'use strict';

import { Map, MapGeoJSONFeature, LngLat, Popup } from 'maplibre-gl';

import popupContent from '../../popup';

export default function (
  map: Map,
  features: MapGeoJSONFeature[],
  lnglat: LngLat
): void {
  const html = popupContent(features[0]);

  new Popup({ maxWidth: 'none' })
    .setLngLat(lnglat)
    .setHTML(html)
    .addTo(map);
}
