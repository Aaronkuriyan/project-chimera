/**
 * lib/detection/crawler-taxonomy.ts
 *
 * Comprehensive taxonomy of AI scrapers, search LLM crawlers, commercial data-mining bots,
 * and automated scraping tooling.
 * Categorized with threat levels, operator attributions, and intended collection targets.
 */

export type CrawlerCategory =
  | "foundation-pretraining" // Harvests broad web for LLM foundation pretraining (e.g. GPTBot, CCBot)
  | "search-rag"            // Real-time indexing for AI search & answer engines (e.g. Perplexity, OAI-SearchBot)
  | "commercial-aggregator" // Commercial scraping & market intelligence (e.g. ByteSpider, Diffbot)
  | "stealth-framework"     // Headless browsers & automated scraping libraries (e.g. Scrapy, Puppeteer)
  | "seo-marketing";        // SEO & backlink analyzers (e.g. Ahrefs, Semrush)

export type CrawlerProfile = {
  id: string;
  name: string;
  operator: string;
  category: CrawlerCategory;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  pattern: RegExp;
  respectsRobotsTxt: boolean;
};

export const CRAWLER_TAXONOMY: CrawlerProfile[] = [
  // --- Foundation Model Pre-training Crawlers ---
  {
    id: "gptbot",
    name: "GPTBot",
    operator: "OpenAI",
    category: "foundation-pretraining",
    riskLevel: "CRITICAL",
    description: "Harvests unstructured web text to train next-generation GPT foundation models.",
    pattern: /gptbot/i,
    respectsRobotsTxt: true,
  },
  {
    id: "chatgpt-user",
    name: "ChatGPT-User",
    operator: "OpenAI",
    category: "search-rag",
    riskLevel: "HIGH",
    description: "On-demand web retrieval triggered by user ChatGPT browsing sessions.",
    pattern: /chatgpt-user/i,
    respectsRobotsTxt: true,
  },
  {
    id: "oai-searchbot",
    name: "OAI-SearchBot",
    operator: "OpenAI",
    category: "search-rag",
    riskLevel: "HIGH",
    description: "Indexes content for SearchGPT / OpenAI real-time search.",
    pattern: /oai-searchbot/i,
    respectsRobotsTxt: true,
  },
  {
    id: "claudebot",
    name: "ClaudeBot",
    operator: "Anthropic",
    category: "foundation-pretraining",
    riskLevel: "CRITICAL",
    description: "Pre-training and fine-tuning crawler for Claude models.",
    pattern: /claudebot|claude-web|anthropic-ai/i,
    respectsRobotsTxt: true,
  },
  {
    id: "ccbot",
    name: "CCBot",
    operator: "Common Crawl",
    category: "foundation-pretraining",
    riskLevel: "CRITICAL",
    description: "Open-source crawl database that feeds LLaMA, Mistral, and dozens of foundational models.",
    pattern: /ccbot/i,
    respectsRobotsTxt: true,
  },
  {
    id: "perplexitybot",
    name: "PerplexityBot",
    operator: "Perplexity AI",
    category: "search-rag",
    riskLevel: "HIGH",
    description: "Live search indexing crawler feeding Perplexity's answer engine.",
    pattern: /perplexitybot|perplexity-user/i,
    respectsRobotsTxt: false,
  },
  {
    id: "bytespider",
    name: "Bytespider",
    operator: "ByteDance (TikTok/Doubao)",
    category: "commercial-aggregator",
    riskLevel: "CRITICAL",
    description: "Aggressive crawler harvesting training corpora for ByteDance's LLM ecosystem.",
    pattern: /bytespider/i,
    respectsRobotsTxt: false,
  },
  {
    id: "google-extended",
    name: "Google-Extended",
    operator: "Google DeepMind",
    category: "foundation-pretraining",
    riskLevel: "CRITICAL",
    description: "Token collector training Google Gemini and AI Overviews models.",
    pattern: /google-extended/i,
    respectsRobotsTxt: true,
  },
  {
    id: "applebot-extended",
    name: "Applebot-Extended",
    operator: "Apple",
    category: "foundation-pretraining",
    riskLevel: "HIGH",
    description: "Crawl bot gathering training datasets for Apple Intelligence foundation models.",
    pattern: /applebot-extended/i,
    respectsRobotsTxt: true,
  },
  {
    id: "meta-externalagent",
    name: "Meta-ExternalAgent",
    operator: "Meta AI",
    category: "foundation-pretraining",
    riskLevel: "CRITICAL",
    description: "Web crawler collecting multimodal datasets for LLaMA and Meta AI training.",
    pattern: /meta-externalagent|facebookbot/i,
    respectsRobotsTxt: true,
  },
  {
    id: "cohere-ai",
    name: "Cohere-AI",
    operator: "Cohere",
    category: "foundation-pretraining",
    riskLevel: "HIGH",
    description: "Scrapes multilingual text for Command R+ enterprise model training.",
    pattern: /cohere-ai|cohere-training-data-crawler/i,
    respectsRobotsTxt: true,
  },
  {
    id: "amazonbot",
    name: "Amazonbot",
    operator: "Amazon",
    category: "foundation-pretraining",
    riskLevel: "HIGH",
    description: "Crawls web knowledge to train Amazon Titan, Bedrock, and Alexa LLMs.",
    pattern: /amazonbot/i,
    respectsRobotsTxt: true,
  },
  {
    id: "diffbot",
    name: "Diffbot",
    operator: "Diffbot",
    category: "commercial-aggregator",
    riskLevel: "HIGH",
    description: "Constructs automated Knowledge Graphs sold to Fortune 500 LLM developers.",
    pattern: /diffbot/i,
    respectsRobotsTxt: false,
  },
  {
    id: "youbot",
    name: "YouBot",
    operator: "You.com",
    category: "search-rag",
    riskLevel: "MEDIUM",
    description: "Real-time RAG crawler for You.com multimodal conversational search.",
    pattern: /youbot/i,
    respectsRobotsTxt: true,
  },
  {
    id: "omgilibot",
    name: "Omgilibot",
    operator: "Webz.io",
    category: "commercial-aggregator",
    riskLevel: "HIGH",
    description: "Massive commercial web data-firehose repackaged and sold as LLM training data.",
    pattern: /omgili|omgilibot/i,
    respectsRobotsTxt: false,
  },
  {
    id: "ai2bot",
    name: "AI2Bot",
    operator: "Allen Institute for AI",
    category: "foundation-pretraining",
    riskLevel: "MEDIUM",
    description: "Crawls open datasets for research models like OLMo and Dolma corpus.",
    pattern: /ai2bot/i,
    respectsRobotsTxt: true,
  },
  {
    id: "timpibot",
    name: "Timpibot",
    operator: "Timpi",
    category: "search-rag",
    riskLevel: "LOW",
    description: "Decentralized search indexer collecting public page tokens.",
    pattern: /timpibot/i,
    respectsRobotsTxt: true,
  },
  {
    id: "imagesiftbot",
    name: "ImagesiftBot",
    operator: "Imagesift",
    category: "commercial-aggregator",
    riskLevel: "MEDIUM",
    description: "Multimodal image and text scraper for computer vision training.",
    pattern: /imagesiftbot/i,
    respectsRobotsTxt: false,
  },
  // --- Headless Tools & Automated Scraping Frameworks ---
  {
    id: "python-requests",
    name: "Python Requests/Urllib",
    operator: "Custom Script / Scraper",
    category: "stealth-framework",
    riskLevel: "HIGH",
    description: "Basic automated script scraping without browser execution.",
    pattern: /python-requests|python-urllib|aiohttp|httpx/i,
    respectsRobotsTxt: false,
  },
  {
    id: "scrapy",
    name: "Scrapy Spider",
    operator: "Scrapy Framework",
    category: "stealth-framework",
    riskLevel: "CRITICAL",
    description: "High-throughput asynchronous distributed web scraping crawler.",
    pattern: /scrapy/i,
    respectsRobotsTxt: false,
  },
  {
    id: "headless-browser",
    name: "Headless Chrome / Playwright / Puppeteer",
    operator: "Automated Browser",
    category: "stealth-framework",
    riskLevel: "CRITICAL",
    description: "Headless rendering engine running scripted DOM traversal to evade basic blocks.",
    pattern: /headlesschrome|puppeteer|playwright|selenium|phantomjs/i,
    respectsRobotsTxt: false,
  },
  {
    id: "http-client",
    name: "Node/Go/Curl HTTP Client",
    operator: "API / CLI Client",
    category: "stealth-framework",
    riskLevel: "MEDIUM",
    description: "Programmatic HTTP utility without real browser rendering or user headers.",
    pattern: /curl\/|wget\/|axios\/|node-fetch|go-http-client|okhttp|libwww-perl|java\//i,
    respectsRobotsTxt: false,
  },
];

/**
 * Fast lookup against the crawler taxonomy.
 */
export function identifyCrawler(userAgent: string): CrawlerProfile | undefined {
  if (!userAgent) return undefined;
  for (const crawler of CRAWLER_TAXONOMY) {
    if (crawler.pattern.test(userAgent)) {
      return crawler;
    }
  }
  return undefined;
}
