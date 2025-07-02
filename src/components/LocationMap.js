// import React, { useEffect, useState } from "react";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";

// const redIcon = new L.Icon({
//   iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
//   shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41],
// });

// const LocationMap = () => {
//   const [locations, setLocations] = useState([]);

//   useEffect(() => {
//     fetch("http://localhost:8080/locations")
//       .then((res) => res.json())
//       .then((data) => {
//         console.log("📍 Locations fetched from backend:", data);
//         setLocations(data);
//       })
//       .catch((err) => console.error("🚨 Error fetching locations:", err));
//   }, []);

//   return (
//     <MapContainer center={[17.0, 79.5]} zoom={7} className="leaflet-container">
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         attribution='© OpenStreetMap contributors'
//       />
//       {locations.map((loc) => (
//         <Marker
//           key={loc.id}
//           position={[loc.latitude, loc.longitude]}
//           icon={redIcon}
//         >
//           <Popup>{loc.name}</Popup>
//         </Marker>
//       ))}
//     </MapContainer>
//   );
// };

// export default LocationMap;



import { React, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";




const redIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function FlyToLocation({ selectedLocation }) {
    const map = useMap();

    useEffect(() => {
        if (selectedLocation) {
            map.flyTo([selectedLocation.latitude, selectedLocation.longitude], 15, {
                duration: 2,
            });
        }
    }, [selectedLocation, map]);

    return null;
}

const LocationMap = () => {
    const [locations, setLocations] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedLocation, setSelectedLocation] = useState(null);

    useEffect(() => {
        fetch("http://localhost:8080/locations")
            .then((res) => res.json())
            .then((data) => {
                console.log("📍 Locations fetched from backend:", data);
                setLocations(data);
            })
            .catch((err) => console.error("🚨 Error fetching locations:", err));
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        const found = locations.find(
            (loc) => loc.name.toLowerCase() === search.toLowerCase()
        );
        if (found) {
            setSelectedLocation(found);
        } else {
            alert("Location not found!");
        }
    };

    return (
        <div>
            <div >
                <form onSubmit={handleSearch} className="search-bar">
                    <input
                        type="text"
                        placeholder="Enter location name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" >Go</button>
                </form>

            </div>

         
            <MapContainer center={[17.0, 79.5]} zoom={5} className="leaflet-container">
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© OpenStreetMap contributors'
                />

                {/* Fly to selected marker on search */}
                <FlyToLocation selectedLocation={selectedLocation} />

                {/* Show markers */}
                {locations.map((loc) => (
                    <Marker
                        key={loc.id}
                        position={[loc.latitude, loc.longitude]}
                        icon={redIcon}
                    >
                        <Popup>{loc.name}</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default LocationMap;
