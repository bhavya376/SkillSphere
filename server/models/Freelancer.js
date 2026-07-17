import mongoose from "mongoose";

const freelancerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    title: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    skills: [
      {
        type: String,
      },
    ],

    hourlyRate: {
      type: Number,
      default: 0,
    },

    weeklyRate: {
      type: Number,
      default: 0,
    },

    experience: {
      type: Number,
      default: 0,
    },

    location: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

freelancerSchema.post("init", function (doc) {
  if (doc.hourlyRate !== undefined && (doc.weeklyRate === undefined || doc.weeklyRate === 0)) {
    doc.weeklyRate = doc.hourlyRate;
  }
});

freelancerSchema.pre("save", function () {
  if (this.weeklyRate !== undefined) {
    this.hourlyRate = this.weeklyRate;
  }
});

const Freelancer = mongoose.model("Freelancer", freelancerSchema);

export default Freelancer;