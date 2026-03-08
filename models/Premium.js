const mongoose = require("mongoose");

const premiumSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true
    },

    plan: {
      type: String,
      default: "weekly"
    },

    isActive: {
      type: Boolean,
      default: false
    },

    startsAt: {
      type: Date,
      default: null
    },

    expiresAt: {
      type: Date,
      default: null
    },

    activatedBy: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Premium ||
  mongoose.model("Premium", premiumSchema);
