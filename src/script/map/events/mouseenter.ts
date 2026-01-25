'use strict';

import { Map } from 'maplibre-gl';

export default function (map: Map): void {
  map.getCanvas().style.cursor = 'pointer';
}
