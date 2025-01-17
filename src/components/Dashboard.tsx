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

const WebSocketURL = 'wss://apager.ff-buschdorf.de/?token=49wocbSN9YBsAEDrHA5v7cB8Y9kwdahysVcdW6cTFe4uRwVFc6UpVVUTkLJYnvXL';

// Interfaces to define the structure of data used in components
interface MapData {
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface DashboardData {
  ziel: MapData;
  keyword: string;
  description: string;
  vehicles: string[];
  sondersignal: string;
}

// Component for updating the map view based on destination coordinates
const MapUpdater: React.FC<{ destination: MapData }> = ({ destination }) => {
  const map = useMap(); // Retrieve the map instance
  useEffect(() => {
    // Update the map view anytime the destination changes
    map.setView(
      [destination?.coordinates?.lat || 50.7618649, destination?.coordinates?.lng || 7.0495328],
      16
    );
  }, [destination, map]);

  return null; // This component does not render anything
};

// Main Dashboard component
const Dashboard: React.FC = () => {
  // State hooks for managing different data points
  const [destination, setDestination] = useState<MapData>({
    coordinates: {
      lat: 0,
      lng: 0,
    },
  });
  const [keyword, setKeyword] = useState<string>('Alarmstichwort');
  const [description, setDescription] = useState<string>('');
  const [vehicles, setVehicles] = useState<string[]>(['Fahrzeug 1', 'Fahrzeug 2']);
  const [sonderSignal, setSonderSignal] = useState('');
  const [alarmTime, setAlarmTime] = useState<string>('Unbekannt');
  const [currentTime, setCurrentTime] = useState<string>('');

  const [isConnected, setIsConnected] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Effect for showing an error message after 1 seconds on initial load if not connected
  useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        setShowError(!isConnected);
        setIsInitialLoad(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowError(!isConnected);
    }
  }, [isConnected, isInitialLoad]);

  // Effect for establishing a WebSocket connection and handling messages
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectWebSocket = () => {
      ws = new WebSocket(WebSocketURL);

      ws.onopen = () => {
        console.log('WebSocket connected'); // Log connection status
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: DashboardData = JSON.parse(event.data);
          console.log('Parsed data:', data);
          // Update state with incoming data
          setDestination(data.ziel || {});
          setKeyword(data.keyword);
          setDescription(data?.description);
          setVehicles(data.vehicles);
          setSonderSignal(data?.sondersignal);
          setAlarmTime(new Date().toLocaleTimeString()); // Set the alarm time
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected'); // Log disconnection
        setIsConnected(false); 
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error); // Log errors
        ws.close();
      };
    };

    connectWebSocket();

    // Cleanup WebSocket connection on component unmount
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []); // Corrected syntax with closed parenthesis

  // Effect for updating the current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className='flex h-screen bg-gray-900 text-white relative'>
      {/* Overlay background */}
      {showError && (
        <div className='absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-10'>
          <div className='bg-red-600 text-white p-4 rounded-lg shadow-lg'>
            Keine Verbindung zum Server - Verbindungsversuch läuft...
          </div>
        </div>
      )}
      {/* Conditionally render the signal image based on the sondersignal state */}
      {sonderSignal && (
        <div className='absolute w-32 h-32 right-0 top-0 z-20'>
          {(() => {
            switch (sonderSignal) {
            case 'Ja':
              return <img src='/JA.png' alt='SonderSignal Ja' />;
            case 'Nein':
              return <img src='/NEIN.png' alt='SonderSignal Nein' />;
            default:
              break;
            }
          })()}
        </div>
      )}
      <div className='w-1/2 h-full'>
        {/* Render the map with initial center and zoom */}
        <MapContainer
          center={[
            destination?.coordinates?.lat || 50.7618649,
            destination?.coordinates?.lng || 7.0495328,
          ]}
          zoom={13}
          className='h-full w-full'
          style={{ zIndex: 1 }} // Ensure map is behind the popup
        >
          <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
          <Marker
            position={[
              destination?.coordinates?.lat || 50.7618649,
              destination?.coordinates?.lng || 7.0495328,
            ]}
          >
            <Popup>
              Coordinates: {destination?.coordinates?.lat}, {destination?.coordinates?.lng}
            </Popup>
          </Marker>
          <MapUpdater destination={{ coordinates: destination.coordinates }} />
        </MapContainer>
      </div>
      <div className='w-1/2 p-8 flex flex-col'>
        {/* Time displays container */}
        <div className='flex w-full justify-around mb-16 mt-8'> 
          <div className='bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center w-2/5'>
            <p className='text-5xl font-bold mb-2'>{alarmTime}</p>
            <h2 className='text-sm font-semibold'>Alarmeingang</h2>
          </div>
          <div className='bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center w-2/5'>
            <p className='text-5xl font-bold mb-2'>{currentTime}</p>
            <h2 className='text-sm font-semibold'>Uhrzeit</h2>
          </div>
        </div>
        <div className='flex-1 flex flex-col justify-center items-center'>
        <h1 className='text-4xl mb-12 font-bold'>{keyword}</h1>
        {description && (
          <p className='mb-10 font-extralight text-lg'>{description}</p>
        )}
        <div className='w-full my-6'>
          <h2 className='text-3xl mb-4 text-center'>Alarmierte Fahrzeuge</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto'>
            {vehicles.map((item) => (
              <div key={item} className='bg-gray-800 rounded p-3'>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Dashboard;