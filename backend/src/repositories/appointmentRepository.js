/**
 * Appointment Repository Definition
 */
const BaseRepository = require('./baseRepository');

class AppointmentRepository extends BaseRepository {
  constructor() {
    super('Appointment', 'appointments');
  }
}

module.exports = new AppointmentRepository();
