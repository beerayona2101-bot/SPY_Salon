export const TERMS_VERSION = '1.0';
export const PRIVACY_VERSION = '1.0';
export const LAST_UPDATED = 'September 28, 2026';

export const LEGAL_PLACEHOLDERS = {
  businessName: '[LEGAL BUSINESS NAME]',
  businessAddress: '[BUSINESS ADDRESS]',
  contactEmail: '[CONTACT EMAIL]',
  contactPhone: '[CONTACT PHONE]',
  websiteUrl: '[WEBSITE URL]'
};

export interface LegalSection {
  id: string;
  number: number;
  title: string;
  content: string[];
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: 'introduction',
    number: 1,
    title: 'Introduction',
    content: [
      `Welcome to SPY Salon. These Terms & Conditions ("Terms") govern your use of the SPY Salon web application, mobile applications, services, and physical salon studio experiences provided by ${LEGAL_PLACEHOLDERS.businessName} ("SPY Salon", "we", "us", or "our").`,
      `By creating an account, accessing our applications, or booking services with SPY Salon, you explicitly agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please do not access or use our platform or services.`
    ]
  },
  {
    id: 'acceptance-of-terms',
    number: 2,
    title: 'Acceptance of Terms',
    content: [
      'By clicking "I agree", registering for an account, or scheduling an appointment, you acknowledge that you have read, understood, and agreed to these Terms in full.',
      'We reserve the right to modify or update these Terms at any time. Continued use of SPY Salon after any changes indicates your acceptance of the revised Terms.'
    ]
  },
  {
    id: 'eligibility',
    number: 3,
    title: 'Eligibility',
    content: [
      'You must be at least 18 years old or the legal age of majority in your jurisdiction to create an account and book appointments independently.',
      'Minors under 18 years of age may receive services only with the express consent and accompaniment of a parent or legal guardian.'
    ]
  },
  {
    id: 'account-registration',
    number: 4,
    title: 'Account Registration',
    content: [
      'To access appointment booking and member privileges, you must register for an account by providing accurate, complete, and updated information including your full name, email address, and mobile phone number.',
      'You agree not to create multiple accounts or register an account on behalf of someone else without authorization.'
    ]
  },
  {
    id: 'account-security',
    number: 5,
    title: 'Account Security',
    content: [
      'You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account.',
      'You must immediately notify SPY Salon support at ' + LEGAL_PLACEHOLDERS.contactEmail + ' if you suspect unauthorized access or security breaches involving your account.'
    ]
  },
  {
    id: 'salon-services',
    number: 6,
    title: 'Salon Services',
    content: [
      'SPY Salon offers professional hair styling, skincare rituals, nail care, grooming, spa treatments, and wellness consultations.',
      'Service descriptions, consultation notes, and treatment recommendations provided on the platform are for informational purposes. Results may vary depending on individual hair and skin conditions.'
    ]
  },
  {
    id: 'appointment-booking',
    number: 7,
    title: 'Appointment Booking',
    content: [
      'Appointments can be booked via our web portal, mobile application, or directly at our studio concierges.',
      'All bookings are subject to stylist availability, studio opening hours, and confirmation.'
    ]
  },
  {
    id: 'appointment-confirmation',
    number: 8,
    title: 'Appointment Confirmation',
    content: [
      'A booking is confirmed only when you receive an official confirmation notification via Email, SMS, WhatsApp, or Push Notification.',
      'Please review your appointment details carefully upon receipt.'
    ]
  },
  {
    id: 'appointment-cancellation',
    number: 9,
    title: 'Appointment Cancellation',
    content: [
      'Clients may cancel scheduled appointments up to 2 hours prior to the slot start time without incurring cancellation charges.',
      'Cancellations made within 2 hours of the slot start time may be subject to a late cancellation fee or loss of advance deposit.'
    ]
  },
  {
    id: 'rescheduling',
    number: 10,
    title: 'Rescheduling',
    content: [
      'Rescheduling request is permitted subject to availability if requested at least 2 hours before the scheduled appointment.',
      'We will make every reasonable effort to accommodate your requested new time slot.'
    ]
  },
  {
    id: 'no-show-late-arrival',
    number: 11,
    title: 'No-Show & Late Arrival Policy',
    content: [
      'A grace period of 15 minutes is allowed for late arrivals. Arriving more than 15 minutes late may result in a shortened service time or slot reassignment to avoid impacting subsequent client bookings.',
      'Failure to arrive without prior cancellation notice ("No-Show") may result in restriction of advance online booking privileges.'
    ]
  },
  {
    id: 'pricing-and-payments',
    number: 12,
    title: 'Service Pricing & Payments',
    content: [
      'All prices displayed on the platform are in local currency (INR) and are inclusive of applicable statutory taxes unless stated otherwise.',
      'We accept Cash, Credit/Debit Cards, UPI, Net Banking, and SPY Salon Membership Wallet Credits.',
      'Prices are subject to revision without prior individual notice, provided that confirmed bookings will be honored at the rate agreed upon at the time of booking.'
    ]
  },
  {
    id: 'refunds',
    number: 13,
    title: 'Refunds',
    content: [
      'Completed salon services are non-refundable. If you are dissatisfied with a service, please inform the salon manager before leaving the studio so we may remedy the experience.',
      'Approved monetary refunds for cancelled advance packages or store credit adjustments will be processed within 5-7 business days to the original payment source.'
    ]
  },
  {
    id: 'offers-and-promotions',
    number: 14,
    title: 'Offers & Promotions',
    content: [
      'Promotional coupon codes, referral benefits, and seasonal discounts are subject to specific validity periods, minimum spend requirements, and service inclusions.',
      'Promotional discounts cannot be combined with other ongoing offers or VIP membership tier discounts unless explicitly permitted.'
    ]
  },
  {
    id: 'user-responsibilities',
    number: 15,
    title: 'User Responsibilities',
    content: [
      'Clients must inform stylists and spa therapists of any pre-existing medical conditions, skin allergies, scalp sensitivities, or pregnancy prior to commencing treatment.',
      'Clients must treat salon staff, stylists, and fellow patrons with dignity and respect at all times.'
    ]
  },
  {
    id: 'salon-responsibilities',
    number: 16,
    title: 'Salon Responsibilities',
    content: [
      'SPY Salon commits to maintaining high standards of hygiene, sanitation, tool sterilization, and professional beauty care.',
      'We deploy certified beauty specialists and use tested, high-grade salon products.'
    ]
  },
  {
    id: 'prohibited-activities',
    number: 17,
    title: 'Prohibited Activities',
    content: [
      'Users shall not use the platform for fraudulent bookings, harassing staff, attempting unauthorized backend access, or tampering with system security.',
      'Any abuse of the system will result in immediate account termination and legal action.'
    ]
  },
  {
    id: 'intellectual-property',
    number: 18,
    title: 'Intellectual Property',
    content: [
      'All content, branding, logos, graphics, app interface designs, software code, and lookbooks are the exclusive property of ' + LEGAL_PLACEHOLDERS.businessName + '.',
      'Unauthorized reproduction, redistribution, or commercial exploitation is strictly prohibited.'
    ]
  },
  {
    id: 'third-party-services',
    number: 19,
    title: 'Third-Party Services',
    content: [
      'Our application integrates secure payment gateways (e.g., Razorpay/UPI), SMS aggregators, and notification systems.',
      'Third-party services operate under their respective terms and privacy policies.'
    ]
  },
  {
    id: 'communication-and-notifications',
    number: 20,
    title: 'Communication & Notifications',
    content: [
      'By creating an account, you consent to receive transaction alerts, booking updates, OTP security messages, and promotional notifications via Email, SMS, WhatsApp, and Push Notifications.',
      'You can adjust promotional preferences anytime in your Profile Settings.'
    ]
  },
  {
    id: 'privacy',
    number: 21,
    title: 'Privacy',
    content: [
      'Your personal data is handled in accordance with our Privacy Policy. By agreeing to these Terms, you consent to data collection and usage practices described therein.'
    ]
  },
  {
    id: 'limitation-of-liability',
    number: 22,
    title: 'Limitation of Liability',
    content: [
      'To the maximum extent permitted by applicable law, SPY Salon and its directors, employees, or affiliates shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the platform or salon services.',
      'Our total aggregate liability for any direct claims shall not exceed the amount paid by you for the specific service in dispute.'
    ]
  },
  {
    id: 'service-availability',
    number: 23,
    title: 'Service Availability',
    content: [
      'We strive to maintain 99.9% application uptime, but we do not guarantee uninterrupted operational availability due to server maintenance, updates, or technical outages.'
    ]
  },
  {
    id: 'account-suspension-termination',
    number: 24,
    title: 'Account Suspension or Termination',
    content: [
      'We reserve the right to suspend or terminate your account and block access to our booking systems if you breach these Terms or engage in fraudulent activity.'
    ]
  },
  {
    id: 'changes-to-terms',
    number: 25,
    title: 'Changes to Terms',
    content: [
      'We may modify these Terms periodically. Updated versions will feature an updated "Last Updated" date at the top of the policy page.'
    ]
  },
  {
    id: 'governing-law',
    number: 26,
    title: 'Governing Law',
    content: [
      'These Terms are governed by and construed in accordance with the laws of India. Any legal proceedings shall be subject to the exclusive jurisdiction of courts located in [GOVERNING CITY/JURISDICTION].'
    ]
  },
  {
    id: 'contact-information',
    number: 27,
    title: 'Contact Information',
    content: [
      'If you have any questions or legal inquiries regarding these Terms & Conditions, please contact us:',
      `Legal Name: ${LEGAL_PLACEHOLDERS.businessName}`,
      `Address: ${LEGAL_PLACEHOLDERS.businessAddress}`,
      `Email: ${LEGAL_PLACEHOLDERS.contactEmail}`,
      `Phone: ${LEGAL_PLACEHOLDERS.contactPhone}`,
      `Website: ${LEGAL_PLACEHOLDERS.websiteUrl}`
    ]
  }
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'introduction',
    number: 1,
    title: 'Introduction',
    content: [
      `SPY Salon ("we", "us", or "our"), operated by ${LEGAL_PLACEHOLDERS.businessName}, is committed to protecting your personal privacy.`,
      `This Privacy Policy explains what personal information we collect through our web application (${LEGAL_PLACEHOLDERS.websiteUrl}) and mobile applications, how we use, store, and safeguard it, and your legal rights regarding your data.`
    ]
  },
  {
    id: 'information-we-collect',
    number: 2,
    title: 'Information We Collect',
    content: [
      'We collect personal data necessary to provide salon booking services, personalize treatments, manage memberships, and maintain platform security.',
      'We collect data directly when you register an account, book appointments, update your profile, or interact with our concierges.'
    ]
  },
  {
    id: 'account-information',
    number: 3,
    title: 'Account Information',
    content: [
      'When you create an account, we collect your full name, email address, mobile phone number, and account password.',
      'Passwords are encrypted using industry-standard salted bcrypt hashing before storage and are never visible in plain text.'
    ]
  },
  {
    id: 'contact-information',
    number: 4,
    title: 'Contact Information',
    content: [
      'Your email address and phone number are collected to deliver appointment confirmations, OTP verification codes, billing invoices, and emergency service updates.'
    ]
  },
  {
    id: 'booking-and-appointment-information',
    number: 5,
    title: 'Booking & Appointment Information',
    content: [
      'We collect records of your requested services, appointment dates and times, preferred stylists or therapists, selected branch studio, booking status, and specific treatment notes.'
    ]
  },
  {
    id: 'profile-information',
    number: 6,
    title: 'Profile Information',
    content: [
      'You may voluntarily provide optional profile information such as gender, date of birth, anniversary date, physical address, emergency contact details, preferred language, and notification preferences to receive customized birthday/anniversary offers and tailored salon care.'
    ]
  },
  {
    id: 'payment-information',
    number: 7,
    title: 'Payment Information',
    content: [
      'When you make online payments or buy membership packages, transaction amounts, payment method types (Card, UPI, Wallet, Cash), and payment IDs are recorded.',
      'Financial credentials (such as full credit card numbers or UPI PINs) are processed directly by PCI-DSS compliant payment gateways and are never stored on SPY Salon servers.'
    ]
  },
  {
    id: 'device-information',
    number: 8,
    title: 'Device Information',
    content: [
      'When you access SPY Salon, our system automatically collects technical metadata including your IP address, browser type, operating system version, and device type (Desktop, Mobile, Tablet) for session security and audit logging.'
    ]
  },
  {
    id: 'location-information',
    number: 9,
    title: 'Location Information',
    content: [
      'SPY Salon DOES NOT perform continuous background GPS tracking.',
      'We use studio address selection and optional browser/device location inputs solely to help you find nearby SPY Salon branches and provide turn-by-turn directions to our studio.'
    ]
  },
  {
    id: 'notification-information',
    number: 10,
    title: 'Notification Information',
    content: [
      'We store your notification delivery preferences (Email alerts, SMS, WhatsApp alerts, and promotional offer subscriptions).'
    ]
  },
  {
    id: 'firebase-push-data',
    number: 11,
    title: 'Firebase / Push Notification Data',
    content: [
      'On mobile devices, we register a unique Firebase Cloud Messaging (FCM) device token to send real-time push notifications regarding appointment status changes, reminders, and exclusive member deals.',
      'You can disable push notifications anytime via your mobile OS application settings.'
    ]
  },
  {
    id: 'how-we-use-information',
    number: 12,
    title: 'How We Use Information',
    content: [
      'We use collected data to:',
      '• Schedule, confirm, and fulfill your salon treatments and appointments.',
      '• Authenticate your identity and secure your account access.',
      '• Process billing transactions and issue digital receipts.',
      '• Manage VIP membership tiers, wallet balances, and package redemptions.',
      '• Provide customer support and address service inquiries.',
      '• Send promotional updates and birthday offers (where opted in).',
      '• Detect and prevent fraudulent activities and protect platform integrity.'
    ]
  },
  {
    id: 'how-we-share-information',
    number: 13,
    title: 'How We Share Information',
    content: [
      'WE DO NOT SELL, RENT, OR TRADE YOUR PERSONAL DATA TO THIRD PARTIES.',
      'We share information only with authorized service providers under strict confidentiality agreements, or when legally mandated by government or law enforcement authorities.'
    ]
  },
  {
    id: 'service-providers',
    number: 14,
    title: 'Service Providers',
    content: [
      'We work with trusted third-party cloud infrastructure providers (MongoDB Atlas, AWS), email delivery services (Nodemailer/SendGrid), SMS gateways, and payment processors to operate our platform securely.'
    ]
  },
  {
    id: 'data-storage-and-security',
    number: 15,
    title: 'Data Storage & Security',
    content: [
      'Your data is encrypted in transit using SSL/TLS encryption protocols and encrypted at rest in secure database clusters.',
      'We enforce access control policies so only authorized salon staff and system administrators can view booking details relevant to providing your service.'
    ]
  },
  {
    id: 'data-retention',
    number: 16,
    title: 'Data Retention',
    content: [
      'We retain your account details and appointment history as long as your account remains active or as required for tax, legal, and accounting compliance.'
    ]
  },
  {
    id: 'user-rights',
    number: 17,
    title: 'User Rights',
    content: [
      'You have the right to:',
      '• Access and review your personal profile data.',
      '• Request correction of inaccurate information.',
      '• Opt out of promotional communications at any time.',
      '• Request account deactivation or deletion.'
    ]
  },
  {
    id: 'account-deletion',
    number: 18,
    title: 'Account Deletion',
    content: [
      `To request full account deletion, contact our support team at ${LEGAL_PLACEHOLDERS.contactEmail}. Upon verification, your account credentials and personal data will be permanently removed or anonymized within 30 days, subject to statutory record-retention requirements.`
    ]
  },
  {
    id: 'cookies-and-similar-technologies',
    number: 19,
    title: 'Cookies & Similar Technologies (Web)',
    content: [
      'On our web application, we use browser local storage and essential session cookies strictly necessary to maintain your logged-in authentication state and theme preferences.',
      'We do not use invasive third-party tracking cookies.'
    ]
  },
  {
    id: 'analytics',
    number: 20,
    title: 'Analytics',
    content: [
      'We analyze aggregated, non-personally identifiable app usage patterns to improve booking speeds, layout usability, and server performance.'
    ]
  },
  {
    id: 'childrens-privacy',
    number: 21,
    title: 'Children\'s Privacy',
    content: [
      'Our platform is not directed at children under the age of 13. We do not knowingly collect personal information from children without parental consent.'
    ]
  },
  {
    id: 'third-party-links',
    number: 22,
    title: 'Third-Party Links',
    content: [
      'Our web and mobile apps may contain links to social media channels (Instagram, Facebook, YouTube). We are not responsible for the privacy practices of external third-party websites.'
    ]
  },
  {
    id: 'changes-to-privacy-policy',
    number: 23,
    title: 'Changes to Privacy Policy',
    content: [
      'We may update this Privacy Policy from time to time. Significant changes will be announced via app notice or email.'
    ]
  },
  {
    id: 'contact-us',
    number: 24,
    title: 'Contact Us',
    content: [
      'If you have questions, privacy concerns, or data protection requests, please contact our Privacy Officer:',
      `Legal Name: ${LEGAL_PLACEHOLDERS.businessName}`,
      `Address: ${LEGAL_PLACEHOLDERS.businessAddress}`,
      `Email: ${LEGAL_PLACEHOLDERS.contactEmail}`,
      `Phone: ${LEGAL_PLACEHOLDERS.contactPhone}`,
      `Website: ${LEGAL_PLACEHOLDERS.websiteUrl}`
    ]
  }
];
