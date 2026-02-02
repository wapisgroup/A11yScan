import type {StructureResolver} from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Pages')
        .child(
          S.list()
            .title('Pages')
            .items([
              S.documentTypeListItem('page').title('All Pages'),
            ])
        ),
      S.divider(),
      S.listItem()
        .title('Blog')
        .child(
          S.list()
            .title('Blog')
            .items([
              S.documentTypeListItem('post').title('Posts'),
              S.documentTypeListItem('category').title('Categories'),
              S.documentTypeListItem('author').title('Authors'),
            ])
        ),
      S.divider(),
      S.listItem()
        .title('FAQ')
        .child(
          S.list()
            .title('FAQ')
            .items([
              S.documentTypeListItem('faq').title('FAQs'),
              S.documentTypeListItem('faqCategory').title('Categories'),
            ])
        ),
      S.divider(),
      S.listItem()
        .title('Reusable Components')
        .child(
          S.list()
            .title('Reusable Components')
            .items([
              S.documentTypeListItem('reusableCta').title('CTAs'),
            ])
        ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) => item.getId() && !['post', 'category', 'author', 'page', 'reusableCta', 'faq', 'faqCategory'].includes(item.getId()!),
      ),
    ])
