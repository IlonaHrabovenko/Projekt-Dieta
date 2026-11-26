import { pool } from '../config/db.js';

type GenerateOptions = {
  mealsCount?: number;
  exclusions?: string[];
};

type Recipe = {
  id: number;
  name: string;
  description: string | null;
  instructions: string | null;
  servings: number;
  preparation_time: number | null;
  category: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  ingredients_text: string;
};

type Targets = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

function calculateScore(
  calories: number,
  protein: number,
  fat: number,
  carbs: number,
  targets: Targets
): number {
  const deviation = (actual: number, target: number): number => {
    if (target <= 0) return 0;
    return Math.abs(actual - target) / target;
  };

  const totalDeviation =
    deviation(calories, targets.calories) * 0.5 +
    deviation(protein, targets.protein) * 0.2 +
    deviation(fat, targets.fat) * 0.15 +
    deviation(carbs, targets.carbs) * 0.15;

  return Math.max(
    0,
    Math.round((100 - totalDeviation * 100) * 100) / 100
  );
}

function getMealType(index: number, mealsCount: number): string {
  if (mealsCount === 2) {
    return ['Śniadanie', 'Obiad'][index] ?? `Posiłek ${index + 1}`;
  }

  if (mealsCount === 3) {
    return ['Śniadanie', 'Obiad', 'Kolacja'][index] ?? `Posiłek ${index + 1}`;
  }

  if (mealsCount === 4) {
    return ['Śniadanie', 'II śniadanie', 'Obiad', 'Kolacja'][index] ?? `Posiłek ${index + 1}`;
  }

  if (mealsCount === 5) {
    return ['Śniadanie', 'II śniadanie', 'Obiad', 'Podwieczorek', 'Kolacja'][index] ?? `Posiłek ${index + 1}`;
  }

  return [
    'Śniadanie',
    'II śniadanie',
    'Obiad',
    'Podwieczorek',
    'Kolacja',
    'Dodatkowy posiłek'
  ][index] ?? `Posiłek ${index + 1}`;
}

// OPTYMALIZACJA LOKALNA – HILL CLIMBING

function optimizeSelection(
  initialSelection: Recipe[],
  recipes: Recipe[],
  targets: Targets
): Recipe[] {
  let bestSelection = [...initialSelection];

  const getScore = (selection: Recipe[]): number => {
    const totals = selection.reduce(
      (sum, recipe) => ({
        calories: sum.calories + recipe.calories,
        protein: sum.protein + recipe.protein,
        fat: sum.fat + recipe.fat,
        carbs: sum.carbs + recipe.carbohydrates
      }),
      {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0
      }
    );

    return calculateScore(
      totals.calories,
      totals.protein,
      totals.fat,
      totals.carbs,
      targets
    );
  };

  let currentScore = getScore(bestSelection);

  const maxIterations = 100;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let improvedSelection: Recipe[] | null = null;
    let improvedScore = currentScore;

    // Próbujemy podmienić każdy posiłek na inny przepis.

    for (let index = 0; index < bestSelection.length; index++) {
      const currentRecipe = bestSelection[index];

      if (!currentRecipe) continue;

      for (const candidate of recipes) {
        // Nie pozwalamy na powtórzenie tego samego przepisu.

        if (
          bestSelection.some(
            (recipe, selectedIndex) =>
              selectedIndex !== index &&
              recipe.id === candidate.id
          )
        ) {
          continue;
        }

        // Jeśli pierwszy posiłek jest śniadaniem,
        // zachowujemy kategorię śniadaniową.

        if (
          index === 0 &&
          (
            (currentRecipe.category || '').toLowerCase().includes('śniadanie') ||
            (currentRecipe.category || '').toLowerCase().includes('sniadanie') ||
            (currentRecipe.category || '').toLowerCase().includes('breakfast')
          )
        ) {
          const category = (candidate.category || '').toLowerCase();

          const isBreakfast =
            category.includes('śniadanie') ||
            category.includes('sniadanie') ||
            category.includes('breakfast');

          if (!isBreakfast) continue;
        }

        const testSelection = [...bestSelection];
        testSelection[index] = candidate;

        const testScore = getScore(testSelection);

        // Zapamiętujemy najlepszą poprawiającą wynik podmianę.

        if (testScore > improvedScore) {
          improvedScore = testScore;
          improvedSelection = testSelection;
        }
      }
    }

    // Jeśli żadna podmiana nie poprawia wyniku,
    // osiągnęliśmy lokalne optimum.

    if (improvedSelection === null) {
      break;
    }

    bestSelection = improvedSelection;
    currentScore = improvedScore;
  }

  return bestSelection;
}

