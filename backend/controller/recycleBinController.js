const { RecycleBin, getModelForType } = require('../services/recycleBinService');

const listRecycleBinEntries = async (req, res) => {
  const { type } = req.query;
  const query = {};

  if (type) {
    query.type = type;
  }

  try {
    const entries = await RecycleBin.find(query).sort({ deletedAt: -1 });
    res.status(200).json({
      message: 'Recycle bin entries',
      data: entries
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error loading recycle bin',
      error: error.message
    });
  }
};

const restoreEntry = async (req, res) => {
  const { id } = req.params;

  try {
    const entry = await RecycleBin.findById(id);

    if (!entry) {
      return res.status(404).json({ message: 'Recycle bin entry not found' });
    }

    const Model = getModelForType(entry.type);

    if (!Model) {
      return res.status(400).json({ message: `Unknown entity type: ${entry.type}` });
    }

    const alreadyExists = await Model.exists({ _id: entry.originalId });

    if (alreadyExists) {
      return res.status(409).json({ message: 'Original record already exists' });
    }

    const restored = await Model.create(entry.data);
    await entry.deleteOne();

    res.status(200).json({
      message: 'Record restored',
      data: restored
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error restoring entry',
      error: error.message
    });
  }
};

const deleteEntry = async (req, res) => {
  const { id } = req.params;

  try {
    const entry = await RecycleBin.findByIdAndDelete(id);

    if (!entry) {
      return res.status(404).json({ message: 'Recycle bin entry not found' });
    }

    res.status(200).json({
      message: 'Entry permanently deleted'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting entry permanently',
      error: error.message
    });
  }
};

module.exports = {
  listRecycleBinEntries,
  restoreEntry,
  deleteEntry
};
