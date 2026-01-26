import { ref } from 'vue'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIGenerationType, LearningOutcome, MagicImportResult } from '@/types'

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_DELAY = 1000 // 1 second

export function useGemini() {
  const loading = ref(false)
  const result = ref('')
  const error = ref('')
  const streamingText = ref('')
  const isStreaming = ref(false)
  const retryCount = ref(0)

  // Sleep function for retry delays
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Retry wrapper with exponential backoff
  const withRetry = async <T>(
    fn: () => Promise<T>,
    onRetry?: (attempt: number, delay: number) => void
  ): Promise<T> => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        retryCount.value = attempt
        return await fn()
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))

        // Check if it's a retryable error (503, rate limit, etc.)
        const isRetryable = lastError.message.includes('503') ||
          lastError.message.includes('overloaded') ||
          lastError.message.includes('rate limit') ||
          lastError.message.includes('RESOURCE_EXHAUSTED')

        if (!isRetryable || attempt === MAX_RETRIES - 1) {
          throw lastError
        }

        const delay = INITIAL_DELAY * Math.pow(2, attempt)
        onRetry?.(attempt + 1, delay)
        await sleep(delay)
      }
    }

    throw lastError
  }

  // Validate API key
  const validateApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

      // Simple test request
      await model.generateContent('Test. Reply with OK.')

      return { valid: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue'

      if (message.includes('API_KEY_INVALID') || message.includes('invalid')) {
        return { valid: false, error: 'Clé API invalide' }
      }
      if (message.includes('quota') || message.includes('QUOTA')) {
        return { valid: false, error: 'Quota API dépassé' }
      }

      return { valid: false, error: message }
    }
  }

  // Generate content with streaming support
  const generateContent = async (
    apiKey: string,
    model: string,
    outcome: LearningOutcome,
    type: AIGenerationType,
    useStreaming = false,
    onRetryCallback?: (attempt: number, delay: number) => void
  ) => {
    console.log('🔧 useGemini.generateContent called')
    console.log('Model:', model)
    console.log('Type:', type)
    console.log('Streaming:', useStreaming)

    loading.value = true
    error.value = ''
    result.value = ''
    streamingText.value = ''
    isStreaming.value = useStreaming

    try {
      const generateFn = async () => {
        console.log('🔑 Initializing Gemini AI...')
        const genAI = new GoogleGenerativeAI(apiKey)
        const aiModel = genAI.getGenerativeModel({ model })
        console.log('✓ Gemini AI initialized')

        let prompt = ''
        const context = `${outcome.description} (Niveau ${outcome.level})`

        switch (type) {
          case 'course':
            prompt = `Tu es un enseignant expert. Crée un plan de cours structuré pour : "${context}".

Réponds en markdown avec ce format :
## Introduction
[Présentation du sujet en 2-3 phrases]

## Concept 1 : [Titre]
[Explication détaillée]

## Concept 2 : [Titre]
[Explication détaillée]

## Concept 3 : [Titre]
[Explication détaillée]

## Exemple Pratique
[Cas concret d'application]

## Conclusion
[Synthèse et perspectives]`
            break

          case 'td':
            prompt = `Tu es un enseignant expert. Crée un exercice progressif de TD pour : "${context}".

Réponds en markdown avec ce format :
## Objectif
[Description de l'objectif pédagogique]

## Prérequis
[Liste des connaissances nécessaires]

## Étape 1 : [Titre]
[Instructions et questions]

## Étape 2 : [Titre]
[Instructions et questions]

## Étape 3 : [Titre]
[Instructions et questions]

## Pour aller plus loin
[Suggestions d'approfondissement]`
            break

          case 'qcm':
            prompt = `Tu es un enseignant expert. Crée un QCM de 5 questions pour évaluer : "${context}".

Réponds en markdown avec ce format :
### Question 1
[Énoncé de la question]

a) [Choix A]
b) [Choix B]
c) [Choix C]
d) [Choix D]

**Réponse correcte :** [Lettre]
**Explication :** [Justification]

[Répéter pour les 5 questions]`
            break

          case 'practice':
            prompt = `Tu es un enseignant expert. Crée une mise en situation professionnelle pour : "${context}".

Réponds en markdown avec ce format :
## Contexte Professionnel
[Description du contexte de travail]

## Situation
[Description détaillée de la situation]

## Tâche à Réaliser
[Liste précise des actions attendues]

## Critères de Réussite
[Comment évaluer la réalisation]

## Ressources Disponibles
[Outils et documents à disposition]`
            break
        }

        console.log('📝 Prompt generated, calling API...')

        if (useStreaming) {
          const response = await aiModel.generateContentStream(prompt)

          for await (const chunk of response.stream) {
            const text = chunk.text()
            streamingText.value += text
          }

          result.value = streamingText.value
        } else {
          const response = await aiModel.generateContent(prompt)
          result.value = response.response.text()
        }

        console.log('📨 Response received!')
        return result.value
      }

      await withRetry(generateFn, onRetryCallback)
      console.log('✅ Result set:', result.value.substring(0, 100))
    } catch (err) {
      console.error('💥 Error in useGemini:', err)
      error.value = err instanceof Error ? err.message : 'Erreur lors de la génération'
      throw err
    } finally {
      loading.value = false
      isStreaming.value = false
      retryCount.value = 0
      console.log('🏁 Loading set to false')
    }
  }

  const analyzeResource = async (apiKey: string, url: string, title: string) => {
    loading.value = true
    error.value = ''

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

      const prompt = `Analyse cette ressource pédagogique :
Titre: ${title}
URL: ${url}

Réponds avec ce JSON exact :
{
  "duration": "durée estimée (ex: 10 min, 1h30)",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "résumé en 1-2 phrases"
}`

      const response = await model.generateContent(prompt)
      const text = response.response.text()

      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return JSON.parse(text)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de l\'analyse'
      return null
    } finally {
      loading.value = false
    }
  }

  const generateSearchTerms = async (apiKey: string, outcome: LearningOutcome) => {
    loading.value = true
    error.value = ''

    try {
      const fn = async () => {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
          model: 'gemini-3-flash-preview',
          generationConfig: { responseMimeType: 'application/json' }
        })

        const context = outcome.description
        const prompt = `Agis comme un expert pédagogique.
Sujet : "${context}" (Niveau ${outcome.level}).

Ta mission : Créer les meilleures requêtes de recherche pour trouver des ressources de qualité.

Réponds avec ce JSON :
{
  "youtube": ["requête1", "requête2", "requête3"],
  "google": ["requête1", "requête2", "requête3"],
  "wikipedia": ["terme1", "terme2"]
}

Consignes :
- YouTube : tutoriels vidéos concrets
- Google : articles, guides, PDFs
- Wikipedia : concepts théoriques

Sois spécifique et pertinent.`

        const response = await model.generateContent(prompt)
        const text = response.response.text()
        return JSON.parse(text)
      }

      return await withRetry(fn)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la génération'
      return null
    } finally {
      loading.value = false
    }
  }

  const analyzeSyllabus = async (apiKey: string, content: string, allOutcomes: LearningOutcome[]) => {
    loading.value = true
    error.value = ''

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-pro',
        generationConfig: { responseMimeType: 'application/json' }
      })

      const outcomesText = allOutcomes.map(o => `${o.id}: ${o.description}`).join('\n')

      const prompt = `Analyse ce syllabus de cours et identifie les compétences DigComp correspondantes.

**Syllabus:**
${content.substring(0, 10000)}

**Compétences DigComp disponibles:**
${outcomesText}

Réponds avec ce JSON :
{
  "matches": [
    {
      "outcomeId": "ID exact de la compétence",
      "confidence": "score de 0 à 100",
      "reasoning": "justification courte"
    }
  ]
}

Sélectionne 3 à 8 compétences les plus pertinentes.`

      const response = await model.generateContent(prompt)
      const text = response.response.text()
      return JSON.parse(text)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de l\'analyse'
      return null
    } finally {
      loading.value = false
    }
  }

  // Magic import: analyze URL and find matching LOs
  const analyzeUrl = async (
    apiKey: string,
    url: string,
    allOutcomes: LearningOutcome[]
  ): Promise<MagicImportResult | null> => {
    loading.value = true
    error.value = ''

    try {
      const fn = async () => {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-pro',
          generationConfig: { responseMimeType: 'application/json' }
        })

        const outcomesText = allOutcomes.slice(0, 100).map(o => `${o.id}: ${o.description}`).join('\n')

        const prompt = `Analyse cette URL de ressource pédagogique et identifie les compétences DigComp qu'elle pourrait développer.

**URL à analyser:** ${url}

**Compétences DigComp disponibles:**
${outcomesText}

Réponds avec ce JSON :
{
  "title": "Titre de la ressource déduit de l'URL",
  "summary": "Description de ce que contient cette ressource (1-2 phrases)",
  "suggestedType": "video" ou "document" ou "file",
  "matches": [
    {
      "outcomeId": "ID exact de la compétence (ex: LO1.1.01)",
      "confidence": 85,
      "reasoning": "Pourquoi cette ressource correspond à cette compétence"
    }
  ]
}

Instructions :
- Déduis le contenu probable de l'URL (YouTube, article, PDF, etc.)
- Sélectionne 1 à 5 compétences les plus pertinentes
- Donne un score de confiance réaliste (0-100)
- Le type suggéré dépend de l'URL (youtube = video, article = document, etc.)`

        const response = await model.generateContent(prompt)
        const text = response.response.text()
        const parsed = JSON.parse(text)

        return {
          url,
          title: parsed.title || 'Ressource importée',
          summary: parsed.summary || '',
          matches: parsed.matches || [],
          suggestedType: parsed.suggestedType || 'document'
        } as MagicImportResult
      }

      return await withRetry(fn)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de l\'analyse'
      return null
    } finally {
      loading.value = false
    }
  }

  const chatWithData = async (apiKey: string, question: string, digcompData: any) => {
    loading.value = true
    error.value = ''
    result.value = ''

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })

      // Simplify data to reduce tokens
      const simplifiedData = {
        totalDomains: digcompData.domains?.length || 0,
        domains: digcompData.domains?.map((d: any) => ({
          id: d.id,
          name: d.name,
          competences: d.competences?.map((c: any) => ({
            id: c.id,
            name: c.name,
            outcomes: c.outcomes?.map((o: any) => ({
              id: o.id,
              level: o.level,
              statusL1: o.mappings?.L1?.status,
              statusL2: o.mappings?.L2?.status,
              statusL3: o.mappings?.L3?.status,
              hasResourcesL1: (o.mappings?.L1?.resources?.length || 0) > 0,
              hasResourcesL2: (o.mappings?.L2?.resources?.length || 0) > 0,
              hasResourcesL3: (o.mappings?.L3?.resources?.length || 0) > 0
            }))
          }))
        }))
      }

      const prompt = `Tu es un assistant spécialisé dans l'analyse du référentiel DigComp.

Données du référentiel :
${JSON.stringify(simplifiedData, null, 2)}

Question de l'utilisateur : ${question}

Réponds de manière claire et concise en français. Utilise des statistiques précises si pertinent.`

      const response = await model.generateContent(prompt)
      result.value = response.response.text()
      return result.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la requête'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    result,
    error,
    streamingText,
    isStreaming,
    retryCount,
    validateApiKey,
    generateContent,
    analyzeResource,
    generateSearchTerms,
    analyzeSyllabus,
    analyzeUrl,
    chatWithData
  }
}
