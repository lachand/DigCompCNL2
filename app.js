import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

      const OFFICIAL_TITLES = {
        1.1: "Naviguer, rechercher et filtrer",
        1.2: "Évaluer les données",
        1.3: "Gérer les données",
        2.1: "Interagir via le numérique",
        2.2: "Partager",
        2.3: "Citoyenneté",
        2.4: "Collaborer",
        2.5: "Nétiquette",
        2.6: "Identité numérique",
        3.1: "Développer contenu",
        3.2: "Intégrer",
        3.3: "Droits d'auteur",
        3.4: "Programmation",
        4.1: "Protéger équipements",
        4.2: "Protéger données",
        4.3: "Protéger santé",
        4.4: "Protéger environnement",
        5.1: "Résoudre problèmes",
        5.2: "Identifier besoins",
        5.3: "Créativité",
        5.4: "Lacunes",
      };
      const firebaseConfig = {
        apiKey: "AIzaSyA1u9I4OQsKlfwi9X-cFMQmCxelWyJcdw8",
        authDomain: "toccata-958f9.firebaseapp.com",
        databaseURL: "https://toccata-958f9.firebaseio.com",
        projectId: "toccata-958f9",
        storageBucket: "toccata-958f9.firebasestorage.app",
        messagingSenderId: "867467991937",
        appId: "1:867467991937:web:a084bd4f07bdf49f386680",
      };
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      const auth = firebase.auth();
      const db = firebase.firestore();
      const { createApp, ref, reactive, computed, onMounted, nextTick } = Vue;

      createApp({
        setup() {
          // 1. Logique Time Machine
          const showTimeMachineModal = ref(false);
          const snapshots = ref([]);
          const newSnapshotName = ref("");

          const loadSnapshots = async () => {
            const snap = await db
              .collection("snapshots")
              .orderBy("date", "desc")
              .limit(20)
              .get();
            snapshots.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          };

          // --- CHASSEUR DE RESSOURCES (AI + IMAGES) ---
          const showHunterModal = ref(false);
          const hunterLoading = ref(false);
          const hunterResults = ref(null); // Stocke les propositions (Videos, Docs, Images)

          const openResourceHunter = (outcome) => {
            currentOutcomeForAI.value = outcome; // On réutilise cette variable existante
            hunterResults.value = null;
            showHunterModal.value = true;
          };

          // --- CHASSEUR DE RESSOURCES : MODE ASSISTANT (Stable) ---

          const hunterSearchTerms = ref(null); // Stocke les stratégies de recherche
          const magicUrlInput = ref(""); // Champ de collage URL
          const magicLoading = ref(false);

          const launchHunter = async () => {
            if (!apiKey.value) {
              alert("Clé API Gemini requise.");
              return;
            }

            hunterLoading.value = true;
            hunterResults.value = null; // On vide les résultats précédents
            hunterSearchTerms.value = null; // On vide les boutons précédents

            try {
              const genAI = new GoogleGenerativeAI(apiKey.value);
              // On n'utilise PAS d'outils complexes, juste le modèle standard rapide
              const model = genAI.getGenerativeModel({
                model: "gemini-3-flash-preview",
                generationConfig: { responseMimeType: "application/json" }, // On force le JSON
              });

              const context = currentOutcomeForAI.value.description;

              // On demande à l'IA de préparer le terrain (Les requêtes idéales)
              const prompt = `Agis comme un expert pédagogique.
                        Sujet : "${context}" (Niveau ${currentOutcomeForAI.value.level}).

                        Ta mission : Créer les meilleures requêtes de recherche pour trouver des ressources de qualité.

                        Réponds avec ce JSON :
                        {
                            "yt_query": "La phrase exacte à taper dans YouTube pour trouver un bon tuto",
                            "google_query": "La phrase exacte à taper dans Google pour trouver un article de fond",
                            "wiki_query": "Le concept clé exact pour Wikipedia"
                        }`;

              const result = await model.generateContent(prompt);
              const text = result.response.text();
              hunterSearchTerms.value = JSON.parse(text);

              // BONUS : On tente quand même Wikipedia en auto (car l'API est ouverte et stable)
              try {
                const wikiUrl = `https://fr.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
                  hunterSearchTerms.value.wiki_query
                )}&limit=2&format=json&origin=*`;
                const wResp = await fetch(wikiUrl);
                if (wResp.ok) {
                  const wJson = await wResp.json(); // Format [query, [titres], [desc], [urls]]
                  if (wJson[1].length > 0) {
                    // On initialise hunterResults avec les suggestions Wiki
                    hunterResults.value = {
                      suggestions: wJson[1].map((t, i) => ({
                        title: "📖 " + t,
                        url: wJson[3][i],
                        thumbnail: null,
                        isAuto: true,
                        snippet: wJson[2][i],
                      })),
                    };
                  }
                }
              } catch (e) {
                console.warn("Wiki auto a échoué, pas grave", e);
              }
            } catch (e) {
              console.error(e);
              showToast("Erreur IA : " + e.message, "error");
            } finally {
              hunterLoading.value = false;
            }
          };

          // FONCTION MAGIQUE : Transforme une URL collée en ressource riche
          // Helper pour raccourcir les URLs (Affichage propre)
          const shortUrl = (url) => {
            if (!url) return "";
            try {
              const u = new URL(url);
              // Affiche "www.google.com/..." au lieu de l'URL géante
              return (
                u.hostname +
                (u.pathname.length > 1 || u.search.length > 1 ? "/...": "")
              );
            } catch (e) {
              // Fallback si ce n'est pas une URL valide
              return url.length > 30 ? url.substring(0, 30) + "..." : url;
            }
          };

          // VERSION CORRIGÉE : Force la mise à jour de la liste
          const fetchSmartTitle = async (url) => {
            // 1. Essai via NoEmbed (Pour YouTube, Vimeo, Twitter...)
            try {
              const oembed = await fetch(
                `https://noembed.com/embed?url=${encodeURIComponent(url)}`
              ).then((r) => r.json());
              if (oembed.title)
                return { title: oembed.title, thumb: oembed.thumbnail_url };
            } catch (e) {}

            // 2. Essai via Proxy HTML (Pour les sites de doc, blogs, articles)
            try {
              const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
                url
              )}`;
              const response = await fetch(proxyUrl);
              const data = await response.json();

              if (data.contents) {
                // On parse le HTML récupéré pour trouver la balise <title>
                const match = data.contents.match(/<title>(.*?)<\/title>/i);
                if (match && match[1]) {
                  // On nettoie le titre (enlève les entités HTML &amp;)
                  const cleanTitle = new DOMParser().parseFromString(
                    match[1],
                    "text/html"
                  ).body.textContent;
                  return { title: cleanTitle.trim(), thumb: null };
                }
              }
            } catch (e) {
              console.warn("Echec récupération titre", e);
            }

            return { title: "Ressource Web", thumb: null };
          };

          const handleMagicPaste = async () => {
            const url = magicUrlInput.value.trim();
            if (!url) return;

            magicLoading.value = true;

            try {
              // On utilise notre nouvelle fonction intelligente
              const metadata = await fetchSmartTitle(url);

              const newRes = {
                title: metadata.title,
                url: url,
                thumbnail: metadata.thumb,
                isAuto: false,
                user: "Moi",
                // ID unique indispensable pour que Vue accepte d'en ajouter plusieurs
                id: Date.now() + Math.random().toString(36).substr(2, 9),
              };

              if (!hunterResults.value)
                hunterResults.value = { suggestions: [] };

              // Ajout en haut de liste
              hunterResults.value.suggestions = [
                newRes,
                ...(hunterResults.value.suggestions || []),
              ];

              showToast("Lien analysé : " + metadata.title, "success");
              magicUrlInput.value = "";
            } catch (e) {
              console.error(e);
              showToast("Erreur analyse lien", "error");
            } finally {
              magicLoading.value = false;
            }
          };

          const adoptResource = (res) => {
            if (!currentCompetence.value) return;

            // 1. Retrouver le LO cible (Version "Base de données")
            // On cherche dans la vraie structure de données, pas dans la copie locale
            let targetOutcome = null;
            const domain = digCompData.domains.find((d) =>
              d.competences.some((c) =>
                c.outcomes.some((o) => {
                  if (o.id === currentOutcomeForAI.value.id) {
                    // On utilise l'ID stocké lors de l'ouverture de la modale
                    targetOutcome = o;
                    return true;
                  }
                  return false;
                })
              )
            );

            if (targetOutcome) {
              // 2. Initialiser le tableau s'il n'existe pas pour l'année en cours
              // Par défaut on ajoute à l'année courante ou 'L3' si indéfini
              const year =
                currentView.value === "Overview"
                  ? "L3"
                  : currentView.value === "Kanban"
                  ? kanbanYear.value
                  : currentView.value;

              if (!targetOutcome.mappings[year]) {
                targetOutcome.mappings[year] = {
                  status: "none",
                  resources: [],
                };
              }
              if (!targetOutcome.mappings[year].resources) {
                targetOutcome.mappings[year].resources = [];
              }

              // 3. CRÉER UNE COPIE PROPRE (Crucial !)
              // Si on pousse 'res' directement, on pousse la référence de la modale.
              // Il faut cloner l'objet.
              const resourceToAdd = {
                title: res.title || "Nouvelle ressource",
                url: res.url,
                type: res.url.includes("youtu") ? "video" : "web",
                addedAt: new Date().toISOString(),
              };

              // 4. Ajout et Notification
              targetOutcome.mappings[year].resources.push(resourceToAdd);

              logActivity("a ajouté une ressource", targetOutcome.id);
              showToast("Ressource ajoutée au cours !", "success");

              // Force le rafraîchissement de l'interface principale
              triggerUpdate();
            } else {
              showToast(
                "Erreur : Impossible de retrouver le LO cible",
                "error"
              );
            }
          };

          // --- GESTION AMÉLIORÉE DU CHAT (FICHIERS + COLLER) ---

                const fileInput = ref(null);

                const triggerFileInput = () => fileInput.value.click();

                // 1. Fonction centrale d'envoi de fichier (Base64)
                const sendAttachment = (file) => {
                    if (!file) return;

                    // Limite Firestore (1 Mo pour éviter les erreurs)
                    if (file.size > 1485760) {
                        showToast("Fichier trop volumineux (Max 1 Mo)", "error");
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const base64String = e.target.result;
                        const type = file.type.startsWith('image/') ? 'image' : 'file';

                        await db.collection('messages').add({
                            text: '',
                            attachment: base64String,
                            attachmentName: file.name,
                            attachmentType: type,
                            sender: user.value.email,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });

                        nextTick(() => { if(chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight; });
                    };
                    reader.readAsDataURL(file);
                };

                // 2. Gestion du bouton Upload (Trombone)
                const handleFileUpload = (event) => {
                    const file = event.target.files[0];
                    sendAttachment(file);
                    event.target.value = ''; // Reset
                };

                // 3. Gestion du "Coller" (CTRL+V) dans la zone de texte
                const handlePaste = (event) => {
                    const items = (event.clipboardData || event.originalEvent.clipboardData).items;

                    for (let index in items) {
                        const item = items[index];
                        if (item.kind === 'file') {
                            const blob = item.getAsFile();
                            // Si c'est une image, on l'envoie direct
                            if (blob) {
                                sendAttachment(blob);
                                event.preventDefault(); // Empêche de coller le nom du fichier en texte
                                showToast("Image collée et envoyée !", "success");
                            }
                        }
                    }
                };

                // 3. Rendre les liens cliquables (Regex)
                const formatMessage = (text) => {
                    if (!text) return '';
                    // Regex pour trouver les URLs
                    const urlRegex = /(https?:\[^\s]+)/g;
                    return text.replace(urlRegex, (url) => {
                        return `<a href="${url}" target="_blank" class="text-blue-500 underline break-all">${url}</a>`;
                    });
                };

                // 4. Nettoyage automatique (> 30 Jours)
                const cleanupOldMessages = async () => {
                    // Date d'il y a 30 jours
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    const snapshot = await db.collection('messages')
                        .where('timestamp', '<', thirtyDaysAgo)
                        .get();

                    if (!snapshot.empty) {
                        const batch = db.batch();
                        snapshot.docs.forEach((doc) => {
                            batch.delete(doc.ref);
                        });
                        await batch.commit();
                        console.log(`${snapshot.size} anciens messages supprimés.`);
                    }
                };

          // --- DIFF VISUEL ---
                
                // 1. Fonction qui génère le HTML coloré
                const getDiffHtml = (oldText, newText) => {
                    if (!oldText && !newText) return '';
                    // On utilise la librairie globale "Diff" chargée dans le head
                    const diff = Diff.diffWords(oldText || '', newText || '');
                    
                    return diff.map(part => {
                        // Vert pour ajout, Rouge barré pour suppression, Gris pour inchangé
                        const color = part.added ? 'bg-green-200 text-green-800 font-bold px-1 rounded' :
                                      part.removed ? 'bg-red-100 text-red-800 line-through px-1 rounded opacity-70' : 
                                      'text-gray-600 dark:text-gray-300';
                        return `<span class="${color}">${part.value}</span>`;
                    }).join('');
                };

                // 2. Variable pour l'édition de description
                const editingOutcomeId = ref(null);
                const tempDescription = ref('');

                // 3. Activer le mode édition
                const startEditDescription = (outcome) => {
                    editingOutcomeId.value = outcome.id;
                    tempDescription.value = outcome.description;
                };

                // 4. Sauvegarder et CRÉER LE LOG pour le diff
                const saveDescription = (outcome) => {
                    if (tempDescription.value !== outcome.description) {
                        const oldDesc = outcome.description;
                        const newDesc = tempDescription.value;
                        
                        outcome.description = newDesc; // Mise à jour locale
                        
                        // IMPORTANT : On loggue l'ancienne et la nouvelle valeur complète
                        logAction('desc_edit', outcome.id, 'Modification description', currentView.value, oldDesc, newDesc);
                        
                        triggerUpdate(); // Sauvegarde Firebase
                        showToast("Description mise à jour", "success");
                    }
                    editingOutcomeId.value = null;
                };

          const createSnapshot = async () => {
            if (!newSnapshotName.value.trim()) return;
            await db.collection("snapshots").add({
              name: newSnapshotName.value,
              user: user.value.email,
              date: new Date().toISOString(),
              data: JSON.parse(JSON.stringify(digCompData.domains)), // Copie profonde de l'état actuel
            });
            newSnapshotName.value = "";
            await loadSnapshots();
            showToast("Sauvegarde réussie", "success");
          };

          const restoreSnapshot = async (snap) => {
            if (
              !confirm(
                "⚠️ ATTENTION : Vous allez écraser la maquette actuelle par la version \"" + snap.name + "\".\n\nÊtes-vous sûr ?"
              )
            ) return;
            digCompData.domains = snap.data;
            triggerUpdate(); // Sauvegarde immédiate dans la base principale
            showTimeMachineModal.value = false;
            showToast("Version restaurée avec succès !", "success");
          };

          const activeLocks = ref({}); // Liste des verrous actuels

          // Écoute des verrous en temps réel
          db.collection("locks").onSnapshot((snap) => {
            const locks = {};
            const now = Date.now();
            snap.forEach((doc) => {
              const data = doc.data();
              // Si le verrou a moins de 5 min, on le garde
              if (now - data.timestamp < 300000) {
                locks[doc.id] = data.user;
              }
            });
            activeLocks.value = locks;
          });

          const requestLock = (outcomeId) => {
            // On pose un verrou dans la base
            db.collection("locks")
              .doc(outcomeId)
              .set({
                user: user.value.email.split("@")[0],
                timestamp: Date.now(),
              });
          };

          const isLocked = (outcomeId) => {
            const locker = activeLocks.value[outcomeId];
            // Vrai si verrouillé par quelqu'un d'autre que moi
            return locker && locker !== user.value.email.split("@")[0];
          };

          const getLockerName = (outcomeId) => activeLocks.value[outcomeId];

          const kanbanYear = ref("L1"); // Année par défaut du Kanban
          const draggedOutcome = ref(null);

          // Calcule les colonnes du Kanban (Gère maintenant le mode Overview)
          const kanbanColumns = computed(() => {
            const cols = {
              none: { title: "À faire", list: [], color: "border-red-400" },
              draft: {
                title: "En cours",
                list: [],
                color: "border-orange-400",
              },
              review: { title: "En relecture", list: [], color: "border-yellow-500" }, // Votre nouveau statut
              validated: { title: "Validé", list: [], color: "border-green-500" },
              obsolete: { title: "Obsolète", list: [], color: "border-gray-300" },
            };

            // Détermine quelles années on affiche
            const yearsProcess =
              kanbanYear.value === "Overview"
                ? ["L1", "L2", "L3"]
                : [kanbanYear.value];

            digCompData.domains.forEach((d) => {
              d.competences.forEach((c) => {
                c.outcomes.forEach((o) => {
                  // 1. Filtre Mes Tâches
                  if (onlyMyTasks.value && user.value) {
                    const me = user.value.email.split("@")[0];
                    if (!o.assignees || !o.assignees.includes(me)) return;
                  }

                  // 2. Boucle sur les années concernées
                  yearsProcess.forEach((year) => {
                    const status =
                      o.mappings && o.mappings[year]
                        ? o.mappings[year].status
                        : "none";

                    if (cols[status]) {
                      // On crée une carte pour CHAQUE année active
                      // On ajoute 'displayYear' pour savoir de quelle année il s'agit sur la carte
                      const item = {
                        ...o,
                        domainName: d.name,
                        compName: c.name,
                        displayYear: year, // Important pour l'affichage
                      };
                      cols[status].list.push(item);
                    }
                  });
                });
              });
            });
            return cols;
          });

          // Statistiques globales (Adapté pour Overview)
          const kanbanOverview = computed(() => {
            const stats = { L1: 0, L2: 0, L3: 0, total: 0 };

            // Si Overview, on compte tout, sinon juste l'année en cours
            const yearsToCheck =
              kanbanYear.value === "Overview"
                ? ["L1", "L2", "L3"]
                : [kanbanYear.value];

            digCompData.domains.forEach((d) => {
              d.competences.forEach((c) => {
                c.outcomes.forEach((o) => {
                  yearsToCheck.forEach((y) => {
                    const status =
                      o.mappings && o.mappings[y]
                        ? o.mappings[y].status
                        : "none";
                    if (status === "validated") {
                      if (stats[y] !== undefined) stats[y]++;
                      stats.total++;
                    }
                  });
                });
              });
            });
            return stats;
          });

          // Fonction pour assigner depuis le Kanban (qui utilise des copies d'objets)
          const toggleAssignmentById = (itemId) => {
            // On cherche l'original dans la base de données locale
            let found = null;
            for (const d of digCompData.domains) {
              for (const c of d.competences) {
                found = c.outcomes.find((o) => o.id === itemId);
                if (found) break;
              }
              if (found) break;
            }

            // Si trouvé, on utilise la fonction standard de toggle
            if (found) toggleAssignment(found);
          };

          const onDrop = (status) => {
            if (draggedOutcome.value) {
              updateStatus(draggedOutcome.value, kanbanYear.value, status);
              draggedOutcome.value = null;
            }
          };

          const showSunburstModal = ref(false);

          const openSunburst = () => {
            showSunburstModal.value = true;
            nextTick(() => {
              const data = [
                {
                  type: "sunburst",
                  labels: [],
                  parents: [],
                  values: [],
                  outsidetextfont: { size: 20, color: "#377eb8" },
                  leaf: { opacity: 0.4 },
                  marker: { line: { width: 2 } },
                },
              ];

              // 1. Racine
              data[0].labels.push("DigComp");
              data[0].parents.push("");
              data[0].values.push(0);

              // 2. Domaines & Compétences
              digCompData.domains.forEach((d) => {
                data[0].labels.push(d.name);
                data[0].parents.push("DigComp");
                data[0].values.push(0); // Sera calculé par Plotly

                d.competences.forEach((c) => {
                  data[0].labels.push(c.name);
                  data[0].parents.push(d.name);
                  let score = 0;
                  c.outcomes.forEach((o) => {
                    if (isCoveredAnywhere(o)) score++;
                  });
                  data[0].values.push(score || 1); // Taille = nombre de LO validés
                });
              });

              Plotly.newPlot("sunburstChart", data, {
                margin: { l: 0, r: 0, b: 0, t: 0 },
              });
            });
          };

          // --- SYSTEME DE NOTIFICATION (TOASTS) ---
          const toasts = ref([]);
          let toastIdCounter = 0;

          const showToast = (message, type = "info") => {
            const id = toastIdCounter++;
            // Types possibles : 'success' (vert), 'error' (rouge), 'info' (bleu)
            toasts.value.push({ id, message, type });

            // Auto-suppression après 3 secondes
            setTimeout(() => {
              removeToast(id);
            }, 3000);
          };

          const removeToast = (id) => {
            toasts.value = toasts.value.filter((t) => t.id !== id);
          };

          // --- ÉDITION DE RESSOURCE ---
          const showEditResModal = ref(false);
          const editResForm = reactive({
            title: "",
            url: "",
            outcome: null,
            year: "",
            original: null,
          });

          // Ouvre la modale et pré-remplit les champs
          const openEditResource = (outcome, res) => {
            editResForm.title = res.title;
            editResForm.url = res.url;
            editResForm.outcome = outcome;
            editResForm.year = res.year; // L'année est fournie par getAllResources
            editResForm.original = res; // On garde une référence pour retrouver l'original
            showEditResModal.value = true;
          };

          // Sauvegarde les modifications
          const saveEditedResource = () => {
            if (!editResForm.outcome || !editResForm.original) return;

            const mapping = editResForm.outcome.mappings[editResForm.year];

            if (mapping && mapping.resources) {
              // On cherche la ressource originale dans la liste (par ID si dispo, sinon par URL/Titre)
              const index = mapping.resources.findIndex(
                (r) =>
                  (r.id &&
                    editResForm.original.id &&
                    r.id === editResForm.original.id) ||
                  (r.url === editResForm.original.url &&
                    r.title === editResForm.original.title)
              );

              if (index !== -1) {
                // Mise à jour des champs
                mapping.resources[index].title = editResForm.title;
                mapping.resources[index].url = editResForm.url;

                triggerUpdate(); // Sauvegarde en base
                showToast("Ressource modifiée avec succès", "success");
                showEditResModal.value = false;

                // Petit log d'activité
                logActivity("a modifié une ressource", editResForm.title);
              } else {
                showToast(
                  "Erreur : Impossible de retrouver la ressource originale",
                  "error"
                );
              }
            }
          };

          // --- SUPPRESSION RESSOURCE ---
          const removeResource = (outcome, resObj) => {
            if (!confirm("Supprimer cette ressource définitivement ?")) return;

            // 1. On identifie l'année concernée (L1, L2 ou L3) grâce à votre objet res
            const year = resObj.year;

            // 2. On récupère la liste réelle dans les données
            const mapping = outcome.mappings[year];

            if (mapping && mapping.resources) {
              // 3. On cherche l'index de la ressource (par url et titre pour être sûr)
              const index = mapping.resources.findIndex(
                (r) => r.url === resObj.url && r.title === resObj.title
              );

              if (index !== -1) {
                mapping.resources.splice(index, 1); // Suppression
                triggerUpdate(); // Sauvegarde
                showToast("Ressource supprimée avec succès", "success"); // Notification Toast
                logActivity("a supprimé la ressource", deletedTitle);
              } else {
                showToast("Erreur : Ressource introuvable", "error");
              }
            }
          };

          const DIGCOMP_TO_PIX_MAP = {
            1.1: {
              code: "1.1",
              label: "Mener une recherche et une veille d’information",
            },
            1.2: { code: "1.2", label: "Gérer des données" },
            1.3: { code: "1.3", label: "Traiter des données" },
            2.1: { code: "2.1", label: "Interagir" },
            2.2: { code: "2.2", label: "Partager et publier" },
            2.3: { code: "2.3", label: "Collaborer" },
            2.4: { code: "2.3", label: "Collaborer" }, // DigComp 2.4 -> Pix 2.3 (souvent fusionné)
            2.5: { code: "2.4", label: "S’insérer dans le monde numérique" },
            2.6: { code: "2.4", label: "S’insérer dans le monde numérique" }, // Identité num.
            3.1: { code: "3.1", label: "Développer des documents textuels" },
            3.2: { code: "3.2", label: "Développer des documents multimédia" },
            3.3: {
              code: "3.3",
              label: "Adapter les documents à leur finalité",
            },
            3.4: { code: "3.4", label: "Programmer" },
            4.1: { code: "4.1", label: "Sécuriser l’environnement numérique" },
            4.2: {
              code: "4.2",
              label: "Protéger les données personnelles et la vie privée",
            },
            4.3: {
              code: "4.3",
              label: "Protéger la santé, le bien-être et l environnement",
            },
            4.4: { code: "4.3", label: "Protéger la santé..." }, // Souvent fusionné
            5.1: { code: "5.1", label: "Résoudre des problèmes techniques" },
            5.2: {
              code: "5.2",
              label: "Construire un environnement numérique",
            }, // Identification besoins
            5.3: {
              code: "5.2",
              label: "Construire un environnement numérique",
            }, // Créativité
          };

          // 2. Conversion des niveaux (DigComp Global -> PIX Score Cible)
          const getPixTargetLevel = (digCompLevel) => {
            switch (digCompLevel) {
              case "Basic":
                return 2; // Novice (1-2)
              case "Intermediate":
                return 4; // Indépendant (3-4)
              case "Advanced":
                return 6; // Avancé (5-6)
              case "Highly advanced":
                return 7; // Expert (7-8)
              default:
                return 1;
            }
          };

          // 3. Fonction d'Export
          const exportToPixExcel = () => {
            const rows = [];
            // AJOUT des en-têtes "Tags" et "Lien Preuve"
            rows.push([
              "Domaine PIX",
              "Compétence PIX",
              "Niveau Cible",
              "Code DigComp",
              "Description",
              "Tags Composantes",
              "Lien Preuve",
            ]);

            digCompData.domains.forEach((d) => {
              d.competences.forEach((c) => {
                const shortId = c.id.split("/").pop();
                const pixEquiv = DIGCOMP_TO_PIX_MAP[shortId];

                if (pixEquiv) {
                  c.outcomes.forEach((o) => {
                    const targetYear =
                      currentView.value === "Overview"
                        ? "L3"
                        : currentView.value;

                    if (isStatusActive(o, targetYear)) {
                      rows.push([
                        pixEquiv.code.charAt(0),
                        `${pixEquiv.code} - ${pixEquiv.label}`,
                        getPixTargetLevel(o.level),
                        shortId,
                        o.description,
                        // AJOUT DES DONNÉES ICI
                        (o.tags || []).join(", "), // Les tags
                        o.mappings[targetYear].courseLink || "", // Le lien du cours
                      ]);
                    }
                  });
                }
              });
            });

            if (rows.length <= 1) {
              showToast("Aucune donnée à exporter !", "warning");
              return;
            }
            const ws = XLSX.utils.aoa_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Export_PIX");
            XLSX.writeFile(wb, `export_pix_${currentView.value}.xlsx`);
            showToast("Export généré avec succès !", "success");
          };

          // 2. Logique Export Moodle
          const exportMoodleXML = async () => {
            if (!aiResult.value) return;
            // On garde le contenu actuel en mémoire pour ne pas le perdre
            const originalContent = aiResult.value;
            aiLoading.value = true;

            try {
              const model = new GoogleGenerativeAI(
                apiKey.value
              ).getGenerativeModel({ model: aiModel.value });
              const prompt = `Agis comme un expert LMS. Convertis le QCM ci-dessous au format "Moodle XML" strict.
                        Le code XML doit être valide et prêt à l'import.
                        Ne mets AUCUN texte avant ou après le code XML (pas de markdown).

                        CONTENU À CONVERTIR :
                        ${originalContent}`;

              const result = await model.generateContent(prompt);
              const xmlContent = (await result.response)
                .text()
                .replace(/```xml/g, "")
                .replace(/```/g, "")
                .trim();

              // Téléchargement du fichier
              const blob = new Blob([xmlContent], { type: "text/xml" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `qcm_moodle_${Date.now()}.xml`;
              a.click();

              // On remet le contenu original (pour que l'utilisateur puisse continuer à lire)
              aiResult.value = originalContent;
            } catch (e) {
              aiError.value = "Erreur conversion : " + e.message;
            } finally {
              aiLoading.value = false;
            }
          };

          const digCompData = reactive({ domains: [] });
          const currentCompetence = ref(null);
          const currentFilter = ref("All");
          const searchQuery = ref("");
          const currentView = ref("L1");
          const isMobileMenuOpen = ref(false);
          const isDarkMode = ref(false);
          const showCheckedOnly = ref(false);
          const selectedComponentTag = ref("");

          const user = ref(null);
          const connectedUsers = ref([]);
          const authForm = reactive({ email: "", password: "" });
          const authError = ref("");
          const loading = ref(false);
          const isSyncing = ref(false);

          const showChat = ref(false);
          const showEmojiPicker = ref(false);
          const showSettingsModal = ref(false);
          const showCommentModal = ref(false);
          const showHistoryModal = ref(false);
          const showLOHistoryModal = ref(false);
          const showAIModal = ref(false);
          const showNotifDropdown = ref(false);
          const notificationSound = ref("fanfare");
          const apiKey = ref("");
          const aiModel = ref("gemini-3-flash-preview");
          const availableTags = ref([
            "ASSP",
            "FJVD",
            "LANG",
            "LESLA",
            "SEG",
            "TT",
            "ICOM",
            "IETL",
            "IFS",
            "IPsyL",
            "ISPEF",
            "IUT",
            "CIEF",
          ]);

          const componentDetails = {
            ASSP: "Anthropologie, sociologie et science politique",
            FJVD: "Faculté de Droit Julie-Victoire Daubié",
            LANG: "Langues",
            LESLA: "Lettres, sciences du langage et arts",
            SEG: "Sciences économiques et gestion",
            TT: "Temps et territoires",
            ICOM: "Institut de la communication",
            IETL: "Institut d etudes du travail de Lyon",
            IFS: "Institut de formation syndicale",
            IPsyL: "Institut de Psychologie de Lyon",
            ISPEF:
              "Institut des sciences et pratiques de l education et de formation",
            IUT: "",
            CIEF: "Centre international d etudes francaises",
          };

          // Fonction helper pour l'affichage
          const getLongName = (tag) => componentDetails[tag] || "";

          const chatMessages = ref([]);
          const newMessage = ref("");
          const newCommentText = ref("");
          const chatBox = ref(null);
          const unreadCount = ref(0);
          const showAddModal = ref(false);
          const newOutcome = reactive({
            description: "",
            level: "Intermediate",
            isAI: false,
          });
          const notifPermission = ref(Notification.permission);
          const lastReadTime = ref(new Date(0));
          const appStartTime = new Date();
          const currentOutcomeForComments = ref(null);
          const currentOutcomeForAI = ref(null);
          const currentAIType = ref("");
          const currentHistoryOutcomeTitle = ref("");
          const currentLOHistory = ref([]);
          const aiResult = ref("");
          const aiLoading = ref(false);
          const aiError = ref("");
          const pinnedCompetences = ref([]);
          const historyLogs = ref([]);
          const userNotifications = ref([]);

          const showImportModal = ref(false);
          const showImportConfirmModal = ref(false);
          const importUrl = ref("");
          const importLoading = ref(false);
          const importAnalysisResult = ref([]);

          let typingTimeout = null, heartbeatInterval = null, idleTimeout = null, radarChartInstance = null;
          let dashBarChart = null, dashDoughnutChart = null, dashRadarChart = null;

          const visioState = reactive({
            isOpen: false, // Fenêtre visible ?
            isActive: false, // Appel en cours ?
            minimized: false, // Réduit ?
            x: 100,
            y: 100, // Position
            dragging: false,
            relX: 0,
            relY: 0,
            api: null, // Instance Jitsi
          });

          const toggleVisio = () => {
            // 1. Si pas d'appel, on lance
            if (!visioState.isActive) {
              visioState.isOpen = true;
              visioState.isActive = true;
              nextTick(initJitsi);
            }
            // 2. Si appel en cours mais fenêtre cachée (minimisée), on la remet
            else if (!visioState.isOpen) {
              visioState.isOpen = true;
            }
            // 3. Si fenêtre ouverte, on la cache (minimise) sans couper
            else {
              visioState.isOpen = false;
            }
          };

          const initJitsi = () => {
            if (visioState.api) return;

            const domain = "8x8.vc";
            const appID = "vpaas-magic-cookie-6d9b644a44dd43169d30c23ee93d243e"; // VOTRE APP ID

            const options = {
              roomName: `${appID}/DigComp_Salle_Virtuelle`, // Nom de salle unique
              width: "100%",
              height: "100%",
              parentNode: document.querySelector("#jaas-container"),
              configOverwrite: {
                startWithAudioMuted: true,
                startWithVideoMuted: true,
              },
              userInfo: {
                displayName: user.value
                  ? user.value.email.split("@")[0]
                  : "Invité",
              },
            };

            visioState.api = new window.JitsiMeetExternalAPI(domain, options);

            // Nettoyage quand on quitte
            visioState.api.addEventListeners({
              videoConferenceLeft: () => {
                visioState.api.dispose();
                visioState.api = null;
                visioState.isActive = false;
                visioState.isOpen = false;
              },
            });
          };

          // --- RESOURCE INSIGHT (ANALYSEUR DE CONTENU) ---
                const analyzingResId = ref(null); // Pour afficher le spinner sur la bonne ressource

                const analyzeResourceContent = async (outcome, resWrapper) => {
                    if (!apiKey.value) { alert("Clé API requise"); return; }

                    // 1. On retrouve la ressource originale dans la structure de données
                    // (car resWrapper est une copie avec l'année ajoutée)
                    const mapping = outcome.mappings[resWrapper.year];
                    if (!mapping || !mapping.resources) return;

                    const originalRes = mapping.resources.find(r => r.url === resWrapper.url && r.title === resWrapper.title);
                    if (!originalRes) return;

                    analyzingResId.value = resWrapper.url; // Début chargement

                    try {
                        // 2. Récupération du contenu (Scraping léger via Proxy)
                        let contentText = "";

                        // Si c'est YouTube, on ne peut pas scraper le transcript facilement sans API complexe.
                        // On se base sur le titre et l'URL pour que l'IA "devine" ou utilise ses connaissances.
                        if (originalRes.url.includes('youtube') || originalRes.url.includes('youtu.be')) {
                            contentText = `Vidéo YouTube intitulée : "${originalRes.title}". URL: ${originalRes.url}`;
                        } else {
                            // Pour les pages web classiques
                            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(originalRes.url)}`;
                            const response = await fetch(proxyUrl);
                            const data = await response.json();
                            if (data.contents) {
                                // On nettoie le HTML pour ne garder que le texte
                                const doc = new DOMParser().parseFromString(data.contents, "text/html");
                                contentText = doc.body.innerText.replace(/\s+/g, ' ').substring(0, 10000); // Max 10k chars
                            }
                        }

                        if (!contentText) throw new Error("Impossible de lire le contenu");

                        // 3. Appel IA
                        const model = new GoogleGenerativeAI(apiKey.value).getGenerativeModel({model: aiModel.value});
                        const prompt = `Analyse cette ressource pédagogique.
                        Contexte : "${contentText}".

                        Génère un JSON strict avec :
                        - "time": estimation temps lecture/visionnage (ex: "5 min").
                        - "tags": tableau de 3 mots-clés pertinents (courts).
                        - "summary": un résumé très concis en 2 phrases maximum (français).

                        Réponds UNIQUEMENT le JSON.`;

                        const result = await model.generateContent(prompt);
                        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                        const analysis = JSON.parse(text);

                        // 4. Sauvegarde dans l'objet ressource
                        originalRes.aiAnalysis = analysis;

                        triggerUpdate();
                        showToast("Ressource analysée avec succès !", "success");

                    } catch (e) {
                        console.error(e);
                        showToast("Échec de l'analyse : " + e.message, "error");
                    } finally {
                        analyzingResId.value = null;
                    }
                };

          // --- GESTION ASSIGNATION ÉQUIPE ---

          // 1. Assigner une personne spécifique
          const assignUser = (outcome, targetUser) => {
            if (!outcome.assignees) outcome.assignees = [];

            // On évite les doublons
            if (!outcome.assignees.includes(targetUser)) {
              outcome.assignees.push(targetUser);
              logActivity(`a assigné la tâche à ${targetUser}`, outcome.id);
              showToast(`${targetUser} assigné avec succès`, "success");
              triggerUpdate();
            }
          };

          // 2. Retirer une personne spécifique (en cliquant sur sa tête)
          const unassignUser = (outcome, targetUser) => {
            if (!outcome.assignees) return;
            outcome.assignees = outcome.assignees.filter(
              (u) => u !== targetUser
            );
            logActivity(`a désassigné ${targetUser}`, outcome.id);
            triggerUpdate();
          };

          // 3. Fonction wrapper pour le Kanban (retrouve l'objet par ID)
          const assignUserById = (outcomeId, targetUser) => {
            // Recherche de l'original dans la data
            let found = null;
            for (const d of digCompData.domains) {
              for (const c of d.competences) {
                found = c.outcomes.find((o) => o.id === outcomeId);
                if (found) break;
              }
              if (found) break;
            }
            if (found) assignUser(found, targetUser);
          };

          // Gestion du Drag & Drop de la fenêtre
          const startDragVisio = (e) => {
            visioState.dragging = true;
            visioState.relX = e.clientX - visioState.x;
            visioState.relY = e.clientY - visioState.y;
            window.addEventListener("mousemove", onDragVisio);
            window.addEventListener("mouseup", stopDragVisio);
          };
          const onDragVisio = (e) => {
            if (!visioState.dragging) return;
            visioState.x = e.clientX - visioState.relX;
            visioState.y = e.clientY - visioState.relY;
          };
          const stopDragVisio = () => {
            visioState.dragging = false;
            window.removeEventListener("mousemove", onDragVisio);
            window.removeEventListener("mouseup", stopDragVisio);
          };
          const commonEmojis = [
            "👍",
            "❤️",
            "😂",
            "😮",
            "😢",
            "🔥",
            "🎉",
            "👋",
            "✅",
            "❌",
          ];
          const md = window.markdownit();

          onMounted(() => {
            auth.onAuthStateChanged((u) => {
              user.value = u;
              if (u) initApp(u);
            });
            document.addEventListener("mousemove", resetIdleTimer);
            document.addEventListener("keydown", resetIdleTimer);
            if (localStorage.getItem("theme") === "dark") {
              isDarkMode.value = true;
              document.documentElement.classList.add("dark");
            }
            cleanupOldMessages()
          });

          const resetIdleTimer = () => {
            if (!user.value) return;
            if (idleTimeout) clearTimeout(idleTimeout);
            if (user.value.state === "idle")
              db.collection("users")
                .doc(user.value.uid)
                .update({ state: "online" });
            idleTimeout = setTimeout(
              () =>
                db
                  .collection("users")
                  .doc(user.value.uid)
                  .update({ state: "idle" }),
              300000
            );
          };

          const initApp = (u) => {
            db.collection("digcomp_data")
              .doc("main_v2")
              .onSnapshot((doc) => {
                if (doc.exists) {
                  const d = doc.data();
                  if (d.tags) availableTags.value = d.tags;
                  const hydratedDomains = (d.domains || []).map((dom) => ({
                    ...dom,
                    competences: (dom.competences || []).map((comp) => {
                      const shortId = comp.id.split("/").pop();
                      if (OFFICIAL_TITLES[shortId])
                        comp.name = OFFICIAL_TITLES[shortId];
                      return {
                        ...comp,
                        outcomes: (comp.outcomes || []).map((o) => {
                          const mappings = o.mappings || {};
                          ["L1", "L2", "L3"].forEach((y) => {
                            if (!mappings[y])
                              mappings[y] = {
                                developed: false,
                                status: "none",
                                courseLink: "",
                              };
                            if (
                              mappings[y].developed &&
                              (!mappings[y].status ||
                                mappings[y].status === "none")
                            ) {
                              mappings[y].status = "validated";
                            }
                            if (!mappings[y].status)
                              mappings[y].status = "none";
                          });
                          return {
                            ...o,
                            description: o.description || o.text || "...",
                            tags: o.tags || [],
                            mappings,
                            comments: o.comments || [],
                          };
                        }),
                      };
                    }),
                  }));
                  digCompData.domains = hydratedDomains;
                }
              });

            db.collection("users")
              .doc(u.uid)
              .onSnapshot((doc) => {
                if (doc.exists) {
                  const d = doc.data();
                  if (d.lastChatOpen)
                    lastReadTime.value = new Date(d.lastChatOpen);
                  else {
                    lastReadTime.value = new Date();
                    db.collection("users")
                      .doc(u.uid)
                      .update({ lastChatOpen: new Date().toISOString() });
                  }
                  if (d.prefSound) notificationSound.value = d.prefSound;
                  if (d.apiKey) apiKey.value = d.apiKey;
                  if (d.aiModel) aiModel.value = d.aiModel;
                  if (d.pinned) pinnedCompetences.value = d.pinned;
                }
              });

            db.collection("audit_logs")
              .orderBy("timestamp", "desc")
              .limit(50)
              .onSnapshot((snap) => {
                historyLogs.value = snap.docs.map((d) => ({
                  id: d.id,
                  ...d.data(),
                }));
              });

            db.collection("notifications")
              .where("userId", "==", u.uid)
              .orderBy("timestamp", "desc")
              .limit(20)
              .onSnapshot((snap) => {
                userNotifications.value = snap.docs.map((d) => ({
                  id: d.id,
                  ...d.data(),
                }));
              });

            const beat = () =>
              db.collection("users").doc(u.uid).set(
                {
                  email: u.email,
                  lastSeen: new Date().toISOString(),
                  state: "online",
                },
                { merge: true }
              );
            beat();
            heartbeatInterval = setInterval(beat, 60000);
            db.collection("users").onSnapshot((snap) => {
              const now = new Date();
              const active = [];
              snap.forEach((d) => {
                if (now - new Date(d.data().lastSeen) < 3600000)
                  active.push(d.data());
              });
              connectedUsers.value = active;
            });

            db.collection("messages")
              .orderBy("timestamp", "asc")
              .limitToLast(50)
              .onSnapshot((snap) => {
                chatMessages.value = snap.docs.map((d) => ({
                  id: d.id,
                  ...d.data(),
                }));
                if (!showChat.value) {
                  const unread = chatMessages.value.filter(
                    (m) =>
                      m.timestamp &&
                      m.timestamp.toDate() > lastReadTime.value &&
                      m.sender !== u.email
                  );
                  unreadCount.value = unread.length;
                }
                snap.docChanges().forEach((change) => {
                  if (change.type === "added") {
                    const msg = change.doc.data();
                    const msgTime = msg.timestamp
                      ? msg.timestamp.toDate()
                      : new Date();
                    if (msg.sender !== u.email && msgTime > appStartTime) {
                      if (!showChat.value || document.hidden) {
                        playNotificationSound();
                        if (document.hidden)
                          sendBrowserNotification(msg.sender, msg.text);
                      }
                    }
                  }
                });
                nextTick(() => {
                  if (chatBox.value)
                    chatBox.value.scrollTop = chatBox.value.scrollHeight;
                });
              });
          };

          const toggleDarkMode = () => {
            isDarkMode.value = !isDarkMode.value;
            document.documentElement.classList.toggle("dark");
            localStorage.setItem("theme", isDarkMode.value ? "dark" : "light");
          };

          const logAction = (action, targetId, desc, year, oldVal, newVal) => {
            db.collection("audit_logs").add({
              timestamp: new Date().toISOString(),
              user: user.value.email.split("@")[0],
              action,
              targetId,
              desc: desc.substring(0, 50) + "...",
              year,
              oldVal,
              newVal,
            });
          };

          const notifyFollowers = async (outcomeId, message) => {
            const snap = await db
              .collection("users")
              .where("pinned", "array-contains", outcomeId)
              .get();
            const batch = db.batch();
            snap.forEach((doc) => {
              if (doc.id !== user.value.uid) {
                // Don't notify self
                const ref = db.collection("notifications").doc();
                batch.set(ref, {
                  userId: doc.id,
                  title: "Mise à jour Favori",
                  message: message,
                  targetId: outcomeId,
                  timestamp: new Date().toISOString(),
                  read: false,
                });
              }
            });
            await batch.commit();
          };

          const getOutcomeDescription = (id) => {
            for (const d of digCompData.domains) {
              for (const c of d.competences) {
                const o = c.outcomes.find((x) => x.id === id);
                if (o) return o.description;
              }
            }
            return "";
          };

          const unreadNotifCount = computed(
            () => userNotifications.value.filter((n) => !n.read).length
          );

          const restoreState = (log) => {
            if (!confirm("Restaurer cet état ?")) return;
            let found = null;
            for (const d of digCompData.domains) {
              for (const c of d.competences) {
                found = c.outcomes.find((o) => o.id === log.targetId);
                if (found) break;
              }
              if (found) break;
            }
            if (found) {
              if (log.action === "status_change") {
                found.mappings[log.year].status = log.oldVal;
                found.mappings[log.year].developed = log.oldVal !== "none";
              } else if (log.action === "link") {
                found.mappings[log.year].courseLink = log.oldVal;
              }
              triggerUpdate();
            }
          };

          const openLOHistory = (outcome) => {
            currentHistoryOutcomeTitle.value =
              outcome.description.substring(0, 40) + "...";
            currentLOHistory.value = historyLogs.value.filter((log) => {
              const matchId = log.targetId === outcome.id;
              const matchYear =
                currentView.value === "Overview"
                  ? true
                  : log.year === currentView.value;
              return matchId && matchYear;
            });
            showLOHistoryModal.value = true;
          };

          const generateAIContent = async (outcome, type) => {
            if (!apiKey.value) {
              alert(
                "Veuillez d'abord configurer votre clé API Gemini dans les Paramètres."
              );
              showSettingsModal.value = true;
              return;
            }
            currentOutcomeForAI.value = outcome;
            currentAIType.value = type;
            showAIModal.value = true;
            aiLoading.value = true;
            aiError.value = "";
            aiResult.value = "";

            try {
              const genAI = new GoogleGenerativeAI(apiKey.value);
              const model = genAI.getGenerativeModel({ model: aiModel.value });

              let prompt = `Agis comme un expert en pédagogie informatique. Public: Etudiants Licence (Bac+1 à +3).
                        Compétence : ${outcome.description} (Niveau: ${outcome.level}).
                        Tâche : Génère `;

              if (type === "course")
                prompt += `un plan de cours détaillé avec : Introduction, 3 Concepts clés expliqués, Exemple concret, Conclusion.`;
              else if (type === "td")
                prompt += `un exercice de Travaux Dirigés (TD) progressif. Énonce l'objectif, les prérequis, et 3 étapes de difficulté croissante.`;
              else if (type === "qcm")
                prompt += `un QCM de 5 questions pour valider cette compétence. Affiche la question, 4 choix, et la réponse correcte expliquée à la fin.`;
              else if (type === "practice")
                prompt += `un scénario de mise en situation pratique (Projet ou TP). Contexte professionnel, Tâche à réaliser, Critères de réussite.`;

              prompt += ` Format de sortie : Markdown propre et structuré.`;

              const result = await model.generateContent(prompt);
              const response = await result.response;
              aiResult.value = response.text();
              showToast("Contenu généré par l'IA !", "success");
              logActivity("a généré une évaluation IA", outcome.id);
            } catch (e) {
              aiError.value = "Erreur Gemini : " + e.message;
            } finally {
              aiLoading.value = false;
            }
          };

          const togglePin = (cid) => {
            let pins = [...pinnedCompetences.value];
            const index = pins.indexOf(cid);
            if (index > -1) pins.splice(index, 1);
            else pins.push(cid);
            pinnedCompetences.value = pins;
            db.collection("users").doc(user.value.uid).update({ pinned: pins });
          };

          const selectCompetenceById = (id) => {
            for (const d of digCompData.domains) {
              const c = d.competences.find((x) => x.id === id);
              if (c) {
                selectCompetence(c);
                return;
              }
            }
          };
          const openCommentModal = (o) => {
            currentOutcomeForComments.value = o;
            showCommentModal.value = true;
          };

          const addComment = () => {
            if (!newCommentText.value.trim()) return;
            const comment = {
              text: newCommentText.value,
              author: user.value.email.split("@")[0],
              date: new Date().toISOString(),
              year: currentView.value,
            };
            currentOutcomeForComments.value.comments.push(comment);
            newCommentText.value = "";
            triggerUpdate();
          };

          const deleteComment = (c) => {
            if (!confirm("Supprimer ?")) return;
            const idx = currentOutcomeForComments.value.comments.indexOf(c);
            if (idx > -1) {
              currentOutcomeForComments.value.comments.splice(idx, 1);
              triggerUpdate();
            }
          };

          const getFilteredComments = (outcome) => {
            if (!outcome || !outcome.comments) return [];
            if (currentView.value === "Overview") return outcome.comments; // Show all
            return outcome.comments.filter((c) => c.year === currentView.value);
          };

          const getFilteredCommentsCount = (outcome) => {
            return getFilteredComments(outcome).length;
          };

          // RESOURCE MANAGEMENT
          const getResourcesCount = (outcome) => {
            if (currentView.value === "Overview") {
              return ["L1", "L2", "L3"].reduce(
                (acc, y) =>
                  acc +
                  (outcome.mappings[y].resources
                    ? outcome.mappings[y].resources.length
                    : 0),
                0
              );
            }
            return (outcome.mappings[currentView.value].resources || []).length;
          };

          const getAllResources = (outcome) => {
            if (currentView.value === "Overview") {
              let all = [];
              ["L1", "L2", "L3"].forEach((y) => {
                if (outcome.mappings[y].resources) {
                  all = all.concat(
                    outcome.mappings[y].resources.map((r) => ({
                      ...r,
                      year: y,
                    }))
                  );
                }
              });
              return all;
            }
            return (outcome.mappings[currentView.value].resources || []).map(
              (r) => ({ ...r, year: currentView.value })
            );
          };

          const addResource = (outcome) => {
            if (!outcome.newResTitle || !outcome.newResUrl) return;
            if (!outcome.mappings[currentView.value].resources)
              outcome.mappings[currentView.value].resources = [];

            const newRes = {
              id: Date.now(),
              title: outcome.newResTitle,
              url: outcome.newResUrl,
              user: user.value.email.split("@")[0],
              date: new Date().toISOString(),
            };

            outcome.mappings[currentView.value].resources.push(newRes);
            logActivity("a ajouté une ressource", "");
            logAction(
              "add_resource",
              outcome.id,
              outcome.description,
              currentView.value,
              null,
              outcome.newResTitle
            );
            notifyFollowers(
              outcome.id,
              `Nouveau document en ${currentView.value}: ${outcome.newResTitle}`
            );
            outcome.newResTitle = "";
            outcome.newResUrl = "";
            triggerUpdate();
          };

          const getMappingData = (o, y) => {
            if (!o.mappings) o.mappings = {};
            if (!o.mappings[y])
              o.mappings[y] = {
                developed: false,
                status: "none",
                courseLink: "",
              };
            return o.mappings[y];
          };

          const updateMapping = (o, y, f, v) => {
            const oldVal = getMappingData(o, y)[f];
            getMappingData(o, y)[f] = v;
            const actionType = f === "developed" ? (v ? "check" : "uncheck") : "link";
            logAction(actionType, o.id, o.description, y, oldVal, v);

            if (field === "courseLink" && value.length > 5) {
              // On log seulement si c'est un lien significatif
              logActivity(
                "a mis à jour le lien cours",
                `${outcome.id} (${year})`
              );
            }

            triggerUpdate();
          };
        
          const exportDataExcel = () => {
            const rows = [];
            digCompData.domains.forEach((d) => {
              d.competences.forEach((c) => {
                c.outcomes.forEach((o) => {
                  rows.push({
                    Domaine: d.name,
                    Competence: c.name,
                    Acquis: o.description,
                    Niveau: o.level,
                    // AJOUT DES TAGS (séparés par des virgules)
                    Composantes: (o.tags || []).join(", "),
                    // AJOUT DES STATUTS
                    Statut_L1: o.mappings.L1.status,
                    Statut_L2: o.mappings.L2.status,
                    Statut_L3: o.mappings.L3.status,
                    // AJOUT DES LIENS
                    Lien_L1: o.mappings.L1.courseLink || "",
                    Lien_L2: o.mappings.L2.courseLink || "",
                    Lien_L3: o.mappings.L3.courseLink || "",
                  });
                });
              });
            });
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "DigComp_Complet");
            XLSX.writeFile(wb, "digcomp_export_complet.xlsx");
            showToast("Export généré avec succès !", "success");
          };
          const exportDataPDF = () => {
            const { jsPDF } = window.jspdf;
            // Mode Paysage ('l') pour avoir de la place
            const doc = new jsPDF("l", "mm", "a4");

            doc.setFontSize(14);
            doc.text(
              `Rapport Détaillé DigComp - Vue ${currentView.value}`,
              14,
              15
            );

            const tableData = [];

            digCompData.domains.forEach((d) => {
              d.competences.forEach((c) => {
                c.outcomes.forEach((o) => {
                  // On filtre pour ne pas faire un PDF de 100 pages : on affiche que si c'est "actif" dans la vue
                  const showRow =
                    currentView.value === "Overview"
                      ? true
                      : isStatusActive(o, currentView.value);

                  if (showRow) {
                    // Récupération du lien selon la vue
                    let link = "";
                    if (
                      currentView.value === "Overview"
                    ) {
                      // En vue globale, on met juste "Oui" si lien existe
                      if (
                        o.mappings.L1.courseLink ||
                        o.mappings.L2.courseLink ||
                        o.mappings.L3.courseLink
                      )
                        link = "Voir Excel";
                    } else {
                      link = o.mappings[currentView.value].courseLink || "";
                    }

                    tableData.push([
                      c.id.split("/").pop(), // Code (ex: 1.1)
                      o.description.substring(0, 60) +
                        (o.description.length > 60 ? "..." : ""), // Desc tronquée
                      o.level,
                      (o.tags || []).join("\n"), // Tags (un par ligne dans la case)
                      link, // Le lien
                    ]);
                  }
                });
              });
            });

            doc.autoTable({
              head: [
                ["Ref", "Acquis", "Niveau", "Composantes (Tags)", "Lien Cours"],
              ],
              body: tableData,
              startY: 20,
              styles: { fontSize: 8, overflow: "linebreak" },
              columnStyles: {
                1: { cellWidth: 90 }, // La description prend de la place
                4: { cellWidth: 60 }, // Le lien aussi
              },
            });

            doc.save(`digcomp_report_${currentView.value}.pdf`);
            showToast("Export généré avec succès !", "success");
          };

          const requestNotifPermission = () =>
            Notification.requestPermission().then((p) => {
              notifPermission.value = p;
              if (p === "granted")
                new Notification("DigComp", { body: "Activé!" });
            });
          const previewSound = (type) => {
            const t = notificationSound.value;
            notificationSound.value = type;
            playNotificationSound();
            notificationSound.value = t;
          };

          const playNotificationSound = () => {
            if (notificationSound.value === "fanfare") {
              new Audio(
                "https://www.myinstants.com/media/sounds/final-fantasy-v-music-victory-fanfare.mp3"
              )
                .play()
                .catch((e) => console.log(e));
            } else if (notificationSound.value === "chat") {
              new Audio("https://www.myinstants.com/media/sounds/m-e-o-w.mp3")
                .play()
                .catch((e) => console.log(e));
            } else if (notificationSound.value === "college") {
              new Audio(
                "https://www.myinstants.com/media/sounds/sonnerie-college.mp3"
              )
                .play()
                .catch((e) => console.log(e));
            } else if (notificationSound.value === "SNCF") {
              new Audio(
                "https://www.myinstants.com/media/sounds/sncf-france-jingle.mp3"
              )
                .play()
                .catch((e) => console.log(e));
            } else if (notificationSound.value === "erreur") {
              new Audio("https://www.myinstants.com/media/sounds/erro.mp3")
                .play()
                .catch((e) => console.log(e));
            } else if (notificationSound.value === "motus") {
              new Audio(
                "https://www.myinstants.com/media/sounds/boule-noire.mp3"
              )
                .play()
                .catch((e) => console.log(e));
            } else if (notificationSound.value === "airhorn") {
              new Audio(
                "https://www.myinstants.com/media/sounds/dj-airhorn-sound-effect-kingbeatz_1.mp3"
              )
                .play()
                .catch((e) => console.log(e));
            } else if (notificationSound.value === "heehee") {
              new Audio(
                "https://www.myinstants.com/media/sounds/michael-jackson-hee-hee.mp3"
              )
                .play()
                .catch((e) => console.log(e));
            } else if (notificationSound.value === "romantique") {
              new Audio(
                "https://www.myinstants.com/media/sounds/romanceeeeeeeeeeeeee.mp3"
              )
                .play()
                .catch((e) => console.log(e));
                } else if (notificationSound.value === "tennis") {
              new Audio(
                "https://www.myinstants.com/media/sounds/tennis-shot.mp3"
              )
                .play()
                .catch((e) => console.log(e));

            } else if (notificationSound.value === "gandalf") {
              new Audio(
                "https://www.myinstants.com/media/sounds/gandalf_shallnotpass.mp3"
              )
                .play()
                .catch((e) => console.log(e));
            } else if (notificationSound.value === "kawoosh") {
              new Audio(
                "https://www.myinstants.com/media/sounds/spellgate-activation.mp3"
              )
                .play()
                .catch((e) => console.log(e));
            } else if (notificationSound.value === "zat") {
              new Audio("https://www.myinstants.com/media/sounds/zat-gun-2.mp3")
                .play()
                .catch((e) => console.log(e));
            } else if (notificationSound.value === "beep") {
              const ctx = new (window.AudioContext ||
                window.webkitAudioContext)();
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g);
              g.connect(ctx.destination);
              o.frequency.value = 800;
              g.gain.setValueAtTime(0.1, ctx.currentTime);
              g.gain.exponentialRampToValueAtTime(
                0.00001,
                ctx.currentTime + 0.5
              );
              o.start();
              o.stop(ctx.currentTime + 0.5);
            }
          };

          const saveSettings = () => {
            db.collection("users").doc(user.value.uid).update({
              prefSound: notificationSound.value,
              apiKey: apiKey.value,
              aiModel: aiModel.value,
            });
            showSettingsModal.value = false;
          };
          const sendBrowserNotification = (s, t) => {
            if (Notification.permission === "granted") {
              const n = new Notification(s.split("@")[0], { body: t });
              n.onclick = () => {
                window.focus();
                toggleChat();
              };
            }
          };
          const login = async () => {
            loading.value = true;
            if (Notification.permission !== "granted")
              await Notification.requestPermission();
            notifPermission.value = Notification.permission;
            try {
              await auth.signInWithEmailAndPassword(
                authForm.email,
                authForm.password
              );
            } catch (e) {
              authError.value = e.message;
            } finally {
              loading.value = false;
            }
          };
          const logout = () => auth.signOut();
          const toggleChat = () => {
            showChat.value = !showChat.value;
            if (showChat.value) {
              unreadCount.value = 0;
              nextTick(
                () => (chatBox.value.scrollTop = chatBox.value.scrollHeight)
              );
              db.collection("users")
                .doc(user.value.uid)
                .update({ lastChatOpen: new Date().toISOString() });
              lastReadTime.value = new Date();
            }
          };
          const toggleReaction = (msg, e) => {
            const r = msg.reactions || {};
            let u = r[e] || [];
            if (u.includes(user.value.email))
              u = u.filter((x) => x !== user.value.email);
            else u.push(user.value.email);
            if (u.length === 0) delete r[e];
            else r[e] = u;
            db.collection("messages").doc(msg.id).update({ reactions: r });
          };

          const triggerUpdate = async () => {
            if (user.value)
              await db
                .collection("digcomp_data")
                .doc("main_v2")
                .set(
                  {
                    domains: JSON.parse(JSON.stringify(digCompData.domains)),
                    tags: availableTags.value,
                    lastUpdated: new Date().toISOString(),
                  },
                  { merge: true }
                );
          };
          const handleTyping = () => {
            if (typingTimeout) clearTimeout(typingTimeout);
            db.collection("users")
              .doc(user.value.uid)
              .set({ isTyping: true }, { merge: true });
            typingTimeout = setTimeout(
              () =>
                db
                  .collection("users")
                  .doc(user.value.uid)
                  .set({ isTyping: false }, { merge: true }),
              2000
            );
          };
          const sendMessage = async () => {
            if (!newMessage.value.trim()) return;
            if (typingTimeout) clearTimeout(typingTimeout);
            db.collection("users")
              .doc(user.value.uid)
              .set({ isTyping: false }, { merge: true });
            await db.collection("messages").add({
              text: newMessage.value,
              sender: user.value.email,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            });
            newMessage.value = "";
          };
          const openAddModal = () => {
            newOutcome.description = "";
            showAddModal.value = true;
          };
          const addCustomOutcome = () => {
            if (!currentCompetence.value) return;
            const d = digCompData.domains.find((x) =>
              x.competences.some((c) => c.id === currentCompetence.value.id)
            );
            const c = d.competences.find(
              (x) => x.id === currentCompetence.value.id
            );
            c.outcomes.push({
              id: `C-${Date.now()}`,
              description: newOutcome.description,
              level: newOutcome.level,
              isAI: newOutcome.isAI,
              isCustom: true,
              mappings: {
                L1: { developed: false },
                L2: { developed: false },
                L3: { developed: false },
              },
              createdBy: user.value.email,
            });
            showAddModal.value = false;
            triggerUpdate();
          };
          const deleteOutcome = (o) => {
            if (!confirm("Supprimer?", "error")) return;
            const d = digCompData.domains.find((x) =>
              x.competences.some((c) => c.id === currentCompetence.value.id)
            );
            const c = d.competences.find(
              (x) => x.id === currentCompetence.value.id
            );
            const i = c.outcomes.findIndex((x) => x.id === o.id);
            if (i > -1) {
              c.outcomes.splice(i, 1);
              triggerUpdate();
            }
          };
          const selectCompetence = (c) => {
            currentCompetence.value = c;
            isMobileMenuOpen.value = false;
          };
          const currentDomainName = computed(() => {
            if (!currentCompetence.value) return "";
            const d = digCompData.domains.find((x) =>
              x.competences.some((c) => c.id === currentCompetence.value.id)
            );
            return d ? d.name : "";
          });
          const filteredTree = computed(() => {
            if (!searchQuery.value && !selectedComponentTag.value)
              return digCompData.domains;
            return digCompData.domains
              .map((d) => ({
                ...d,
                competences: d.competences.filter((c) =>
                  c.outcomes.some((o) => {
                    const matchText = (o.description || "")
                      .toLowerCase()
                      .includes(searchQuery.value.toLowerCase());
                    const matchTag = selectedComponentTag.value
                      ? o.tags.includes(selectedComponentTag.value)
                      : true;
                    return matchText && matchTag;
                  })
                ),
              }))
              .filter((d) => d.competences.length > 0);
          });
          const displayedOutcomes = computed(() => {
            if (!currentCompetence.value) return [];
            const d = digCompData.domains.find((x) =>
              x.competences.some((c) => c.id === currentCompetence.value.id)
            );
            if (!d) return [];
            const c = d.competences.find(
              (x) => x.id === currentCompetence.value.id
            );
            let out = c.outcomes;
            // --- NOUVEAU : FILTRE MES TÂCHES ---
            if (onlyMyTasks.value) {
              // On vérifie que l'utilisateur est connecté
              if (user.value) {
                const myId = user.value.email.split("@")[0];
                // On ne garde que les LO où mon ID est dans la liste 'assignees'
                out = out.filter(
                  (o) => o.assignees && o.assignees.includes(myId)
                );
              } else {
                return []; // Si pas connecté et filtre actif -> rien
              }
            }
            // -----------------------------------
            if (searchQuery.value)
              out = out.filter((o) =>
                (o.description || "")
                  .toLowerCase()
                  .includes(searchQuery.value.toLowerCase())
              );
            if (currentFilter.value !== "All")
              out = out.filter((o) => o.level === currentFilter.value);
            if (selectedComponentTag.value)
              out = out.filter((o) =>
                o.tags.includes(selectedComponentTag.value)
              );
            if (showCheckedOnly.value)
              out = out.filter((o) => {
                if (currentView.value === "Overview")
                  return ["L1", "L2", "L3"].some((y) => isStatusActive(o, y));
                return isStatusActive(o, currentView.value);
              });
            return out;
          });
          const translateLevel = (l) =>
            ({ Basic: "Fondamental", Intermediate: "Intermédiaire", Advanced: "Avancé", "Highly advanced": "Expert" }[l] || l);
          const getLevelBadgeClass = (l) =>
            ({ Basic: "badge-Basic", Intermediate: "badge-Intermediate", Advanced: "badge-Advanced", "Highly advanced": "badge-Highly-advanced" }[l] || "bg-gray-100");
          const getViewBadgeClass = () => {
            if (currentView.value === "L1")
              return "bg-red-100 text-red-700 border-red-200";
            if (currentView.value === "L2")
              return "bg-amber-100 text-amber-700 border-amber-200";
            if (currentView.value === "L3")
              return "bg-emerald-100 text-emerald-700 border-emerald-200";
            return "bg-slate-700 text-white border-slate-700";
          };
          const viewBgClass = computed(() => {
            if (isDarkMode.value) return "bg-darkbg";
            switch (currentView.value) {
              case "L1":
                return "bg-red-50/50";
              case "L2":
                return "bg-amber-50/50";
              case "L3":
                return "bg-green-50/50";
              default:
                return "bg-gray-50";
            }
          });
          const highlightText = (t) =>
            searchQuery.value
              ? t.replace(
                  new RegExp(`(${searchQuery.value})`, "gi"),
                  '<span class="bg-yellow-200 text-black font-bold">$1</span>'
                )
              : t;
          const calculateCompetenceCoverage = (c) => {
            if (!c.outcomes.length) return 0;
            let checked = 0;
            c.outcomes.forEach((o) => {
              if (currentView.value === "Overview") {
                if (isCoveredAnywhere(o)) checked++;
              } else {
                if (isStatusActive(o, currentView.value)) checked++;
              }
            });
            return (checked / c.outcomes.length) * 100;
          };
          const calculateDomainCoverage = (d) => {
            let t = 0,
              c = 0;
            d.competences.forEach((comp) => {
              t += comp.outcomes.length;
              comp.outcomes.forEach((o) => {
                if (currentView.value === "Overview") {
                  if (isCoveredAnywhere(o)) c++;
                } else {
                  if (isStatusActive(o, currentView.value)) c++;
                }
              });
            });
            return t ? (c / t) * 100 : 0;
          };
          const usersTypingText = computed(() => {
            if (!user.value) return "";
            return connectedUsers.value
              .filter((u) => u.isTyping && u.email !== user.value.email)
              .map((u) => u.email.split("@")[0])
              .join(", ");
          });
          const getUserColor = (email) => {
            const colors = [
              "bg-red-500",
              "bg-orange-500",
              "bg-amber-500",
              "bg-green-500",
              "bg-emerald-500",
              "bg-teal-500",
              "bg-cyan-500",
              "bg-blue-500",
              "bg-indigo-500",
              "bg-violet-500",
              "bg-purple-500",
              "bg-fuchsia-500",
              "bg-pink-500",
              "bg-rose-500",
            ];
            let hash = 0;
            for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
            return colors[Math.abs(hash) % colors.length];
          };
          const markdownToHtml = (t) => md.render(t);

          // WORKFLOW CYCLE
          const updateStatus = (o, y, newStatus) => {
            const statusLabels = {
              validated: "🟢 Validé",
              draft: "🟠 Brouillon",
              review: "🟡 En relecture", // Ajout
              obsolete: "⚪ Obsolète",
              none: "🔴 A faire",
            };
            const current = getMappingData(o, y).status || "none";
            if (!o.mappings) o.mappings = {};
            if (!o.mappings[y])
              o.mappings[y] = { developed: false, courseLink: "" };
            o.mappings[y].status = newStatus;
            o.mappings[y].developed = newStatus === "validated" || newStatus === "draft"; // Considered active for stats

            logAction(
              "status_change",
              o.id,
              o.description,
              y,
              current,
              newStatus
            );
            logActivity(`a passé en ${label}`, `${outcome.id} (${year})`);
            if (newStatus === "validated")
              notifyFollowers(o.id, `Compétence validée en ${y}`);
            triggerUpdate();
          };

          const fetchSyllabus = async () => {
            if (!importUrl.value) return;
            importLoading.value = true;
            try {
              // Utilisation d'un proxy pour contourner les restrictions CORS
              const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
                importUrl.value
              )}`;
              const response = await fetch(proxyUrl);
              const data = await response.json();
              if (data.contents) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, "text/html");
                // Extraction basique du texte (limité à 15000 caractères pour l'IA)
                const textContent = doc.body.innerText
                  .replace(/\s+/g, " ")
                  .substring(0, 15000);
                await analyzeSyllabus(textContent);
              } else {
                throw new Error("Impossible de lire le contenu.");
              }
            } catch (e) {
              alert(
                "Erreur de récupération : " +
                  e.message +
                  "\nLe site est peut-être protégé."
              );
              importLoading.value = false;
            }
          };

          // --- COLLABORATION : ASSIGNATION & RADAR ---

          // 1. Gestion du Radar d'Activité
          const showActivityPanel = ref(false); // Ouvrir/Fermer le panneau
          const activities = ref([]);

          // Fonction pour enregistrer une action
          const logActivity = (action, detail) => {
            if (!user.value) return;
            db.collection("activity_feed").add({
              user: user.value.email.split("@")[0],
              action: action, // ex: "A validé", "A commenté"
              detail: detail, // ex: "LO 1.2", "Ressource vidéo"
              date: new Date().toISOString(),
            });
          };

          // Écoute en temps réel du flux d'activité
          db.collection("activity_feed")
            .orderBy("date", "desc")
            .limit(50)
            .onSnapshot((snap) => {
              activities.value = snap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
            });

          // 2. Gestion des Assignations
          const onlyMyTasks = ref(false); // Le filtre "Mes Tâches" 

          const toggleAssignment = (outcome) => {
            if (!user.value) return;
            const me = user.value.email.split("@")[0];

            // Si pas de liste, on la crée
            if (!outcome.assignees) outcome.assignees = [];

            if (outcome.assignees.includes(me)) {
              // On se retire
              outcome.assignees = outcome.assignees.filter((u) => u !== me);
              logActivity("s'est désassigné de", outcome.id);
              showToast("Vous n'êtes plus assigné", "info");
            } else {
              // On s'ajoute
              outcome.assignees.push(me);
              logActivity("s'est assigné", outcome.id);
              showToast("Tâche assignée !", "success");
            }
            triggerUpdate(); // Sauvegarde
          };

          const analyzeSyllabus = async (text) => {
            try {
              if (!apiKey.value) {
                alert(
                  "Veuillez configurer votre clé API Gemini dans les paramètres."
                );
                importLoading.value = false;
                return;
              }

              const model = new GoogleGenerativeAI(
                apiKey.value
              ).getGenerativeModel({ model: aiModel.value });

              // On crée une version allégée de l'arbre pour économiser des tokens
              const simplifiedTree = digCompData.domains.map((d) => ({
                domain: d.name,
                competences: d.competences.flatMap((c) =>
                  c.outcomes.map((o) => ({ id: o.id, txt: o.description }))
                ),
              }));

              const prompt = `Analyse ce cours : "${text}".
                        Compare-le avec ce référentiel de compétences JSON : ${JSON.stringify(
                          simplifiedTree
                        )}.
                        Trouve les 3 à 8 compétences les plus pertinentes qui sont enseignées dans ce cours.
                        Format de réponse OBLIGATOIRE : Un tableau JSON brut (sans markdown) : [{"id": "ID_EXACT_DU_JSON", "justification": "Court texte expliquant pourquoi", "level": "Basic, Intermediate, Advanced ou Highly advanced"}].`;

              const result = await model.generateContent(prompt);
              const responseText = (await result.response).text();
              // Nettoyage du markdown si présent
              const jsonStr = responseText
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();

              const parsed = JSON.parse(jsonStr);
              // On ajoute une propriété 'selected' pour l'UI
              importAnalysisResult.value = parsed.map((i) => ({ ...i, selected: true }));

              showImportModal.value = false;
              showImportConfirmModal.value = true;
            } catch (e) {
              alert("Erreur analyse IA : " + e.message);
            } finally {
              importLoading.value = false;
            }
          };

          // --- CHAT WITH DATA (Assistant Référentiel) ---
const showDataChatModal = ref(false);
const dataChatQuery = ref("");
const dataChatResponse = ref("");
const dataChatLoading = ref(false);

// 1. Fonction pour alléger le JSON avant envoi (Token optimization)
const simplifyTreeForAnalysis = () => {
  return digCompData.domains.map(d => ({
    domain: d.name,
    competences: d.competences.map(c => ({
      id: c.id,
      name: c.name,
      outcomes: c.outcomes.map(o => ({
        id: o.id,
        desc: o.description.substring(0, 100), // On tronque pour économiser
        level: o.level,
        // On extrait juste l'essentiel des statuts
        L1: { status: o.mappings.L1.status, hasRes: (o.mappings.L1.resources || []).length > 0 },
        L2: { status: o.mappings.L2.status, hasRes: (o.mappings.L2.resources || []).length > 0 },
        L3: { status: o.mappings.L3.status, hasRes: (o.mappings.L3.resources || []).length > 0 },
        assignees: o.assignees || []
      }))
    }))
  }));
};

// 2. La fonction d'appel à Gemini
const askDataAssistant = async () => {
  if (!apiKey.value) {
    alert("Veuillez configurer la clé API Gemini dans les paramètres.");
    return;
  }
  if (!dataChatQuery.value.trim()) return;

  dataChatLoading.value = true;
  dataChatResponse.value = "";

  try {
    const genAI = new GoogleGenerativeAI(apiKey.value);
    const model = genAI.getGenerativeModel({ model: aiModel.value });

    const simplifiedData = simplifyTreeForAnalysis();
    
    const prompt = `
      Tu es un analyste de données pédagogiques. Voici l'état actuel du projet DigComp au format JSON :
      ${JSON.stringify(simplifiedData)}

      Analyse ces données pour répondre à la question de l'utilisateur.
      Sois précis, cite les IDs des compétences si nécessaire. Fais des statistiques si demandé.
      
      Question utilisateur : "${dataChatQuery.value}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    dataChatResponse.value = response.text();
  } catch (e) {
    dataChatResponse.value = "Erreur : " + e.message;
  } finally {
    dataChatLoading.value = false;
  }
};

