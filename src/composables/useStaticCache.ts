// Cache intelligent pour les données statiques
import { ref } from 'vue'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  version?: string
}

class StaticCache {
  private cache = new Map<string, CacheItem<any>>()
  
  // TTL par défaut pour différents types de données
  private defaultTTLs = {
    digcomp_data: 24 * 60 * 60 * 1000, // 24h pour les données DigComp
    user_stats: 10 * 60 * 1000,        // 10min pour les stats utilisateur
    shop_items: 60 * 60 * 1000,        // 1h pour les articles du magasin
    challenges: 30 * 60 * 1000,        // 30min pour les défis
    news: 60 * 60 * 1000,              // 1h pour les news
    default: 5 * 60 * 1000             // 5min par défaut
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    // Vérifier si le cache est expiré
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  set<T>(key: string, data: T, customTTL?: number): void {
    const dataType = key.split('_')[0] as keyof typeof this.defaultTTLs
    const ttl = customTTL || this.defaultTTLs[dataType] || this.defaultTTLs.default

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      version: '1.0'
    })
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    // Invalider les clés correspondant au pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  // Obtenir les statistiques du cache
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: this.calculateMemoryUsage()
    }
  }

  private calculateMemoryUsage(): number {
    let total = 0
    for (const item of this.cache.values()) {
      total += JSON.stringify(item).length
    }
    return total
  }

  // Nettoyer les éléments expirés
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Instance singleton
const staticCache = new StaticCache()

// Nettoyage automatique toutes les 10 minutes
setInterval(() => staticCache.cleanup(), 10 * 60 * 1000)

export function useStaticCache() {
  const cacheStats = ref(staticCache.getStats())

  const updateStats = () => {
    cacheStats.value = staticCache.getStats()
  }

  return {
    get: staticCache.get.bind(staticCache),
    set: staticCache.set.bind(staticCache),
    invalidate: staticCache.invalidate.bind(staticCache),
    cleanup: staticCache.cleanup.bind(staticCache),
    stats: cacheStats,
    updateStats
  }
}