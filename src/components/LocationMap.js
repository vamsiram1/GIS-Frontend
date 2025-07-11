

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
import "../styles/LocationMap.css"; // ✅ Ensure this file has correct CSS

// 🔴 Red icon
const redIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [15, 25],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [10, 10],
});

// 🔵 Blue icon
const blueIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [15, 25],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [10, 10],
});

const FlyToLocation = ({ selectedLocation, selectedFeature }) => {
    const map = useMap();

    useEffect(() => {
        if (!selectedLocation) return;

        if (selectedLocation.type === "point") {
            map.flyTo(
                [selectedLocation.latitude, selectedLocation.longitude],
                15,
                { duration: 1 }
            );
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

const getRandomColor = (name) => {
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 70%)`;
};

const LocationMap = () => {
    const [locations, setLocations] = useState([]);
    const [boundaries, setBoundaries] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [search, setSearch] = useState("");
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [stateBoundaries, setStateBoundaries] = useState(null);

    useEffect(() => {
        fetch("http://localhost:8080/locations/getallbuildings")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    const filtered = data.filter(
                        (loc) =>
                            loc.building_name &&
                            loc.latitude &&
                            loc.longitude &&
                            !isNaN(parseFloat(loc.latitude)) &&
                            !isNaN(parseFloat(loc.longitude))
                    );

                    const withTypes = filtered.map((loc, index) => ({
                        id: index + 1,
                        name: loc.building_name,
                        latitude: parseFloat(loc.latitude),
                        longitude: parseFloat(loc.longitude),
                        type: "point",
                        campus: loc.campus_name,
                        college_type: loc.college_type,
                    }));

                    setLocations(withTypes);
                } else {
                    console.error("Invalid building location data");
                }
            })
            .catch((err) => {
                console.error("Error fetching buildings:", err);
                alert("Failed to fetch building locations");
            });
    }, []);

    useEffect(() => {
        fetch("http://localhost:8080/india-states.geojson")
            .then((res) => res.json())
            .then((geojson) => {
                const filtered = {
                    ...geojson,
                    features: geojson.features.filter(
                        (f) =>
                            f.geometry &&
                            (f.properties?.ST_NM ||
                                f.properties?.name ||
                                f.properties?.tags?.name)
                    ),
                };
                if (filtered.features.length > 0) {
                    setStateBoundaries(filtered);
                } else {
                    console.warn("No valid state boundaries found");
                }
            })
            .catch((err) => {
                console.error("Error loading GeoJSON:", err);
            });
    }, []);

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
                    alert("Boundary not found");
                }
            } else {
                alert("No features found");
            }
        } catch (err) {
            console.error("Failed to fetch boundary:", err);
            alert("Error fetching boundary");
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (!search.trim()) return;

        const match = locations.find(
            (loc) => loc.name.toLowerCase().trim() === search.toLowerCase().trim()
        );

        setSelectedFeature(null);

        if (match) {
            setSelectedLocation({
                ...match,
                type: "point",
            });
        } else {
            fetchDistrictBoundary(search);
        }
    };

    return (
        <div>
            <form
                onSubmit={handleSearch}
                style={{
                    margin: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 999,
                    position: "absolute",
                    top: "10px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    backgroundColor: "white",
                    padding: "10px",
                    borderRadius: "10px",
                    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
                }}
            >
                <input
                    type="text"
                    placeholder="Enter building, district, or state"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        padding: "9px",
                        width: "250px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: "6px 15px",
                        marginLeft: "10px",
                        borderRadius: "5px",
                        backgroundColor: "#d4a3f0",
                        border: "none",
                        fontWeight: "bold",
                        fontSize: "15px",
                        color: "#152102",
                    }}
                >
                    Go
                </button>
            </form>

            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100vh", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© OpenStreetMap contributors'
                />

                <FlyToLocation
                    selectedLocation={selectedLocation}
                    selectedFeature={selectedFeature}
                />

                {selectedFeature && (
                    <GeoJSON
                        data={selectedFeature}
                        style={{ color: "#023610", weight: 3, fillOpacity: 0 }}
                        onEachFeature={(feature, layer) => {
                            const name = feature.properties?.name || feature.properties?.tags?.name;
                            if (name) layer.bindPopup(name);
                        }}
                    />
                )}

                {stateBoundaries && (
                    <GeoJSON
                        data={stateBoundaries}
                        style={(feature) => {
                            const name =
                                feature.properties?.ST_NM ||
                                feature.properties?.name ||
                                feature.properties?.tags?.name ||
                                "State";
                            return {
                                color: getRandomColor(name),
                                weight: 3,
                                fillOpacity: 0.1,
                            };
                        }}
                        onEachFeature={(feature, layer) => {
                            const name =
                                feature.properties?.ST_NM ||
                                feature.properties?.name ||
                                feature.properties?.tags?.name ||
                                "Unknown";
                            layer.bindPopup(name);
                            layer.on("click", () => {
                                const bounds = layer.getBounds();
                                if (bounds.isValid()) {
                                    layer._map.flyToBounds(bounds, {
                                        animate: true,
                                        duration: 1,
                                        maxZoom: 30,
                                    });
                                }
                            });
                        }}
                    />
                )}

                {locations.map((loc) => {
                    const iconToUse =
                        loc.college_type?.toLowerCase() === "school"
                            ? blueIcon
                            : redIcon;

                    const handleMarkerClick = () => {
                        const encodedCampus = encodeURIComponent(loc.campus);
                        const dashboardUrl = `http://192.168.1.48:3000/dashboard/9?campus_name=${encodedCampus}&tab=9-overall`;
                        window.open(dashboardUrl, "_blank");
                    };

                    return (
                        <Marker
                            key={loc.id}
                            position={[loc.latitude, loc.longitude]}
                            icon={iconToUse}
                            eventHandlers={{
                                mouseover: (e) => {
                                    e.target.openPopup();
                                    e.target._icon.classList.add("blinking-marker");
                                },
                                mouseout: (e) => {
                                    e.target.closePopup();
                                    e.target._icon.classList.remove("blinking-marker");
                                },
                                click: handleMarkerClick,
                            }}
                        >
                            <Popup>
                                <strong>{loc.name}</strong>
                                <br />
                                Campus: {loc.campus}
                                <br />
                                Type: {loc.college_type}
                            </Popup>
                        </Marker>
                    );
                })}

                {selectedLocation && selectedLocation.type === "point" && (
                    <Marker
                        position={[selectedLocation.latitude, selectedLocation.longitude]}
                        icon={
                            selectedLocation.college_type?.toLowerCase() === "school"
                                ? blueIcon
                                : redIcon
                        }
                        eventHandlers={{
                            mouseover: (e) => {
                                e.target.openPopup();
                                e.target._icon.classList.add("blinking-marker");
                            },
                            mouseout: (e) => {
                                e.target.closePopup();
                                e.target._icon.classList.remove("blinking-marker");
                            },
                            click: () => {
                                const encodedCampus = encodeURIComponent(selectedLocation.campus);
                                const dashboardUrl = `http://192.168.1.48:3000/dashboard/9?campus_name=${encodedCampus}&tab=9-overall`;
                                window.open(dashboardUrl, "_blank");
                            },
                        }}
                    >
                        <Popup>
                            <strong>{selectedLocation.name}</strong> (Selected)
                            <br />
                            Campus: {selectedLocation.campus}
                            <br />
                            Type: {selectedLocation.college_type}
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default LocationMap;











// import React, { useEffect, useState } from "react";
// import {
//     MapContainer,
//     TileLayer,
//     Marker,
//     Popup,
//     useMap,
//     GeoJSON,
// } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import osmtogeojson from "osmtogeojson";
// import "../styles/LocationMap.css"; // ✅ Ensure this file has correct CSS

// // 🔴 Red icon
// const redIcon = new L.Icon({
//     iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
//     shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
//     iconSize: [15, 25],
//     iconAnchor: [12, 41],
//     popupAnchor: [1, -34],
//     shadowSize: [10, 10],
// });

// // 🔵 Blue icon
// const blueIcon = new L.Icon({
//     iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
//     shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
//     iconSize: [15, 25],
//     iconAnchor: [12, 41],
//     popupAnchor: [1, -34],
//     shadowSize: [10, 10],
// });

// const FlyToLocation = ({ selectedLocation, selectedFeature }) => {
//     const map = useMap();

//     useEffect(() => {
//         if (!selectedLocation) return;

//         if (selectedLocation.type === "point") {
//             map.flyTo(
//                 [selectedLocation.latitude, selectedLocation.longitude],
//                 15,
//                 { duration: 1 }
//             );
//         } else if (
//             (selectedLocation.type === "district" ||
//                 selectedLocation.type === "state") &&
//             selectedFeature
//         ) {
//             const layer = L.geoJSON(selectedFeature);
//             const bounds = layer.getBounds();
//             if (bounds.isValid()) {
//                 map.flyToBounds(bounds, { maxZoom: 15, animate: true, duration: 1 });
//             }
//         }
//     }, [selectedLocation, selectedFeature, map]);

//     return null;
// };

// const getRandomColor = (name) => {
//     const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
//     const hue = hash % 360;
//     return `hsl(${hue}, 70%, 70%)`;
// };

// const LocationMap = () => {
//     const [locations, setLocations] = useState([]);
//     const [boundaries, setBoundaries] = useState(null);
//     const [selectedFeature, setSelectedFeature] = useState(null);
//     const [search, setSearch] = useState("");
//     const [selectedLocation, setSelectedLocation] = useState(null);
//     const [stateBoundaries, setStateBoundaries] = useState(null);

//     useEffect(() => {
//         fetch("http://localhost:8080/locations/getallbuildings")
//             .then((res) => res.json())
//             .then((data) => {
//                 if (Array.isArray(data)) {
//                     const filtered = data.filter(
//                         (loc) =>
//                             loc.building_name &&
//                             loc.latitude &&
//                             loc.longitude &&
//                             !isNaN(parseFloat(loc.latitude)) &&
//                             !isNaN(parseFloat(loc.longitude))
//                     );

//                     const withTypes = filtered.map((loc, index) => ({
//                         id: index + 1,
//                         name: loc.building_name,
//                         latitude: parseFloat(loc.latitude),
//                         longitude: parseFloat(loc.longitude),
//                         type: "point",
//                         campus: loc.campus_name,
//                         college_type: loc.college_type,
//                     }));

//                     setLocations(withTypes);
//                 } else {
//                     console.error("Invalid building location data");
//                 }
//             })
//             .catch((err) => {
//                 console.error("Error fetching buildings:", err);
//                 alert("Failed to fetch building locations");
//             });
//     }, []);

//     useEffect(() => {
//         fetch("http://localhost:8080/india-states.geojson")
//             .then((res) => res.json())
//             .then((geojson) => {
//                 const filtered = {
//                     ...geojson,
//                     features: geojson.features.filter(
//                         (f) =>
//                             f.geometry &&
//                             (f.properties?.ST_NM ||
//                                 f.properties?.name ||
//                                 f.properties?.tags?.name)
//                     ),
//                 };
//                 if (filtered.features.length > 0) {
//                     setStateBoundaries(filtered);
//                 } else {
//                     console.warn("No valid state boundaries found");
//                 }
//             })
//             .catch((err) => {
//                 console.error("Error loading GeoJSON:", err);
//             });
//     }, []);

//     const fetchDistrictBoundary = async (districtName) => {
//         try {
//             const res = await fetch(
//                 `http://localhost:8080/locations/${encodeURIComponent(districtName)}`
//             );
//             const overpassData = await res.json();
//             const geojson = osmtogeojson(overpassData);

//             if (geojson?.features?.length > 0) {
//                 const matched = geojson.features.find(
//                     (f) =>
//                         f.properties?.name?.toLowerCase().trim() ===
//                         districtName.toLowerCase().trim()
//                 );

//                 if (matched) {
//                     setBoundaries(geojson);
//                     setSelectedFeature(matched);
//                     setSelectedLocation({ name: districtName, type: "district" });
//                 } else {
//                     alert("Boundary not found");
//                 }
//             } else {
//                 alert("No features found");
//             }
//         } catch (err) {
//             console.error("Failed to fetch boundary:", err);
//             alert("Error fetching boundary");
//         }
//     };

//     const handleSearch = (e) => {
//         e.preventDefault();
//         if (!search.trim()) return;

//         const match = locations.find(
//             (loc) => loc.name.toLowerCase().trim() === search.toLowerCase().trim()
//         );

//         setSelectedFeature(null);

//         if (match) {
//             setSelectedLocation({
//                 ...match,
//                 type: "point",
//             });
//         } else {
//             fetchDistrictBoundary(search);
//         }
//     };

//     return (
//         <div>
//             <form
//                 onSubmit={handleSearch}
//                 style={{
//                     margin: "10px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     zIndex: 999,
//                     position: "absolute",
//                     top: "10px",
//                     left: "50%",
//                     transform: "translateX(-50%)",
//                     backgroundColor: "white",
//                     padding: "10px",
//                     borderRadius: "10px",
//                     boxShadow: "0 0 10px rgba(0,0,0,0.2)",
//                 }}
//             >
//                 <input
//                     type="text"
//                     placeholder="Enter building, district, or state"
//                     value={search}
//                     onChange={(e) => setSearch(e.target.value)}
//                     style={{
//                         padding: "9px",
//                         width: "250px",
//                         borderRadius: "5px",
//                         border: "1px solid #ccc",
//                     }}
//                 />
//                 <button
//                     type="submit"
//                     style={{
//                         padding: "6px 15px",
//                         marginLeft: "10px",
//                         borderRadius: "5px",
//                         backgroundColor: "#d4a3f0",
//                         border: "none",
//                         fontWeight: "bold",
//                         fontSize: "15px",
//                         color: "#152102",
//                     }}
//                 >
//                     Go
//                 </button>
//             </form>

//             <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100vh", width: "100%" }}>
//                 <TileLayer
//                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                     attribution='© OpenStreetMap contributors'
//                 />

//                 <FlyToLocation
//                     selectedLocation={selectedLocation}
//                     selectedFeature={selectedFeature}
//                 />

//                 {selectedFeature && (
//                     <GeoJSON
//                         data={selectedFeature}
//                         style={{ color: "#023610", weight: 3, fillOpacity: 0 }}
//                         onEachFeature={(feature, layer) => {
//                             const name = feature.properties?.name || feature.properties?.tags?.name;
//                             if (name) layer.bindPopup(name);
//                         }}
//                     />
//                 )}

//                 {stateBoundaries && (
//                     <GeoJSON
//                         data={stateBoundaries}
//                         style={(feature) => {
//                             const name =
//                                 feature.properties?.ST_NM ||
//                                 feature.properties?.name ||
//                                 feature.properties?.tags?.name ||
//                                 "State";
//                             return {
//                                 color: getRandomColor(name),
//                                 weight: 3,
//                                 fillOpacity: 0.1,
//                             };
//                         }}
//                         onEachFeature={(feature, layer) => {
//                             const name =
//                                 feature.properties?.ST_NM ||
//                                 feature.properties?.name ||
//                                 feature.properties?.tags?.name ||
//                                 "Unknown";
//                             layer.bindPopup(name);
//                             layer.on("click", () => {
//                                 const bounds = layer.getBounds();
//                                 if (bounds.isValid()) {
//                                     layer._map.flyToBounds(bounds, {
//                                         animate: true,
//                                         duration: 1,
//                                         maxZoom: 30,
//                                     });
//                                 }
//                             });
//                         }}
//                     />
//                 )}

//                 {locations.map((loc) => {
//                     const iconToUse =
//                         loc.college_type?.toLowerCase() === "school"
//                             ? blueIcon
//                             : redIcon;

//                     const handleMarkerClick = () => {
//                         const encodedCampus = encodeURIComponent(loc.campus);
//                         const encodedCollegeType=encodeURIComponent(loc.college_type.toLowerCase())
//                         const dashboardUrl = `http://192.168.1.48:3000/dashboard/15-mis-admissions-dashboard?academic_year=2025&business_type=${encodedCollegeType}&campus_name=${encodedCampus}&city_name=AMALAPURAM&class=LONG_TERM&state_name=ANDHRA+PRADESH&tab=44-campus-admission-dash&text_1=2021&text_1=2022&text_2=2023&text_2=2024`;
//                         window.open(dashboardUrl, "_blank");
//                     };

//                     return (
//                         <Marker
//                             key={loc.id}
//                             position={[loc.latitude, loc.longitude]}
//                             icon={iconToUse}
//                             eventHandlers={{
//                                 mouseover: (e) => {
//                                     e.target.openPopup();
//                                     e.target._icon.classList.add("blinking-marker");
//                                 },
//                                 mouseout: (e) => {
//                                     e.target.closePopup();
//                                     e.target._icon.classList.remove("blinking-marker");
//                                 },
//                                 click: handleMarkerClick,
//                             }}
//                         >
//                             <Popup>
//                                 <strong>{loc.name}</strong>
//                                 <br />
//                                 Campus: {loc.campus}
//                                 <br />
//                                 Type: {loc.college_type}
//                             </Popup>
//                         </Marker>
//                     );
//                 })}

//                 {selectedLocation && selectedLocation.type === "point" && (
//                     <Marker
//                         position={[selectedLocation.latitude, selectedLocation.longitude]}
//                         icon={
//                             selectedLocation.college_type?.toLowerCase() === "school"
//                                 ? blueIcon
//                                 : redIcon
//                         }
//                         eventHandlers={{
//                             mouseover: (e) => {
//                                 e.target.openPopup();
//                                 e.target._icon.classList.add("blinking-marker");
//                             },
//                             mouseout: (e) => {
//                                 e.target.closePopup();
//                                 e.target._icon.classList.remove("blinking-marker");
//                             },
//                             click: () => {
//                                 const encodedCampus = encodeURIComponent(selectedLocation.campus);
//                                 const dashboardUrl = `http://192.168.1.48:3000/dashboard/9?campus_name=${encodedCampus}&tab=9-overall`;
//                                 window.open(dashboardUrl, "_blank");
//                             },
//                         }}
//                     >
//                         <Popup>
//                             <strong>{selectedLocation.name}</strong> (Selected)
//                             <br />
//                             Campus: {selectedLocation.campus}
//                             <br />
//                             Type: {selectedLocation.college_type}
//                         </Popup>
//                     </Marker>
//                 )}
//             </MapContainer>
//         </div>
//     );
// };

// export default LocationMap;