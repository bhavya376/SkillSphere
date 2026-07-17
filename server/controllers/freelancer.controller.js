import Freelancer from "../models/Freelancer.js";

export const createFreelancerProfile = async (req, res) => {
  const { title, bio, skills, weeklyRate, experience, location } = req.body;

  const existingProfile = await Freelancer.findOne({
    user: req.user._id,
  });

  if (existingProfile) {
    existingProfile.title = title || existingProfile.title;
    existingProfile.bio = bio || existingProfile.bio;
    existingProfile.skills = skills || existingProfile.skills;
    existingProfile.weeklyRate = weeklyRate !== undefined ? weeklyRate : existingProfile.weeklyRate;
    existingProfile.experience = experience !== undefined ? experience : existingProfile.experience;
    existingProfile.location = location || existingProfile.location;
    await existingProfile.save();
    return res.status(200).json({
      message: "Freelancer profile updated successfully",
      profile: existingProfile,
    });
  }

  const profile = await Freelancer.create({
    user: req.user._id,
    title,
    bio,
    skills,
    weeklyRate,
    experience,
    location,
  });
  return res.status(201).json({
    message: "Freelancer profile created successfully",
    profile,
  });
};

export const getFreelancerProfile = async (req, res) => {
  try {
    const profile = await Freelancer.findOne({ user: req.user._id }).populate("user", "name email avatar");
    if (!profile) {
      return res.status(404).json({ message: "Freelancer profile not found" });
    }
    return res.status(200).json({ success: true, profile });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getFreelancers = async (req, res) => {
  try {
    const freelancers = await Freelancer.find().populate("user", "name email avatar");
    return res.status(200).json({ success: true, freelancers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};