const { db } = require('../db/database');
const { verifyPassword, generateAccessToken, generateRefreshToken } = require('../utils/security');
const { z } = require('zod');

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8)
});

const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { username, password } = validatedData;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const validPassword = await verifyPassword(user.password, password);
      if (!validPassword) {
        // Audit log for failed attempt
        db.run(`INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)`, 
          [user.id, 'FAILED_LOGIN', req.ip, `Failed login attempt for user: ${username}`]);
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Set Refresh Token in HttpOnly cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Audit log for successful login
      db.run(`INSERT INTO audit_logs (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)`, 
        [user.id, 'LOGIN', req.ip, 'User logged in successfully']);

      res.status(200).json({
        accessToken,
        user: { id: user.id, username: user.username, role: user.role }
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Server error' });
  }
};

const logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = { login, logout };
