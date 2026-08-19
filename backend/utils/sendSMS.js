const sendSMS = async ({ to, message }) => {
  if (!to || !message) return false;

  if (String(process.env.SMS_ENABLED).toLowerCase() !== "true") {
    return false;
  }

  console.log(`[SMS MOCK] To: ${to} | ${message}`);
  return true;
};

module.exports = sendSMS;
