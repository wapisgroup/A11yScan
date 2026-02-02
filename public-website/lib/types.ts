// TypeScript types for Sanity content

export interface SanityImage {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  alt?: string
}

export interface Author {
  _id: string
  _type: 'author'
  name: string
  slug: { current: string }
  image?: SanityImage
  bio?: string
}

export interface BlogPost {
  _id: string
  _type: 'blogPost'
  title: string
  slug: { current: string }
  author: Author
  publishedAt: string
  excerpt: string
  mainImage?: SanityImage
  body: any[] // Portable Text
  categories?: string[]
  readTime?: number
}

export interface FeatureBoxComponent {
  _type: 'featureBox'
  _key: string
  title: string
  description: string
  icon?: string
  features?: string[]
  withoutBackground?: boolean
  iconFirst?: boolean
  iconSize?: 'small' | 'medium' | 'large'
}

export interface HeroComponent {
  _type: 'hero'
  _key: string
  title: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  backgroundImage?: SanityImage
  badge?: string
  badgeVariant?: 'green' | 'blue'
  alignment?: 'center' | 'left' | 'right'
  noPadding?: boolean
}

export interface CTAComponent {
  _type: 'cta'
  _key: string
  title: string
  description?: string
  buttonText: string
  buttonLink: string
  variant?: 'primary' | 'secondary'
}

export interface SectionHeadingComponent {
  _type: 'sectionHeading'
  _key: string
  title: string
  description?: string
}

export interface ProcessStep {
  _key: string
  title: string
  description: string
}

export interface ProcessStepsComponent {
  _type: 'processSteps'
  _key: string
  steps: ProcessStep[]
}

export interface InfoBoxComponent {
  _type: 'infoBox'
  _key: string
  text: string
  variant?: 'green' | 'blue' | 'yellow' | 'red'
  icon?: 'bolt' | 'check' | 'info' | 'exclamation'
}

export interface Column {
  _key: string
  components: PageComponent[]
}

export interface ColumnsComponent {
  _type: 'columns'
  _key: string
  numberOfColumns: 1 | 2 | 3 | 4 | 5 | 6
  columns: Column[]
}

export interface TwoColumnLayout {
  _type: 'twoColumnLayout'
  _key: string
  leftColumn: PageComponent[]
  rightColumn: PageComponent[]
}

export interface SectionComponent {
  _type: 'section'
  _key: string
  internalTitle: string
  components: PageComponent[]
  gap: 'none' | 'small' | 'medium' | 'large' | 'xlarge'
  backgroundColor: 'none' | 'white' | 'slate-50' | 'slate-100' | 'slate-gradient' | 'purple-gradient' | 'blue-gradient'
}

export interface ReusableCtaComponent {
  _type: 'reusableCta'
  _id: string
  title: string
  heading: string
  description?: string
  primaryButtonText: string
  primaryButtonLink: string
  secondaryButtonText?: string
  secondaryButtonLink?: string
  footerText?: string
  variant?: 'purple-blue' | 'purple' | 'blue'
}

export interface CtaReferenceComponent {
  _type: 'ctaReference'
  _key: string
  cta: ReusableCtaComponent
}

export interface FAQCategory {
  _id: string
  _type: 'faqCategory'
  title: string
  slug: { current: string }
  description?: string
}

export interface FAQ {
  _id: string
  _type: 'faq'
  question: string
  answer: string
  category: FAQCategory
  order: number
  publishedAt: string
}

export interface FaqListComponent {
  _type: 'faqList'
  _key: string
}

export interface FaqCategoryComponent {
  _type: 'faqCategory'
  _key: string
  title?: string
  category: FAQCategory
  limit: number
}

export interface FaqCategoryListComponent {
  _type: 'faqCategoryList'
  _key: string
  title?: string
  category: FAQCategory
  limit: number
}

export interface PricingTier {
  name: string
  price: string
  pricePeriod?: string
  description?: string
  badge?: string
  highlighted?: boolean
  features?: {
    text: string
    included: boolean
    emphasized?: boolean
  }[]
  buttonText: string
  buttonLink: string
  buttonVariant?: 'primary' | 'secondary'
}

export interface PricingTiersComponent {
  _type: 'pricingTiers'
  _key: string
  tiers: PricingTier[]
}
export interface ContactFormComponent {
  _type: 'contactForm';
  _key: string;
  title?: string;
  description?: string;
  requireCompany?: boolean;
  submitButtonText?: string;
  successMessage?: string;
  helperText?: string;
}

export interface ContactInfoItem {
  _key: string;
  title: string;
  description?: string;
  icon: 'email' | 'support' | 'partners' | 'phone' | 'location';
  email?: string;
  phone?: string;
  customText?: string;
}

export interface ContactInfoComponent {
  _type: 'contactInfo';
  _key: string;
  title?: string;
  description?: string;
  items: ContactInfoItem[];
}

export interface Testimonial {
  _key: string;
  quote: string;
  name: string;
  title?: string;
  company?: string;
  avatar?: string;
}

export interface TestimonialsComponent {
  _type: 'testimonials';
  _key: string;
  title?: string;
  description?: string;
  testimonials: Testimonial[];
}

export interface Logo {
  _key: string;
  name: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface LogoCloudComponent {
  _type: 'logoCloud';
  _key: string;
  title?: string;
  description?: string;
  logos: Logo[];
}

export interface Stat {
  _key: string;
  value: string;
  label: string;
  description?: string;
  icon?: 'check' | 'users' | 'clock' | 'chart' | 'star' | 'globe' | 'document' | 'shield';
}

export interface StatsComponent {
  _type: 'stats';
  _key: string;
  stats: Stat[];
  size?: 'normal' | 'small';
}

export interface TableRow {
  _key: string;
  cells: string[];
}

export interface TableComponent {
  _type: 'table';
  _key: string;
  title?: string;
  description?: string;
  headers?: string[];
  rows: TableRow[];
}

export interface ReusableTableComponent {
  _type: 'reusableTable';
  _id: string;
  title: string;
  displayTitle?: string;
  description?: string;
  headers: string[];
  rows: TableRow[];
}

export interface TableReferenceComponent {
  _type: 'tableReference';
  _key: string;
  table: ReusableTableComponent;
}

export interface TwoColumnComponent {
  _type: 'twoColumn';
  _key: string;
  ratio: '1fr_1fr' | '2fr_1fr' | '1fr_2fr';
  leftColumn: PageComponent[];
  rightColumn: PageComponent[];
}
export interface HTMLComponent {
  _type: 'html'
  _key: string
  htmlContent: string
}
export type PageComponent =
  | FeatureBoxComponent
  | HeroComponent
  | CTAComponent
  | SectionHeadingComponent
  | ProcessStepsComponent
  | InfoBoxComponent
  | ColumnsComponent
  | TwoColumnLayout
  | SectionComponent
  | CtaReferenceComponent
  | FaqListComponent
  | FaqCategoryComponent
  | FaqCategoryListComponent
  | PricingTiersComponent
  | ContactFormComponent
  | ContactInfoComponent
  | TestimonialsComponent
  | LogoCloudComponent
  | StatsComponent
  | TableComponent
  | TableReferenceComponent
  | TwoColumnComponent
  | HTMLComponent

export interface Page {
  _id: string
  _type: 'page'
  title: string
  slug: { current: string }
  description?: string
  components?: PageComponent[]
}
