const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendReminderEmail } = require('../services/emailService');

/**
 * Reminder Cron Job
 * Runs every hour to check for appointments starting in ~24 hours.
 * Sends reminder emails and marks them as sent to prevent duplicates.
 */
const startReminderJob = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // Find confirmed appointments starting in 23–25 hours that haven't been reminded
      const upcomingAppointments = await Appointment.find({
        status: 'confirmed',
        reminderSent: false,
        start: { $gte: in23h, $lte: in25h },
      })
        .populate('businessId', 'name timezone')
        .populate('serviceId', 'name duration price')
        .populate('customerId', 'name email');

      if (upcomingAppointments.length === 0) return;

      console.log(`⏰ Sending ${upcomingAppointments.length} reminder email(s)...`);

      for (const appointment of upcomingAppointments) {
        try {
          // Skip if customer has email notifications disabled
          const customer = await User.findById(appointment.customerId._id);
          if (!customer || customer.emailNotifications === false) {
            // Still mark as sent so we don't re-process
            appointment.reminderSent = true;
            await appointment.save();
            continue;
          }

          await sendReminderEmail({
            user: customer,
            business: appointment.businessId,
            service: appointment.serviceId,
            appointment,
          });

          // Mark reminder as sent
          appointment.reminderSent = true;
          await appointment.save();

          console.log(`  ✓ Reminder sent for appointment ${appointment._id}`);
        } catch (err) {
          console.error(`  ✗ Failed to send reminder for ${appointment._id}:`, err.message);
        }
      }
    } catch (error) {
      console.error('Reminder cron job error:', error.message);
    }
  });

  console.log('  ⏰ Reminder cron job scheduled (runs every hour)');
};

module.exports = { startReminderJob };
