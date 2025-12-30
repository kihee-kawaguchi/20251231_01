const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Mock user data
const users = new Map();
const lifeData = new Map();

// Authentication endpoint
app.post('/api/auth/signup', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (users.has(email)) {
        return res.status(409).json({ error: 'User already exists' });
    }

    const userId = Date.now().toString();
    users.set(email, {
        id: userId,
        name,
        email,
        password, // In production, hash this!
        createdAt: new Date().toISOString(),
        plan: 'free'
    });

    // Initialize life data
    lifeData.set(userId, {
        health: {
            score: 85,
            weeklyActivity: 4,
            sleepAverage: 7.5,
            lastUpdated: new Date().toISOString()
        },
        finance: {
            monthlyBudget: 3240,
            budgetProgress: 65,
            savingsGoal: 68,
            upcomingBills: 3,
            lastUpdated: new Date().toISOString()
        },
        career: {
            skillsDevelopment: 67,
            productivity: 92,
            nextGoalReview: 5,
            lastUpdated: new Date().toISOString()
        },
        wellbeing: {
            stressLevel: 'low',
            meditationStreak: 12,
            workLifeBalance: 78,
            lastUpdated: new Date().toISOString()
        }
    });

    res.status(201).json({
        success: true,
        user: {
            id: userId,
            name,
            email,
            plan: 'free'
        }
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.get(email);
    if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
        success: true,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan
        }
    });
});

// Life data endpoints
app.get('/api/life-overview/:userId', (req, res) => {
    const { userId } = req.params;
    const data = lifeData.get(userId);

    if (!data) {
        return res.status(404).json({ error: 'User data not found' });
    }

    res.json({
        success: true,
        data
    });
});

app.put('/api/health/:userId', (req, res) => {
    const { userId } = req.params;
    const data = lifeData.get(userId);

    if (!data) {
        return res.status(404).json({ error: 'User not found' });
    }

    data.health = {
        ...data.health,
        ...req.body,
        lastUpdated: new Date().toISOString()
    };

    lifeData.set(userId, data);

    res.json({
        success: true,
        health: data.health
    });
});

app.put('/api/finance/:userId', (req, res) => {
    const { userId } = req.params;
    const data = lifeData.get(userId);

    if (!data) {
        return res.status(404).json({ error: 'User not found' });
    }

    data.finance = {
        ...data.finance,
        ...req.body,
        lastUpdated: new Date().toISOString()
    };

    lifeData.set(userId, data);

    res.json({
        success: true,
        finance: data.finance
    });
});

app.put('/api/career/:userId', (req, res) => {
    const { userId } = req.params;
    const data = lifeData.get(userId);

    if (!data) {
        return res.status(404).json({ error: 'User not found' });
    }

    data.career = {
        ...data.career,
        ...req.body,
        lastUpdated: new Date().toISOString()
    };

    lifeData.set(userId, data);

    res.json({
        success: true,
        career: data.career
    });
});

app.put('/api/wellbeing/:userId', (req, res) => {
    const { userId } = req.params;
    const data = lifeData.get(userId);

    if (!data) {
        return res.status(404).json({ error: 'User not found' });
    }

    data.wellbeing = {
        ...data.wellbeing,
        ...req.body,
        lastUpdated: new Date().toISOString()
    };

    lifeData.set(userId, data);

    res.json({
        success: true,
        wellbeing: data.wellbeing
    });
});

// AI Guidance endpoint (Premium feature)
app.post('/api/ai-guidance/:userId', (req, res) => {
    const { userId } = req.params;
    const user = Array.from(users.values()).find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (user.plan === 'free') {
        return res.status(403).json({
            error: 'Upgrade required',
            message: 'AI Guidance is available on Plus plan and above'
        });
    }

    const data = lifeData.get(userId);
    const { question } = req.body;

    // Mock AI response
    const guidance = {
        question,
        response: 'Based on your current life metrics, I recommend focusing on maintaining your healthy habits while slightly increasing your savings rate. Your work-life balance is excellent - keep it up!',
        actionItems: [
            'Increase monthly savings by $200',
            'Maintain current exercise routine',
            'Schedule quarterly career goal review'
        ],
        generatedAt: new Date().toISOString()
    };

    res.json({
        success: true,
        guidance
    });
});

// Subscription management
app.post('/api/subscription/:userId/upgrade', (req, res) => {
    const { userId } = req.params;
    const { plan } = req.body; // 'plus', 'complete', 'coaching'

    const user = Array.from(users.values()).find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    user.plan = plan;

    res.json({
        success: true,
        message: `Successfully upgraded to ${plan} plan`,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            plan: user.plan
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`LifeOS AI Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
