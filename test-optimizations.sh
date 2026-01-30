#!/bin/bash

echo "🎯 Test des optimisations Firestore"
echo "=================================="

# Vérifier que les imports sont corrects
echo "Vérification des imports d'optimisation..."

# Vérifier chat.ts
if grep -q "createDelayedListener" src/stores/chat.ts; then
    echo "✅ Chat store optimisé"
else
    echo "❌ Chat store manquant"
fi

# Vérifier notifications.ts
if grep -q "createDelayedListener" src/stores/notifications.ts; then
    echo "✅ Notifications store optimisé"
else
    echo "❌ Notifications store manquant"
fi

# Vérifier news.ts
if grep -q "createDelayedListener" src/stores/news.ts; then
    echo "✅ News store optimisé"
else
    echo "❌ News store manquant"
fi

# Vérifier extendedGamification.ts
if grep -q "createDelayedListener" src/stores/extendedGamification.ts; then
    echo "✅ ExtendedGamification store optimisé"
else
    echo "❌ ExtendedGamification store manquant"
fi

# Vérifier competences.ts
if grep -q "createDelayedListener" src/stores/competences.ts; then
    echo "✅ Competences store optimisé"
else
    echo "❌ Competences store manquant"
fi

# Vérifier auth.ts
if grep -q "createDelayedListener" src/stores/auth.ts; then
    echo "✅ Auth store optimisé"
else
    echo "❌ Auth store manquant"
fi

echo ""
echo "🔍 Délais configurés:"
echo "- Chat: 2s (quasi temps réel)"
echo "- Notifications: 10s" 
echo "- News: 1min"
echo "- Gamification: 30s"
echo "- Compétences: 15s"
echo "- Utilisateurs: 20s"
echo "- Logs d'audit: 15min"

echo ""
echo "📊 Estimation d'économies:"
echo "- Réduction de ~70-80% des lectures Firestore"
echo "- Passage de 68k lectures/jour à ~15-20k estimé"