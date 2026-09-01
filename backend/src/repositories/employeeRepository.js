/**
 * Employee Repository Definition
 */
const BaseRepository = require('./baseRepository');

class EmployeeRepository extends BaseRepository {
  constructor() {
    super('Employee', 'employees');
  }
}

module.exports = new EmployeeRepository();
