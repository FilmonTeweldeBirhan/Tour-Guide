/* eslint-disable */

export const dispalyMap = (locations) => {
  mapboxgl.accessToken =
    'pk.dgasdgsadgsetout2osdhsjooiewm0sdgsadgsdbbadat-asbsa-dgasb';

  let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/<yourAcc>/cjvi9q8jd04milcpgmg7ev3dy',
    scrollZoom: false,
    // center: [-118.113491, 34.1111745],
    // zoom: 10,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
      element: 'el',
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup()
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100,
    },
  });
};