// GENEROWANIE JADŁOSPISU

export async function generateDailyMealPlan(
  userId: number,
  options: GenerateOptions = {}
) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Nieprawidłowe ID użytkownika.');
  }

  const mealsCount = Math.min(
    6,
    Math.max(2, Number(options.mealsCount) || 4)
  );

  const exclusions = Array.isArray(options.exclusions)
    ? options.exclusions
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    : [];

  // Pobieranie zapotrzebowania użytkownika z bazy danych.

  const userResult = await pool.query(
    `
    SELECT
      id,
      target_calories,
      target_protein_g,
      target_fat_g,
      target_carbs_g
    FROM users
    WHERE id = $1
    `,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('Nie znaleziono użytkownika.');
  }

  const user = userResult.rows[0];

  const targets: Targets = {
    calories: Number(user.target_calories) || 0,
    protein: Number(user.target_protein_g) || 0,
    fat: Number(user.target_fat_g) || 0,
    carbs: Number(user.target_carbs_g) || 0
  };

  if (!Number.isFinite(targets.calories) || targets.calories <= 0) {
    throw new Error(
      'Użytkownik nie ma zapisanego zapotrzebowania. Uzupełnij profil.'
    );
  }

  // Pobieranie przepisów i obliczanie wartości odżywczych.
  // Wartości produktów są podawane na 100 g.
  // Wartości przepisu dzielimy przez liczbę porcji.

  const recipesResult = await pool.query(
    `
    SELECT
      r.id,
      r.name,
      r.description,
      r.instructions,
      r.servings,
      r.preparation_time,
      r.category,

      COALESCE(
        SUM(
          COALESCE(p.calories, 0) *
          COALESCE(ri.quantity_g, 0) / 100.0
        ),
        0
      ) / GREATEST(COALESCE(r.servings, 1), 1) AS calories,

      COALESCE(
        SUM(
          COALESCE(p.protein, 0) *
          COALESCE(ri.quantity_g, 0) / 100.0
        ),
        0
      ) / GREATEST(COALESCE(r.servings, 1), 1) AS protein,

      COALESCE(
        SUM(
          COALESCE(p.fat, 0) *
          COALESCE(ri.quantity_g, 0) / 100.0
        ),
        0
      ) / GREATEST(COALESCE(r.servings, 1), 1) AS fat,

      COALESCE(
        SUM(
          COALESCE(p.carbohydrates, 0) *
          COALESCE(ri.quantity_g, 0) / 100.0
        ),
        0
      ) / GREATEST(COALESCE(r.servings, 1), 1) AS carbohydrates,

      COALESCE(
        STRING_AGG(LOWER(p.name), ' '),
        ''
      ) AS ingredients_text

    FROM recipes r

    LEFT JOIN recipe_ingredients ri
      ON ri.recipe_id = r.id

    LEFT JOIN products p
      ON p.id = ri.product_id

    GROUP BY
      r.id,
      r.name,
      r.description,
      r.instructions,
      r.servings,
      r.preparation_time,
      r.category

    HAVING COUNT(ri.id) > 0

    ORDER BY r.id
    `
  );

  let recipes: Recipe[] = recipesResult.rows.map((row: any) => ({
    ...row,
    id: Number(row.id),
    servings: Number(row.servings) || 1,
    calories: Number(row.calories) || 0,
    protein: Number(row.protein) || 0,
    fat: Number(row.fat) || 0,
    carbohydrates: Number(row.carbohydrates) || 0,
    ingredients_text: row.ingredients_text || ''
  }));

  if (recipes.length === 0) {
    throw new Error(
      'Brak przepisów z przypisanymi składnikami.'
    );
  }

  // Filtrowanie wykluczonych składników i nazw.

  if (exclusions.length > 0) {
    recipes = recipes.filter((recipe) => {
      const text = [
        recipe.name,
        recipe.description || '',
        recipe.category || '',
        recipe.ingredients_text
      ]
        .join(' ')
        .toLowerCase();

      return !exclusions.some((exclusion) =>
        text.includes(exclusion)
      );
    });
  }

  if (recipes.length < mealsCount) {
    throw new Error(
      `Po uwzględnieniu wykluczeń dostępnych jest tylko ${recipes.length} różnych przepisów. Potrzeba ${mealsCount}.`
    );
  }

  // W pierwszej kolejności próbujemy wybrać śniadanie.

  const breakfasts = recipes.filter((recipe) => {
    const category = (recipe.category || '').toLowerCase();

    return (
      category.includes('śniadanie') ||
      category.includes('sniadanie') ||
      category.includes('breakfast')
    );
  });

  const selected: Recipe[] = [];
  const remaining = [...recipes];

  let totalCalories = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;

  // Algorytm zachłanny dobierający przepisy do zapotrzebowania.

  for (let index = 0; index < mealsCount; index++) {
    const candidates =
      index === 0 && breakfasts.length > 0
        ? remaining.filter((recipe) =>
            breakfasts.some(
              (breakfast) => breakfast.id === recipe.id
            )
          )
        : remaining;

    let bestRecipe: Recipe | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const recipe of candidates) {
      const nextCalories = totalCalories + recipe.calories;
      const nextProtein = totalProtein + recipe.protein;
      const nextFat = totalFat + recipe.fat;
      const nextCarbs = totalCarbs + recipe.carbohydrates;

      const mealsLeft = mealsCount - index - 1;

      const remainingCalories = targets.calories - nextCalories;
      const remainingProtein = targets.protein - nextProtein;
      const remainingFat = targets.fat - nextFat;
      const remainingCarbs = targets.carbs - nextCarbs;

      const penalty =
        (
          Math.abs(
            remainingCalories -
            (targets.calories / mealsCount) * mealsLeft
          ) / Math.max(targets.calories, 1)
        ) * 0.5 +
        (
          Math.abs(
            remainingProtein -
            (targets.protein / mealsCount) * mealsLeft
          ) / Math.max(targets.protein, 1)
        ) * 0.2 +
        (
          Math.abs(
            remainingFat -
            (targets.fat / mealsCount) * mealsLeft
          ) / Math.max(targets.fat, 1)
        ) * 0.15 +
        (
          Math.abs(
            remainingCarbs -
            (targets.carbs / mealsCount) * mealsLeft
          ) / Math.max(targets.carbs, 1)
        ) * 0.15;

      if (penalty < bestScore) {
        bestScore = penalty;
        bestRecipe = recipe;
      }
    }

    if (bestRecipe === null) {
      throw new Error(
        'Nie udało się dobrać kolejnego posiłku.'
      );
    }

    const recipe = bestRecipe;

    selected.push(recipe);

    totalCalories += recipe.calories;
    totalProtein += recipe.protein;
    totalFat += recipe.fat;
    totalCarbs += recipe.carbohydrates;

    const selectedIndex = remaining.findIndex(
      (item) => item.id === recipe.id
    );

    if (selectedIndex >= 0) {
      remaining.splice(selectedIndex, 1);
    }
  }
    // Optymalizacja lokalna wybranego jadłospisu.

    const optimizedSelection = optimizeSelection(
      selected,
      recipes,
      targets
    );
  
    // Zastępujemy początkowy wybór zoptymalizowanym.
  
    selected.splice(
      0,
      selected.length,
      ...optimizedSelection
    );
  
    // Ponownie obliczamy sumę wartości odżywczych.
  
    totalCalories = 0;
    totalProtein = 0;
    totalFat = 0;
    totalCarbs = 0;
  
    for (const recipe of selected) {
      totalCalories += recipe.calories;
      totalProtein += recipe.protein;
      totalFat += recipe.fat;
      totalCarbs += recipe.carbohydrates;
    }
  totalCalories = Number(totalCalories.toFixed(2));
  totalProtein = Number(totalProtein.toFixed(2));
  totalFat = Number(totalFat.toFixed(2));
  totalCarbs = Number(totalCarbs.toFixed(2));

  const score = calculateScore(
    totalCalories,
    totalProtein,
    totalFat,
    totalCarbs,
    targets
  );

  // Zapisywanie planu w transakcji.

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const planResult = await client.query(
      `
      INSERT INTO meal_plans (
        user_id,
        plan_date,
        total_calories,
        total_protein,
        total_fat,
        total_carbohydrates,
        created_at
      )
      VALUES (
  $1,
  (NOW() AT TIME ZONE 'Europe/Warsaw')::date,
  $2,
  $3,
  $4,
  $5,
  NOW()
)

      ON CONFLICT (user_id, plan_date)

      DO UPDATE SET
        total_calories = EXCLUDED.total_calories,
        total_protein = EXCLUDED.total_protein,
        total_fat = EXCLUDED.total_fat,
        total_carbohydrates = EXCLUDED.total_carbohydrates,
        created_at = NOW()

      RETURNING id, user_id, plan_date
      `,
      [
        userId,
        totalCalories,
        totalProtein,
        totalFat,
        totalCarbs
      ]
    );

    const plan = planResult.rows[0];

    // Usuwamy poprzednie pozycje planu z tego dnia.

    await client.query(
      `
      DELETE FROM meal_plan_items
      WHERE meal_plan_id = $1
      `,
      [plan.id]
    );

    // Zapisujemy wybrane posiłki.

    for (let index = 0; index < selected.length; index++) {
      const recipe = selected[index];

      if (!recipe) {
        throw new Error(
          `Nie znaleziono przepisu o indeksie ${index}.`
        );
      }

      const mealType = getMealType(index, mealsCount);

      await client.query(
        `
        INSERT INTO meal_plan_items (
          meal_plan_id,
          recipe_id,
          meal_type,
          servings_multiplier
        )
        VALUES ($1, $2, $3, $4)
        `,
        [plan.id, recipe.id, mealType, 1.0]
      );
    }

    await client.query('COMMIT');

    return {
      planId: Number(plan.id),
      userId,
      planDate: plan.plan_date,
      targets,

      achieved: {
        calories: totalCalories,
        protein: totalProtein,
        fat: totalFat,
        carbs: totalCarbs,
        score
      },

      plan: selected.map((recipe, index) => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        instructions: recipe.instructions,
        category: recipe.category,
        preparationTime: recipe.preparation_time,
        servings: recipe.servings,

        mealType: getMealType(index, mealsCount),

        calories: Number(recipe.calories.toFixed(2)),
        protein: Number(recipe.protein.toFixed(2)),
        fat: Number(recipe.fat.toFixed(2)),
        carbohydrates: Number(
          recipe.carbohydrates.toFixed(2)
        )
      }))
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// POBIERANIE DZISIEJSZEGO JADŁOSPISU


