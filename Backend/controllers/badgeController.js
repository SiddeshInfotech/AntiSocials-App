const badgeService = require('../services/badgeService');

exports.getBadges = async (req, res) => {
    try {
        const userId = req.user.id;
        const badges = await badgeService.getUserBadges(userId);

        const unlockedCount = badges.filter(b => b.isUnlocked).length;
        const totalCount = badges.length;

        res.json({
            badges,
            stats: {
                unlockedCount,
                totalCount,
                lockedCount: totalCount - unlockedCount
            }
        });
    } catch (error) {
        console.error('getBadges error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
