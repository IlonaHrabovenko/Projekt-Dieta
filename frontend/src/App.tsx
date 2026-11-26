import { useState, useEffect } from 'react';
import { Alert } from 'react-native';

import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import ProfileScreen from './ProfileScreen';
import PlanScreen from './PlanScreen';
import GeneratorScreen from './GeneratorScreen';
import RecipeScreen from './RecipeScreen';
import SavedScreen from './SavedScreen';
import API_URL from './api';

type ScreenType =
  | 'login'
  | 'register'
  | 'profile'
  | 'plan'
  | 'generator'
  | 'recipe'
  | 'saved';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [userId, setUserId] = useState<number>(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [targetCalories, setTargetCalories] = useState<number>(0);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);

  // Pobieranie aktualnych danych profilu z backendu.
  // Odświeża się również po przejściu z profilu do Generatora.
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userEmail) {
        setTargetCalories(0);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/user/profile/${encodeURIComponent(userEmail)}`
        );

        const result = await response.json();

        if (!response.ok) {
          console.log('Nie udało się pobrać profilu:', result.message);
          return;
        }

        const savedCalories = Number(result.user?.target_calories);

        setTargetCalories(
          Number.isFinite(savedCalories) && savedCalories > 0
            ? savedCalories
            : 0
        );
      } catch (error) {
        console.error('Błąd pobierania profilu:', error);
      }
    };

    fetchUserProfile();
  }, [userEmail, currentScreen]);

  const handleLoginSuccess = (
  id: number,
  jwtToken: string,
  email?: string
) => {
  if (!email || !email.trim()) {
    Alert.alert(
      'Błąd logowania',
      'Nie otrzymano adresu e-mail z serwera.'
    );
    return;
  }

  setUserId(id);
  setToken(jwtToken);
  setUserEmail(email.trim().toLowerCase());
  setCurrentScreen('plan');
};
    

  const handleLogout = () => {
    setUserId(0);
    setUserEmail('');
    setToken('');
    setTargetCalories(0);
    setSelectedPlanId(null);
    setCurrentScreen('login');
  };

  switch (currentScreen) {
    case 'login':
      return (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateToRegister={() => setCurrentScreen('register')}
        />
      );

    case 'register':
      return (
        <RegisterScreen
          onRegisterSuccess={() => setCurrentScreen('login')}
          onNavigateToLogin={() => setCurrentScreen('login')}
        />
      );

    case 'profile':
      return (
        <ProfileScreen
          userEmail={userEmail}
          onNavigateToPlan={() => setCurrentScreen('plan')}
          onNavigateToGenerator={() => setCurrentScreen('generator')}
          onNavigateToSaved={() => setCurrentScreen('saved')}
          onLogout={handleLogout}
        />
      );

    case 'plan':
  return (
    <PlanScreen
      userId={userId}
      planId={selectedPlanId}
      onOpenRecipe={(recipe) => {
  setSelectedRecipe(recipe);
  setCurrentScreen('recipe');
}}
      onNavigateToGenerator={() => {
        setSelectedPlanId(null);
        setCurrentScreen('generator');
      }}
      onNavigateToSaved={() => setCurrentScreen('saved')}
      onNavigateToProfile={() => setCurrentScreen('profile')}
    />
  );

    case 'generator':
      return (
        <GeneratorScreen
          userEmail={userEmail}
          targetCalories={targetCalories}
          onNavigateToPlan={() => setCurrentScreen('plan')}
          onNavigateToSaved={() => setCurrentScreen('saved')}
          onNavigateToProfile={() => setCurrentScreen('profile')}
        />
      );

    
case 'recipe':
  return (
    <RecipeScreen
      recipeData={
        selectedRecipe
          ? {
              name: selectedRecipe.name,
              category: selectedRecipe.category || 'Posiłek',
              calories: Number(selectedRecipe.calories) || 0,
              protein: Number(selectedRecipe.protein) || 0,
              carbs: Number(selectedRecipe.carbohydrates) || 0,
              fat: Number(selectedRecipe.fat) || 0,
              prepTime: selectedRecipe.preparationTime
                ? `${selectedRecipe.preparationTime} min`
                : 'Brak danych',
              ingredients: selectedRecipe.ingredients || [],
              instructions: selectedRecipe.instructions || '',
            }
          : undefined
      }
      onBack={() => setCurrentScreen('plan')}
    />
  );


    
case 'saved':
  return (
    <SavedScreen
      userId={userId}
      onNavigateToPlan={(planId) => {
        setSelectedPlanId(planId);
        setCurrentScreen('plan');
      }}
      onNavigateToCurrentPlan={() => {
        setSelectedPlanId(null);
        setCurrentScreen('plan');
      }}
      onNavigateToGenerator={() => setCurrentScreen('generator')}
      onNavigateToProfile={() => setCurrentScreen('profile')}
    />
  );


    default:
      return (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onNavigateToRegister={() => setCurrentScreen('register')}
        />
      );
  }
}
