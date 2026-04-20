const requestsRepo = require('../db/repos/requests');
const listingsRepo = require('../db/repos/listings');

async function createRequest(req, res) {
  try {
    const { listing_id, message } = req.body;
    const sender_id = req.user.id;

    // get listing to know owner
    const listing = await listingsRepo.getListingById(listing_id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const request = await requestsRepo.createRequest({
      listing_id,
      sender_id,
      owner_id: listing.owner_id,
      message
    });

    res.status(201).json(request);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function getMyRequests(req, res) {
  try {
    const owner_id = req.user.id;

    const requests = await requestsRepo.getRequestsForOwner(owner_id);

    res.json(requests);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function updateRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await requestsRepo.updateRequestStatus(
      id,
      req.user.id,
      status
    );

    if (!updated) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // 🔥 IMPORTANT: unlock contact when accepted (TEMP logic)
    if (status === 'accepted') {
      await require('../db').query(
        `UPDATE requests 
         SET contact_unlocked = true 
         WHERE id = $1`,
        [id]
      );
    }

    res.json({
      ...updated,
      contact_unlocked: status === 'accepted' ? true : updated.contact_unlocked
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createRequest,
  getMyRequests,
    updateRequestStatus
};