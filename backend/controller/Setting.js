const Setting = require('../model/Setting');

const readAll = async (req, res) => {
  try {
    const settings = await Setting.find();

    res.status(200).json({
      message: "Settings loaded successfully",
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      message: "Error loading settings",
      error: error.message
    });
  }
};

module.exports = { readAll };
