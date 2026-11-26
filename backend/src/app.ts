
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import {
  registerUser,
  loginUser,
  verifyUserEmail
} from './services/authService.js';


import {
  generateDailyMealPlan,
  getDailyMealPlan,
  getSavedMealPlans,
  getMealPlanById
} from './services/dietService.js';


import {
  updateUserProfile,
  getUserProfile
} from './controllers/userController.js';

import { pool } from './config/db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// REJESTRACJA
app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await registerUser(req.body);

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// WERYFIKACJA E-MAILA
app.get('/api/auth/verify', async (req, res) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(400).send('Brak tokenu weryfikacyjnego.');
    }

    const result = await verifyUserEmail(token);

    return res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; margin-top: 50px;">
          <h1>Sukces!</h1>
          <p>${result.message}</p>
          <p>Możesz zamknąć tę kartę i zalogować się w aplikacji.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    return res.status(400).send(`
      <html>
        <body style="font-family: Arial; text-align: center; margin-top: 50px;">
          <h1>Błąd weryfikacji</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
});

// LOGOWANIE
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const data = await loginUser(email, password);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
});

// ZAPIS PROFILU
app.post('/api/user/profile', updateUserProfile);

// POBRANIE PROFILU
app.get('/api/user/profile/:email', getUserProfile);

// GENEROWANIE JADŁOSPISU PO ID UŻYTKOWNIKA
app.post('/api/diet/plan/:userId/generate', async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: 'Nieprawidłowe ID użytkownika.'
      });
    }

    const plan = await generateDailyMealPlan(userId, req.body);

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error: any) {
    console.error('Błąd generowania jadłospisu:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POBRANIE ZAPISANEGO JADŁOSPISU PO ID UŻYTKOWNIKA
app.get('/api/diet/plan/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        message: 'Nieprawidłowe ID użytkownika.'
      });
    }

    const plan = await getDailyMealPlan(userId);

    if (!plan) {
      return res.status(404).json({
        message: 'Nie znaleziono jadłospisu na dzisiejszy dzień.'
      });
    }

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error: any) {
    console.error('Błąd pobierania jadłospisu:', error);

    return res.status(500).json({
      success: false,
      message: 'Nie udało się pobrać jadłospisu.'
    });
  }
});

// POBRANIE LISTY ZAPISANYCH JADŁOSPISÓW
app.get('/api/diet/plans/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowe ID użytkownika.'
      });
    }

    const plans = await getSavedMealPlans(userId);

    return res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error: any) {
    console.error('Błąd pobierania zapisanych jadłospisów:', error);

    return res.status(500).json({
      success: false,
      message: 'Nie udało się pobrać zapisanych jadłospisów.'
    });
  }
});


app.get('/api/diet/plans/:userId/:planId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const planId = Number(req.params.planId);

    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !Number.isInteger(planId) ||
      planId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Nieprawidłowe ID użytkownika lub jadłospisu.'
      });
    }

    const plan = await getMealPlanById(userId, planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Nie znaleziono zapisanego jadłospisu.'
      });
    }

    return res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error: any) {
    console.error('Błąd pobierania archiwalnego jadłospisu:', error);

    return res.status(500).json({
      success: false,
      message: 'Nie udało się pobrać archiwalnego jadłospisu.'
    });
  }
});


// KOMPATYBILNOŚĆ ZE STARYM GENERATORS​​CREEN
// POST /api/meal-plan/generate
// Oczekuje email, mealsCount, exclusions.
app.post('/api/meal-plan/generate', async (req, res) => {
  try {
    const { email, mealsCount, exclusions } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'Nie podano adresu e-mail użytkownika.'
      });
    }

    const userResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Nie znaleziono użytkownika.'
      });
    }

    const userId = Number(userResult.rows[0].id);

    const plan = await generateDailyMealPlan(userId, {
      mealsCount,
      exclusions
    });

    return res.status(200).json({
      success: true,
      ...plan
    });
  } catch (error: any) {
    console.error('Błąd generowania jadłospisu:', error);

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// SERWER — tylko jedno uruchomienie
const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
