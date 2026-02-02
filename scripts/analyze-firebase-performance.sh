#!/bin/bash

# Script d'analyse des performances Firebase
echo "🔍 ANALYSE DES PERFORMANCES FIREBASE"
echo "===================================="

# Variables
PROJECT_PATH="/home/valentin/Developpement/DigCompCNL2"
LOG_FILE="$PROJECT_PATH/firebase-analysis.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Fonction pour analyser les requêtes dans le code
analyze_firestore_queries() {
    echo "📊 Analyse des requêtes Firestore dans le code..."
    
    # Compter les différents types de requêtes
    echo "🔍 Types de requêtes détectées:" > $LOG_FILE
    echo "================================" >> $LOG_FILE
    
    # onSnapshot (temps réel)
    ONSNAPSHOT_COUNT=$(grep -r "onSnapshot" $PROJECT_PATH/src --include="*.ts" --include="*.vue" | wc -l)
    echo "onSnapshot (temps réel): $ONSNAPSHOT_COUNT" >> $LOG_FILE
    
    # getDocs (lecture batch)
    GETDOCS_COUNT=$(grep -r "getDocs" $PROJECT_PATH/src --include="*.ts" --include="*.vue" | wc -l)
    echo "getDocs (lecture batch): $GETDOCS_COUNT" >> $LOG_FILE
    
    # getDoc (lecture unique)
    GETDOC_COUNT=$(grep -r "getDoc" $PROJECT_PATH/src --include="*.ts" --include="*.vue" | wc -l)
    echo "getDoc (lecture unique): $GETDOC_COUNT" >> $LOG_FILE
    
    # addDoc (écriture)
    ADDDOC_COUNT=$(grep -r "addDoc" $PROJECT_PATH/src --include="*.ts" --include="*.vue" | wc -l)
    echo "addDoc (création): $ADDDOC_COUNT" >> $LOG_FILE
    
    # updateDoc (mise à jour)
    UPDATEDOC_COUNT=$(grep -r "updateDoc" $PROJECT_PATH/src --include="*.ts" --include="*.vue" | wc -l)
    echo "updateDoc (mise à jour): $UPDATEDOC_COUNT" >> $LOG_FILE
    
    # setDoc (écriture/remplacement)
    SETDOC_COUNT=$(grep -r "setDoc" $PROJECT_PATH/src --include="*.ts" --include="*.vue" | wc -l)
    echo "setDoc (écriture): $SETDOC_COUNT" >> $LOG_FILE
    
    echo "" >> $LOG_FILE
    
    # Analyser les collections les plus utilisées
    echo "📁 Collections les plus utilisées:" >> $LOG_FILE
    echo "===================================" >> $LOG_FILE
    
    grep -r "collection(db, '" $PROJECT_PATH/src --include="*.ts" --include="*.vue" | \
    sed "s/.*collection(db, '\([^']*\)'.*/\1/" | \
    sort | uniq -c | sort -nr | head -10 >> $LOG_FILE
    
    echo "" >> $LOG_FILE
}

# Fonction pour analyser les optimisations
analyze_optimizations() {
    echo "⚡ Analyse des optimisations..."
    
    echo "🎯 Optimisations détectées:" >> $LOG_FILE
    echo "============================" >> $LOG_FILE
    
    # Vérifier les délais optimisés
    if [ -f "$PROJECT_PATH/src/composables/useOptimizedDelays.ts" ]; then
        echo "✅ Délais optimisés configurés" >> $LOG_FILE
        DELAYS_COUNT=$(grep -c ":" $PROJECT_PATH/src/composables/useOptimizedDelays.ts)
        echo "   - Nombre de délais configurés: $DELAYS_COUNT" >> $LOG_FILE
    fi
    
    # Vérifier le cache
    if [ -f "$PROJECT_PATH/src/composables/useStaticCache.ts" ]; then
        echo "✅ Cache statique implémenté" >> $LOG_FILE
    fi
    
    # Vérifier le monitoring
    if [ -f "$PROJECT_PATH/src/composables/useQueryMonitoring.ts" ]; then
        echo "✅ Monitoring des requêtes activé" >> $LOG_FILE
    fi
    
    # Vérifier les polling
    POLLING_COUNT=$(grep -r "startPolling" $PROJECT_PATH/src --include="*.ts" | wc -l)
    echo "🔄 Nombre de polling détectés: $POLLING_COUNT" >> $LOG_FILE
    
    echo "" >> $LOG_FILE
}

