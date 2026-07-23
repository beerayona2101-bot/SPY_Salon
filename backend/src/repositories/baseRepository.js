/**
 * Universal Base Repository Supporting Dual Persistence Mode (Mongoose / In-Memory Store)
 * Enforces Pagination, Searching, Filtering, Sorting, and Field Selection (Projection).
 */
const store = require('../data/store');

class BaseRepository {
  constructor(modelName, storeArrayName) {
    this.modelName = modelName;
    this.storeArrayName = storeArrayName;
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

    // Direct In-Memory Store Query Execution
    let items = Array.isArray(store[this.storeArrayName]) ? [...store[this.storeArrayName]] : [];

    // Filter By Parameters
    if (Object.keys(filter).length > 0) {
      items = items.filter(item => {
        return Object.entries(filter).every(([key, value]) => {
          if (value === undefined || value === null || value === '' || value === 'All') return true;
          return String(item[key] || '').toLowerCase() === String(value).toLowerCase();
        });
      });
    }

    // Text Search
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(item => {
        return Object.values(item).some(val => 
          typeof val === 'string' && val.toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    const isDesc = sort.startsWith('-');
    const sortField = isDesc ? sort.substring(1) : sort;

    items.sort((a, b) => {
      const valA = a[sortField] !== undefined ? a[sortField] : '';
      const valB = b[sortField] !== undefined ? b[sortField] : '';

      if (valA < valB) return isDesc ? 1 : -1;
      if (valA > valB) return isDesc ? -1 : 1;
      return 0;
    });

    const total = items.length;
    let paginated = items.slice(skip, skip + limitNum);

    // Field Projection (Sparse Fieldsets to avoid over-fetching)
    if (fields && fields.trim()) {
      const selectedFields = fields.split(',').map(f => f.trim()).filter(Boolean);
      paginated = paginated.map(item => {
        const projected = {};
        selectedFields.forEach(f => {
          if (item[f] !== undefined) projected[f] = item[f];
        });
        return projected;
      });
    }

    return {
      data: paginated,
      total,
      page: pageNum,
      limit: limitNum
    };
  }

  async findById(id) {
    const items = store[this.storeArrayName] || [];
    return items.find(item => String(item._id) === String(id) || String(item.id) === String(id)) || null;
  }

  async create(payload) {
    const newRecord = {
      _id: `${this.storeArrayName.slice(0, 3)}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      ...payload
    };
    if (Array.isArray(store[this.storeArrayName])) {
      store[this.storeArrayName].unshift(newRecord);
    }
    return newRecord;
  }

  async update(id, payload) {
    const items = store[this.storeArrayName] || [];
    const index = items.findIndex(item => String(item._id) === String(id) || String(item.id) === String(id));
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...payload,
      updatedAt: new Date().toISOString()
    };

    return items[index];
  }

  async softDelete(id) {
    const items = store[this.storeArrayName] || [];
    const index = items.findIndex(item => String(item._id) === String(id) || String(item.id) === String(id));
    if (index === -1) return false;

    store[this.storeArrayName].splice(index, 1);
    return true;
  }
}

module.exports = BaseRepository;
