/**
 * Transaction Repository Definition
 */
const BaseRepository = require('./baseRepository');

class TransactionRepository extends BaseRepository {
  constructor() {
    super('Transaction', 'transactions');
  }
}

module.exports = new TransactionRepository();