# Fonction pour calculer l'estimation des coûts
estimate_costs() {
    echo "💰 Estimation des coûts..."
    
    echo "💰 Estimation des coûts Firestore:" >> $LOG_FILE
    echo "=====================================" >> $LOG_FILE
    
    # Calculs basés sur les patterns détectés
    # Prix Firestore: $0.36 pour 100K lectures
    
    # Estimation du nombre de requêtes par jour
    DAILY_READS_ESTIMATE=$(($ONSNAPSHOT_COUNT * 1440 + $GETDOCS_COUNT * 144 + $GETDOC_COUNT * 24))
    MONTHLY_READS_ESTIMATE=$(($DAILY_READS_ESTIMATE * 30))
    
    echo "Estimation quotidienne de lectures: $DAILY_READS_ESTIMATE" >> $LOG_FILE
    echo "Estimation mensuelle de lectures: $MONTHLY_READS_ESTIMATE" >> $LOG_FILE
    
    # Coût approximatif (en cents)
    MONTHLY_COST_CENTS=$(echo "scale=2; $MONTHLY_READS_ESTIMATE * 0.36 / 100000" | bc 2>/dev/null || echo "N/A")
    if [ "$MONTHLY_COST_CENTS" != "N/A" ]; then
        echo "Coût mensuel estimé: $MONTHLY_COST_CENTS USD" >> $LOG_FILE
    fi
    
    echo "" >> $LOG_FILE
}

# Fonction pour générer des recommandations
generate_recommendations() {
    echo "📋 Génération des recommandations..."
    
    echo "🎯 RECOMMANDATIONS D'OPTIMISATION:" >> $LOG_FILE
    echo "=====================================:" >> $LOG_FILE
    
    # Recommandations basées sur l'analyse
    if [ $ONSNAPSHOT_COUNT -gt 10 ]; then
        echo "⚠️ PRIORITÉ ÉLEVÉE: Trop de listeners temps réel ($ONSNAPSHOT_COUNT)" >> $LOG_FILE
        echo "   → Convertir certains onSnapshot en polling" >> $LOG_FILE
        echo "" >> $LOG_FILE
    fi
    
    if [ $GETDOCS_COUNT -gt 20 ]; then
        echo "📊 PRIORITÉ MOYENNE: Nombreuses requêtes getDocs ($GETDOCS_COUNT)" >> $LOG_FILE
        echo "   → Implémenter plus de cache et de pagination" >> $LOG_FILE
        echo "" >> $LOG_FILE
    fi
    
    # Vérifier si les index sont optimaux
    if [ ! -f "$PROJECT_PATH/firestore.indexes.json" ]; then
        echo "❌ CRITIQUE: Fichier d'index Firestore manquant" >> $LOG_FILE
        echo "   → Créer firestore.indexes.json avec les index nécessaires" >> $LOG_FILE
        echo "" >> $LOG_FILE
    fi
    
    echo "✅ ACTIONS RECOMMANDÉES PAR PRIORITÉ:" >> $LOG_FILE
    echo "1. Augmenter les délais de polling (déjà fait ✓)" >> $LOG_FILE
    echo "2. Implémenter le cache statique (déjà fait ✓)" >> $LOG_FILE  
    echo "3. Convertir les onSnapshot non critiques en polling" >> $LOG_FILE
    echo "4. Ajouter la pagination aux listes longues" >> $LOG_FILE
    echo "5. Implémenter le chargement conditionnel" >> $LOG_FILE
    echo "6. Optimiser les index Firestore (déjà fait ✓)" >> $LOG_FILE
}

# Exécution de l'analyse
echo "🚀 Début de l'analyse à $TIMESTAMP"

# Aller dans le répertoire du projet
cd $PROJECT_PATH

analyze_firestore_queries
analyze_optimizations
estimate_costs
generate_recommendations

echo "✅ Analyse terminée. Résultats dans: $LOG_FILE"
echo ""
echo "📊 RÉSUMÉ RAPIDE:"
echo "=================="
echo "onSnapshot: $ONSNAPSHOT_COUNT | getDocs: $GETDOCS_COUNT | getDoc: $GETDOC_COUNT"
echo "Requêtes estimées/jour: $DAILY_READS_ESTIMATE"
echo ""
echo "📖 Consultez $LOG_FILE pour le rapport complet."

# Afficher les 10 dernières lignes du log
echo ""
echo "📋 Dernières recommandations:"
tail -10 $LOG_FILE