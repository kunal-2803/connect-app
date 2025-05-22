const transporter = require('../config/emailConfig');

const sendVerificationEmail = async (userEmail) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Profile Verified - Welcome to IntiMate!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">🎉 Congratulations! Your Profile is Verified 🎉</h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.5; color: #444;">
              Dear User,
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #444;">
              We're excited to inform you that your IntiMate profile has been successfully verified! 
              You now have full access to all features and can start exploring the platform.
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #444;">
              Thank you for choosing IntiMate. We're committed to providing you with the best possible experience.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Visit IntiMate
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

const sendRejectionEmail = async (userEmail, reason) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Profile Verification Update - Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Profile Verification Update</h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.5; color: #444;">
              Dear User,
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #444;">
              We've reviewed your profile verification submission, and we need some additional information or adjustments before we can proceed with verification.
            </p>
            
            ${reason ? `
            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #ff4444; margin: 15px 0;">
              <p style="font-size: 16px; line-height: 1.5; color: #444;">
                <strong>Reason for rejection:</strong><br>
                ${reason}
              </p>
            </div>
            ` : ''}
            
            <p style="font-size: 16px; line-height: 1.5; color: #444;">
              Please update your profile with:
              <ul>
                <li>Clear, recent photos</li>
                <li>Accurate and complete information</li>
                <li>Valid verification documents where required</li>
              </ul>
            </p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #444;">
              Once you've made these updates, your profile will be reviewed again promptly.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.CLIENT_URL}/profile" 
               style="background-color: #ff4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Update Profile
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
            If you need any clarification or assistance, please contact our support team.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Rejection email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendRejectionEmail
}; 