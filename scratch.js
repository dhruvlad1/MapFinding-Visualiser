import "node-fetch";
const highWayExclude = ["footway", "street_lamp", "steps", "pedestrian", "track", "path"];

const ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
];

async function test() {
    const boundingBox = [
        { latitude: 51.5, longitude: -0.1 },
        { latitude: 51.52, longitude: -0.08 }
    ];
    const exclusion = highWayExclude.map(e => `[highway!="${e}"]`).join("");
    const query = `
    [out:json];(
        way[highway]${exclusion}[footway!="*"]
        (${boundingBox[0].latitude},${boundingBox[0].longitude},${boundingBox[1].latitude},${boundingBox[1].longitude});
        node(w);
    );
    out skel;`;

    for (const endpoint of ENDPOINTS) {
        console.log("Testing", endpoint);
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                body: query
            });
            console.log(response.status);
            if (response.ok) {
                const text = await response.text();
                console.log(text.substring(0, 100));
            }
        } catch (e) {
            console.error(e.message);
        }
    }
}
test();
