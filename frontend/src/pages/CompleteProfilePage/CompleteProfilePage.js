import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  getCurrentProfile,
  createOrUpdateProfile,
  uploadVerificationPhotos,
  clearProfileError,
  resetProfileState
} from '../../features/profile/profileSlice';
import './CompleteProfilePage.css'; // We'll create this CSS file

const CompleteProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, isLoading, error, profileStatus } = useSelector((state) => state.profile);
  const { user } = useSelector((state) => state.auth);

  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Verification Photos

  // Form state for Step 1: Basic Info
  const [formData, setFormData] = useState({
    displayName: '',
    primaryAge: '', // age.primaryAge
    // For location, you'll need a map interface or manual lat/lng input.
    // For simplicity, let's use city/country text input first and adapt later if needed.
    city: '',
    country: '',
    // For location.coordinates as per backend: [longitude, latitude]
    // This requires a more complex input, e.g., a map picker or geocoding.
    // For now, let's keep it simple and assume backend can handle text location or adjust backend.
    // Or, make location optional for now in frontend if backend doesn't strictly require coordinates.
    // Assuming backend 'location' field expects { type: 'Point', coordinates: [lng, lat], address: 'text address' }
    // For this example, we'll submit a text address that backend might geocode or store.
    // The backend validation `check('location.coordinates', 'Location is required').isArray()` means we MUST send coordinates.
    // This is a common sticking point. For now, let's hardcode or use dummy values for coordinates.
    // A real app needs a map input (e.g., Google Maps Places API).
    longitude: '', // For location.coordinates[0]
    latitude: '',  // For location.coordinates[1]
    interests: '', // Comma-separated
    lookingFor: 'Friendship', // Default, make it a select
    experienceLevel: 'Beginner', // Default, select
    experienceCount: 0,
    healthStatus: '',
    bio: '',
    // preferences: {} // This is complex, handle as needed
  });

  // Form state for Step 2: Verification Photos
  const [verificationFiles, setVerificationFiles] = useState([]);
  const [verificationPreviews, setVerificationPreviews] = useState([]);


  useEffect(() => {
    // Clear any previous errors when component mounts
    dispatch(clearProfileError());
    // Fetch current profile when component mounts or user changes
    if (user?.id) {
        dispatch(getCurrentProfile());
    }
    return () => {
      // Optionally reset part of profile state if navigating away from this specific flow
      // For example, if you want errors to clear if they navigate away and come back.
      // dispatch(clearProfileError());
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    // Pre-fill form if profile exists
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        primaryAge: profile.age?.primaryAge || '',
        city: profile.location?.address?.city || '', // Assuming address structure
        country: profile.location?.address?.country || '', // Assuming address structure
        longitude: profile.location?.coordinates?.[0]?.toString() || '',
        latitude: profile.location?.coordinates?.[1]?.toString() || '',
        interests: Array.isArray(profile.interests) ? profile.interests.join(', ') : '',
        lookingFor: profile.lookingFor || 'Friendship',
        experienceLevel: profile.experienceLevel || 'Beginner',
        experienceCount: profile.experienceCount || 0,
        healthStatus: profile.healthStatus || '',
        bio: profile.bio || '',
      });

      // If profile exists and has verification photos, they are likely under review.
      // The `profileStatus` from slice should reflect this.
      // If profile exists but photos are needed, move to step 2 or allow updates.
      if (profileStatus === 'profileExistsNoPhotos' && currentStep !== 2) {
        // If profile details are filled but no photos, we might auto-advance or guide user
        // setCurrentStep(2); // Example: Auto-advance if basic profile is good.
      }
    }
  }, [profile, profileStatus, currentStep]);


  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
        alert("You can upload a maximum of 5 verification photos.");
        setVerificationFiles([]);
        setVerificationPreviews([]);
        e.target.value = null; // Clear the file input
        return;
    }
    setVerificationFiles(files);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setVerificationPreviews(previews);
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    dispatch(clearProfileError());
    const profileData = {
      ...formData,
      age: { primaryAge: parseInt(formData.primaryAge) },
      location: {
        type: 'Point', // Assuming GeoJSON Point for backend
        coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
        // You might add a textual address if your backend stores it
        // address: { city: formData.city, country: formData.country } 
      },
      interests: formData.interests.split(',').map(interest => interest.trim()).filter(i => i),
      experienceCount: parseInt(formData.experienceCount) || 0,
    };
    // Remove city/country if not directly part of profileFields for POST /api/profiles
    delete profileData.city;
    delete profileData.country;
    delete profileData.primaryAge; // Since it's nested under 'age'

    const resultAction = await dispatch(createOrUpdateProfile(profileData));
    if (createOrUpdateProfile.fulfilled.match(resultAction)) {
      setCurrentStep(2); // Move to next step
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    dispatch(clearProfileError());
    if (verificationFiles.length === 0) {
      alert('Please select verification photos.');
      return;
    }
    const filesFormData = new FormData();
    verificationFiles.forEach(file => {
      filesFormData.append('images', file); // 'images' must match backend multer field name
    });

    const resultAction = await dispatch(uploadVerificationPhotos(filesFormData));
    if (uploadVerificationPhotos.fulfilled.match(resultAction)) {
        // Photos uploaded, profileStatus will be 'photosUploaded' or 'underReview'
        // The page will re-render based on profileStatus
        alert("Verification photos submitted! Your profile is now under review.");
        // Optionally navigate to dashboard or a pending page
        // navigate('/dashboard');
    }
  };

  // Render different content based on profileStatus
  if (isLoading && !profile && profileStatus !== 'noProfile') { // Show loading only if fetching initial profile
    return <div className="complete-profile-page loading">Loading profile information...</div>;
  }

  if (profileStatus === 'underReview' || profileStatus === 'photosUploaded') {
    return (
      <div className="complete-profile-page status-message">
        <h2>Profile Submitted</h2>
        <p>Thank you for completing your profile and submitting your verification photos.</p>
        <p>Your profile is currently under review by our team. This usually takes 24-48 hours.</p>
        <p>You will be notified once your profile is approved. In the meantime, you can log out or explore any available public content (if applicable).</p>
        {/* <button onClick={() => navigate('/dashboard')}>Go to Dashboard (Limited Access)</button> */}
      </div>
    );
  }


  return (
    <div className="complete-profile-page">
      <h1>Complete Your IntiMate Profile</h1>
      <p className="sub-heading">
        To ensure a safe and genuine community, please complete your profile and provide verification.
      </p>

      {error && (
        <div className="error-messages">
          {Array.isArray(error) ? (
            error.map((err, index) => <p key={index}>{err.msg}</p>)
          ) : (
            <p>{error.msg || 'An error occurred.'}</p>
          )}
        </div>
      )}

      <div className="steps-indicator">
        <span className={currentStep === 1 ? 'active' : ''}>Step 1: Basic Information</span>
        {' -> '}
        <span className={currentStep === 2 ? 'active' : ''}>Step 2: Verification Photos</span>
      </div>

      {currentStep === 1 && (
        <form onSubmit={handleStep1Submit} className="profile-form">
          <h2>Step 1: Basic Information</h2>
          {/* Add all form fields from formData state here */}
          {/* Example: Display Name */}
          <div className="form-group">
            <label htmlFor="displayName">Display Name *</label>
            <input type="text" name="displayName" value={formData.displayName} onChange={handleInputChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="primaryAge">Your Age *</label>
            <input type="number" name="primaryAge" value={formData.primaryAge} onChange={handleInputChange} required min="18"/>
          </div>
          {/* Location: Simplified for now. A map interface is better. */}
          <fieldset className="form-group">
            <legend>Location (Coordinates Required for Search) *</legend>
            <p className="info-text">Please provide precise coordinates. You can use an online tool to find latitude/longitude for your city/area.</p>
            <div>
                <label htmlFor="latitude">Latitude:</label>
                <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} placeholder="e.g., 34.0522" required />
            </div>
            <div>
                <label htmlFor="longitude">Longitude:</label>
                <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} placeholder="e.g., -118.2437" required />
            </div>
            {/* Optional text fields for address if your backend profile stores more than just coordinates */}
            {/* <div>
                <label htmlFor="city">City:</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} />
            </div>
            <div>
                <label htmlFor="country">Country:</label>
                <input type="text" name="country" value={formData.country} onChange={handleInputChange} />
            </div> */}
          </fieldset>

          <div className="form-group">
            <label htmlFor="interests">Interests (comma-separated)</label>
            <input type="text" name="interests" value={formData.interests} onChange={handleInputChange} placeholder="e.g., Travel, Art, Dining" />
          </div>

          <div className="form-group">
            <label htmlFor="lookingFor">Looking For *</label>
            <select name="lookingFor" value={formData.lookingFor} onChange={handleInputChange} required>
              <option value="Friendship">Friendship</option>
              <option value="Networking">Networking</option>
              <option value="Casual Encounters">Casual Encounters</option>
              <option value="Long-term Relationship">Long-term Relationship (Cuckold context)</option>
              <option value="Bull Role">Bull Role</option>
              <option value="Couple Seeking Bull">Couple Seeking Bull</option>
              {/* Add more relevant options */}
            </select>
          </div>

           <div className="form-group">
            <label htmlFor="experienceLevel">Experience Level *</label>
            <select name="experienceLevel" value={formData.experienceLevel} onChange={handleInputChange} required>
              <option value="Newbie">Newbie (Exploring)</option>
              <option value="Beginner">Beginner (Few experiences)</option>
              <option value="Intermediate">Intermediate (Comfortable & Experienced)</option>
              <option value="Advanced">Advanced (Very Experienced)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="experienceCount">Number of Experiences (approx)</label>
            <input type="number" name="experienceCount" value={formData.experienceCount} onChange={handleInputChange} min="0" />
          </div>
          
          <div className="form-group">
            <label htmlFor="healthStatus">Health Status / STI Testing (Optional, be honest)</label>
            <input type="text" name="healthStatus" value={formData.healthStatus} onChange={handleInputChange} placeholder="e.g., Recently tested, On PrEP" />
          </div>

          <div className="form-group">
            <label htmlFor="bio">Bio / About You (Tell us a bit about yourself or what you're seeking)</label>
            <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="4"></textarea>
          </div>

          <button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save and Continue to Verification'}</button>
        </form>
      )}

      {currentStep === 2 && (
        <form onSubmit={handleStep2Submit} className="profile-form verification-form">
          <h2>Step 2: Verification Photos</h2>
          <div className="verification-instructions">
            <h4>Photo Requirements for Verification:</h4>
            <ul>
              <li><strong>Clear Face Photo:</strong> At least one photo must clearly show your face. No sunglasses, heavy filters, or obstructions.</li>
              <li><strong>Identity Verification:</strong> One photo holding a piece of paper with:
                <ul>
                    <li>Your **IntiMate Username** (your username is: <strong>{user?.username || 'loading...'}</strong>)</li>
                    <li>Today's **Date**</li>
                </ul>
                Your face and the paper must be clearly visible in this photo.
              </li>
              <li><strong>Original Photos:</strong> Photos must be original and not downloaded from the internet.</li>
              <li><strong>Optional - Government ID:</strong> For faster verification, you can (optionally and securely) include one photo holding a government-issued ID (obscure sensitive numbers, show name and photo). This is highly recommended for Bulls. *This photo will be reviewed by admins and not publicly visible.*</li>
              <li><strong>No Nudity in Verification Photos:</strong> Keep these SFW. Profile photos can be different.</li>
            </ul>
            <p><strong>Why these steps?</strong> To ensure all profiles are genuine and maintain a safe community. Your privacy is important; verification photos used for admin review only unless you choose to share specific ones later.</p>
          </div>

          <div className="form-group">
            <label htmlFor="verificationFiles">Upload Photos (Max 5 files, JPG/PNG)</label>
            <input 
              type="file" 
              name="verificationFiles" 
              onChange={handleFileChange} 
              multiple 
              accept="image/jpeg, image/png" 
            />
          </div>
          {verificationPreviews.length > 0 && (
            <div className="image-previews">
              {verificationPreviews.map((preview, index) => (
                <img key={index} src={preview} alt={`Preview ${index + 1}`} />
              ))}
            </div>
          )}
          <button type="submit" disabled={isLoading || verificationFiles.length === 0}>
            {isLoading ? 'Uploading...' : 'Submit Verification Photos'}
          </button>
          <button type="button" onClick={() => setCurrentStep(1)} className="back-button" disabled={isLoading}>
            Back to Basic Info
          </button>
        </form>
      )}
    </div>
  );
};

export default CompleteProfilePage;