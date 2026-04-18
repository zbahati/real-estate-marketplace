const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usersRepo = require('../db/repos/users');

const SALT_ROUNDS = 10;

async function register(req, res) {
  try {
    const { email, password, full_name, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and  passwordrequired' });
    }

    const existing = await usersRepo.findByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await usersRepo.createUser({
      email,
      password_hash,
      full_name,
      phone,
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await usersRepo.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  register,
  login,
};