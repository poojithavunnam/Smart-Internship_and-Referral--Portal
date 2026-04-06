const { readData, writeData } = require('./dataUtils');

function createId() {
  return `ref_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

async function requestReferral(req, res) {
  try {
    const { internshipId, message } = req.body;
    const userId = req.user.id;

    const internships = await readData('internships.json');
    const internship = internships.find(i => i.id === internshipId);
    if (!internship) {
      return res.status(400).json({ error: 'Internship not found' });
    }

    const referrals = await readData('referrals.json');
    const referral = {
      id: createId(),
      userId,
      internshipId,
      internshipTitle: internship.title,
      company: internship.company,
      message: message.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    referrals.push(referral);
    await writeData('referrals.json', referrals);
    res.json({ message: 'Referral request submitted', referral });
  } catch (error) {
    console.error('Error requesting referral:', error);
    res.status(500).json({ error: 'Failed to submit referral request' });
  }
}

async function getReferrals(req, res) {
  try {
    const userId = req.user.id;
    const referrals = await readData('referrals.json');
    const userReferrals = referrals.filter(ref => ref.userId === userId).sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
    res.json({ referrals: userReferrals });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
}

module.exports = {
  requestReferral,
  getReferrals,
};
