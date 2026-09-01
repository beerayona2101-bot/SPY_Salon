/**
 * Quick Enquiry Templates Controller & Store Seeding
 */
const EnquiryTemplate = require('../models/EnquiryTemplate');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const mongoose = require('mongoose');

/**
 * Public Endpoint: Get Active Enquiry Templates
 */
exports.getPublicTemplates = async (req, res, next) => {
  try {
    const templates = await EnquiryTemplate.find({ status: 'Active' })
      .sort({ displayOrder: 1 });

    return ApiResponse.success(res, templates, 'Active enquiry templates retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Endpoint: Get All Templates
 */
exports.adminGetTemplates = async (req, res, next) => {
  try {
    const templates = await EnquiryTemplate.find().sort({ displayOrder: 1 });
    return ApiResponse.success(res, templates, 'All enquiry templates retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Endpoint: Create Template
 */
exports.adminCreateTemplate = async (req, res, next) => {
  try {
    const { name, icon, category, message, displayOrder } = req.body;
    if (!name || !message) throw ApiError.badRequest('Name and message content are required');

    const totalCount = await EnquiryTemplate.countDocuments();
    const newTemplate = await EnquiryTemplate.create({
      templateId: `tmpl-${Date.now()}`,
      name,
      icon: icon || '✨',
      category: category || 'General',
      message,
      displayOrder: displayOrder || (totalCount + 1),
      status: 'Active'
    });

    return ApiResponse.success(res, newTemplate, 'Template created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Endpoint: Update Template
 */
exports.adminUpdateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { templateId: id };
    const updated = await EnquiryTemplate.findOneAndUpdate(query, req.body, { new: true });
    if (!updated) throw ApiError.notFound('Template not found');

    return ApiResponse.success(res, updated, 'Template updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Endpoint: Delete Template
 */
exports.adminDeleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { templateId: id };
    const result = await EnquiryTemplate.deleteOne(query);
    if (result.deletedCount === 0) throw ApiError.notFound('Template not found');

    return ApiResponse.success(res, null, 'Template deleted successfully');
  } catch (error) {
    next(error);
  }
};
