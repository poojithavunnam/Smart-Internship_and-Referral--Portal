const { readData } = require('./dataUtils');

async function getInternships(req, res) {
  try {
    const internships = await readData('internships.json');
    res.json({ internships });
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ error: 'Failed to fetch internships' });
  }
}

module.exports = {
  getInternships,
};