const closeAIModal = () => {
    showAIModal.value = false;
    aiLoading.value = false;
    aiError.value = "";
    aiResult.value = "";
    currentOutcomeForAI.value = null;
    currentAIType.value = "";
};

const closeHunterModal = () => {
    showHunterModal.value = false;
    hunterLoading.value = false;
    hunterResults.value = null;
    hunterSearchTerms.value = null;
    magicUrlInput.value = "";
    magicLoading.value = false;
    currentOutcomeForAI.value = null;
};

const closeDataChatModal = () => {
    showDataChatModal.value = false;
    dataChatQuery.value = "";
    dataChatResponse.value = "";
    dataChatLoading.value = false;
};


          const applyImport = () => {
            const targetYear =
              currentView.value === "Overview" ? "L1" : currentView.value;
            let count = 0;

            importAnalysisResult.value.forEach((item) => {
              if (item.selected) {
                // Recherche du LO correspondant dans l'arbre
                for (const d of digCompData.domains) {
                  for (const c of d.competences) {
                    const outcome = c.outcomes.find((o) => o.id === item.id);
                    if (outcome) {
                      // On utilise les fonctions existantes pour la mise à jour
                      updateStatus(outcome, targetYear, "validated");
                      updateMapping(
                        outcome,
                        targetYear,
                        "courseLink",
                        importUrl.value
                      );
                      count++;
                    }
                  }
                }
              }
            });

            showImportConfirmModal.value = false;
            importUrl.value = "";
            showToast("Importation terminée avec succès", "success");
          };

          const getStatusClass = (status) => {
            switch (status) {
              case "validated":
                return "bg-green-100 text-green-700 border-green-200";
              case "draft":
                return "bg-orange-100 text-orange-700 border-orange-200";
              // AJOUT ICI
              case "review":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
              case "obsolete":
                return "bg-red-100 text-red-700 border-red-200";
              default:
                return "bg-gray-100 text-gray-500 border-gray-200";
            }
          };
          const getStatusIcon = (status) => {
            if (status === "validated") return "ph-check-circle";
            if (status === "draft") return "ph-pencil-simple";
            if (status === "review") return "ph-eye"; // Icône "Oeil" pour relecture
            if (status === "obsolete") return "ph-trash";
            return "ph-circle";
          };

          const getStatusLabel = (status) => {
            const labels = {
              validated: "Validé",
              draft: "Brouillon",
              review: "En relecture", // Ajout
              obsolete: "Obsolète",
              none: "Non traité",
            };
            return labels[status] || status;
          };
          const isStatusActive = (o, y) => {
            const s = getMappingData(o, y).status;
            return s === "validated" || s === "draft";
          };

          const isCoveredAnywhere = (o) =>
            o.mappings && ["L1", "L2", "L3"].some((y) => isStatusActive(o, y));

          // TAGS
          const addTag = (o, t) => {
            if (!t || o.tags.includes(t)) return;
            o.tags.push(t);
            triggerUpdate();
          };
          const removeTag = (o, t) => {
            const i = o.tags.indexOf(t);
            if (i > -1) {
              o.tags.splice(i, 1);
              triggerUpdate();
            }
          };

          // DASHBOARD LOGIC
          const dashboardStats = reactive({
            totalLOs: 0,
            globalCoverage: 0,
            draftCount: 0,
            noResourceCount: 0,
          });
          const renderCharts = () => {
            let counts = {
              L1: 0,
              L2: 0,
              L3: 0,
              draft: 0,
              noRes: 0,
              total: 0,
              domains: {},
            };
            digCompData.domains.forEach((d) => {
              let dVal = 0;
              d.competences.forEach((c) => {
                c.outcomes.forEach((o) => {
                  counts.total++;
                  ["L1", "L2", "L3"].forEach((y) => {
                    if (o.mappings[y].status === "validated") {
                      counts[y]++;
                      dVal++;
                    }
                    if (o.mappings[y].status === "draft") counts.draft++;
                    if (
                      o.mappings[y].status === "validated" &&
                      (!o.mappings[y].resources ||
                        o.mappings[y].resources.length === 0)
                    )
                      counts.noRes++;
                  });
                });
              });
              counts.domains[d.name] = dVal;
            });

            dashboardStats.totalLOs = counts.total;
            dashboardStats.globalCoverage = Math.round(
              (counts.L3 / counts.total) * 100
            ); // Simplification L3 = target
            dashboardStats.draftCount = counts.draft;
            dashboardStats.noResourceCount = counts.noRes;

            if (dashBarChart) dashBarChart.destroy();
            dashBarChart = new Chart(document.getElementById("dashBarChart"), {
              type: "bar",
              data: {
                labels: ["L1", "L2", "L3"],
                datasets: [
                  {
                    label: "Validés",
                    data: [counts.L1, counts.L2, counts.L3],
                    backgroundColor: ["#FCA5A5", "#FCD34D", "#6EE7B7"],
                  },
                ],
              },
            });

            if (dashDoughnutChart) dashDoughnutChart.destroy();
            dashDoughnutChart = new Chart(
              document.getElementById("dashDoughnutChart"),
              {
                type: "doughnut",
                data: {
                  labels: ["Validés", "Brouillon", "Manque Ressource"],
                  datasets: [
                    {
                      data: [
                        counts.L1 + counts.L2 + counts.L3,
                        counts.draft,
                        counts.noRes,
                      ],
                      backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
                    },
                  ],
                },
              }
            );

            if (dashRadarChart) dashRadarChart.destroy();
            dashRadarChart = new Chart(
              document.getElementById("dashRadarChart"),
              {
                type: "radar",
                data: {
                  labels: Object.keys(counts.domains),
                  datasets: [
                    {
                      label: "Couverture",
                      data: Object.values(counts.domains),
                      backgroundColor: "rgba(59, 130, 246, 0.2)",
                      borderColor: "#3B82F6",
                    },
                  ],
                },
                options: { scales: { r: { beginAtZero: true } } },
              }
            );
          };

          const changeView = (v) => {
            currentView.value = v;
            if (v === "Dashboard") nextTick(renderCharts);
          };

          return {
            digCompData,
            currentCompetence,
            user,
            connectedUsers,
            authForm,
            authError,
            loading,
            isSyncing,
            searchQuery,
            currentFilter,
            currentView,
            filteredTree,
            displayedOutcomes,
            currentDomainName,
            isMobileMenuOpen,
            isDarkMode,
            showCheckedOnly,
            selectedComponentTag,
            availableTags,
            login,
            logout,
            selectCompetence,
            updateMapping,
            getMappingData,
            isCoveredAnywhere,
            showAddModal,
            newOutcome,
            openAddModal,
            addCustomOutcome,
            deleteOutcome,
            showChat,
            showEmojiPicker,
            showSettingsModal,
            notificationSound,
            chatMessages,
            newMessage,
            chatBox,
            unreadCount,
            sendMessage,
            handleTyping,
            toggleChat,
            toggleReaction,
            previewSound,
            saveSettings,
            translateLevel,
            getLevelBadgeClass,
            getViewBadgeClass,
            viewBgClass,
            highlightText,
            calculateCompetenceCoverage,
            calculateDomainCoverage,
            exportDataExcel,
            exportDataPDF,
            requestNotifPermission,
            notifPermission,
            commonEmojis,
            usersTypingText,
            toggleDarkMode,
            togglePin,
            selectCompetenceById,
            pinnedCompetences,
            getCompetenceName: (id) => {
              for (const d of digCompData.domains)
                for (const c of d.competences) if (c.id === id) return c.name;
              return id;
            },
            openCommentModal,
            showCommentModal,
            currentOutcomeForComments,
            newCommentText,
            addComment,
            deleteComment,
            getUserColor,
            showHistoryModal,
            historyLogs,
            restoreState,
            showAIModal,
            aiResult,
            aiLoading,
            aiError,
            generateAIContent,
            markdownToHtml,
            apiKey,
            aiModel,
            currentAIType,
            getFilteredComments,
            getFilteredCommentsCount,
            openLOHistory,
            showLOHistoryModal,
            currentLOHistory,
            currentHistoryOutcomeTitle,
            getResourcesCount,
            getAllResources,
            addResource,
            removeResource,
            updateStatus,
            getStatusClass,
            getStatusIcon,
            getStatusLabel,
            isStatusActive,
            userNotifications,
            unreadNotifCount,
            showNotifDropdown,
            changeView,
            dashboardStats,
            addTag,
            removeTag,
            getLongName,
            showImportModal,
            showImportConfirmModal,
            importUrl,
            importLoading,
            importAnalysisResult,
            fetchSyllabus,
            applyImport,
            getOutcomeDescription,
            visioState,
            toggleVisio,
            startDragVisio,
            showTimeMachineModal,
            snapshots,
            newSnapshotName,
            loadSnapshots,
            createSnapshot,
            restoreSnapshot,
            exportMoodleXML,
            activeLocks,
            requestLock,
            isLocked,
            getLockerName,
            kanbanYear,
            kanbanColumns,
            draggedOutcome,
            onDrop,
            showSunburstModal,
            openSunburst,
            exportToPixExcel,
            showHunterModal,
            openResourceHunter,
            launchHunter,
            hunterLoading,
            hunterResults,
            adoptResource,
            removeResource,
            toasts,
            showToast,
            removeToast,
            showActivityPanel,
            activities,
            logActivity,
            onlyMyTasks,
            toggleAssignment,
            assignUser,
            unassignUser,
            assignUserById,
            toggleAssignmentById,
            hunterSearchTerms,
            magicUrlInput,
            magicLoading,
            shortUrl,
            handleMagicPaste,
            kanbanOverview,
            fetchSmartTitle,
            showEditResModal,
            editResForm,
            openEditResource,
            saveEditedResource,
            showDataChatModal,
            dataChatQuery,
            dataChatResponse,
            dataChatLoading,
            askDataAssistant,
            closeAIModal,
            closeHunterModal,
            closeDataChatModal,
            getDiffHtml, editingOutcomeId, tempDescription, startEditDescription,saveDescription,
            handlePaste,
            fileInput, triggerFileInput, handleFileUpload, formatMessage, analyzeResourceContent, analyzingResId
          };
        },
      }).mount("#app");
