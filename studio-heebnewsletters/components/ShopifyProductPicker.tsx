import {useCallback, useEffect, useRef, useState} from 'react'
import {Autocomplete, Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {SearchIcon, TrashIcon} from '@sanity/icons'
import {set, unset, type ObjectInputProps} from 'sanity'

/**
 * Custom input for the `shopProductPick` object: searches the Heeb Media
 * Shopify catalog through the tokenless Storefront API (same endpoint the
 * site uses; nothing to install or sync) and stores the handle plus a cached
 * title/image for the Studio preview. The site always re-reads live data by
 * handle, so the cached fields are only for editors.
 */

const STORE_DOMAIN = '303ed7-79.myshopify.com'
const API_VERSION = '2026-07'
const ENDPOINT = `https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`

const SEARCH_QUERY = `
  query PickerSearch($query: String!) {
    products(first: 25, query: $query, sortKey: TITLE) {
      nodes {
        handle
        title
        productType
        availableForSale
        featuredImage { url }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  }
`

type Hit = {
  handle: string
  title: string
  productType: string
  availableForSale: boolean
  imageUrl: string | null
  price: string
}

async function searchProducts(term: string, signal?: AbortSignal): Promise<Hit[]> {
  const safe = term.replace(/["\\]/g, ' ').trim()
  const query = safe ? `title:*${safe}* OR product_type:*${safe}* OR handle:${safe}*` : ''
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query: SEARCH_QUERY, variables: {query}}),
    signal,
  })
  const json = await res.json()
  const nodes = json?.data?.products?.nodes ?? []
  return nodes.map((n: any) => ({
    handle: n.handle,
    title: n.title,
    productType: n.productType || '',
    availableForSale: Boolean(n.availableForSale),
    imageUrl: n.featuredImage?.url ?? null,
    price: n.priceRange?.minVariantPrice
      ? `$${Number(n.priceRange.minVariantPrice.amount).toFixed(0)}`
      : '',
  }))
}

export function ShopifyProductPicker(props: ObjectInputProps) {
  const {value, onChange, renderDefault} = props
  const current = (value ?? {}) as {handle?: string; title?: string; imageUrl?: string}
  const [term, setTerm] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [loading, setLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    const t = setTimeout(() => {
      searchProducts(term, ctrl.signal)
        .then((h) => setHits(h))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 200)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [term])

  const choose = useCallback(
    (handle: string) => {
      const hit = hits.find((h) => h.handle === handle)
      if (!hit) return
      onChange([
        set(hit.handle, ['handle']),
        set(hit.title, ['title']),
        hit.imageUrl ? set(hit.imageUrl, ['imageUrl']) : unset(['imageUrl']),
      ])
    },
    [hits, onChange],
  )

  const clear = useCallback(() => {
    onChange([unset(['handle']), unset(['title']), unset(['imageUrl'])])
  }, [onChange])

  return (
    <Stack space={3}>
      {current.handle ? (
        <Card padding={3} radius={2} shadow={1} tone="positive">
          <Flex align="center" gap={3}>
            {current.imageUrl ? (
              <img
                src={`${current.imageUrl}${current.imageUrl.includes('?') ? '&' : '?'}width=96`}
                alt=""
                width={48}
                height={48}
                style={{objectFit: 'cover', borderRadius: 4, flex: '0 0 auto'}}
              />
            ) : null}
            <Box flex={1}>
              <Text size={1} weight="semibold">
                {current.title || current.handle}
              </Text>
              <Text size={1} muted>
                heebmedia.com/products/{current.handle}
              </Text>
            </Box>
            <Button icon={TrashIcon} mode="ghost" tone="critical" text="Remove" onClick={clear} />
          </Flex>
        </Card>
      ) : null}
      <Autocomplete
        id={`shopify-picker-${props.id}`}
        icon={SearchIcon}
        placeholder={current.handle ? 'Search to replace this product…' : 'Search the Heeb shop (title, type or handle)…'}
        loading={loading}
        openButton
        options={hits.map((h) => ({value: h.handle, hit: h}))}
        filterOption={() => true}
        onQueryChange={(q) => setTerm(q ?? '')}
        onSelect={choose}
        renderOption={(option: any) => {
          const h: Hit = option.hit
          return (
            <Card as="button" padding={2} radius={2}>
              <Flex align="center" gap={3}>
                {h.imageUrl ? (
                  <img
                    src={`${h.imageUrl}${h.imageUrl.includes('?') ? '&' : '?'}width=80`}
                    alt=""
                    width={40}
                    height={40}
                    style={{objectFit: 'cover', borderRadius: 4, flex: '0 0 auto'}}
                  />
                ) : (
                  <Box style={{width: 40, height: 40, background: '#eee', borderRadius: 4}} />
                )}
                <Box flex={1}>
                  <Text size={1} weight="medium">
                    {h.title}
                  </Text>
                  <Text size={1} muted>
                    {[h.productType, h.price, h.availableForSale ? null : 'Sold out']
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </Box>
              </Flex>
            </Card>
          )
        }}
      />
      {/* Remaining fields (note) render with the default input. */}
      {renderDefault({...props, members: props.members.filter((m) => m.kind === 'field' && m.name === 'note')})}
    </Stack>
  )
}
