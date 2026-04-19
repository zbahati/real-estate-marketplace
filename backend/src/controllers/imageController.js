const imagesRepo = require('../db/repos/images');

async function uploadImage(req, res) {
  try {
    const { listing_id } = req.body;

      if (!listing_id) {
      return res.status(400).json({ message: 'listing_id is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const image = await imagesRepo.addImage(
      listing_id,
      req.file.path
    );

    res.status(201).json(image);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  uploadImage
};