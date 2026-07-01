const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'BookEase <onboarding@resend.dev>';

/**
 * Send welcome email after signup.
 */
const sendWelcomeEmail = async (user) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject: 'Welcome to BookEase! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
            .header { text-align: center; margin-bottom: 32px; }
            .logo { font-size: 28px; font-weight: 700; color: #818cf8; letter-spacing: -0.5px; }
            .card { background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            h1 { color: #f8fafc; font-size: 24px; margin: 0 0 12px 0; }
            p { color: #94a3b8; line-height: 1.6; margin: 0 0 16px 0; }
            .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 16px 0; }
            .footer { text-align: center; color: #64748b; font-size: 13px; margin-top: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📅 BookEase</div>
            </div>
            <div class="card">
              <h1>Welcome, ${user.name}! 👋</h1>
              <p>Thanks for joining BookEase. Your account has been created successfully.</p>
              <p>${user.role === 'owner'
                ? 'You can now set up your business profile, add services, and start accepting bookings from customers.'
                : 'You can now browse businesses, book appointments, and manage your schedule with ease.'
              }</p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="btn">
                Go to Dashboard →
              </a>
              <p style="margin-top: 24px;">If you have any questions, just reply to this email. We're here to help!</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} BookEase. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent:', data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Email service error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking confirmation email.
 */
const sendBookingConfirmation = async ({ user, business, service, appointment }) => {
  try {
    const startDate = new Date(appointment.start);
    const dateStr = startDate.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeStr = startDate.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject: `Booking Confirmed: ${service.name} ✅`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
            .header { text-align: center; margin-bottom: 32px; }
            .logo { font-size: 28px; font-weight: 700; color: #818cf8; letter-spacing: -0.5px; }
            .card { background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            h1 { color: #f8fafc; font-size: 24px; margin: 0 0 12px 0; }
            p { color: #94a3b8; line-height: 1.6; margin: 0 0 8px 0; }
            .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #334155; }
            .detail-label { color: #64748b; font-size: 14px; min-width: 100px; }
            .detail-value { color: #f1f5f9; font-weight: 500; }
            .highlight { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; padding: 16px; border-radius: 10px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; color: #64748b; font-size: 13px; margin-top: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📅 BookEase</div>
            </div>
            <div class="card">
              <h1>Booking Confirmed! ✅</h1>
              <p>Hi ${user.name}, your appointment has been confirmed.</p>
              <div class="highlight">
                <strong>${dateStr}</strong><br>
                <span style="font-size: 20px;">${timeStr}</span>
              </div>
              <div style="margin: 20px 0;">
                <div class="detail-row">
                  <span class="detail-label">Service</span>
                  <span class="detail-value">${service.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Business</span>
                  <span class="detail-value">${business.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration</span>
                  <span class="detail-value">${service.duration} minutes</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Price</span>
                  <span class="detail-value">₹${service.price}</span>
                </div>
              </div>
              <p style="color: #64748b; font-size: 13px; margin-top: 16px;">
                Need to make changes? Log in to your dashboard to reschedule or cancel.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} BookEase. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Booking confirmation email error:', error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Booking confirmation email error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send cancellation notification email.
 */
const sendCancellationEmail = async ({ user, business, service, appointment }) => {
  try {
    const startDate = new Date(appointment.start);
    const dateStr = startDate.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeStr = startDate.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject: `Booking Cancelled: ${service.name} ❌`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
            .header { text-align: center; margin-bottom: 32px; }
            .logo { font-size: 28px; font-weight: 700; color: #818cf8; letter-spacing: -0.5px; }
            .card { background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            h1 { color: #f8fafc; font-size: 24px; margin: 0 0 12px 0; }
            p { color: #94a3b8; line-height: 1.6; margin: 0 0 8px 0; }
            .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #334155; }
            .detail-label { color: #64748b; font-size: 14px; min-width: 100px; }
            .detail-value { color: #f1f5f9; font-weight: 500; }
            .cancelled-badge { background: rgba(239, 68, 68, 0.15); color: #fb7185; padding: 16px; border-radius: 10px; text-align: center; margin: 20px 0; border: 1px solid rgba(239, 68, 68, 0.2); }
            .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 16px 0; }
            .footer { text-align: center; color: #64748b; font-size: 13px; margin-top: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📅 BookEase</div>
            </div>
            <div class="card">
              <h1>Booking Cancelled ❌</h1>
              <p>Hi ${user.name}, your appointment has been cancelled.</p>
              <div class="cancelled-badge">
                <strong>${dateStr}</strong><br>
                <span style="font-size: 20px;">${timeStr}</span>
              </div>
              <div style="margin: 20px 0;">
                <div class="detail-row">
                  <span class="detail-label">Service</span>
                  <span class="detail-value">${service.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Business</span>
                  <span class="detail-value">${business.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status</span>
                  <span class="detail-value" style="color: #fb7185;">Cancelled</span>
                </div>
              </div>
              <p style="margin-top: 16px;">You can always rebook by visiting the business page.</p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="btn">
                Go to Dashboard →
              </a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} BookEase. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Cancellation email error:', error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Cancellation email error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send reschedule notification email.
 */
const sendRescheduleEmail = async ({ user, business, service, appointment, oldStart, oldEnd }) => {
  try {
    const oldDate = new Date(oldStart).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const oldTime = new Date(oldStart).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });
    const newDate = new Date(appointment.start).toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const newTime = new Date(appointment.start).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject: `Booking Rescheduled: ${service.name} 🔄`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
            .header { text-align: center; margin-bottom: 32px; }
            .logo { font-size: 28px; font-weight: 700; color: #818cf8; letter-spacing: -0.5px; }
            .card { background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            h1 { color: #f8fafc; font-size: 24px; margin: 0 0 12px 0; }
            p { color: #94a3b8; line-height: 1.6; margin: 0 0 8px 0; }
            .old-time { background: rgba(239, 68, 68, 0.1); color: #fca5a5; padding: 12px 16px; border-radius: 10px; text-align: center; margin: 12px 0; border: 1px solid rgba(239, 68, 68, 0.15); text-decoration: line-through; }
            .new-time { background: rgba(34, 197, 94, 0.1); color: #86efac; padding: 16px; border-radius: 10px; text-align: center; margin: 12px 0; border: 1px solid rgba(34, 197, 94, 0.15); }
            .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #334155; }
            .detail-label { color: #64748b; font-size: 14px; min-width: 100px; }
            .detail-value { color: #f1f5f9; font-weight: 500; }
            .footer { text-align: center; color: #64748b; font-size: 13px; margin-top: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📅 BookEase</div>
            </div>
            <div class="card">
              <h1>Booking Rescheduled 🔄</h1>
              <p>Hi ${user.name}, your appointment has been rescheduled.</p>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Previous time:</p>
              <div class="old-time">
                <strong>${oldDate}</strong> at ${oldTime}
              </div>
              <p style="color: #64748b; font-size: 13px; margin-top: 12px;">New time:</p>
              <div class="new-time">
                <strong>${newDate}</strong><br>
                <span style="font-size: 20px;">${newTime}</span>
              </div>
              <div style="margin: 20px 0;">
                <div class="detail-row">
                  <span class="detail-label">Service</span>
                  <span class="detail-value">${service.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Business</span>
                  <span class="detail-value">${business.name}</span>
                </div>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} BookEase. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Reschedule email error:', error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Reschedule email error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send appointment reminder email (24h before).
 */
const sendReminderEmail = async ({ user, business, service, appointment }) => {
  try {
    const startDate = new Date(appointment.start);
    const dateStr = startDate.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeStr = startDate.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit',
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [user.email],
      subject: `Reminder: ${service.name} Tomorrow ⏰`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
            .header { text-align: center; margin-bottom: 32px; }
            .logo { font-size: 28px; font-weight: 700; color: #818cf8; letter-spacing: -0.5px; }
            .card { background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }
            h1 { color: #f8fafc; font-size: 24px; margin: 0 0 12px 0; }
            p { color: #94a3b8; line-height: 1.6; margin: 0 0 8px 0; }
            .highlight { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; padding: 16px; border-radius: 10px; text-align: center; margin: 20px 0; }
            .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #334155; }
            .detail-label { color: #64748b; font-size: 14px; min-width: 100px; }
            .detail-value { color: #f1f5f9; font-weight: 500; }
            .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 16px 0; }
            .footer { text-align: center; color: #64748b; font-size: 13px; margin-top: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📅 BookEase</div>
            </div>
            <div class="card">
              <h1>Appointment Reminder ⏰</h1>
              <p>Hi ${user.name}, this is a friendly reminder about your upcoming appointment.</p>
              <div class="highlight">
                <strong>${dateStr}</strong><br>
                <span style="font-size: 20px;">${timeStr}</span>
              </div>
              <div style="margin: 20px 0;">
                <div class="detail-row">
                  <span class="detail-label">Service</span>
                  <span class="detail-value">${service.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Business</span>
                  <span class="detail-value">${business.name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Duration</span>
                  <span class="detail-value">${service.duration} minutes</span>
                </div>
              </div>
              <p style="margin-top: 16px;">Need to make changes? Log in to reschedule or cancel.</p>
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" class="btn">
                Go to Dashboard →
              </a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} BookEase. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Reminder email error:', error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error('Reminder email error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendBookingConfirmation,
  sendCancellationEmail,
  sendRescheduleEmail,
  sendReminderEmail,
};
