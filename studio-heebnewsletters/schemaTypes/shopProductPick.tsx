import {defineField, defineType} from 'sanity'
import {ShopifyProductPicker} from '../components/ShopifyProductPicker'

/**
 * A pointer to one product in the Heeb Media Shopify store, chosen with a
 * live search. Only `handle` matters to the site (it re-reads price, stock
 * and images from Shopify on every render); `title`/`imageUrl` are cached
 * for the Studio preview.
 */
export const shopProductPickType = defineType({
  name: 'shopProductPick',
  title: 'Shop product',
  type: 'object',
  components: {input: ShopifyProductPicker},
  fields: [
    defineField({
      name: 'handle',
      title: 'Product handle',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'title', title: 'Title (cached)', type: 'string', readOnly: true}),
    defineField({name: 'imageUrl', title: 'Image (cached)', type: 'url', readOnly: true}),
    defineField({
      name: 'note',
      title: 'Why this? (optional)',
      description:
        'One short line shown under the product on the article, e.g. "The issue this story ran in."',
      type: 'string',
    }),
  ],
  preview: {
    select: {title: 'title', handle: 'handle', note: 'note', imageUrl: 'imageUrl'},
    prepare({title, handle, note, imageUrl}) {
      return {
        title: title || handle || 'Pick a product',
        subtitle: note || (handle ? `/shop/${handle}` : ''),
        media: imageUrl ? (
          <img src={`${imageUrl}?width=120`} alt="" style={{objectFit: 'cover', width: '100%', height: '100%'}} />
        ) : undefined,
      }
    },
  },
})
