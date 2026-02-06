// backend/controllers/storyController.js
import Story from '../models/Story.js';
import User from '../models/User.js';
import Donate from '../models/DonateModel.js';
import { notifyStory, notifyAdmins } from '../utils/notificationHelper.js'; // ✅ ADD notifyAdmins

// Helper function to calculate statistics from database
const calculateStatistics = async () => {
  try {
    // 1. Calculate total funds raised from donations
    const donationResult = await Donate.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalFunds = donationResult.length > 0 ? donationResult[0].total : 0;
    
    // Format funds (convert to K format)
    let fundsRaised;
    if (totalFunds >= 1000000) {
      fundsRaised = `${(totalFunds / 1000000).toFixed(1)}M+`;
    } else if (totalFunds >= 1000) {
      fundsRaised = `${Math.floor(totalFunds / 1000)}K+`;
    } else {
      fundsRaised = `${totalFunds}+`;
    }

    // 2. Count students/staff involved (excluding regular users and admins)
    const studentCount = await User.countDocuments({ 
      role: { $in: ['staff'] } // Count only staff members as "students involved"
    });
    const studentsInvolved = `${studentCount}+`;

    // 3. Count unique donors/families helped
    // Using unique email addresses from donations as a proxy for families helped
    const uniqueDonors = await Donate.distinct('email');
    const familiesHelped = `${uniqueDonors.filter(email => email).length}+`; // Filter out null/undefined emails

    return {
      fundsRaised,
      studentsInvolved,
      familiesHelped
    };
  } catch (error) {
    console.error('Error calculating statistics:', error);
    // Return default values on error
    return {
      fundsRaised: '0+',
      studentsInvolved: '0+',
      familiesHelped: '0+'
    };
  }
};

// @desc    Get story data with auto-calculated statistics
// @route   GET /api/story
// @access  Public
export const getStory = async (req, res) => {
  try {
    const story = await Story.getSingleStory();
    
    // Auto-calculate statistics from database
    const calculatedStats = await calculateStatistics();
    
    // Update story with calculated statistics
    story.statistics = calculatedStats;
    await story.save();
    
    res.status(200).json(story);
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ 
      message: 'Error fetching story data', 
      error: error.message 
    });
  }
};

