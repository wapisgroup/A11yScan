import { type SchemaTypeDefinition } from 'sanity'

import {blockContentType} from './blockContentType'
import {categoryType} from './categoryType'
import {postType} from './postType'
import {authorType} from './authorType'
import {pageType} from './pageType'
import {heroType} from './heroType'
import {featureBoxType} from './featureBoxType'
import {ctaType} from './ctaType'
import {sectionHeadingType} from './sectionHeadingType'
import {processStepsType} from './processStepsType'
import {infoBoxType} from './infoBoxType'
import {columnsType} from './columnsType'
import {twoColumnLayoutType} from './twoColumnLayoutType'
import {twoColumnType} from './twoColumnType'
import sectionType from './sectionType'
import {reusableCtaType} from './reusableCtaType'
import ctaReferenceType from './ctaReferenceType'
import {faqType} from './faqType'
import {faqCategoryType} from './faqCategoryType'
import {faqListType} from './faqListType'
import {faqCategoryListType} from './faqCategoryListType'
import {pricingTiersType} from './pricingTiersType'
import {contactFormType} from './contactFormType'
import {contactInfoType} from './contactInfoType'
import {testimonialsType} from './testimonialsType'
import {logoCloudType} from './logoCloudType'
import {statsType} from './statsType'
import {tableType} from './tableType'
import {reusableTableType} from './reusableTableType'
import tableReferenceType from './tableReferenceType'
import {htmlType} from './htmlType'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContentType, 
    categoryType, 
    postType, 
    authorType,
    pageType,
    heroType,
    featureBoxType,
    ctaType,
    sectionHeadingType,
    processStepsType,
    infoBoxType,
    columnsType,
    twoColumnLayoutType,
    twoColumnType,
    sectionType,
    reusableCtaType,
    ctaReferenceType,
    faqType,
    faqCategoryType,
    faqListType,
    faqCategoryListType,
    pricingTiersType,
    contactFormType,
    contactInfoType,
    testimonialsType,
    logoCloudType,
    statsType,
    tableType,
    reusableTableType,
    tableReferenceType,
    htmlType,
  ],
}
