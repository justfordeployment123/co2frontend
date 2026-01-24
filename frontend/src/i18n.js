import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    common: {
      app: {
        name: 'AURIXON',
        tagline: 'AI-powered CSRD compliance made simple'
      },
      nav: {
        dashboard: 'Dashboard',
        activities: 'Activities',
        calculations: 'Calculations',
        reports: 'Reports',
        settings: 'Settings',
        admin: 'Admin',
        help: 'Help & Support',
        logout: 'Logout'
      },
      dashboard: {
        welcome: 'Welcome back, {{name}}!',
        subtitle: 'Track your carbon emissions and CSRD compliance progress',
        totalEmissions: 'Total Emissions',
        scope1: 'Scope 1',
        scope2: 'Scope 2',
        scope3: 'Scope 3',
        quickActions: 'Quick Actions',
        completionStatus: 'Completion Status',
        dataEntry: 'Data Entry',
        csrdCompliance: 'CSRD Compliance',
        reportGeneration: 'Report Generation',
        dataQuality: 'Data Quality Status',
        complete: 'Complete',
        inProgress: 'In Progress',
        missingData: 'Missing Data',
        activities: 'activities',
      },
      auth: {
        login: 'Sign In',
        register: 'Create Account',
        logout: 'Logout',
        email: 'Email Address',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        firstName: 'First Name',
        lastName: 'Last Name',
        companyName: 'Company Name',
        forgotPassword: 'Forgot password?',
        backToLogin: 'Back to Login',
        dontHaveAccount: "Don't have an account?",
        alreadyHaveAccount: 'Already have an account?',
        createAccountButton: 'Create Account',
        signInButton: 'Sign In',
        sendResetLink: 'Send Reset Link',
        resetPassword: 'Reset Your Password',
        language: 'Preferred Language'
      },
      actions: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        submit: 'Submit',
        close: 'Close',
        confirm: 'Confirm',
        loading: 'Loading...',
        search: 'Search',
        addActivity: 'Add New Activity Data',
        viewReports: 'View Reports',
        generateReport: 'Generate CSRD Report',
      },
      messages: {
        success: 'Success!',
        error: 'Error occurred',
        loading: 'Loading...',
        noData: 'No data available',
        confirmDelete: 'Are you sure you want to delete this?'
      },
      validation: {
        required: 'This field is required',
        invalidEmail: 'Invalid email address',
        passwordMismatch: 'Passwords do not match',
        minLength: 'Minimum {{count}} characters required',
        maxLength: 'Maximum {{count}} characters allowed'
      }
    }
  },
  de: {
    common: {
      app: {
        name: 'AURIXON',
        tagline: 'KI-gestützte CSRD-Compliance leicht gemacht'
      },
      nav: {
        dashboard: 'Dashboard',
        activities: 'Aktivitäten',
        calculations: 'Berechnungen',
        reports: 'Berichte',
        settings: 'Einstellungen',
        admin: 'Admin',
        help: 'Hilfe & Support',
        logout: 'Abmelden'
      },
      dashboard: {
        welcome: 'Willkommen zurück, {{name}}!',
        subtitle: 'Verfolgen Sie Ihre CO2-Emissionen und CSRD-Compliance-Fortschritte',
        totalEmissions: 'Gesamtemissionen',
        scope1: 'Scope 1',
        scope2: 'Scope 2',
        scope3: 'Scope 3',
        quickActions: 'Schnellaktionen',
        completionStatus: 'Abschlussstatus',
        dataEntry: 'Dateneingabe',
        csrdCompliance: 'CSRD-Compliance',
        reportGeneration: 'Berichtserstellung',
        dataQuality: 'Datenqualitätsstatus',
        complete: 'Abgeschlossen',
        inProgress: 'In Bearbeitung',
        missingData: 'Fehlende Daten',
        activities: 'Aktivitäten',
      },
      auth: {
        login: 'Anmelden',
        register: 'Konto erstellen',
        logout: 'Abmelden',
        email: 'E-Mail-Adresse',
        password: 'Passwort',
        confirmPassword: 'Passwort bestätigen',
        firstName: 'Vorname',
        lastName: 'Nachname',
        companyName: 'Firmenname',
        forgotPassword: 'Passwort vergessen?',
        backToLogin: 'Zurück zur Anmeldung',
        dontHaveAccount: 'Noch kein Konto?',
        alreadyHaveAccount: 'Haben Sie bereits ein Konto?',
        createAccountButton: 'Konto erstellen',
        signInButton: 'Anmelden',
        sendResetLink: 'Link senden',
        resetPassword: 'Passwort zurücksetzen',
        language: 'Bevorzugte Sprache'
      },
      actions: {
        save: 'Speichern',
        cancel: 'Abbrechen',
        delete: 'Löschen',
        edit: 'Bearbeiten',
        add: 'Hinzufügen',
        submit: 'Absenden',
        close: 'Schließen',
        confirm: 'Bestätigen',
        loading: 'Lädt...',
        search: 'Suchen',
        addActivity: 'Neue Aktivitätsdaten hinzufügen',
        viewReports: 'Berichte anzeigen',
        generateReport: 'CSRD-Bericht erstellen',
      },
      messages: {
        success: 'Erfolgreich!',
        error: 'Ein Fehler ist aufgetreten',
        loading: 'Lädt...',
        noData: 'Keine Daten verfügbar',
        confirmDelete: 'Möchten Sie dies wirklich löschen?'
      },
      validation: {
        required: 'Dieses Feld ist erforderlich',
        invalidEmail: 'Ungültige E-Mail-Adresse',
        passwordMismatch: 'Passwörter stimmen nicht überein',
        minLength: 'Mindestens {{count}} Zeichen erforderlich',
        maxLength: 'Maximal {{count}} Zeichen erlaubt'
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Set default language explicitly
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
