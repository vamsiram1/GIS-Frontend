
import React, { useEffect, useState } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    GeoJSON,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import osmtogeojson from "osmtogeojson";

// 🔴 Red marker icon
const redIcon = new L.Icon({
    iconUrl:
        "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// 🔄 Fly to city or district/state
const FlyToLocation = ({ selectedLocation, selectedFeature }) => {
    const map = useMap();

    useEffect(() => {
        if (!selectedLocation) return;

        if (selectedLocation.type === "point") {
            map.flyTo([selectedLocation.latitude, selectedLocation.longitude], 15, {
                duration: 1,
            });
        } else if (
            (selectedLocation.type === "district" ||
                selectedLocation.type === "state") &&
            selectedFeature
        ) {
            const layer = L.geoJSON(selectedFeature);
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
                map.flyToBounds(bounds, { maxZoom: 15, animate: true, duration: 1 });
            }
        }
    }, [selectedLocation, selectedFeature, map]);

    return null;
};

// 🔷 Show only one boundary
const GeoBoundaries = ({ feature }) => {
    if (!feature) return null;

    return (
        <GeoJSON
            data={feature}
            style={{
                color: "#be59f7", // purple border
                weight: 3,
                fillOpacity: 0, // border only
            }}
            onEachFeature={(feature, layer) => {
                layer.bindPopup(feature.properties?.name || "Unknown");
            }}
        />
    );
};

const LocationMap = () => {
    const [locations, setLocations] = useState([]);
    const [boundaries, setBoundaries] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedLocation, setSelectedLocation] = useState(null);

    // 🌐 Load point locations
    useEffect(() => {
        fetch("http://localhost:8080/locations")
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                console.log("📍 All Locations from API:", data);

                if (Array.isArray(data)) {
                    const filtered = data.filter((loc) => {
                        const isValid =
                            loc.id &&
                            loc.name &&
                            typeof loc.latitude === "number" &&
                            typeof loc.longitude === "number";

                        if (!isValid) {
                            console.warn("⚠️ Skipped invalid location:", loc);
                        }

                        return isValid;
                    });

                    const withTypes = filtered.map((loc) => ({
                        ...loc,
                        type: "point", // 🔄 mark them as point
                    }));

                    setLocations(withTypes);
                } else {
                    console.error("🚨 Invalid locations data:", data);
                    setLocations([]);
                }
            })
            .catch((err) => {
                console.error("🚨 Error fetching locations:", err);
                alert("Failed to fetch locations. Please check the backend.");
            });
    }, []);

    // 🔍 Fetch boundary from backend Overpass API
    const fetchDistrictBoundary = async (districtName) => {
        try {
            const res = await fetch(
                `http://localhost:8080/locations/${encodeURIComponent(districtName)}`
            );
            const overpassData = await res.json();
            const geojson = osmtogeojson(overpassData);

            if (geojson?.features?.length > 0) {
                const matched = geojson.features.find(
                    (f) =>
                        f.properties?.name?.toLowerCase().trim() ===
                        districtName.toLowerCase().trim()
                );

                if (matched) {
                    setBoundaries(geojson);
                    setSelectedFeature(matched);
                    setSelectedLocation({ name: districtName, type: "district" });
                } else {
                    alert("Boundary not found in GeoJSON");
                }
            } else {
                alert("No features found");
            }
        } catch (err) {
            console.error("Failed to fetch boundary:", err);
            alert("Error fetching boundary");
        }
    };

    // 🔍 Search handler
    const handleSearch = (e) => {
        e.preventDefault();
        if (!search.trim()) return;

        const match = locations.find(
            (loc) =>
                loc.name.toLowerCase().trim() === search.toLowerCase().trim()
        );

        setSelectedFeature(null); // clear previous district boundary

        if (match) {
            setSelectedLocation(match); // fly to point
        } else {
            fetchDistrictBoundary(search); // treat as district
        }
    };

    return (
        <div>
            {/* 🔎 Search bar */}


            {/* 🗺️ Map */}
            <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                style={{ height: "100vh", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© OpenStreetMap contributors'
                />

                <FlyToLocation
                    selectedLocation={selectedLocation}
                    selectedFeature={selectedFeature}
                />
                <GeoBoundaries feature={selectedFeature} />

                <form
                    onSubmit={handleSearch}
                    style={{ margin: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                    <input
                        type="text"
                        placeholder="Enter city, district, or location name"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: "9px", width: "250px", zIndex: "450", borderRadius: "5px", border: "none", backgroundColor: "#fffff" }}
                    />
                    <button type="submit" style={{ padding: "4px 15px", marginLeft: "10px", zIndex: "450", borderRadius: "5px", backgroundColor: "#d4a3f0", borderColor: "white", fontWeight: "bold", fontSize: "15px", clolr: "#152102" }}>
                        Go
                    </button>
                </form>

                <div className="loc-details">

                    <div >

                        <div style={{ display: "flex", gap: "10px",dispaly:"flex",justifyContent:"center"}}>
                            <img
                                src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
                                alt="Red Marker"
                                style={{ width: "20px" , height:"25px"}}
                            />
                            <p style={{ margin: 0 , fontSize:"17px", fontFamily:"monospace"}}>Schools location</p>
                        </div>

                    </div>


                    <div>

                        {/* you can add location detals here */}

                    </div>
                </div>

                {/* 📍 Render red markers for all points */}
                {locations.map((loc) => (
                    <Marker
                        key={loc.id}
                        position={[loc.latitude, loc.longitude]}
                        icon={redIcon}
                    >
                        <Popup>{loc.name}</Popup>
                    </Marker>
                ))}

                {/* 📍 Highlight selected location (point only) */}
                {selectedLocation && selectedLocation.type === "point" && (
                    <Marker
                        position={[selectedLocation.latitude, selectedLocation.longitude]}
                        icon={redIcon}
                    >
                        <Popup>{selectedLocation.name} (Selected)</Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default LocationMap;
