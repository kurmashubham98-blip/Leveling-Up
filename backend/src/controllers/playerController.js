const pool = require('../config/db');

// Get player profile with stats
exports.getProfile = async (req, res) => {
  try {
    const [players] = await pool.query(`
      SELECT p.*, r.name as rank_name, r.color as rank_color,
             ps.strength, ps.agility, ps.intelligence, ps.vitality, ps.luck
      FROM players p
      JOIN ranks r ON p.rank_id = r.id
      JOIN player_stats ps ON p.id = ps.player_id
      WHERE p.id = ?
    `, [req.player.id]);

    if (players.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const player = players[0];
    delete player.password_hash;

    res.json({ player });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Allocate stat points
exports.allocateStats = async (req, res) => {
  const { strength, agility, intelligence, vitality, luck } = req.body;
  const totalPoints = (strength || 0) + (agility || 0) + (intelligence || 0) + (vitality || 0) + (luck || 0);

  try {
    // Check available stat points
    const [players] = await pool.query('SELECT stat_points FROM players WHERE id = ?', [req.player.id]);
    
    if (players[0].stat_points < totalPoints) {
      return res.status(400).json({ error: 'Not enough stat points' });
    }

    // Update stats
    await pool.query(`
      UPDATE player_stats SET
        strength = strength + ?,
        agility = agility + ?,
        intelligence = intelligence + ?,
        vitality = vitality + ?,
        luck = luck + ?
      WHERE player_id = ?
    `, [strength || 0, agility || 0, intelligence || 0, vitality || 0, luck || 0, req.player.id]);

    // Deduct stat points
    await pool.query('UPDATE players SET stat_points = stat_points - ? WHERE id = ?', [totalPoints, req.player.id]);

    res.json({ message: 'Stats allocated successfully' });
  } catch (error) {
    console.error('Allocate stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get inventory
exports.getInventory = async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT i.*, inv.quantity, inv.acquired_at
      FROM inventory inv
      JOIN items i ON inv.item_id = i.id
      WHERE inv.player_id = ?
    `, [req.player.id]);

    res.json({ inventory: items });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get shop items
exports.getShop = async (req, res) => {
  try {
    const [items] = await pool.query('SELECT * FROM items');
    res.json({ items });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Buy item
exports.buyItem = async (req, res) => {
  const { itemId } = req.params;

  try {
    const [items] = await pool.query('SELECT * FROM items WHERE id = ?', [itemId]);
    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = items[0];
    const [players] = await pool.query('SELECT gold FROM players WHERE id = ?', [req.player.id]);

    if (players[0].gold < item.price) {
      return res.status(400).json({ error: 'Not enough gold' });
    }

    // Deduct gold and add to inventory
    await pool.query('UPDATE players SET gold = gold - ? WHERE id = ?', [item.price, req.player.id]);
    
    // Check if item exists in inventory
    const [existing] = await pool.query(
      'SELECT id FROM inventory WHERE player_id = ? AND item_id = ?',
      [req.player.id, itemId]
    );

    if (existing.length > 0) {
      await pool.query('UPDATE inventory SET quantity = quantity + 1 WHERE id = ?', [existing[0].id]);
    } else {
      await pool.query('INSERT INTO inventory (player_id, item_id) VALUES (?, ?)', [req.player.id, itemId]);
    }

    res.json({ message: 'Item purchased successfully' });
  } catch (error) {
    console.error('Buy item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

