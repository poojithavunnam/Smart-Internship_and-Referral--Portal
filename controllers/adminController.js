const { readData, writeData } = require('./dataUtils');

async function getAllApplications(req, res) {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const applications = await readData('applications.json');
    const users = await readData('users.json');

    // Enrich applications with user details
    const enrichedApplications = applications.map(app => {
      const user = users.find(u => u.id === app.userId);
      return {
        ...app,
        applicantName: user ? user.name : 'Unknown',
        applicantEmail: user ? user.email : 'Unknown',
        applicantMobile: user ? user.mobile : '',
        applicantLinkedin: user ? user.linkedin : '',
        applicantGithub: user ? user.github : '',
        applicantResume: user ? user.resume : ''
      };
    });

    res.json({ applications: enrichedApplications });
  } catch (error) {
    console.error('Error fetching all applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
}

async function updateApplicationStatus(req, res) {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { applicationId, status } = req.body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be pending, accepted, or rejected.' });
    }

    const applications = await readData('applications.json');
    const applicationIndex = applications.findIndex(app => app.id === applicationId);

    if (applicationIndex === -1) {
      return res.status(404).json({ error: 'Application not found' });
    }

    applications[applicationIndex].status = status;
    applications[applicationIndex].updatedAt = new Date().toISOString();
    applications[applicationIndex].updatedBy = req.user.id;

    await writeData('applications.json', applications);

    res.json({ message: 'Application status updated successfully', application: applications[applicationIndex] });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
}

async function createAdminUser(req, res) {
  try {
    // This is a temporary endpoint to create admin user - should be removed in production
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const users = await readData('users.json');
    const existing = users.find(user => user.email.toLowerCase() === email.toLowerCase());

    if (existing) {
      // Update existing user to admin
      existing.role = 'admin';
      await writeData('users.json', users);
      return res.json({ message: 'User updated to admin successfully' });
    }

    // Create new admin user
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');
    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    users.push(newAdmin);
    await writeData('users.json', users);

    const secret = process.env.JWT_SECRET || 'smart_portal_secret_key';
    const token = jwt.sign({ id: newAdmin.id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role }, secret, { expiresIn: '12h' });

    res.json({ message: 'Admin user created successfully', token, user: { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role } });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
}

async function getAllReferrals(req, res) {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const referrals = await readData('referrals.json');
    const users = await readData('users.json');

    // Enrich referrals with user details
    const enrichedReferrals = referrals.map(ref => {
      const user = users.find(u => u.id === ref.userId);
      return {
        ...ref,
        applicantName: user ? user.name : 'Unknown',
        applicantEmail: user ? user.email : 'Unknown',
        applicantMobile: user ? user.mobile : '',
        applicantLinkedin: user ? user.linkedin : '',
        applicantGithub: user ? user.github : '',
      };
    });

    res.json({ referrals: enrichedReferrals });
  } catch (error) {
    console.error('Error fetching all referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
}

async function updateReferralStatus(req, res) {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { referralId, status } = req.body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be pending, accepted, or rejected.' });
    }

    const referrals = await readData('referrals.json');
    const referralIndex = referrals.findIndex(ref => ref.id === referralId);

    if (referralIndex === -1) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    referrals[referralIndex].status = status;
    referrals[referralIndex].updatedAt = new Date().toISOString();
    referrals[referralIndex].updatedBy = req.user.id;

    await writeData('referrals.json', referrals);

    res.json({ message: 'Referral status updated successfully', referral: referrals[referralIndex] });
  } catch (error) {
    console.error('Error updating referral status:', error);
    res.status(500).json({ error: 'Failed to update referral status' });
  }
}

module.exports = {
  getAllApplications,
  updateApplicationStatus,
  getAllReferrals,
  updateReferralStatus,
  createAdminUser,
};