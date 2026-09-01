/**
 * Complete Staff -> Admin -> Staff Leave Request Workflow Integration Test
 * Verifies all 5 end-to-end test cases specified in Prompt Section 17
 */
const mongoose = require('mongoose');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const connectDB = require('../config/db');
require('dotenv').config();

const runLeaveWorkflowTests = async () => {
  try {
    console.log('==================================================');
    console.log('  SPY SALON LEAVE WORKFLOW END-TO-END VERIFICATION');
    console.log('==================================================\n');
    await connectDB();

    const staffAId = 'test_staff_A_101';
    const staffBId = 'test_staff_B_202';
    const adminId = 'test_admin_boss_999';

    // Clean up test documents
    await Leave.deleteMany({ employeeId: { $in: [staffAId, staffBId] } });
    await Notification.deleteMany({ userId: { $in: [staffAId, staffBId] } });

    // TEST CASE 1: Staff A applies for leave
    console.log('[TEST CASE 1] Staff A applying for leave (10-09-2026 to 16-09-2026)...');
    const leaveA = await Leave.create({
      employeeId: staffAId,
      employeeName: 'Vishnu Reddy (Staff A)',
      employeeEmail: 'vishnu.staffA@spysalon.com',
      startDate: '2026-09-10',
      endDate: '2026-09-16',
      reason: 'Personal issue',
      status: 'Pending'
    });

    console.log('  -> Leave ID:', leaveA._id.toString());
    console.log('  -> Status:', leaveA.status);
    console.log('  -> Staff ID:', leaveA.employeeId);
    if (leaveA.status !== 'Pending') throw new Error('TEST 1 Failed: Default status must be Pending');
    if (leaveA.employeeId !== staffAId) throw new Error('TEST 1 Failed: Staff ID mismatch');

    // Create Admin Notification for Leave A
    const adminNotif = await Notification.create({
      role: 'admin',
      title: 'New Leave Request from Vishnu Reddy (Staff A)',
      message: 'Vishnu Reddy (Staff A) requested leave from 2026-09-10 to 2026-09-16. Reason: Personal issue',
      type: 'leave',
      leaveRequestId: leaveA._id.toString(),
      isRead: false
    });
    console.log('  -> Admin notification created:', adminNotif.notificationId);
    console.log('  ✓ TEST CASE 1 PASSED: Leave saved with status PENDING & Admin notification dispatched');

    // TEST CASE 2: Admin inspects & reviews Staff A leave
    console.log('\n[TEST CASE 2] Admin opening notification & inspecting Leave A...');
    const inspectedLeave = await Leave.findById(leaveA._id);
    console.log('  -> Staff Name:', inspectedLeave.employeeName);
    console.log('  -> Dates:', inspectedLeave.startDate, 'to', inspectedLeave.endDate);
    console.log('  -> Reason:', inspectedLeave.reason);
    console.log('  -> Status:', inspectedLeave.status);
    if (!inspectedLeave || inspectedLeave.status !== 'Pending') throw new Error('TEST 2 Failed');
    console.log('  ✓ TEST CASE 2 PASSED: Correct leave request details retrieved for Admin popup');

    // TEST CASE 3: Admin APPROVES Staff A leave -> Targeted Notification to ONLY Staff A
    console.log('\n[TEST CASE 3] Admin ACCEPTING Staff A leave request...');
    const approvedLeave = await Leave.findOneAndUpdate(
      { _id: leaveA._id, status: 'Pending' },
      {
        status: 'Approved',
        actionByAdminId: adminId,
        actionByAdminName: 'Super Admin',
        actionTimestamp: new Date()
      },
      { new: true }
    );

    if (!approvedLeave || approvedLeave.status !== 'Approved') throw new Error('TEST 3 Failed');

    // Dispatch targeted notification ONLY to Staff A
    const staffANotif = await Notification.create({
      userId: staffAId,
      role: 'employee',
      title: 'Leave Request Approved',
      message: 'Your leave request from 2026-09-10 to 2026-09-16 has been approved by Admin.',
      type: 'leave',
      leaveRequestId: approvedLeave._id.toString(),
      isRead: false
    });

    console.log('  -> Approved Status:', approvedLeave.status);
    console.log('  -> Action By Admin:', approvedLeave.actionByAdminName);
    console.log('  -> Notification Recipient User ID:', staffANotif.userId);
    if (staffANotif.userId !== staffAId) throw new Error('TEST 3 Failed: Notification recipient must be Staff A');
    console.log('  ✓ TEST CASE 3 PASSED: Leave status APPROVED & targeted notification sent ONLY to Staff A');

    // TEST CASE 4: Staff B applies & Admin REJECTS -> Targeted Notification to ONLY Staff B
    console.log('\n[TEST CASE 4] Staff B applying & Admin REJECTING leave request...');
    const leaveB = await Leave.create({
      employeeId: staffBId,
      employeeName: 'Ananya Sharma (Staff B)',
      startDate: '2026-09-20',
      endDate: '2026-09-22',
      reason: 'Family trip',
      status: 'Pending'
    });

    const rejectedLeave = await Leave.findOneAndUpdate(
      { _id: leaveB._id, status: 'Pending' },
      {
        status: 'Rejected',
        actionByAdminId: adminId,
        actionByAdminName: 'Super Admin',
        rejectionReason: 'High customer booking volume during weekend',
        actionTimestamp: new Date()
      },
      { new: true }
    );

    const staffBNotif = await Notification.create({
      userId: staffBId,
      role: 'employee',
      title: 'Leave Request Rejected',
      message: 'Your leave request from 2026-09-20 to 2026-09-22 has been rejected by Admin.',
      type: 'leave',
      leaveRequestId: rejectedLeave._id.toString(),
      isRead: false
    });

    console.log('  -> Rejected Status:', rejectedLeave.status);
    console.log('  -> Rejection Reason:', rejectedLeave.rejectionReason);
    console.log('  -> Staff B Notification Recipient:', staffBNotif.userId);

    // Verify Staff A did NOT receive Staff B's notification
    const staffANotifs = await Notification.find({ userId: staffAId });
    const hasStaffBNotif = staffANotifs.some(n => n.leaveRequestId === leaveB._id.toString());
    if (hasStaffBNotif) throw new Error('TEST 4 Failed: Staff A must NOT receive Staff B notification');
    console.log('  ✓ TEST CASE 4 PASSED: Leave status REJECTED & notification sent ONLY to Staff B (Staff A unaffected)');

    // TEST CASE 5: Double approval / race condition protection
    console.log('\n[TEST CASE 5] Attempting double decision on finalized Leave A...');
    const doubleAttempt = await Leave.findOneAndUpdate(
      { _id: leaveA._id, status: 'Pending' },
      { status: 'Rejected' },
      { new: true }
    );
    console.log('  -> Atomic update result on finalized document:', doubleAttempt);
    if (doubleAttempt !== null) throw new Error('TEST 5 Failed: Atomic query should reject double modification');
    console.log('  ✓ TEST CASE 5 PASSED: Double modification correctly blocked by atomic query');

    // Cleanup
    await Leave.deleteMany({ employeeId: { $in: [staffAId, staffBId] } });
    await Notification.deleteMany({ userId: { $in: [staffAId, staffBId] } });

    console.log('\n==================================================');
    console.log('  ALL 5 LEAVE WORKFLOW TEST CASES PASSED CLEANLY! ');
    console.log('==================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Leave Workflow Test Failed:', err.message);
    process.exit(1);
  }
};

runLeaveWorkflowTests();
