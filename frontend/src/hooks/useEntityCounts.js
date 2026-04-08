import { useEffect, useState } from 'react';
import api from '../services/api';

const initialCounts = {
  drivers: 0,
  vehicles: 0,
  trips: 0,
  shipments: 0
};

export default function useEntityCounts() {
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadCounts = async () => {
      setLoading(true);
      try {
        const [drivers, vehicles, trips, shipments] = await Promise.all([
          api.getDrivers(),
          api.getVehicles(),
          api.getTrips(),
          api.getShipments()
        ]);

        if (!mounted) {
          return;
        }

        setCounts({
          drivers: Array.isArray(drivers) ? drivers.length : 0,
          vehicles: Array.isArray(vehicles) ? vehicles.length : 0,
          trips: Array.isArray(trips) ? trips.length : 0,
          shipments: Array.isArray(shipments) ? shipments.length : 0
        });
        setError('');
      } catch {
        if (!mounted) {
          return;
        }
        setError('Unable to load quick stats right now.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCounts();

    return () => {
      mounted = false;
    };
  }, []);

  return { counts, loading, error };
}
