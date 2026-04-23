const { createEnquiry } = require("../models/enquiryModel");

async function submitEnquiry(req, res, next) {
  try {
    const enquiry = await createEnquiry(req.body);
    return res.status(201).json({
      message: "Details submitted successfully",
      enquiry
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  submitEnquiry
};

