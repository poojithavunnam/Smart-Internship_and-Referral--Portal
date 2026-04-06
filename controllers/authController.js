const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const { readData, writeData } = require('./dataUtils');

const secret = process.env.JWT_SECRET || 'smart_portal_secret_key';
const saltRounds = 10;

function createId() {
  return `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

async function saveBase64File(base64Data, filename) {
  if (!base64Data) return '';
  const base64 = base64Data.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');
  const filePath = path.join(__dirname, '..', 'uploads', filename);
  await fs.writeFile(filePath, buffer);
  return filename;
}

async function register(req, res) {
  const { name, email, password, mobile, linkedin, github, experience, resume } = req.body;
  const users = await readData('users.json');

  const existing = users.find(user => user.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, saltRounds);
  const resumeFilename = resume ? `resume-${createId()}.pdf` : '';
  if (resume) {
    await saveBase64File(resume, resumeFilename);
  }

  const newUser = {
    id: createId(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    mobile: mobile ? mobile.trim() : '',
    linkedin: linkedin ? linkedin.trim() : '',
    github: github ? github.trim() : '',
    resume: resumeFilename,
    experience: experience ? experience.trim() : '',
    role: 'student', // Default role
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  await writeData('users.json', users);

  const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email }, secret, { expiresIn: '12h' });
  res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
}

async function updateProfile(req, res) {
  const { mobile, linkedin, github, experience, resume } = req.body;
  const userId = req.user.id;

  const users = await readData('users.json');
  const userIndex = users.findIndex(user => user.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users[userIndex].mobile = mobile ? mobile.trim() : users[userIndex].mobile;
  users[userIndex].linkedin = linkedin ? linkedin.trim() : users[userIndex].linkedin;
  users[userIndex].github = github ? github.trim() : users[userIndex].github;
  users[userIndex].experience = experience ? experience.trim() : users[userIndex].experience;
  
  if (resume) {
    const resumeFilename = `resume-${userId}-${Date.now()}.pdf`;
    await saveBase64File(resume, resumeFilename);
    users[userIndex].resume = resumeFilename;
  }

  await writeData('users.json', users);

  const user = users[userIndex];
  res.json({ message: 'Profile updated successfully', user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, linkedin: user.linkedin, github: user.github, resume: user.resume, experience: user.experience, role: user.role || 'student' } });
}

async function getProfile(req, res) {
  const userId = req.user.id;
  const users = await readData('users.json');
  const user = users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: { id: user.id, name: user.name, email: user.email, mobile: user.mobile, linkedin: user.linkedin, github: user.github, resume: user.resume, experience: user.experience, role: user.role || 'student' } });
}

async function login(req, res) {
  const { email, password } = req.body;
  const users = await readData('users.json');
  const user = users.find(item => item.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role || 'student' }, secret, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role || 'student' } });
}

module.exports = {
  register,
  login,
  updateProfile,
  getProfile,
};
