import { createContext, useContext, useReducer } from 'react';
import type { Screen, ChatMessage, UserProfile, CareerRecommendation, LeadData } from '@/mocks/careers';

interface AppState {
  screen: Screen;
  messages: ChatMessage[];
  currentStep: number;
  userProfile: Partial<UserProfile>;
  recommendation: { primary: CareerRecommendation; secondary: CareerRecommendation; personalMessage: string } | null;
  leadData: Partial<LeadData>;
  isTyping: boolean;
}

type AppAction =
  | { type: 'SET_SCREEN'; payload: Screen }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'SET_RECOMMENDATION'; payload: AppState['recommendation'] }
  | { type: 'SET_LEAD'; payload: Partial<LeadData> }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'RESET' };

const initialState: AppState = {
  screen: 'hero',
  messages: [],
  currentStep: 0,
  userProfile: {},
  recommendation: null,
  leadData: {},
  isTyping: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_PROFILE':
      return { ...state, userProfile: { ...state.userProfile, ...action.payload } };
    case 'SET_RECOMMENDATION':
      return { ...state, recommendation: action.payload };
    case 'SET_LEAD':
      return { ...state, leadData: { ...state.leadData, ...action.payload } };
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}