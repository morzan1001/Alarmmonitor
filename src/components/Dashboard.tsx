import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Initialize the default marker icon to fix missing icons in react-leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const WebSocketURL = 'wss://116.203.84.208:8000/ws';

interface MapData {
  coordinates: {
    lat: number;
    lng: number;
  }
}

interface DashboardData {
  ziel: MapData;
  keyword: string;
  description: string;
  vehicles: string[];
}

const MapUpdater: React.FC<{ destination: MapData }> = ({ destination }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([destination.coordinates.lng, destination.coordinates.lat], 16);
  }, [destination, map]);

  return null;
};

const Dashboard: React.FC = () => {
  const [coordinates, setCoordinates] = useState<MapData>({
    Latitude: 50.761952,
    Longitude: 7.049516,
  });
  const [keyword, setKeyword] = useState<string>('Alarmstichwort');
  const [description, setDescription] = useState<string>(
    'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Rerum maiores atque sunt possimus nisi id fugiat pariatur, architecto laboriosam. Necessitatibus itaque, assumenda id nobis consectetur tempore placeat at inventore totam.'
  );
  const [vehicles, setTableContent] = useState<string[]>([
    'Fahrzeug 1',
    'Fahrzeug 2',
  ]);

  useEffect(() => {
    const ws = new WebSocket(WebSocketURL);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data: DashboardData = JSON.parse(event.data);
        console.log('Parsed data:', data);
        setCoordinates(data.ziel.coordinates);
        setKeyword(data.keyword);
        setDescription(data.description);
        setTableContent(data.vehicles);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className='flex h-screen bg-gray-900 text-white'>
      <div className='w-1/2 h-full'>
        <MapContainer
          center={[destination.coordinates.lat, destination.coordinates.lng]}
          zoom={13}
          className='h-full w-full'
        >
          <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
          <Marker position={[destination.coordinates.lat, destination.coordinates.lng]}>
            <Popup>
              Coordinates: {destination.coordinates.lat}, {destination.coordinates.lng}
            </Popup>
          </Marker>
          <MapUpdater coordinates={coordinates} />
        </MapContainer>
      </div>
      <div className='w-1/2 p-8 flex flex-col justify-center items-center'>
        <h1 className='text-4xl mb-12 font-bold'>{keyword}</h1>
        <p className='mb-10 font-extralight text-lg'>{description}</p>
        <table className='w-full table-auto my-6'>
          <thead>
            <tr>
              <th className='py-2 text-3xl text-start px-4'>Alarmierte Fahrzeuge</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((item, index) => (
              <tr key={index}>
                <td>
                  <div className='px-4 py-2'>{item}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