// @desc    Update statistics (manual override - optional)
// @route   PUT /api/story/statistics
// @access  Private/Admin
export const updateStatistics = async (req, res) => {
  try {
    const { statistics } = req.body;

    if (!statistics) {
      return res.status(400).json({ message: 'Statistics data is required' });
    }

    const story = await Story.getSingleStory();
    
    const oldStats = { ...story.statistics };
    
    story.statistics = {
      fundsRaised: statistics.fundsRaised || story.statistics.fundsRaised,
      studentsInvolved: statistics.studentsInvolved || story.statistics.studentsInvolved,
      familiesHelped: statistics.familiesHelped || story.statistics.familiesHelped
    };

    await story.save();

    // 🔔 NOTIFY ADMINS ABOUT MANUAL STATISTICS UPDATE
    try {
      const updatedBy = req.user?.name || 'Admin';
      await notifyAdmins({
        title: 'Story Statistics Updated',
        message: `${updatedBy} manually updated story statistics`,
        type: 'admin',
        link: '/admin/story'
      });
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    res.status(200).json({ 
      message: 'Statistics updated successfully', 
      statistics: story.statistics 
    });
  } catch (error) {
    console.error('Error updating statistics:', error);
    res.status(500).json({ 
      message: 'Error updating statistics', 
      error: error.message 
    });
  }
};

// @desc    Update mission and vision
// @route   PUT /api/story/mission-vision
// @access  Private/Admin
export const updateMissionVision = async (req, res) => {
  try {
    const { missionVision } = req.body;

    if (!missionVision) {
      return res.status(400).json({ message: 'Mission and vision data is required' });
    }

    const story = await Story.getSingleStory();

    if (missionVision.mission) {
      story.missionVision.mission = {
        text: missionVision.mission.text || story.missionVision.mission.text,
        features: missionVision.mission.features || story.missionVision.mission.features
      };
    }

    if (missionVision.vision) {
      story.missionVision.vision = {
        text: missionVision.vision.text || story.missionVision.vision.text,
        features: missionVision.vision.features || story.missionVision.vision.features
      };
    }

    await story.save();

    // 🔔 NOTIFY ADMINS
    try {
      const updatedBy = req.user?.name || 'Admin';
      await notifyAdmins({
        title: 'Mission & Vision Updated',
        message: `${updatedBy} updated the organization's mission and vision`,
        type: 'admin',
        link: '/admin/story'
      });
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    res.status(200).json({ 
      message: 'Mission and vision updated successfully', 
      missionVision: story.missionVision 
    });
  } catch (error) {
    console.error('Error updating mission and vision:', error);
    res.status(500).json({ 
      message: 'Error updating mission and vision', 
      error: error.message 
    });
  }
};

// @desc    Update milestones
// @route   PUT /api/story/milestones
// @access  Private/Admin
export const updateMilestones = async (req, res) => {
  try {
    const { milestones } = req.body;

    if (!milestones || !Array.isArray(milestones)) {
      return res.status(400).json({ message: 'Valid milestones array is required' });
    }

    const story = await Story.getSingleStory();
    const oldMilestoneCount = story.milestones.length;
    
    story.milestones = milestones;
    await story.save();

    // 🔔 SEND NOTIFICATIONS
    try {
      const updatedBy = req.user?.name || 'Admin';
      
      // Notify users if new milestone was added
      if (milestones.length > oldMilestoneCount) {
        const latestMilestone = milestones[milestones.length - 1];
        await notifyStory.posted(
          `New Milestone: ${latestMilestone.year || 'Recent Achievement'}`,
          story._id
        );
        console.log('🔔 Milestone update notifications sent to users');
      }
      
      // Always notify admins about milestone changes
      await notifyAdmins({
        title: 'Milestones Updated',
        message: `${updatedBy} updated organization milestones (${milestones.length} total)`,
        type: 'admin',
        link: '/admin/story'
      });
      
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    res.status(200).json({ 
      message: 'Milestones updated successfully', 
      milestones: story.milestones 
    });
  } catch (error) {
    console.error('Error updating milestones:', error);
    res.status(500).json({ 
      message: 'Error updating milestones', 
      error: error.message 
    });
  }
};

// @desc    Update values
// @route   PUT /api/story/values
// @access  Private/Admin
export const updateValues = async (req, res) => {
  try {
    const { values } = req.body;

    if (!values || !Array.isArray(values)) {
      return res.status(400).json({ message: 'Valid values array is required' });
    }

    const story = await Story.getSingleStory();
    story.values = values;
    await story.save();

    // 🔔 NOTIFY ADMINS
    try {
      const updatedBy = req.user?.name || 'Admin';
      await notifyAdmins({
        title: 'Organization Values Updated',
        message: `${updatedBy} updated core values (${values.length} values)`,
        type: 'admin',
        link: '/admin/story'
      });
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    res.status(200).json({ 
      message: 'Values updated successfully', 
      values: story.values 
    });
  } catch (error) {
    console.error('Error updating values:', error);
    res.status(500).json({ 
      message: 'Error updating values', 
      error: error.message 
    });
  }
};

// @desc    Update story text
// @route   PUT /api/story/story-text
// @access  Private/Admin
export const updateStoryText = async (req, res) => {
  try {
    const { storyText, notifyUsers = false } = req.body;

    if (!storyText) {
      return res.status(400).json({ message: 'Story text data is required' });
    }

    const story = await Story.getSingleStory();
    
    story.storyText = {
      paragraph1: storyText.paragraph1 || story.storyText.paragraph1,
      paragraph2: storyText.paragraph2 || story.storyText.paragraph2
    };

    await story.save();

    // 🔔 SEND NOTIFICATIONS
    try {
      const updatedBy = req.user?.name || 'Admin';
      
      // Notify users if admin chooses to
      if (notifyUsers) {
        await notifyStory.posted(
          "Our Story Has Been Updated",
          story._id
        );
        console.log('🔔 Story update notifications sent to users');
      }
      
      // Always notify admins
      await notifyAdmins({
        title: 'Story Text Updated',
        message: `${updatedBy} updated the story text${notifyUsers ? ' (users notified)' : ''}`,
        type: 'admin',
        link: '/admin/story'
      });
      
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    res.status(200).json({ 
      message: 'Story text updated successfully', 
      storyText: story.storyText,
      notificationSent: notifyUsers
    });
  } catch (error) {
    console.error('Error updating story text:', error);
    res.status(500).json({ 
      message: 'Error updating story text', 
      error: error.message 
    });
  }
};

// ✅ NEW: Create/Post a new story section
// @desc    Post a new story
// @route   POST /api/story/post
// @access  Private/Admin
export const postNewStory = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const story = await Story.getSingleStory();
    
    story.storyText = {
      paragraph1: title,
      paragraph2: content
    };

    await story.save();

    // 🔔 SEND NOTIFICATIONS
    try {
      const postedBy = req.user?.name || 'Admin';
      
      // Notify all users
      await notifyStory.posted(title, story._id);
      console.log('🔔 New story notifications sent to users');
      
      // Notify admins
      await notifyAdmins({
        title: 'New Story Published',
        message: `${postedBy} published a new story: "${title}"`,
        type: 'admin',
        link: '/admin/story'
      });
      
    } catch (notifError) {
      console.error('⚠️ Notification failed:', notifError.message);
    }

    res.status(201).json({ 
      message: 'Story posted successfully', 
      story 
    });
  } catch (error) {
    console.error('Error posting story:', error);
    
    // 🔔 CRITICAL ERROR ALERT
    try {
      await notifyAdmins({
        title: '🚨 Error Posting Story',
        message: `Failed to post story: ${error.message}`,
        type: 'error',
        link: '/admin/story'
      });
    } catch (notifError) {
      console.error('⚠️ Error notification failed:', notifError.message);
    }
    
    res.status(500).json({ 
      message: 'Error posting story', 
      error: error.message 
    });
  }
};

export default {
  getStory,
  updateStatistics,
  updateMissionVision,
  updateMilestones,
  updateValues,
  updateStoryText,
  postNewStory,
};