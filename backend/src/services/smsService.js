/**
 * Fast2SMS Gateway Integration Service for SPY Salon
 * Sends real 6-digit SMS OTPs to Indian mobile numbers (+91).
 */
const https = require('https');

class SmsService {
  /**
   * Cleans mobile number input to a 10-digit Indian mobile number string
   */
  cleanPhoneNumber(phone) {
    if (!phone) return '';
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length > 10 && digits.startsWith('91')) {
      digits = digits.substring(2);
    }
    if (digits.length > 10 && digits.startsWith('0')) {
      digits = digits.substring(1);
    }
    return digits;
  }

  /**
   * Helper HTTPS POST request runner for Fast2SMS
   */
  _requestFast2SMS(apiKey, payload) {
    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'www.fast2sms.com',
      port: 443,
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            resolve(parsed);
          } catch (e) {
            resolve({ return: false, message: 'Invalid JSON response from Fast2SMS' });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ return: false, message: err.message });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Dispatch 6-digit OTP SMS via Fast2SMS Gateway API
   */
  async sendOtpSms(phone, otp) {
    const mobileNumber = this.cleanPhoneNumber(phone);
    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!mobileNumber || mobileNumber.length !== 10) {
      console.warn(`[smsService] Invalid 10-digit mobile number for SMS dispatch: ${phone}`);
      return { success: false, message: 'Invalid 10-digit mobile number' };
    }

    if (!apiKey) {
      console.log(`\n==================================================`);
      console.log(`[SMS Gateway (Dev Mode)] Target Phone: +91 ${mobileNumber}`);
      console.log(`[SMS Gateway (Dev Mode)] 6-Digit OTP Code: [ ${otp} ]`);
      console.log(`[SMS Gateway (Dev Mode)] Add FAST2SMS_API_KEY in backend/.env to send real SMS!`);
      console.log(`==================================================\n`);
      return {
        success: true,
        sent: false,
        message: `OTP logged to console. Add FAST2SMS_API_KEY in .env for real SMS.`
      };
    }

    console.log(`[smsService] Attempting Fast2SMS dispatch to +91 ${mobileNumber} with OTP [${otp}]...`);

    // 1. Try OTP route on bulkV2
    let resData = await this._requestFast2SMS(apiKey, {
      route: 'otp',
      variables_values: String(otp),
      numbers: mobileNumber
    });

    if (resData.return === true || resData.status_code === 200) {
      console.log(`[smsService] Fast2SMS OTP successfully dispatched to +91 ${mobileNumber}!`);
      return { success: true, sent: true, message: 'OTP sent to mobile via Fast2SMS' };
    }

    console.warn(`[smsService] Fast2SMS OTP route response:`, resData.message || resData);

    // 2. Fallback to Quick SMS route ('q') if OTP route requires template/DLT configuration
    console.log(`[smsService] Retrying Fast2SMS via Quick SMS route ('q')...`);
    resData = await this._requestFast2SMS(apiKey, {
      route: 'q',
      message: `Your SPY Salon verification OTP is: ${otp}. Valid for 10 minutes. Do not share.`,
      language: 'english',
      flash: 0,
      numbers: mobileNumber
    });

    if (resData.return === true || resData.status_code === 200) {
      console.log(`[smsService] Fast2SMS Quick SMS successfully dispatched to +91 ${mobileNumber}!`);
      return { success: true, sent: true, message: 'OTP sent to mobile via Fast2SMS' };
    }

    console.warn(`[smsService] Fast2SMS Quick SMS route response:`, resData.message || resData);
    
    // Always print OTP in server logs so testing is never blocked while Fast2SMS account is activated
    console.log(`\n==================================================`);
    console.log(`[Fast2SMS Gateway Status] Target Mobile: +91 ${mobileNumber}`);
    console.log(`[Fast2SMS Gateway Status] Generated OTP: [ ${otp} ]`);
    console.log(`[Fast2SMS Gateway Status] Gateway Note: ${resData.message || 'API route restricted'}`);
    console.log(`==================================================\n`);

    return {
      success: true,
      sent: false,
      message: resData.message || 'Fast2SMS dispatch pending account activation'
    };
  }
}

module.exports = new SmsService();
