const Report = require('../model/Reports');

const readAll = async (req, res) => {
  try {
    const reports = await Report.find();

    res.status(200).json({
      message: "Reports loaded successfully",
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      message: "Error loading reports",
      error: error.message
    });
  }
};

module.exports = { readAll };
