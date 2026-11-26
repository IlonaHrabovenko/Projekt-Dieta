import { Router, type Request, type Response } from 'express';
import { registerUser, verifyUserEmail, loginUser } from '../services/authService.js';

const router = Router();

// 1. Endpoint rejestracji
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const result = await registerUser({ name, email, password });

    return res.status(201).json({
      success: true,
      message: result.message,
      user: result.user,
    });

  } catch (error: any) {
    console.error('Błąd podczas rejestracji:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Błąd serwera podczas rejestracji.'
    });
  }
});

// 2. Endpoint weryfikacji e-maila (po kliknięciu w link z maila)
router.get('/verify', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Brak tokenu weryfikacyjnego.'
      });
    }

    const result = await verifyUserEmail(token);
    return res.status(200).json(result); // <-- Tutaj była literówka (było return.status)

  } catch (error: any) {
    console.error('Błąd weryfikacji:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Nie udało się zweryfikować e-maila.'
    });
  }
});

// 3. Endpoint logowania
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Podaj e-mail i hasło.' });
    }

    const result = await loginUser(email, password);
    return res.status(200).json({ success: true, ...result });

  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;