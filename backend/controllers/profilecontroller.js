
// controllers/profileController.js
import User from '../models/User.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

// ========================================
// GET USER PROFILE
// ========================================
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;

    console.log('\n' + '='.repeat(70));
    console.log('📥 GET USER PROFILE REQUEST');
    console.log('='.repeat(70));
    console.log('Profile ID from URL:', userId);
    console.log('Auth User ID (_id):', req.user._id.toString());
    console.log('Auth User Role:', req.user.role);

    const user = await User.findById(userId).select('-password -resetToken');

    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Profile fetched successfully for:', user.email);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        profilePic: user.profilePic || '',
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// ========================================
// UPDATE USER PROFILE (Text fields only)
// ========================================
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, phone, address } = req.body;

    console.log('\n' + '='.repeat(70));
    console.log('📝 UPDATE PROFILE REQUEST');
    console.log('='.repeat(70));
    console.log('Target User ID:', userId);
    console.log('Auth User ID (_id):', req.user._id.toString());
    console.log('Auth User Role:', req.user.role);
    console.log('Update Data:', { name, phone, address });

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ Target user not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ AUTHORIZATION CHECK - Only the user/staff can update their OWN profile
    // NO ADMIN BYPASS - User/Staff only!
    const authUserId = req.user._id.toString();
    const targetUserId = userId.toString();

    console.log('🔐 Authorization Check:');
    console.log(`   Auth User ID: ${authUserId}`);
    console.log(`   Target ID: ${targetUserId}`);
    console.log(`   Match: ${authUserId === targetUserId}`);

    if (authUserId !== targetUserId) {
      console.log('❌ AUTHORIZATION FAILED - User trying to update different user profile');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    console.log('✅ Authorization PASSED');

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address.trim();

    console.log('💾 Saving to database:', updateData);

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -resetToken');

    console.log('✅ Profile updated successfully');
    console.log('Updated user:', {
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profilePic: updatedUser.profilePic,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// ========================================
// UPLOAD PROFILE PICTURE
// ========================================
export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.params.id;

    console.log('\n' + '='.repeat(70));
    console.log('📸 UPLOAD PROFILE PICTURE');
    console.log('='.repeat(70));
    console.log('Target User ID:', userId);
    console.log('Auth User ID (_id):', req.user._id.toString());
    console.log('Auth User Role:', req.user.role);
    console.log('File received:', req.file ? 'YES ✅' : 'NO ❌');
    
    if (req.file) {
      console.log('File info:');
      console.log('  - Name:', req.file.originalname);
      console.log('  - Size:', req.file.size, 'bytes');
      console.log('  - MIME:', req.file.mimetype);
    }

    // ❌ CHECK 1: File uploaded?
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // ❌ CHECK 2: User exists?
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ Target user not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ CHECK 3: AUTHORIZATION - Only the user/staff can upload their OWN picture
    // THIS IS THE CRITICAL FIX FOR THE 401 ERROR!
    const authUserId = req.user._id.toString();
    const targetUserId = userId.toString();

    console.log('🔐 Authorization Check:');
    console.log(`   Auth User ID: ${authUserId}`);
    console.log(`   Target ID: ${targetUserId}`);
    console.log(`   Match: ${authUserId === targetUserId}`);

    if (authUserId !== targetUserId) {
      console.log('❌ AUTHORIZATION FAILED - User trying to upload picture for different user');
      console.log('   This is what was causing the 401 error!');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this profile'
      });
    }

    console.log('✅ Authorization PASSED');

    console.log('📤 File ready for upload:');
    console.log('   Cloudinary URL:', req.file.path);
    console.log('   Public ID:', req.file.filename);

    // Delete old profile picture from Cloudinary (if exists)
    if (user.profilePic && user.profilePicPublicId) {
      console.log('🗑️ Attempting to delete old profile picture from Cloudinary');
      try {
        await deleteFromCloudinary(user.profilePicPublicId);
        console.log('✅ Old picture deleted successfully');
      } catch (delErr) {
        console.warn('⚠️ Warning: Failed to delete old picture from Cloudinary:', delErr.message);
        // Continue anyway - don't fail the entire upload
        console.log('   Continuing with new upload...');
      }
    }

    // Update user with new profile picture
    console.log('💾 Saving new profile picture to database...');
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePic: req.file.path,
        profilePicPublicId: req.file.filename
      },
      { new: true }
    ).select('-password -resetToken');

    console.log('✅ Profile picture updated successfully!');
    console.log('   New picture URL:', updatedUser.profilePic);
    console.log('   User:', updatedUser.email);

    res.status(200).json({
      success: true,
      message: 'Profile picture updated successfully',
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profilePic: updatedUser.profilePic,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error uploading profile picture:', error);
    console.error('Full error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture',
      error: error.message
    });
  }
};

// ========================================
// DELETE PROFILE PICTURE
// ========================================
export const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.params.id;

    console.log('\n' + '='.repeat(70));
    console.log('🗑️ DELETE PROFILE PICTURE');
    console.log('='.repeat(70));
    console.log('Target User ID:', userId);
    console.log('Auth User ID (_id):', req.user._id.toString());
    console.log('Auth User Role:', req.user.role);

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ Target user not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ AUTHORIZATION CHECK - Only the user/staff can delete their OWN picture
    const authUserId = req.user._id.toString();
    const targetUserId = userId.toString();

    console.log('🔐 Authorization Check:');
    console.log(`   Auth User ID: ${authUserId}`);
    console.log(`   Target ID: ${targetUserId}`);
    console.log(`   Match: ${authUserId === targetUserId}`);

    if (authUserId !== targetUserId) {
      console.log('❌ AUTHORIZATION FAILED - User trying to delete picture for different user');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this profile picture'
      });
    }

    console.log('✅ Authorization PASSED');

    // Delete from Cloudinary
    if (user.profilePic && user.profilePicPublicId) {
      console.log('🗑️ Deleting from Cloudinary');
      try {
        await deleteFromCloudinary(user.profilePicPublicId);
        console.log('✅ Picture deleted from Cloudinary');
      } catch (delErr) {
        console.warn('⚠️ Failed to delete from Cloudinary:', delErr.message);
        // Don't fail if Cloudinary deletion fails
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePic: '',
        profilePicPublicId: ''
      },
      { new: true }
    ).select('-password -resetToken');

    console.log('✅ Profile picture deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Profile picture deleted successfully',
      user: {
        id: updatedUser._id,
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profilePic: updatedUser.profilePic,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('❌ Error deleting profile picture:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile picture',
      error: error.message
    });
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  uploadProfilePicture,
  deleteProfilePicture
};