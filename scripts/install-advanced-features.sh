#!/bin/bash

# Script d'installation des nouvelles dépendances pour les fonctionnalités avancées
echo "🚀 Installation des nouvelles dépendances..."

# Installation des dépendances de développement
echo "📦 Installation de Playwright pour les tests E2E..."
npm install --save-dev @playwright/test@^1.40.0

echo "📦 Installation de vite-bundle-analyzer pour l'analyse des performances..."
npm install --save-dev vite-bundle-analyzer@^0.7.4

# Installation des navigateurs Playwright
echo "🌐 Installation des navigateurs Playwright..."
npx playwright install

# Création des répertoires de tests s'ils n'existent pas
echo "📁 Création des répertoires de tests..."
mkdir -p tests/e2e
mkdir -p tests/unit
mkdir -p test-results

# Copie des exemples de configuration si nécessaire
echo "⚙️ Configuration des tests..."

# Variables d'environnement pour les tests
if [ ! -f ".env.test" ]; then
  echo "📝 Création du fichier .env.test..."
  cp .env.example .env.test 2>/dev/null || echo "# Fichier .env.test créé" > .env.test
fi

echo "✅ Installation terminée !"
echo ""
echo "🧪 Vous pouvez maintenant utiliser:"
echo "  npm run test:e2e       - Tests E2E avec Playwright"
echo "  npm run test:e2e:ui    - Interface UI pour les tests"
echo "  npm run analyze:bundle - Analyse du bundle"
echo "  npm run test:all       - Tous les tests (unit + E2E)"
echo ""
echo "📊 Dashboard de performance accessible via /dashboard/performance"
echo "🔔 Configuration des notifications push via /settings/notifications"