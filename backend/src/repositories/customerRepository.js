/**
 * Customer Repository Definition
 */
const BaseRepository = require('./baseRepository');

class CustomerRepository extends BaseRepository {
  constructor() {
    super('Customer', 'customers');
  }
}

module.exports = new CustomerRepository();
