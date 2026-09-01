/**
 * Production-Grade Contact Service for SPY Salon Enterprise
 * Handles multi-channel customer contacts (Phone, WhatsApp, SMS, Email, Messenger),
 * status state transitions (New -> Contacted), and activity logging.
 */

import { API_BASE_URL } from '@/lib/api';

export interface QuickContactEnquiry {
  _id?: string;
  enquiryId: string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  serviceName?: string;
  message?: string;
  status: 'New' | 'Contacted' | 'In Progress' | 'Resolved' | 'Closed';
  messengerUrl?: string;
  createdAt?: string;
}

export interface AdminUser {
  name?: string;
  email?: string;
  role?: string;
}

export type ContactMethod = 'Phone Call' | 'WhatsApp' | 'Email' | 'SMS' | 'Messenger';

export interface ContactActionResult {
  success: boolean;
  method: ContactMethod;
  statusUpdated: boolean;
  newStatus?: string;
  error?: string;
}

export interface ContactServiceOptions {
  onStatusUpdate?: (newStatus: string) => void;
  onActivityLog?: (log: any) => void;
  onError?: (errorMessage: string) => void;
}

class ContactService {
  /**
   * Format Phone Number into clean E.164 string (+91XXXXXXXXXX or clean digits)
   */
  public formatPhoneNumber(phone?: string): string {
    if (!phone) return '';
    let cleaned = String(phone).replace(/[^0-9]/g, '');
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    return cleaned ? `+${cleaned}` : '';
  }

  /**
   * Automatically update Lead Status ONLY if current status is 'New'
   */
  public async handleAutoStatusUpdate(
    enquiry: QuickContactEnquiry,
    method: ContactMethod,
    adminUser?: AdminUser,
    options?: ContactServiceOptions
  ): Promise<boolean> {
    let statusUpdated = false;

    // Only update if current status is 'New'
    if (enquiry.status === 'New') {
      try {
        await this.updateLeadStatus(enquiry.enquiryId, 'Contacted');
        enquiry.status = 'Contacted';
        statusUpdated = true;
        if (options?.onStatusUpdate) {
          options.onStatusUpdate('Contacted');
        }
      } catch (err: any) {
        console.warn(`[ContactService] Failed to auto-update enquiry status to Contacted:`, err.message);
      }
    }

    // Always log activity log
    try {
      const logEntry = await this.createActivityLog({
        action: `Admin contacted customer via ${method}`,
        details: `Admin ${adminUser?.name || 'Executive'} contacted ${enquiry.name} via ${method}. (Enquiry #${enquiry.enquiryId})`,
        adminName: adminUser?.name || 'Admin Executive',
        method,
        customerName: enquiry.name,
        enquiryId: enquiry.enquiryId,
        timestamp: new Date().toISOString()
      });
      if (options?.onActivityLog) {
        options.onActivityLog(logEntry);
      }
    } catch (logErr: any) {
      console.warn(`[ContactService] Failed to create activity log:`, logErr.message);
    }

    return statusUpdated;
  }

  /**
   * 1. Phone Call Action
   * Protocol: tel:+91XXXXXXXXXX
   */
  public async openPhone(
    enquiry: QuickContactEnquiry,
    adminUser?: AdminUser,
    options?: ContactServiceOptions
  ): Promise<ContactActionResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(enquiry.phone);
      if (!formattedPhone) {
        throw new Error('Customer phone number is unavailable');
      }

      const telUrl = `tel:${formattedPhone}`;
      window.location.href = telUrl;

