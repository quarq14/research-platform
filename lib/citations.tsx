export type CitationStyle = "APA" | "MLA" | "Chicago"

export interface Author {
  firstName: string
  lastName: string
}

export interface Source {
  id?: string
  title: string
  authors: Author[]
  year: number
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  doi?: string
  url?: string
  type: "article" | "book" | "website" | "conference"
  publisher?: string
  accessed?: string
}

export function formatCitation(source: Source, style: CitationStyle): string {
  switch (style) {
    case "APA":
      return formatAPA(source)
    case "MLA":
      return formatMLA(source)
    case "Chicago":
      return formatChicago(source)
    default:
      return formatAPA(source)
  }
}

export function formatInTextCitation(source: Source, style: CitationStyle, page?: string): string {
  switch (style) {
    case "APA":
      return formatAPAInText(source, page)
    case "MLA":
      return formatMLAInText(source, page)
    case "Chicago":
      return formatChicagoInText(source, page)
    default:
      return formatAPAInText(source, page)
  }
}

function formatAPA(source: Source): string {
  const authors = formatAuthorsAPA(source.authors)
  const year = source.year
  const title = source.title
  const journal = source.journal ? `<i>${source.journal}</i>` : ""
  const volume = source.volume ? `, ${source.volume}` : ""
  const issue = source.issue ? `(${source.issue})` : ""
  const pages = source.pages ? `, ${source.pages}` : ""
  const doi = source.doi ? `. https://doi.org/${source.doi}` : ""

  if (source.type === "article") {
    return `${authors} (${year}). ${title}. ${journal}${volume}${issue}${pages}${doi}`
  }

  return `${authors} (${year}). <i>${title}</i>${doi || (source.url ? `. ${source.url}` : "")}`
}

function formatMLA(source: Source): string {
  const authors = formatAuthorsMLA(source.authors)
  const title = `"${source.title}"`
  const journal = source.journal ? `<i>${source.journal}</i>` : ""
  const volume = source.volume ? `, vol. ${source.volume}` : ""
  const issue = source.issue ? `, no. ${source.issue}` : ""
  const year = source.year
  const pages = source.pages ? `, pp. ${source.pages}` : ""
  const doi = source.doi ? `. doi:${source.doi}` : ""

  if (source.type === "article") {
    return `${authors}. ${title}. ${journal}${volume}${issue}, ${year}${pages}${doi}`
  }

  return `${authors}. <i>${source.title}</i>. ${year}${doi || (source.url ? `. ${source.url}` : "")}`
}

function formatChicago(source: Source): string {
  const authors = formatAuthorsChicago(source.authors)
  const year = source.year
  const title = `"${source.title}"`
  const journal = source.journal ? `<i>${source.journal}</i>` : ""
  const volume = source.volume ? ` ${source.volume}` : ""
  const issue = source.issue ? `, no. ${source.issue}` : ""
  const pages = source.pages ? `: ${source.pages}` : ""
  const doi = source.doi ? `. https://doi.org/${source.doi}` : ""

  if (source.type === "article") {
    return `${authors}. ${title}. ${journal}${volume}${issue} (${year})${pages}${doi}`
  }

  return `${authors}. <i>${source.title}</i>. ${year}${doi || (source.url ? `. ${source.url}` : "")}`
}

function formatAPAInText(source: Source, page?: string): string {
  const firstAuthor = source.authors[0]
  const lastName = firstAuthor.lastName
  const year = source.year
  const pageRef = page ? `, p. ${page}` : ""

  if (source.authors.length === 1) {
    return `(${lastName}, ${year}${pageRef})`
  } else if (source.authors.length === 2) {
    return `(${lastName} & ${source.authors[1].lastName}, ${year}${pageRef})`
  } else {
    return `(${lastName} et al., ${year}${pageRef})`
  }
}

function formatMLAInText(source: Source, page?: string): string {
  const firstAuthor = source.authors[0]
  const lastName = firstAuthor.lastName
  const pageRef = page ? ` ${page}` : ""

  if (source.authors.length === 1) {
    return `(${lastName}${pageRef})`
  } else if (source.authors.length === 2) {
    return `(${lastName} and ${source.authors[1].lastName}${pageRef})`
  } else {
    return `(${lastName} et al.${pageRef})`
  }
}

function formatChicagoInText(source: Source, page?: string): string {
  const firstAuthor = source.authors[0]
  const lastName = firstAuthor.lastName
  const year = source.year
  const pageRef = page ? `, ${page}` : ""

  if (source.authors.length === 1) {
    return `(${lastName} ${year}${pageRef})`
  } else if (source.authors.length === 2) {
    return `(${lastName} and ${source.authors[1].lastName} ${year}${pageRef})`
  } else {
    return `(${lastName} et al. ${year}${pageRef})`
  }
}

function formatAuthorsAPA(authors: Author[]): string {
  if (authors.length === 0) return "Unknown"
  if (authors.length === 1) {
    return `${authors[0].lastName}, ${authors[0].firstName.charAt(0)}.`
  }
  if (authors.length <= 20) {
    const formatted = authors.map((a) => `${a.lastName}, ${a.firstName.charAt(0)}.`)
    return formatted.slice(0, -1).join(", ") + ", & " + formatted[formatted.length - 1]
  }
  // More than 20 authors
  const formatted = authors.slice(0, 19).map((a) => `${a.lastName}, ${a.firstName.charAt(0)}.`)
  return (
    formatted.join(", ") +
    ", ... " +
    `${authors[authors.length - 1].lastName}, ${authors[authors.length - 1].firstName.charAt(0)}.`
  )
}

function formatAuthorsMLA(authors: Author[]): string {
  if (authors.length === 0) return "Unknown"
  if (authors.length === 1) {
    return `${authors[0].lastName}, ${authors[0].firstName}`
  }
  const first = `${authors[0].lastName}, ${authors[0].firstName}`
  const rest = authors
    .slice(1)
    .map((a) => `${a.firstName} ${a.lastName}`)
    .join(", ")
  return `${first}, and ${rest}`
}

function formatAuthorsChicago(authors: Author[]): string {
  if (authors.length === 0) return "Unknown"
  if (authors.length === 1) {
    return `${authors[0].lastName}, ${authors[0].firstName}`
  }
  if (authors.length <= 3) {
    const formatted = authors.map((a, i) =>
      i === 0 ? `${a.lastName}, ${a.firstName}` : `${a.firstName} ${a.lastName}`,
    )
    return formatted.slice(0, -1).join(", ") + ", and " + formatted[formatted.length - 1]
  }
  return `${authors[0].lastName}, ${authors[0].firstName}, et al.`
}
