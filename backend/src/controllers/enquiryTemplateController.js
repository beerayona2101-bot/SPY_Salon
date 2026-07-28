/**
 * Quick Enquiry Templates Controller & Store Seeding
 */
const store = require('../data/store');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');

// Seed Default 13 Enquiry Templates if not exists
if (!store.enquiryTemplates) {
  store.enquiryTemplates = [
    {
      id: 'tmpl-1',
      name: 'Hair Cut',
      icon: '💇',
      category: 'Services',
      message: `Hello,\n\nI would like to know more about your Hair Cut services.\n\nCould you please share the available packages, pricing, and appointment timings?\n\nThank you.`,
      displayOrder: 1,
      status: 'Active'
    },
    {
      id: 'tmpl-2',
      name: 'Hair Spa',
      icon: '💆',
      category: 'Treatments',
      message: `Hello,\n\nI'm interested in your Hair Spa treatments.\n\nPlease share the available options, duration, prices, and current offers.\n\nThank you.`,
      displayOrder: 2,
      status: 'Active'
    },
    {
      id: 'tmpl-3',
      name: 'Bridal Package',
      icon: '👰',
      category: 'Bridal',
      message: `Hello,\n\nI would like information about your Bridal Makeup and Bridal Packages.\n\nPlease share pricing, inclusions, and availability.\n\nThank you.`,
      displayOrder: 3,
      status: 'Active'
    },
    {
      id: 'tmpl-4',
      name: 'Pricing Enquiry',
      icon: '💰',
      category: 'Pricing',
      message: `Hello,\n\nCould you please send me the latest price list for your salon services?\n\nThank you.`,
      displayOrder: 4,
      status: 'Active'
    },
    {
      id: 'tmpl-5',
      name: 'Appointment Booking',
      icon: '📅',
      category: 'Booking',
      message: `Hello,\n\nI would like to book an appointment.\n\nPlease let me know the available time slots.\n\nThank you.`,
      displayOrder: 5,
      status: 'Active'
    },
    {
      id: 'tmpl-6',
      name: 'Membership Plans',
      icon: '👑',
      category: 'Membership',
      message: `Hello,\n\nI'm interested in your Standard, Premium, and Gold Membership plans.\n\nPlease share the benefits, pricing, discounts, and validity.\n\nThank you.`,
      displayOrder: 6,
      status: 'Active'
    },
    {
      id: 'tmpl-7',
      name: 'Salon Packages',
      icon: '🎁',
      category: 'Offers',
      message: `Hello,\n\nPlease share your salon combo packages and current offers.\n\nThank you.`,
      displayOrder: 7,
      status: 'Active'
    },
    {
      id: 'tmpl-8',
      name: 'VIP Services',
      icon: '⭐',
      category: 'VIP',
      message: `Hello,\n\nI would like to know more about your VIP services and exclusive treatments.\n\nPlease share complete details.\n\nThank you.`,
      displayOrder: 8,
      status: 'Active'
    },
    {
      id: 'tmpl-9',
      name: 'Payment',
      icon: '💳',
      category: 'Payment',
      message: `Hello,\n\nI have a question regarding payment methods and online booking.\n\nPlease assist me.\n\nThank you.`,
      displayOrder: 9,
      status: 'Active'
    },
    {
      id: 'tmpl-10',
      name: 'Callback Request',
      icon: '📞',
      category: 'Support',
      message: `Hello,\n\nPlease arrange a callback at your earliest convenience.\n\nThank you.`,
      displayOrder: 10,
      status: 'Active'
    },
    {
      id: 'tmpl-11',
      name: 'Feedback',
      icon: '💬',
      category: 'Feedback',
      message: `Hello,\n\nI would like to share my feedback regarding my recent salon visit.\n\nThank you.`,
      displayOrder: 11,
      status: 'Active'
    },
    {
      id: 'tmpl-12',
      name: 'Complaint',
      icon: '❗',
      category: 'Support',
      message: `Hello,\n\nI would like to report an issue regarding my recent appointment.\n\nPlease contact me.\n\nThank you.`,
      displayOrder: 12,
      status: 'Active'
    },
    {
      id: 'tmpl-13',
      name: 'General Enquiry',
      icon: '✨',
      category: 'General',
      message: `Hello,\n\nI would like to know more about your salon services.\n\nPlease contact me.\n\nThank you.`,
      displayOrder: 13,
      status: 'Active'
    }
  ];
}

/**
 * Public Endpoint: Get Active Enquiry Templates
 */
exports.getPublicTemplates = async (req, res, next) => {
  try {
    const templates = (store.enquiryTemplates || [])
      .filter(t => t.status === 'Active')
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

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
    return ApiResponse.success(res, store.enquiryTemplates || [], 'All enquiry templates retrieved');
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

    const newTemplate = {
      id: `tmpl-${Date.now()}`,
      name,
      icon: icon || '✨',
      category: category || 'General',
      message,
      displayOrder: displayOrder || (store.enquiryTemplates.length + 1),
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    store.enquiryTemplates.push(newTemplate);
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
    const template = store.enquiryTemplates.find(t => t.id === id);
    if (!template) throw ApiError.notFound('Template not found');

    Object.assign(template, req.body);
    return ApiResponse.success(res, template, 'Template updated successfully');
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
    store.enquiryTemplates = store.enquiryTemplates.filter(t => t.id !== id);
    return ApiResponse.success(res, null, 'Template deleted successfully');
  } catch (error) {
    next(error);
  }
};
