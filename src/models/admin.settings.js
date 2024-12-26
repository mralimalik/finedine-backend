import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  countries: {
    type: [String],
    default: []
  },
  settingsId: {
    type: String,
    default: "uniqueSettingsId"
  }
});

export const Settings = mongoose.model('Settings', settingsSchema);

