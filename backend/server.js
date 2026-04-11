const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const vehicleRouter = require('./router/Vehicles');
const driverRouter = require('./router/Drivers');
const tripRouter = require('./router/Trips');
const fuelRouter = require('./router/fuel');
const maintenanceRouter = require('./router/Maintenance');
const fleetMapRouter = require('./router/FleetMap');
const reportsRouter = require('./router/Reports');
const settingRouter = require('./router/Setting');
const recycleBinRouter = require('./router/RecycleBin');
const shipmentRouter = require('./router/Shipments');
const inventoryRouter = require('./router/Inventory');
const warehousingRouter = require('./router/Warehousing');
const { readAll: dashboardSummary } = require('./controller/dashboardController');
const { readAll: systemReadAll, health } = require('./controller/systemController');
const { seedDatabase } = require('./controller/seedController');

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

app.use('/api/vehicles', vehicleRouter);
app.use('/api/drivers', driverRouter);
app.use('/api/trips', tripRouter);
app.use('/api/fuel', fuelRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/map', fleetMapRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingRouter);
app.use('/api/recycle-bin', recycleBinRouter);
app.use('/api/shipments', shipmentRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/warehousing', warehousingRouter);

app.get('/api/dashboard/summary', dashboardSummary);
app.get('/api/system', systemReadAll);
app.get('/api/health', health);

app.use((req, res) => {
	res.status(404).json({
		message: `Not Found - ${req.originalUrl}`
	});
});

const startServer = async () => {
	try {
		await mongoose.connect(MONGO_URI);
		console.log('MongoDB connected');
		await seedDatabase();
		console.log('Database seed check complete');
	} catch (error) {
		console.error('MongoDB connection failed.');
		console.error(error.message);
		process.exit(1);
	}

	app.listen(PORT, () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
};

startServer();
