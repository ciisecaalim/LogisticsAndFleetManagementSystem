module.exports = {
  vehicles: [
    { vehicleId: 'VH-1001', trackerId: 'TRK-1001', plateNumber: 'ABC-1234', model: 'Transit', brand: 'Ford', type: 'Van', year: 2022, status: 'Assigned', assignedDriver: 'John Smith', assignedDriverId: 'DRV-1001', lat: 40.7589, lng: -73.9851 },
    { vehicleId: 'VH-1002', trackerId: 'TRK-1002', plateNumber: 'XYZ-5678', model: 'Sprinter', brand: 'Mercedes', type: 'Van', year: 2023, status: 'Assigned', assignedDriver: 'Sarah Johnson', assignedDriverId: 'DRV-1002', lat: 40.6782, lng: -73.9442 },
    { vehicleId: 'VH-1003', trackerId: 'TRK-1003', plateNumber: 'DEF-9012', model: 'FH16', brand: 'Volvo', type: 'Truck', year: 2021, status: 'Off', assignedDriver: 'Unassigned', lat: 40.7282, lng: -74.0776 },
    { vehicleId: 'VH-1004', trackerId: 'TRK-1004', plateNumber: 'GHI-3456', model: 'R450', brand: 'Scania', type: 'Truck', year: 2023, status: 'Assigned', assignedDriver: 'Michael Davis', assignedDriverId: 'DRV-1003', lat: 40.742, lng: -73.7749 },
    { vehicleId: 'VH-1005', trackerId: 'TRK-1005', plateNumber: 'JKL-7890', model: 'Daily', brand: 'Iveco', type: 'Van', year: 2022, status: 'Available', assignedDriver: 'Unassigned', lat: 40.8116, lng: -73.9465 }
  ],
  drivers: [
    { driverId: 'DRV-1001', name: 'John Smith', phone: '+1-555-0101', email: 'john.smith@email.com', contactInfo: { phone: '+1-555-0101', email: 'john.smith@email.com' }, licenseNumber: 'DL-12345678', joinDate: '2022-01-15', status: 'Assigned' },
    { driverId: 'DRV-1002', name: 'Sarah Johnson', phone: '+1-555-0102', email: 'sarah.johnson@email.com', contactInfo: { phone: '+1-555-0102', email: 'sarah.johnson@email.com' }, licenseNumber: 'DL-23456789', joinDate: '2022-03-20', status: 'Assigned' },
    { driverId: 'DRV-1003', name: 'Michael Davis', phone: '+1-555-0103', email: 'michael.davis@email.com', contactInfo: { phone: '+1-555-0103', email: 'michael.davis@email.com' }, licenseNumber: 'DL-34567890', joinDate: '2021-11-10', status: 'Assigned' },
    { driverId: 'DRV-1004', name: 'Emily Wilson', phone: '+1-555-0104', email: 'emily.wilson@email.com', contactInfo: { phone: '+1-555-0104', email: 'emily.wilson@email.com' }, licenseNumber: 'DL-45678901', joinDate: '2023-02-05', status: 'Available' },
    { driverId: 'DRV-1005', name: 'David Brown', phone: '+1-555-0105', email: 'david.brown@email.com', contactInfo: { phone: '+1-555-0105', email: 'david.brown@email.com' }, licenseNumber: 'DL-56789012', joinDate: '2022-06-12', status: 'Off' }
  ],
  trips: [
    { tripId: 'TRP-1001', vehicleId: 'VH-1001', vehicle: 'ABC-1234', driverId: 'DRV-1001', driver: 'John Smith', from: 'New York, NY', to: 'Boston, MA', date: '2024-04-02', departureTime: '2024-04-02T08:00:00.000Z', expectedArrivalTime: '2024-04-02T13:00:00.000Z', distance: 215, status: 'Ongoing', progressPercent: 45 },
    { tripId: 'TRP-1002', vehicleId: 'VH-1002', vehicle: 'XYZ-5678', driverId: 'DRV-1002', driver: 'Sarah Johnson', from: 'Los Angeles, CA', to: 'San Francisco, CA', date: '2024-04-02', departureTime: '2024-04-02T09:00:00.000Z', expectedArrivalTime: '2024-04-02T16:00:00.000Z', distance: 382, status: 'Ongoing', progressPercent: 32 },
    { tripId: 'TRP-1003', vehicleId: 'VH-1004', vehicle: 'GHI-3456', driverId: 'DRV-1003', driver: 'Michael Davis', from: 'Chicago, IL', to: 'Detroit, MI', date: '2024-04-01', departureTime: '2024-04-01T07:30:00.000Z', expectedArrivalTime: '2024-04-01T12:30:00.000Z', distance: 283, status: 'Completed', progressPercent: 100 }
  ],
  fuel: [
    { date: '2024-04-02', vehicle: 'ABC-1234 - Ford Transit', liters: 65, cost: 195, pricePerLiter: 3, station: 'Shell Gas Station', odometer: '45230 mi' },
    { date: '2024-04-02', vehicle: 'XYZ-5678 - Mercedes Sprinter', liters: 70, cost: 210, pricePerLiter: 3, station: 'BP Fuel Center', odometer: '38450 mi' },
    { date: '2024-04-01', vehicle: 'GHI-3456 - Scania R450', liters: 120, cost: 360, pricePerLiter: 3, station: 'Chevron Station', odometer: '62180 mi' }
  ],
  maintenance: [
    { date: '2024-03-28', vehicle: 'DEF-9012 - Volvo FH16', description: 'Engine oil change and filter replacement', type: 'Scheduled', cost: 250, status: 'In Progress', nextDue: '2024-06-28' },
    { date: '2024-03-15', vehicle: 'ABC-1234 - Ford Transit', description: 'Brake pad replacement', type: 'Repair', cost: 450, status: 'Completed', nextDue: '2024-09-15' },
    { date: '2024-04-05', vehicle: 'ABC-1234 - Ford Transit', description: 'Air conditioning system check', type: 'Inspection', cost: 120, status: 'Pending', nextDue: '2024-10-05' }
  ],
  reports: [
    { title: 'Monthly Fuel Report', summary: 'Fuel expenses by month', type: 'Fuel' },
    { title: 'Vehicle Usage Report', summary: 'Active vs idle fleet usage', type: 'Fleet' }
  ],
  settings: [
    { key: 'theme', value: 'light' },
    { key: 'language', value: 'en-US' }
  ]
};
