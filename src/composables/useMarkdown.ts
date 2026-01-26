import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
})

// Simple HTML sanitizer to prevent XSS
const sanitizeHtml = (html: string): string => {
  // Remove script tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers
  html = html.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  html = html.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')

  // Remove javascript: protocol in href/src
  html = html.replace(/\s*href\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, ' href="#"')
  html = html.replace(/\s*src\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, ' src="#"')

  // Remove data: protocol in src (potential XSS vector)
  html = html.replace(/\s*src\s*=\s*["']?\s*data:[^"'>\s]*/gi, ' src="#"')

  // Remove style tags
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remove iframe tags
  html = html.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')

  // Remove object/embed tags
  html = html.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
  html = html.replace(/<embed\b[^>]*\/?>/gi, '')

  // Remove form tags
  html = html.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')

  return html
}

export function useMarkdown() {
  const render = (text: string): string => {
    const html = md.render(text)
    return sanitizeHtml(html)
  }

  // Render without sanitization (use only for trusted content)
  const renderUnsafe = (text: string): string => {
    return md.render(text)
  }

  return {
    render,
    renderUnsafe
  }
}
