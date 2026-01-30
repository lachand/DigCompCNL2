# Plan d'adaptation mobile — DigCompCNL2

| Composant/Vue                | Problèmes identifiés                                                                 | Actions à mener (CSS/UX)                                                                                 |
|------------------------------|------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| **App.vue**                  | Layout principal, panels fixes, padding global                                      | Ajouter breakpoints Tailwind, réduire padding, rendre panels scrollables sur mobile                      |
| **Header.vue**               | Actions horizontales, padding fixe, pas de menu burger                             | Ajouter menu burger, masquer/compacter actions, réduire padding, adapter taille police                   |
| **Sidebar.vue**              | Sidebar fixe, overlay mobile, navigation dense                                     | Transformer en drawer/menu burger, masquer par défaut sur mobile, gestures, scroll vertical amélioré     |
| **DashboardView.vue**        | Grilles KPI/Charts, padding, taille police                                         | Passer grilles à 1 colonne sur mobile, réduire padding, adapter taille police                            |
| **LearningOutcomesView.vue** | Sticky progress, barres d’actions larges, breadcrumb horizontal                    | Empiler barres d’actions, scroll horizontal pour breadcrumb, réduire padding                             |
| **KanbanView.vue**           | Grille stats 5 colonnes, filtres côte à côte                                       | Passer stats en scroll horizontal ou stack vertical, empiler filtres/boutons                             |
| **GamificationView.vue**     | Grilles de quêtes, tabs horizontaux                                                | Passer grilles à 1 colonne, tabs scrollables, réduire padding                                            |
| **CalendarView.vue**         | Header large, grille 7 colonnes, contrôles larges                                  | Scroll horizontal sur grille, empiler contrôles, réduire padding                                         |
| **ComparisonView.vue**       | Tableaux larges, scroll horizontal prévu                                            | Vérifier lisibilité, adapter taille police, espacer boutons                                              |
| **StatisticsView.vue**       | Grilles de stats, padding, taille police                                           | Passer grilles à 1 colonne, réduire padding, adapter taille police                                       |
| **KPICard.vue**              | Padding, taille police, icône grande                                               | Réduire padding, taille police, icône plus petite sur mobile                                             |
| **ProgressChart.vue**        | Padding, canvas responsive                                                         | Réduire padding, vérifier largeur canvas, adapter légendes                                               |
| **UserAvatar.vue**           | OK (taille dynamique)                                                              | Vérifier dans Sidebar/Header                                                                             |

**Actions globales :**
- Utiliser les breakpoints Tailwind (`sm`, `md`, `lg`, `xl`) pour tous les layouts.
- Réduire les paddings/margins sur mobile.
- Empiler les éléments horizontaux.
- Ajouter/adapter les menus burger, drawers, overlays.
- Vérifier la taille des polices et zones tactiles.
- Tester tous les scrolls horizontaux (tableaux, grilles, tabs).
- S’assurer que tous les composants sont utilisables à une main.

---

Ce plan servira de feuille de route pour l’adaptation mobile. Étape suivante : définition de la stratégie PWA.
