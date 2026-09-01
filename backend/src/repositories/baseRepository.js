/**
 * Universal Base Repository Supporting Dual Persistence Mode (Mongoose / In-Memory Store)
 * Enforces Pagination, Searching, Filtering, Sorting, and Field Selection (Projection).
 */
const mongoose = require('mongoose');

class BaseRepository {
  constructor(modelName, storeArrayName) {
    this.modelName = modelName;
    this.storeArrayName = storeArrayName;
  }

  // Model resolver helper
  getModel() {
    return mongoose.model(this.modelName);
  }

  // Generic List Handler with Pagination, Filter, Search, Sort & Fields Projection
  async find(queryParams = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      sort = '-createdAt',
      fields = '',
      ...filter
    } = queryParams;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const Model = this.getModel();
    let queryFilter = {};

    // Filter By Parameters
    if (Object.keys(filter).length > 0) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || value === 'All') return;
        
        // Exact match for numbers/booleans, case-insensitive regex match for strings
        if (typeof value === 'string') {
          if (mongoose.Types.ObjectId.isValid(value)) {
            queryFilter[key] = value;
          } else {
            queryFilter[key] = new RegExp(`^${value}$`, 'i');
          }
        } else {
          queryFilter[key] = value;
        }
      });
    }

    // Text Search
    if (search && search.trim()) {
      const q = search.trim();
      const searchConditions = [];
      const paths = Model.schema.paths;
      for (const [path, schemaType] of Object.entries(paths)) {
        if (schemaType.instance === 'String' && path !== '_id' && path !== '__v') {
          searchConditions.push({ [path]: new RegExp(q, 'i') });
        }
      }
      if (searchConditions.length > 0) {
        queryFilter['$or'] = searchConditions;
      }
    }

    let query = Model.find(queryFilter);

    // Sorting
    if (sort) {
      query = query.sort(sort);
    } else {
      query = query.sort('-createdAt');
    }

    // Projection
    if (fields && fields.trim()) {
      query = query.select(fields.split(',').join(' '));
    }

    // Pagination
    query = query.skip(skip).limit(limitNum);

    const data = await query.exec();
    const total = await Model.countDocuments(queryFilter);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum
    };
  }

  async findById(id) {
    const Model = this.getModel();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      // Try finding by custom bookingId or identifier if it's not a valid ObjectId
      const fieldName = this.modelName === 'Appointment' ? 'bookingId' : (this.modelName === 'MembershipPlan' ? 'code' : null);
      if (fieldName) {
        const item = await Model.findOne({ [fieldName]: id });
        if (item) return item;
      }
      return null;
    }
    return await Model.findById(id);
  }

  async create(payload) {
    const Model = this.getModel();
    return await Model.create(payload);
  }

  async update(id, payload) {
    const Model = this.getModel();
    const query = mongoose.Types.ObjectId.isValid(id) 
      ? { _id: id } 
      : (this.modelName === 'Appointment' ? { bookingId: id } : (this.modelName === 'MembershipPlan' ? { code: id } : { _id: id }));

    return await Model.findOneAndUpdate(query, payload, { new: true, runValidators: true });
  }

  async softDelete(id) {
    const Model = this.getModel();
    const query = mongoose.Types.ObjectId.isValid(id) 
      ? { _id: id } 
      : (this.modelName === 'Appointment' ? { bookingId: id } : (this.modelName === 'MembershipPlan' ? { code: id } : { _id: id }));

    const res = await Model.deleteOne(query);
    return res.deletedCount > 0;
  }
}

module.exports = BaseRepository;
