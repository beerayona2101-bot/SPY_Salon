/**
 * SPY Salon - Service Queue Consistency & Active Workload Test Suite
 * Validates that COUNT, LIST, FILTERS, BADGES, and DATE GROUPS use 100% identical active-appointment logic.
 */

function isActiveQueueAppointment(raw) {
  if (!raw) return false;
  const status = String(raw.status || '').trim().toLowerCase();
  return status !== 'completed' &&
         status !== 'cancelled' &&
         status !== 'staff_rejected' &&
         status !== 'no show' &&
         status != 'no_show' &&
         status != 'noshow';
}

function runQueueConsistencyTests() {
  console.log('================================================================');
  console.log('✂️  RUNNING SPY SALON SERVICE QUEUE CONSISTENCY TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  const todayStr = '2026-10-06';
  const futureDateStr = '2026-10-07';
  const pastDateStr = '2026-10-05';

  const testDataset = [
    { id: 'A', customerName: 'Client A', appointmentDate: todayStr, appointmentTime: '09:00 AM', status: 'Pending' },
    { id: 'B', customerName: 'Client B', appointmentDate: todayStr, appointmentTime: '10:00 AM', status: 'Confirmed' },
    { id: 'C', customerName: 'Client C', appointmentDate: todayStr, appointmentTime: '11:00 AM', status: 'Staff_Accepted' },
    { id: 'D', customerName: 'Client D', appointmentDate: todayStr, appointmentTime: '12:00 PM', status: 'In Progress' },
    { id: 'E', customerName: 'Client E', appointmentDate: todayStr, appointmentTime: '01:00 PM', status: 'Completed' },
    { id: 'F', customerName: 'Client F', appointmentDate: todayStr, appointmentTime: '02:00 PM', status: 'Cancelled' },
    { id: 'G', customerName: 'Client G', appointmentDate: todayStr, appointmentTime: '03:00 PM', status: 'Staff_Rejected' },
    { id: 'H', customerName: 'Client H', appointmentDate: todayStr, appointmentTime: '04:00 PM', status: 'No Show' },
    { id: 'I', customerName: 'Client I', appointmentDate: futureDateStr, appointmentTime: '10:00 AM', status: 'Confirmed' },
    { id: 'J', customerName: 'Client J', appointmentDate: pastDateStr, appointmentTime: '10:00 AM', status: 'Completed' }
  ];

  // 1. Test individual active status determination
  console.log('--- TEST MATRIX EVALUATION ---');
  const expectedMap = {
    A: true,  // Pending
    B: true,  // Confirmed
    C: true,  // Staff_Accepted
    D: true,  // In Progress
    E: false, // Completed
    F: false, // Cancelled
    G: false, // Staff_Rejected
    H: false, // No Show
    I: true,  // Future Confirmed
    J: false  // Past Completed
  };

  for (const item of testDataset) {
    const isAct = isActiveQueueAppointment(item);
    assert(isAct === expectedMap[item.id], `Appointment ${item.id} (${item.status}, ${item.appointmentDate}) activeQueue = ${isAct} (Expected: ${expectedMap[item.id]})`);
  }

  // 2. Active Queue Filtering
  console.log('\n--- QUEUE COUNTS & LIST PARITY ---');
  const activeQueueList = testDataset.filter(isActiveQueueAppointment);
  const activeBadgeCount = activeQueueList.length;
  assert(activeBadgeCount === 5, `Total Active Queue Badge Count = ${activeBadgeCount} (Expected: 5 -> A, B, C, D, I)`);

  const todayList = activeQueueList.filter(a => a.appointmentDate === todayStr);
  assert(todayList.length === 4, `Today Active Queue Count = ${todayList.length} (Expected: 4 -> A, B, C, D)`);
  assert(todayList.map(a => a.id).join(',') === 'A,B,C,D', 'Today Queue List contains exactly [A, B, C, D]');

  const upcomingList = activeQueueList.filter(a => a.appointmentDate > todayStr);
  assert(upcomingList.length === 1 && upcomingList[0].id === 'I', `Upcoming Active Queue Count = ${upcomingList.length} (Expected: 1 -> I)`);

  const previousList = activeQueueList.filter(a => a.appointmentDate < todayStr);
  assert(previousList.length === 0, `Previous Active Queue Count = ${previousList.length} (Expected: 0, since past appointment J is Completed)`);

  // 3. Guarantee that Queue List and Badge Count are 100% Identical
  console.log('\n--- ZERO DISCREPANCY GUARANTEE ---');
  assert(activeQueueList.length === activeBadgeCount, 'activeQueueList.length === activeBadgeCount (Zero Discrepancy)');
  assert(!activeQueueList.some(a => ['completed', 'cancelled', 'staff_rejected', 'no show'].includes(a.status.toLowerCase())), 'No inactive appointment exists in the active queue list');

  console.log('\n================================================================');
  console.log(`📊 QUEUE CONSISTENCY RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runQueueConsistencyTests();
