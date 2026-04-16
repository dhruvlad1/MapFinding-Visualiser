const highWayExclude = ["footway", "street_lamp", "steps", "pedestrian", "track", "path"];
const ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
];

/**
 * 
 * @param {Array} boundingBox array with 2 objects that have a latitude and longitude property 
 * @returns {Promise<Response>}
 */
export async function fetchOverpassData(boundingBox) {
    const exclusion = highWayExclude.map(e => `[highway!="${e}"]`).join("");
    const query = `
    [out:json];(
        way[highway]${exclusion}[footway!="*"]
        (${boundingBox[0].latitude},${boundingBox[0].longitude},${boundingBox[1].latitude},${boundingBox[1].longitude});
        node(w);
    );
    out skel;`;

    let lastError = null;

    for (const endpoint of ENDPOINTS) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                body: query
            });

            if (response.ok) {
                return response; // Success, return response
            }
            
            console.warn(`Endpoint ${endpoint} returned ${response.status}`);
            lastError = new Error(`Overpass API error: ${response.status}`);
        } catch (error) {
            console.warn(`Endpoint ${endpoint} failed:`, error);
            lastError = error;
        }
    }

    // If all endpoints fail, throw the last encountered error
    throw lastError || new Error("All Overpass API endpoints failed.");
}