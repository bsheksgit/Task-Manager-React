import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import { commonActions } from '../store/commonSlice';
import { userActions } from '../store/userSlice';

// Character limits for profile fields
const FIRST_NAME_LIMIT = 30;
const LAST_NAME_LIMIT = 30;
const PROFESSION_LIMIT = 50;
const BIO_LIMIT = 200;
const LOCATION_LIMIT = 50;
const PHONE_LIMIT = 15;

// Helper function to count characters
function countCharacters(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().length;
}

// Helper to format date for display
function formatDateForDisplay(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

export default function UserProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userId } = useParams();

  // Get user info from Redux store
  const userDetails = useSelector((state) => state.user.userDetails);

  // State for editing mode
  const [editingFirstName, setEditingFirstName] = useState(false);
  const [editingLastName, setEditingLastName] = useState(false);
  const [editingProfession, setEditingProfession] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingDateOfBirth, setEditingDateOfBirth] = useState(false);

  // State for profile picture (placeholder)
  const [profilePicture, setProfilePicture] = useState(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  // Character count validation
  const firstNameCharCount = countCharacters(userDetails.firstName || '');
  const lastNameCharCount = countCharacters(userDetails.lastName || '');
  const professionCharCount = countCharacters(userDetails.profession || '');
  const bioCharCount = countCharacters(userDetails.bio || '');
  const locationCharCount = countCharacters(userDetails.location || '');
  const phoneCharCount = countCharacters(userDetails.phone || '');

  const isFirstNameOverLimit = firstNameCharCount > FIRST_NAME_LIMIT;
  const isLastNameOverLimit = lastNameCharCount > LAST_NAME_LIMIT;
  const isProfessionOverLimit = professionCharCount > PROFESSION_LIMIT;
  const isBioOverLimit = bioCharCount > BIO_LIMIT;
  const isLocationOverLimit = locationCharCount > LOCATION_LIMIT;
  const isPhoneOverLimit = phoneCharCount > PHONE_LIMIT;

  // Check if save should be disabled
  const isSaveDisabled =
    isFirstNameOverLimit ||
    isLastNameOverLimit ||
    isProfessionOverLimit ||
    isBioOverLimit ||
    isLocationOverLimit ||
    isPhoneOverLimit;

  // Simulate loading state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Handle field edit functions
  const handleFirstNameEdit = (newFirstName) => {
    if (
      newFirstName !== userDetails.firstName &&
      countCharacters(newFirstName) <= FIRST_NAME_LIMIT
    ) {
      dispatch(
        userActions.updateUserDetails({ firstName: newFirstName.trim() })
      );
    }
    setEditingFirstName(false);
  };

  const handleLastNameEdit = (newLastName) => {
    if (
      newLastName !== userDetails.lastName &&
      countCharacters(newLastName) <= LAST_NAME_LIMIT
    ) {
      dispatch(userActions.updateUserDetails({ lastName: newLastName.trim() }));
    }
    setEditingLastName(false);
  };

  const handleProfessionEdit = (newProfession) => {
    if (
      newProfession !== userDetails.profession &&
      countCharacters(newProfession) <= PROFESSION_LIMIT
    ) {
      dispatch(
        userActions.updateUserDetails({ profession: newProfession.trim() })
      );
    }
    setEditingProfession(false);
  };

  const handleBioEdit = (newBio) => {
    if (newBio !== userDetails.bio && countCharacters(newBio) <= BIO_LIMIT) {
      dispatch(userActions.updateUserDetails({ bio: newBio.trim() }));
    }
    setEditingBio(false);
  };

  const handleLocationEdit = (newLocation) => {
    if (
      newLocation !== userDetails.location &&
      countCharacters(newLocation) <= LOCATION_LIMIT
    ) {
      dispatch(userActions.updateUserDetails({ location: newLocation.trim() }));
    }
    setEditingLocation(false);
  };

  const handlePhoneEdit = (newPhone) => {
    if (
      newPhone !== userDetails.phone &&
      countCharacters(newPhone) <= PHONE_LIMIT
    ) {
      // Basic phone validation - only numbers
      const phoneRegex = /^[0-9]*$/;
      if (phoneRegex.test(newPhone)) {
        dispatch(userActions.updateUserDetails({ phone: newPhone.trim() }));
      }
    }
    setEditingPhone(false);
  };

  const handleDateOfBirthEdit = (newDate) => {
    if (newDate !== userDetails.dateOfBirth) {
      dispatch(userActions.updateUserDetails({ dateOfBirth: newDate }));
    }
    setEditingDateOfBirth(false);
  };

  // Handle profile picture upload (non-functional for now)
  const handleProfilePictureChange = (e) => {
    // Non-functional - just show a placeholder message
    dispatch(
      commonActions.openSnackbar({
        message: 'Profile picture upload functionality coming soon!',
        severity: 'info',
      })
    );
    e.target.value = ''; // Reset file input
  };

  // Handle save (non-functional)
  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      dispatch(
        commonActions.openSnackbar({
          message: 'Profile save functionality coming soon!',
          severity: 'info',
        })
      );
    }, 1000);
  };

  // Handle delete account (non-functional)
  const handleDeleteAccount = () => {
    setDeleting(true);
    // Show confirmation modal in future
    setTimeout(() => {
      setDeleting(false);
      dispatch(
        commonActions.openSnackbar({
          message: 'Account deletion functionality coming soon!',
          severity: 'warning',
        })
      );
    }, 1000);
  };

  return (
    <div className="bg-[#bec1c3] h-full w-full flex flex-col items-center overflow-x-hidden overflow-visible">
      {/* Header */}
      <div className="w-full h-16 flex flex-col items-center justify-start mb-4">
        <div className="w-full flex flex-row justify-between items-center">
          <h1 className="text-3xl font-bold text-[#7b5063da] ml-5 pt-4">
            User Profile
          </h1>
          <div className="flex gap-4 items-center mr-6 mt-4">
            <Link to="/logout" className="text-red-600 hover:underline">
              Logout
            </Link>
          </div>
        </div>
      </div>

      {/* Back button */}
      <div className="w-full flex flex-row justify-between items-center mx-6">
        <div className="text-indigo-600 hover:underline gap-2 ml-4">
          <Link to={`/users/${userId}/tasks`}>← Back to Tasks</Link>
        </div>
      </div>

      {/* Profile Content */}
      <div className="w-11/12 max-w-6xl bg-yellow-300/60 backdrop-blur-sm rounded-lg shadow-md p-6 m-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Picture */}
          <div className="lg:col-span-1">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#7b5063da] mb-4 text-center">
                Profile Picture
              </h2>
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 bg-gray-300 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl text-gray-600">
                      {userDetails.firstName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="text-center mb-2">
                  <p className="text-gray-600">
                    Upload a profile picture to personalize your account
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    id="profile-picture"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-picture"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer"
                  >
                    Upload Picture
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Max size: 5MB • JPG, PNG, WebP
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-[#7b5063da] mb-6">
              Personal Information
            </h2>

            {/* First Name */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-700">
                  First Name *
                </h3>
                {editingFirstName && (
                  <div
                    className={`text-sm ${isFirstNameOverLimit ? 'text-red-600' : 'text-gray-600'}`}
                  >
                    {firstNameCharCount}/{FIRST_NAME_LIMIT} characters
                    {isFirstNameOverLimit && ' (Limit exceeded)'}
                  </div>
                )}
              </div>
              {editingFirstName ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={userDetails.firstName || ''}
                    onChange={(e) =>
                      dispatch(
                        userActions.updateUserDetails({
                          firstName: e.target.value,
                        })
                      )
                    }
                    onKeyPress={(e) =>
                      e.key === 'Enter' &&
                      !isFirstNameOverLimit &&
                      handleFirstNameEdit(e.target.value)
                    }
                    onBlur={() =>
                      !isFirstNameOverLimit &&
                      handleFirstNameEdit(userDetails.firstName)
                    }
                    className={`flex-1 p-2 border rounded text-gray-800 text-lg ${isFirstNameOverLimit ? 'border-red-500' : ''}`}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() =>
                        !isFirstNameOverLimit &&
                        handleFirstNameEdit(userDetails.firstName)
                      }
                      className={`px-3 py-2 rounded hover:cursor-pointer ${isFirstNameOverLimit ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      disabled={isFirstNameOverLimit}
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setEditingFirstName(false)}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-gray-800 text-lg hover:bg-white/50 p-2 rounded hover:cursor-pointer"
                  onClick={() => setEditingFirstName(true)}
                >
                  {userDetails.firstName || 'Click to add first name'}
                </div>
              )}
            </div>

            {/* Last Name */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-700">
                  Last Name
                </h3>
                {editingLastName && (
                  <div
                    className={`text-sm ${isLastNameOverLimit ? 'text-red-600' : 'text-gray-600'}`}
                  >
                    {lastNameCharCount}/{LAST_NAME_LIMIT} characters
                    {isLastNameOverLimit && ' (Limit exceeded)'}
                  </div>
                )}
              </div>
              {editingLastName ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={userDetails.lastName || ''}
                    onChange={(e) =>
                      dispatch(
                        userActions.updateUserDetails({
                          lastName: e.target.value,
                        })
                      )
                    }
                    onKeyPress={(e) =>
                      e.key === 'Enter' &&
                      !isLastNameOverLimit &&
                      handleLastNameEdit(e.target.value)
                    }
                    onBlur={() =>
                      !isLastNameOverLimit &&
                      handleLastNameEdit(userDetails.lastName)
                    }
                    className={`flex-1 p-2 border rounded text-gray-800 text-lg ${isLastNameOverLimit ? 'border-red-500' : ''}`}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() =>
                        !isLastNameOverLimit &&
                        handleLastNameEdit(userDetails.lastName)
                      }
                      className={`px-3 py-2 rounded hover:cursor-pointer ${isLastNameOverLimit ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      disabled={isLastNameOverLimit}
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setEditingLastName(false)}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-gray-800 text-lg hover:bg-white/50 p-2 rounded hover:cursor-pointer"
                  onClick={() => setEditingLastName(true)}
                >
                  {userDetails.lastName || 'Click to add last name (optional)'}
                </div>
              )}
            </div>

            {/* Email (Non-editable) */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Email
              </h3>
              <div className="text-gray-800 text-lg p-2 bg-gray-100/50 rounded">
                {userDetails.email || 'No email available'}
                <p className="text-sm text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-700">
                  Date of Birth
                </h3>
              </div>
              {editingDateOfBirth ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="date"
                    value={userDetails.dateOfBirth || ''}
                    onChange={(e) =>
                      dispatch(
                        userActions.updateUserDetails({
                          dateOfBirth: e.target.value,
                        })
                      )
                    }
                    onBlur={() =>
                      handleDateOfBirthEdit(userDetails.dateOfBirth)
                    }
                    className="flex-1 p-2 border rounded text-gray-800 text-lg"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() =>
                        handleDateOfBirthEdit(userDetails.dateOfBirth)
                      }
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 hover:cursor-pointer"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setEditingDateOfBirth(false)}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-gray-800 text-lg hover:bg-white/50 p-2 rounded hover:cursor-pointer"
                  onClick={() => setEditingDateOfBirth(true)}
                >
                  {userDetails.dateOfBirth
                    ? formatDateForDisplay(userDetails.dateOfBirth)
                    : 'Click to add date of birth (optional)'}
                </div>
              )}
            </div>

            {/* Profession */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-700">
                  Profession
                </h3>
                {editingProfession && (
                  <div
                    className={`text-sm ${isProfessionOverLimit ? 'text-red-600' : 'text-gray-600'}`}
                  >
                    {professionCharCount}/{PROFESSION_LIMIT} characters
                    {isProfessionOverLimit && ' (Limit exceeded)'}
                  </div>
                )}
              </div>
              {editingProfession ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={userDetails.profession || ''}
                    onChange={(e) =>
                      dispatch(
                        userActions.updateUserDetails({
                          profession: e.target.value,
                        })
                      )
                    }
                    onKeyPress={(e) =>
                      e.key === 'Enter' &&
                      !isProfessionOverLimit &&
                      handleProfessionEdit(e.target.value)
                    }
                    onBlur={() =>
                      !isProfessionOverLimit &&
                      handleProfessionEdit(userDetails.profession)
                    }
                    className={`flex-1 p-2 border rounded text-gray-800 text-lg ${isProfessionOverLimit ? 'border-red-500' : ''}`}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() =>
                        !isProfessionOverLimit &&
                        handleProfessionEdit(userDetails.profession)
                      }
                      className={`px-3 py-2 rounded hover:cursor-pointer ${isProfessionOverLimit ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      disabled={isProfessionOverLimit}
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setEditingProfession(false)}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-gray-800 text-lg hover:bg-white/50 p-2 rounded hover:cursor-pointer"
                  onClick={() => setEditingProfession(true)}
                >
                  {userDetails.profession ||
                    'Click to add profession (optional)'}
                </div>
              )}
            </div>

            {/* Bio/About Me */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-700">
                  Bio / About Me
                </h3>
                {editingBio && (
                  <div
                    className={`text-sm ${isBioOverLimit ? 'text-red-600' : 'text-gray-600'}`}
                  >
                    {bioCharCount}/{BIO_LIMIT} characters
                    {isBioOverLimit && ' (Limit exceeded)'}
                  </div>
                )}
              </div>
              {editingBio ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={userDetails.bio || ''}
                    onChange={(e) =>
                      dispatch(
                        userActions.updateUserDetails({
                          bio: e.target.value,
                        })
                      )
                    }
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey && !isBioOverLimit) {
                        handleBioEdit(e.target.value);
                      }
                    }}
                    onBlur={() =>
                      !isBioOverLimit && handleBioEdit(userDetails.bio)
                    }
                    className={`flex-1 p-2 border rounded text-gray-800 text-lg h-32 ${isBioOverLimit ? 'border-red-500' : ''}`}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() =>
                        !isBioOverLimit && handleBioEdit(userDetails.bio)
                      }
                      className={`px-3 py-2 rounded hover:cursor-pointer ${isBioOverLimit ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      disabled={isBioOverLimit}
                    >
                      Done (Ctrl+Enter)
                    </button>
                    <button
                      onClick={() => setEditingBio(false)}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-gray-800 text-lg whitespace-pre-wrap hover:bg-white/50 p-2 rounded hover:cursor-pointer min-h-12"
                  onClick={() => setEditingBio(true)}
                >
                  {userDetails.bio || 'Click to add bio (optional)'}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-700">
                  Location
                </h3>
                {editingLocation && (
                  <div
                    className={`text-sm ${isLocationOverLimit ? 'text-red-600' : 'text-gray-600'}`}
                  >
                    {locationCharCount}/{LOCATION_LIMIT} characters
                    {isLocationOverLimit && ' (Limit exceeded)'}
                  </div>
                )}
              </div>
              {editingLocation ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={userDetails.location || ''}
                    onChange={(e) =>
                      dispatch(
                        userActions.updateUserDetails({
                          location: e.target.value,
                        })
                      )
                    }
                    onKeyPress={(e) =>
                      e.key === 'Enter' &&
                      !isLocationOverLimit &&
                      handleLocationEdit(e.target.value)
                    }
                    onBlur={() =>
                      !isLocationOverLimit &&
                      handleLocationEdit(userDetails.location)
                    }
                    className={`flex-1 p-2 border rounded text-gray-800 text-lg ${isLocationOverLimit ? 'border-red-500' : ''}`}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() =>
                        !isLocationOverLimit &&
                        handleLocationEdit(userDetails.location)
                      }
                      className={`px-3 py-2 rounded hover:cursor-pointer ${isLocationOverLimit ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      disabled={isLocationOverLimit}
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setEditingLocation(false)}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-gray-800 text-lg hover:bg-white/50 p-2 rounded hover:cursor-pointer"
                  onClick={() => setEditingLocation(true)}
                >
                  {userDetails.location || 'Click to add location (optional)'}
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-700">
                  Phone Number
                </h3>
                {editingPhone && (
                  <div
                    className={`text-sm ${isPhoneOverLimit ? 'text-red-600' : 'text-gray-600'}`}
                  >
                    {phoneCharCount}/{PHONE_LIMIT} characters
                    {isPhoneOverLimit && ' (Limit exceeded)'}
                  </div>
                )}
              </div>
              {editingPhone ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="tel"
                    value={userDetails.phone || ''}
                    onChange={(e) => {
                      const phoneRegex = /^[0-9]*$/;
                      if (
                        phoneRegex.test(e.target.value) ||
                        e.target.value === ''
                      ) {
                        dispatch(
                          userActions.updateUserDetails({
                            phone: e.target.value,
                          })
                        );
                      }
                    }}
                    onKeyPress={(e) =>
                      e.key === 'Enter' &&
                      !isPhoneOverLimit &&
                      handlePhoneEdit(e.target.value)
                    }
                    onBlur={() =>
                      !isPhoneOverLimit && handlePhoneEdit(userDetails.phone)
                    }
                    className={`flex-1 p-2 border rounded text-gray-800 text-lg ${isPhoneOverLimit ? 'border-red-500' : ''}`}
                    autoFocus
                    placeholder="Enter numbers only"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() =>
                        !isPhoneOverLimit && handlePhoneEdit(userDetails.phone)
                      }
                      className={`px-3 py-2 rounded hover:cursor-pointer ${isPhoneOverLimit ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      disabled={isPhoneOverLimit}
                    >
                      Done
                    </button>
                    <button
                      onClick={() => setEditingPhone(false)}
                      className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-gray-800 text-lg hover:bg-white/50 p-2 rounded hover:cursor-pointer"
                  onClick={() => setEditingPhone(true)}
                >
                  {userDetails.phone || 'Click to add phone number (optional)'}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row justify-between items-center gap-4 pt-8 border-t">
              <Button
                variant="contained"
                color="error"
                startIcon={
                  deleting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <DeleteIcon />
                  )
                }
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? 'Processing...' : 'Delete Account'}
              </Button>

              <Button
                variant="contained"
                color="primary"
                startIcon={
                  saving ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                onClick={handleSave}
                disabled={saving || isSaveDisabled}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              <p>* Required fields</p>
              <p className="mt-1">
                Note: Buttons are non-functional in this phase. Functionality
                will be added in future updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
