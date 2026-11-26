import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import dns from 'dns';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db.js';
// import { transporter } from '../config/mailer.js'; // Wykomentowane, bo nie wysyłamy maili

const resolveMx = promisify(dns.resolveMx);

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

async function checkEmailDomain(email: string): Promise<boolean> {
  try {
    const domain = email.split('@')[1];
    if (!domain) return false;
    const addresses = await resolveMx(domain);
    return addresses && addresses.length > 0;
  } catch (err) {
    return false;
  }
}

export async function registerUser(input: RegisterInput) {
  if (!input.name || !input.email || !input.password) {
    throw new Error('Wypełnij wszystkie pola.');
  }

  if (!validator.isEmail(input.email)) {
    throw new Error('Podany adres e-mail jest nieprawidłowy.');
  }

  const isDomainValid = await checkEmailDomain(input.email);
  if (!isDomainValid) {
    throw new Error('Domena tego e-maila nie istnieje lub nie obsługuje poczty.');
  }

  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [input.email]);
  if (existingUser.rows.length > 0) {
    throw new Error('Ten adres e-mail jest już zarejestrowany.');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  
  // TYMCZASOWO: Pomijamy wysyłkę maila, konto od razu dostaje is_verified = TRUE
  const res = await pool.query(
    `INSERT INTO users (name, email, password_hash, is_verified)
     VALUES ($1, $2, $3, TRUE)
     RETURNING id, name, email, created_at`,
    [input.name, input.email, hashedPassword]
  );

  return {
    user: res.rows[0],
    message: 'Konto utworzone pomyślnie! Możesz się zalogować.'
  };
}

export async function verifyUserEmail(token: string) {
  // Funkcja wyłączona na czas testów
  return { success: true, message: 'Weryfikacja wyłączona w trybie testowym.' };
}

export async function loginUser(email: string, password: string) {
  const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (userRes.rows.length === 0) throw new Error('Błędny email lub hasło');

  const user = userRes.rows[0];

  // TYMCZASOWO: Wyłączamy blokadę dla niezweryfikowanych kont
  /*
  if (!user.is_verified) {
    throw new Error('Najpierw potwierdź swój adres e-mail (sprawdź skrzynkę pocztową).');
  }
  */

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error('Błędny email lub hasło');

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  return { 
    token, 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      targetCalories: user.target_calories 
    } 
  };
}