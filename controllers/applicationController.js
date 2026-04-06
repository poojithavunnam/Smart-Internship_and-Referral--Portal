const { readData, writeData } = require('./dataUtils');
const fs = require('fs').promises;
const path = require('path');

function createId() {
  return `app_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

async function saveBase64File(base64Data, filename) {
  if (!base64Data) return '';
  const base64 = base64Data.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  await fs.writeFile(filePath, buffer);
  return filename;
}

async function applyForInternship(req, res) {
  try {
    const { internshipId, skills, coverLetter, linkedin, resume } = req.body;
    const userId = req.user.id;

    const internships = await readData('internships.json');
    const internship = internships.find(i => i.id === internshipId);
    if (!internship) {
      return res.status(400).json({ error: 'Internship not found' });
    }

    const applications = await readData('applications.json');
    const resumeFilename = resume ? `resume-app-${createId()}.pdf` : '';
    if (resume) {
      await saveBase64File(resume, resumeFilename);
    }

    const application = {
      id: createId(),
      userId,
      internshipId,
      internshipTitle: internship.title,
      company: internship.company,
      skills: skills.trim(),
      coverLetter: coverLetter ? coverLetter.trim() : '',
      linkedin: linkedin ? linkedin.trim() : '',
      resume: resumeFilename,
      status: 'pending',
      appliedAt: new Date().toISOString()
    };

    applications.push(application);
    await writeData('applications.json', applications);
    res.json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Error applying for internship:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
}

async function getApplications(req, res) {
  try {
    const userId = req.user.id;
    const applications = await readData('applications.json');
    const userApplications = applications.filter(app => app.userId === userId).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    res.json({ applications: userApplications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
}

module.exports = {
  applyForInternship,
  getApplications,
};
