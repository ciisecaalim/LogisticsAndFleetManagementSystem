const mongoose = require('mongoose');
const schemaOptions = require('./schemaOptions');

const maintenanceSchema = new mongoose.Schema(
	{
		date: { type: String, required: true, trim: true },
		vehicle: { type: String, required: true, trim: true },
		description: { type: String, required: true, trim: true },
		type: { type: String, required: true, trim: true },
		cost: { type: Number, required: true },
		status: { type: String, required: true, trim: true },
		nextDue: { type: String, required: true, trim: true }
	},
	schemaOptions
);

module.exports = mongoose.model('Maintenance', maintenanceSchema);
