const BaseRepository = require('./baseRepository');

class CustomerRepository extends BaseRepository {
  constructor() {
    super('User', 'customers');
  }

  async find(queryParams = {}) {
    const query = { ...queryParams, role: 'customer' };
    return super.find(query);
  }

  async create(payload) {
    const crypto = require('crypto');
    const pwd = payload.password || ('CUST-' + crypto.randomBytes(6).toString('hex'));
    return super.create({ ...payload, role: 'customer', password: pwd });
  }
}

module.exports = new CustomerRepository();
