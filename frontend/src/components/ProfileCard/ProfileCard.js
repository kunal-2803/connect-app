import React from 'react';
import './ProfileCard.css';
import { FaStar, FaMapMarkerAlt, FaUserCheck, FaBriefcase, FaTags, FaHeart } from 'react-icons/fa'; // Using FaHeart for lookingFor

const ProfileCard = ({ profile }) => {
  if (!profile) return null;

  const { user, displayName, bio, age, location, experienceLevel, interests, lookingFor, profilePicture } = profile;

  // Construct age string (handles single or couple)
  let ageString = '';
  if (age?.primaryAge) {
    ageString = `${age.primaryAge}`;
    if (age?.secondaryAge) {
      ageString += `/${age.secondaryAge}`;
    }
  }

  // Location string (simplified - backend might provide full address or city)
  const locationString = location?.address?.city || location?.address?.country || (location?.coordinates ? 'View on Map' : 'Location Private');

  // Placeholder for rating as it's not in schema
  const rating = 4.8; // Dummy rating

  // Default profile image if none provided
  const imageSrc = profilePicture || 'https://via.placeholder.com/300x200.png?text=IntiMate+User';


  return (
    <div className="profile-card">
      <div className="profile-card-image-container">
        <img src={imageSrc} alt={displayName || user?.username} className="profile-card-image" />
        {user?.isVerified && <FaUserCheck className="verified-tick-on-image" title="Verified Profile" />}
      </div>
      <div className="profile-card-content">
        <div className="profile-card-header">
          <h3 className="profile-name">{displayName || user?.username}</h3>
          <div className="profile-rating">
            <FaStar className="star-icon" /> {rating.toFixed(1)}
          </div>
        </div>

        <p className="profile-label">
          <span className="account-type">{user?.accountType}</span> 
          {ageString && ` (${ageString})`}
          {locationString && <> • <FaMapMarkerAlt className="icon" /> {locationString} </>}
        </p>

        {bio && <p className="profile-bio">{bio.substring(0, 100)}{bio.length > 100 ? '...' : ''}</p>}
        
        <div className="profile-details">
          {experienceLevel && (
            <p><FaBriefcase className="icon" /> <strong>Experience:</strong> {experienceLevel}</p>
          )}
          {interests && interests.length > 0 && (
            <p><FaTags className="icon" /> <strong>Interests:</strong> {interests.join(', ')}</p>
          )}
          {lookingFor && (
            <p><FaHeart className="icon" /> <strong>Looking for:</strong> {lookingFor}</p>
          )}
        </div>
        
        {/* Optional: Add a 'View Profile' button if cards link to full profiles */}
        {/* <button className="view-profile-button">View Profile</button> */}
      </div>
    </div>
  );
};

export default ProfileCard;