      const statusUpdated = await this.handleAutoStatusUpdate(enquiry, 'Phone Call', adminUser, options);
      return { success: true, method: 'Phone Call', statusUpdated, newStatus: enquiry.status };
    } catch (err: any) {
      const errorMsg = err.message || 'Unable to open application.';
      if (options?.onError) options.onError(errorMsg);
      return { success: false, method: 'Phone Call', statusUpdated: false, error: errorMsg };
    }
  }

  /**
   * 2. WhatsApp Action
   * Protocol: https://wa.me/<phone>?text=<encoded message>
   */
  public async openWhatsApp(
    enquiry: QuickContactEnquiry,
    adminUser?: AdminUser,
    options?: ContactServiceOptions
  ): Promise<ContactActionResult> {
    try {
      const cleanedPhone = String(enquiry.phone || '').replace(/[^0-9]/g, '');
      if (!cleanedPhone || cleanedPhone.length < 10) {
        throw new Error('Customer WhatsApp phone number is unavailable');
      }

      const formattedNum = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;
      const serviceName = enquiry.service || enquiry.serviceName || 'General Enquiry';

      const defaultMsg = `Hi ${enquiry.name},

Thank you for contacting SPY Salon.

Regarding your enquiry about "${serviceName}", we would be happy to assist you.

Please let us know a convenient time to talk.

Regards,
SPY Salon`;

      const waUrl = `https://wa.me/${formattedNum}?text=${encodeURIComponent(defaultMsg)}`;
      window.open(waUrl, '_blank');

      const statusUpdated = await this.handleAutoStatusUpdate(enquiry, 'WhatsApp', adminUser, options);
      return { success: true, method: 'WhatsApp', statusUpdated, newStatus: enquiry.status };
    } catch (err: any) {
      const errorMsg = err.message || 'Unable to open application.';
      if (options?.onError) options.onError(errorMsg);
      return { success: false, method: 'WhatsApp', statusUpdated: false, error: errorMsg };
    }
  }

  /**
   * 3. SMS Action
   * Protocol: sms:+91XXXXXXXXXX?body=<encoded message>
   */
  public async openSMS(
    enquiry: QuickContactEnquiry,
    adminUser?: AdminUser,
    options?: ContactServiceOptions
  ): Promise<ContactActionResult> {
    try {
      const formattedPhone = this.formatPhoneNumber(enquiry.phone);
      if (!formattedPhone) {
        throw new Error('Customer phone number is unavailable for SMS');
      }

      const bodyText = `Hi ${enquiry.name}, Thank you for contacting SPY Salon.`;
      const smsUrl = `sms:${formattedPhone}?body=${encodeURIComponent(bodyText)}`;
      window.location.href = smsUrl;

      const statusUpdated = await this.handleAutoStatusUpdate(enquiry, 'SMS', adminUser, options);
      return { success: true, method: 'SMS', statusUpdated, newStatus: enquiry.status };
    } catch (err: any) {
      const errorMsg = err.message || 'Unable to open application.';
      if (options?.onError) options.onError(errorMsg);
      return { success: false, method: 'SMS', statusUpdated: false, error: errorMsg };
    }
  }

  /**
   * 4. Email Action
   * Protocol: mailto:customer@email.com?subject=...&body=...
   */
  public async openEmail(
    enquiry: QuickContactEnquiry,
    adminUser?: AdminUser,
    options?: ContactServiceOptions
  ): Promise<ContactActionResult> {
    try {
      if (!enquiry.email || !enquiry.email.trim()) {
        throw new Error('Customer email address is unavailable');
      }

      const subject = 'SPY Salon Enquiry';
      const body = `Hi ${enquiry.name},

Thank you for contacting SPY Salon.

We received your enquiry and our team will contact you shortly.

Regards,
SPY Salon`;

      const mailtoUrl = `mailto:${enquiry.email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;

      const statusUpdated = await this.handleAutoStatusUpdate(enquiry, 'Email', adminUser, options);
      return { success: true, method: 'Email', statusUpdated, newStatus: enquiry.status };
    } catch (err: any) {
      const errorMsg = err.message || 'Unable to open application.';
      if (options?.onError) options.onError(errorMsg);
      return { success: false, method: 'Email', statusUpdated: false, error: errorMsg };
    }
  }

  /**
   * 5. Messenger Action
   */
  public async openMessenger(
    enquiry: QuickContactEnquiry,
    adminUser?: AdminUser,
    options?: ContactServiceOptions
  ): Promise<ContactActionResult> {
    try {
      if (!enquiry.messengerUrl) {
        throw new Error('Messenger not available');
      }

      window.open(enquiry.messengerUrl, '_blank');

      const statusUpdated = await this.handleAutoStatusUpdate(enquiry, 'Messenger', adminUser, options);
      return { success: true, method: 'Messenger', statusUpdated, newStatus: enquiry.status };
    } catch (err: any) {
      const errorMsg = err.message || 'Messenger not available';
      if (options?.onError) options.onError(errorMsg);
      return { success: false, method: 'Messenger', statusUpdated: false, error: errorMsg };
    }
  }

  /**
   * Update Enquiry Lead Status on Backend API
   */
  public async updateLeadStatus(enquiryId: string, status: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/admin/enquiries/${enquiryId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return await res.json();
  }

  /**
   * Create Activity Log Entry on Backend API
   */
  public async createActivityLog(logData: {
    action: string;
    details: string;
    adminName: string;
    method: ContactMethod;
    customerName: string;
    enquiryId: string;
    timestamp: string;
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/activity-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: logData.action,
          details: logData.details,
          user: logData.adminName,
          method: logData.method,
          customerName: logData.customerName,
          enquiryId: logData.enquiryId
        })
      });
      return await res.json();
    } catch (err) {
      console.warn('[ContactService] Activity log API call skipped/fallback:', err);
      return { success: false };
    }
  }
}

export const contactService = new ContactService();
export default contactService;