export async function getDailyMealPlan(userId: number) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Nieprawidłowe ID użytkownika.');
  }

  const planResult = await pool.query(
    `
    SELECT
      id,
      user_id,
      plan_date,
      total_calories,
      total_protein,
      total_fat,
      total_carbohydrates

    FROM meal_plans

    WHERE user_id = $1
  AND plan_date = (NOW() AT TIME ZONE 'Europe/Warsaw')::date

    ORDER BY created_at DESC
    LIMIT 1
    `,
    [userId]
  );

  if (planResult.rows.length === 0) {
    return null;
  }

  const plan = planResult.rows[0];

  // Pobieramy posiłki razem z obliczonymi kaloriami i makrami.

  const itemsResult = await pool.query(
    `
    SELECT
      mpi.id,
      mpi.meal_type,
      mpi.servings_multiplier,

      r.id AS recipe_id,
      r.name,
      r.description,
      r.instructions,
      r.preparation_time,
r.servings,
r.category,

(
  SELECT COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'name', p2.name,
        'quantityG', ri2.quantity_g
      )
      ORDER BY p2.name
    ),
    '[]'::json
  )
  FROM recipe_ingredients ri2
  JOIN products p2
    ON p2.id = ri2.product_id
  WHERE ri2.recipe_id = r.id
) AS ingredients,

      COALESCE(
        SUM(
          COALESCE(p.calories, 0) *
          COALESCE(ri.quantity_g, 0) / 100.0
        ),
        0
      ) / GREATEST(COALESCE(r.servings, 1), 1)
        * COALESCE(mpi.servings_multiplier, 1) AS calories,

      COALESCE(
        SUM(
          COALESCE(p.protein, 0) *
          COALESCE(ri.quantity_g, 0) / 100.0
        ),
        0
      ) / GREATEST(COALESCE(r.servings, 1), 1)
        * COALESCE(mpi.servings_multiplier, 1) AS protein,

      COALESCE(
        SUM(
          COALESCE(p.fat, 0) *
          COALESCE(ri.quantity_g, 0) / 100.0
        ),
        0
      ) / GREATEST(COALESCE(r.servings, 1), 1)
        * COALESCE(mpi.servings_multiplier, 1) AS fat,

      COALESCE(
        SUM(
          COALESCE(p.carbohydrates, 0) *
          COALESCE(ri.quantity_g, 0) / 100.0
        ),
        0
      ) / GREATEST(COALESCE(r.servings, 1), 1)
        * COALESCE(mpi.servings_multiplier, 1) AS carbohydrates

    FROM meal_plan_items mpi

    JOIN recipes r
      ON r.id = mpi.recipe_id

    LEFT JOIN recipe_ingredients ri
      ON ri.recipe_id = r.id

    LEFT JOIN products p
      ON p.id = ri.product_id

    WHERE mpi.meal_plan_id = $1

    GROUP BY
      mpi.id,
      mpi.meal_type,
      mpi.servings_multiplier,
      r.id,
      r.name,
      r.description,
      r.instructions,
      r.preparation_time,
      r.servings,
      r.category

    ORDER BY mpi.id
    `,
    [plan.id]
  );

  return {
    planId: Number(plan.id),
    userId: Number(plan.user_id),
    planDate: plan.plan_date,

    totals: {
      calories: Number(plan.total_calories) || 0,
      protein: Number(plan.total_protein) || 0,
      fat: Number(plan.total_fat) || 0,
      carbs: Number(plan.total_carbohydrates) || 0
    },

    meals: itemsResult.rows.map((meal: any) => ({
      id: Number(meal.recipe_id),
      mealItemId: Number(meal.id),
      name: meal.name,
      description: meal.description,
      ingredients: meal.ingredients || [],
      category: meal.category || meal.meal_type,
      mealType: meal.meal_type,
      preparationTime: meal.preparation_time,
      servings: Number(meal.servings) || 1,
      servingsMultiplier:
        Number(meal.servings_multiplier) || 1,
      calories: Number(meal.calories) || 0,
      protein: Number(meal.protein) || 0,
      fat: Number(meal.fat) || 0,
      carbohydrates: Number(meal.carbohydrates) || 0
    }))
  };
}

