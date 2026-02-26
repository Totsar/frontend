/* global workbox */
importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js");

workbox.setConfig({ debug: false });

workbox.routing.registerRoute(
    ({ url }) =>
        url.hostname === "tile.openstreetmap.org" ||
        url.hostname.endsWith(".tile.openstreetmap.org"),
    new workbox.strategies.CacheFirst({
        cacheName: "osm-tiles",
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 500,
                maxAgeSeconds: 7 * 24 * 60 * 60,
            }),
        ],
    })
);

workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith("/api/item"),
    new workbox.strategies.NetworkFirst({
        cacheName: "items-api",
        plugins: [
            new workbox.expiration.ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60,
            }),
        ],
    })
);
