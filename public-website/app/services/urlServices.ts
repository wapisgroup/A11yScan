"use client";
const URL_AUTH = '/auth'

export const startTrial = '/signup'
export const openSample = "window.open('/sample-report', '_blank')";
export const contactSales = 'mailto:sales@a11yscan.example?subject=Demo%20request%20for%20A11yScan'


export const URL_FRONTEND_FEATURES = "/features"
export const URL_FRONTEND_PRICING = "/pricing"
export const URL_FRONTEND_FAQS = "/faqs"
export const URL_FRONTEND_CONTACT = "/contact"

export const URL_FRONTEND_CASE_STUDIES = "/contact"
export const URL_FRONTEND_BLOG = "/contact"
export const URL_FRONTEND_DOCUMENTATION = "/contact"
export const URL_FRONTEND_GUIDES = "/contact"

export const URL_FRONTEND_PRIVACY = "/privacy"
export const URL_FRONTEND_TERMS = "/terms"
export const URL_FRONTEND_COOKIES = "/cookies"



export const URL_APP_WORKSPACE = "/workspace"
export const URL_AUTH_LOGIN = `${URL_AUTH}/login`


export const main_menu_urls = [
    {url: URL_FRONTEND_FEATURES, title:'Features'},
    {url: URL_FRONTEND_PRICING, title:'Pricing'},
    {url: URL_FRONTEND_FAQS, title:'FAQs'},
    {url: URL_FRONTEND_CONTACT, title:'Contact'},
];

export const main_menu_mobile_urls = main_menu_urls;