// POBIERANIE ARCHIWUM JADŁOSPISÓW

export async function getSavedMealPlans(userId: number) {
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('Nieprawidłowe ID użytkownika.');
  }

  const result = await pool.query(
    `
    SELECT
      id,
      user_id,
      plan_date,
      total_calories,
      total_protein,
      total_fat,
      total_carbohydrates,
      created_at

    FROM meal_plans

    WHERE user_id = $1

    ORDER BY created_at DESC
    `,
    [userId]
  );

  return result.rows.map((plan: any) => ({
    id: Number(plan.id),
    userId: Number(plan.user_id),
    planDate: plan.plan_date,
    createdAt: plan.created_at,

    totals: {
      calories: Number(plan.total_calories) || 0,
      protein: Number(plan.total_protein) || 0,
      fat: Number(plan.total_fat) || 0,
      carbs: Number(plan.total_carbohydrates) || 0
    }
  }));
}

// POBIERANIE KONKRETNEGO JADŁOSPISU Z ARCHIWUM


export async function getMealPlanById(
  userId: number,
  planId: number
) {
  if (
    !Number.isInteger(userId) ||
    userId <= 0 ||
    !Number.isInteger(planId) ||
    planId <= 0
  ) {
    throw new Error(
      'Nieprawidłowe ID użytkownika lub jadłospisu.'
    );
  }

  // Pobieramy wybrany plan należący do danego użytkownika.

  const planResult = await pool.query(
    `
    SELECT
      mp.id,
      mp.user_id,
      mp.plan_date,
      mp.total_calories,
      mp.total_protein,
      mp.total_fat,
      mp.total_carbohydrates,

      u.target_calories,
      u.target_protein_g,
      u.target_fat_g,
      u.target_carbs_g

    FROM meal_plans mp

    JOIN users u
      ON u.id = mp.user_id

    WHERE mp.id = $1
      AND mp.user_id = $2
    `,
    [planId, userId]
  );

  if (planResult.rows.length === 0) {
    return null;
  }

  const plan = planResult.rows[0];

  // Pobieramy posiłki z wybranego jadłospisu.

  const itemsResult = await pool.query(
    `
    SELECT
      mpi.id,
      mpi.meal_type,
      mpi.servings_multiplier,

      r.id AS recipe_id,
      r.name,
      r.description,
      r.instructions,
      r.preparation_time,
r.servings,
r.category,

(
  SELECT COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'name', p2.name,
        'quantityG', ri2.quantity_g
      )
      ORDER BY p2.name
    ),
    '[]'::json
  )
  FROM recipe_ingredients ri2
  JOIN products p2
    ON p2.id = ri2.product_id
  WHERE ri2.recipe_id = r.id
) AS ingredients,

      COALESCE(
        SUM(
          COALESCE(p.calories, 0) *
          COALESCE(ri.quantity_g, 0) / 100.0
        ),
        0
      ) / GREATEST(COALESCE(r.servings, 1), 1)
        * COALESCE(mpi.servings_multiplier, 1) AS calories,

      COALESCE(
        SUM(
          COALESCE(p.protein, 0) *
          COALESCE(ri.quantity_g, 0) / 100.0
        ),
        0
      ) / GREATEST(COALESCE(r.servings, 1), 1)
        * COALESCE(mpi.servings_multiplier, 1) AS protein,

      COALESCE(
        SUM(
          COALESCE(p.fat, 0) *
          COALESCE(ri.quantity_g, 0) / 100.0
        ),
        0
      ) / GREATEST(COALESCE(r.servings, 1), 1)
        * COALESCE(mpi.servings_multiplier, 1) AS fat,

      COALESCE(
        SUM(
          COALESCE(p.carbohydrates, 0) *
          COALESCE(ri.quantity_g, 0) / 100.0
        ),
        0
      ) / GREATEST(COALESCE(r.servings, 1), 1)
        * COALESCE(mpi.servings_multiplier, 1) AS carbohydrates

    FROM meal_plan_items mpi

    JOIN recipes r
      ON r.id = mpi.recipe_id

    LEFT JOIN recipe_ingredients ri
      ON ri.recipe_id = r.id

    LEFT JOIN products p
      ON p.id = ri.product_id

    WHERE mpi.meal_plan_id = $1

    GROUP BY
      mpi.id,
      mpi.meal_type,
      mpi.servings_multiplier,
      r.id,
      r.name,
      r.description,
      r.instructions,
      r.preparation_time,
      r.servings,
      r.category

    ORDER BY mpi.id
    `,
    [planId]
  );

  const targets: Targets = {
    calories: Number(plan.target_calories) || 0,
    protein: Number(plan.target_protein_g) || 0,
    fat: Number(plan.target_fat_g) || 0,
    carbs: Number(plan.target_carbs_g) || 0
  };

  const achieved = {
    calories: Number(plan.total_calories) || 0,
    protein: Number(plan.total_protein) || 0,
    fat: Number(plan.total_fat) || 0,
    carbs: Number(plan.total_carbohydrates) || 0
  };

  const score = calculateScore(
    achieved.calories,
    achieved.protein,
    achieved.fat,
    achieved.carbs,
    targets
  );

  return {
    planId: Number(plan.id),
    userId: Number(plan.user_id),
    planDate: plan.plan_date,

    targets,

    achieved: {
      ...achieved,
      score
    },

    plan: itemsResult.rows.map((meal: any) => ({
      id: Number(meal.recipe_id),
      mealItemId: Number(meal.id),
      name: meal.name,
      description: meal.description,
      ingredients: meal.ingredients || [],
      category: meal.category || meal.meal_type,
      mealType: meal.meal_type,
      preparationTime: meal.preparation_time,
      servings: Number(meal.servings) || 1,
      servingsMultiplier:
        Number(meal.servings_multiplier) || 1,
      calories: Number(meal.calories) || 0,
      protein: Number(meal.protein) || 0,
      fat: Number(meal.fat) || 0,
      carbohydrates: Number(meal.carbohydrates) || 0
    }))
  };
}
