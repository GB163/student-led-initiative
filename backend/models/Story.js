// backend/models/Story.js
import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  statistics: {
    fundsRaised: {
      type: String,
      default: '50K+'
    },
    studentsInvolved: {
      type: String,
      default: '100+'
    },
    familiesHelped: {
      type: String,
      default: '25+'
    }
  },
  missionVision: {
    mission: {
      text: {
        type: String,
        default: 'To provide financial and emotional support to blood cancer patients and their families while raising awareness and funding critical research that will lead to better treatments and cures.'
      },
      features: {
        type: [String],
        default: ['Patient Support Programs', 'Research Funding', 'Community Awareness']
      }
    },
    vision: {
      text: {
        type: String,
        default: 'A world where every blood cancer patient has access to the support they need and where research advances lead to effective treatments and ultimately, a cure for all blood cancers.'
      },
      features: {
        type: [String],
        default: ['Comprehensive Support Network', 'Breakthrough Research', 'Hope for Every Patient']
      }
    }
  },
  milestones: [{
    id: {
      type: Number,
      required: true
    },
    year: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  values: [{
    id: {
      type: Number,
      required: true
    },
    icon: {
      type: String,
      enum: ['Heart', 'Users', 'Lightbulb', 'Award', 'Sparkles'],
      default: 'Heart'
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: '#3b82f6'
    }
  }],
  storyText: {
    paragraph1: {
      type: String,
      default: 'Student-Led Initiative began when a group of passionate students witnessed the challenges faced by blood cancer patients and their families. We realized that even small contributions could make a significant difference in their lives.'
    },
    paragraph2: {
      type: String,
      default: 'What started as a small fundraiser has grown into a dedicated movement of students committed to supporting patients, raising awareness, and funding research. Every donation, every volunteer hour, and every shared story brings us closer to our goal of making a real difference in the fight against blood cancer.'
    }
  }
}, {
  timestamps: true
});

// Ensure only one story document exists
storySchema.statics.getSingleStory = async function() {
  let story = await this.findOne();
  if (!story) {
    story = await this.create({
      milestones: [
        { id: 1, year: '2023', title: 'Foundation', description: 'Student-Led Initiative was founded with a mission to support blood cancer patients' },
        { id: 2, year: '2024', title: 'First Campaign', description: 'Launched our first successful fundraising campaign for pediatric blood cancer research' },
        { id: 3, year: '2025', title: 'Growing Impact', description: 'Expanding our reach to support more families and fund critical research' }
      ],
      values: [
        { id: 1, icon: 'Heart', title: 'Compassion', description: 'We put patients and families at the heart of everything we do', color: '#ef4444' },
        { id: 2, icon: 'Users', title: 'Community', description: 'Building strong connections between students, donors, and families in need', color: '#3b82f6' },
        { id: 3, icon: 'Lightbulb', title: 'Innovation', description: 'Using creative approaches to raise awareness and funds for blood cancer research', color: '#f59e0b' },
        { id: 4, icon: 'Award', title: 'Transparency', description: 'Maintaining clear communication about how donations make a difference', color: '#8b5cf6' }
      ]
    });
  }
  return story;
};

const Story = mongoose.model('Story', storySchema);

export default Story;