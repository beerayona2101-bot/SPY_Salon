const mongoose = require('mongoose');

const LandingSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main_landing_settings', unique: true },
  heroTitle: { 
    type: String, 
    default: 'Hairs make perfectly',
    trim: true,
    maxlength: [120, 'Hero headline cannot exceed 120 characters']
  },
  heroSubtitle: { 
    type: String, 
    default: 'Style come from the hair style',
    trim: true,
    maxlength: [300, 'Hero subtitle cannot exceed 300 characters']
  },
  announcement: { 
    type: String, 
    default: '✨ Festival Special: Enjoy 25% Off on All Luxury Bridal & Skin Care Packages! Use Code: LUXURY25',
    trim: true,
    maxlength: [250, 'Announcement ticker cannot exceed 250 characters']
  },
  announcementActive: { type: Boolean, default: true },
  hotlinePhone: { 
    type: String, 
    default: '+91 94906 44434',
    trim: true
  },
  supportEmail: { 
    type: String, 
    default: 'concierge@spysalon.com',
    trim: true,
    lowercase: true
  },
  openingHours: { 
    type: String, 
    default: 'Mon - Sun: 09:00 AM - 09:00 PM',
    trim: true
  },
  studioAddress: { 
    type: String, 
    default: 'Road No. 36, Opposite Metro Pillar 1650, Jubilee Hills, Hyderabad, Telangana 500033',
    trim: true
  },
  stat1Value: { type: String, default: '25,000+', trim: true },
  stat1Label: { type: String, default: 'Satisfied Clients', trim: true },
  stat2Value: { type: String, default: '45+', trim: true },
  stat2Label: { type: String, default: 'Master Stylists', trim: true },
  stat3Value: { type: String, default: 'Jubilee Hills', trim: true },
  stat3Label: { type: String, default: 'Luxury Studio', trim: true },
  stat4Value: { type: String, default: '4.9 ⭐', trim: true },
  stat4Label: { type: String, default: 'Google Rating', trim: true }
}, { timestamps: true });

module.exports = mongoose.model('LandingSettings', LandingSettingsSchema);
