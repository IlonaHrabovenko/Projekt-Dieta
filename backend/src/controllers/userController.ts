
import type { Request, Response } from 'express';
import { pool } from '../config/db.js';

type Gender = 'female' | 'male';
type Goal = 'Redukcja' | 'Utrzymanie' | 'Masa';

export async function updateUserProfile(req: Request, res: Response) {
  try {
    const {
      email,
      age,
      height,
      weight,
      gender,
      activityMultiplier,
      goal
    } = req.body;

    if (
      !email ||
      age === undefined ||
      height === undefined ||
      weight === undefined ||
      !gender ||
      activityMultiplier === undefined ||
      !goal
    ) {
      return res.status(400).json({
        message: 'Wypełnij wszystkie wymagane pola profilu.'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const a = Number(age);
    const h = Number(height);
    const w = Number(weight);
    const activity = Number(activityMultiplier);

    if (
      !Number.isInteger(a) ||
      a < 15 ||
      a > 100 ||
      !Number.isFinite(h) ||
      h < 100 ||
      h > 250 ||
      !Number.isFinite(w) ||
      w < 30 ||
      w > 300 ||
      !Number.isFinite(activity) ||
      activity < 1.2 ||
      activity > 2.5
    ) {
      return res.status(400).json({
        message: 'Podane wartości wieku, wzrostu, wagi lub aktywności są nieprawidłowe.'
      });
    }

    if (gender !== 'female' && gender !== 'male') {
  return res.status(400).json({
    message: 'Nieprawidłowa wartość płci.'
  });
}

    if (!['Redukcja', 'Utrzymanie', 'Masa'].includes(goal)) {
      return res.status(400).json({
        message: 'Nieprawidłowy cel użytkownika.'
      });
    }

    // Wzór Mifflina-St Jeora
    let bmr = 10 * w + 6.25 * h - 5 * a;
    bmr += gender === 'female' ? -161 : 5;
    bmr = Math.round(bmr);

    // Całkowita przemiana materii
    const tdee = Math.round(bmr * activity);

    // Cel kaloryczny
    let targetCalories = tdee;

    if (goal === 'Redukcja') {
      targetCalories = Math.round(tdee * 0.85);
    } else if (goal === 'Masa') {
      targetCalories = Math.round(tdee * 1.15);
    }

    // Makroskładniki
    const targetProtein = Math.round(w * 2);
    const targetFat = Math.round((targetCalories * 0.25) / 9);
    const targetCarbs = Math.max(
      0,
      Math.round(
        (targetCalories - targetProtein * 4 - targetFat * 9) / 4
      )
    );

    // Aktualizujemy istniejącego użytkownika.
    // Nie wykonujemy INSERT, aby nie nadpisać danych logowania.
    const result = await pool.query(
      `
      UPDATE users
      SET
        age = $2,
        gender = $3,
        weight_kg = $4,
        height_cm = $5,
        activity_level = $6,
        goal = $7,
        target_calories = $8,
        target_protein_g = $9,
        target_fat_g = $10,
        target_carbs_g = $11
      WHERE LOWER(email) = $1
      RETURNING
        id,
        email,
        age,
        gender,
        weight_kg,
        height_cm,
        activity_level,
        goal,
        target_calories,
        target_protein_g,
        target_fat_g,
        target_carbs_g
      `,
      [
        normalizedEmail,
        a,
        gender,
        w,
        h,
        activity,
        goal,
        targetCalories,
        targetProtein,
        targetFat,
        targetCarbs
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Nie znaleziono konta użytkownika. Najpierw załóż konto.'
      });
    }

    return res.status(200).json({
      message: 'Profil i zapotrzebowanie zostały zapisane.',
      bmr,
      tdee,
      targetCalories,
      targetProtein,
      targetFat,
      targetCarbs,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Błąd zapisu profilu:', error);

    return res.status(500).json({
      message: 'Wystąpił błąd podczas zapisywania profilu.'
    });
  }
}

export async function getUserProfile(req: Request, res: Response) {
  try {
    const email = String(req.params.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: 'Nie podano adresu e-mail.'
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        email,
        age,
        gender,
        weight_kg,
        height_cm,
        activity_level,
        goal,
        target_calories,
        target_protein_g,
        target_fat_g,
        target_carbs_g
      FROM users
      WHERE LOWER(email) = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Profil użytkownika nie został jeszcze uzupełniony.'
      });
    }

    return res.status(200).json({
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Błąd pobierania profilu:', error);

    return res.status(500).json({
      message: 'Nie udało się pobrać profilu użytkownika.'
    });
  }
}
