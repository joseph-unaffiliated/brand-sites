import {articleType} from './article'
import {sourceLinkType} from './sourceLink'
import {proseSectionType} from './proseSection'
import {listicleItemType, listicleSectionType} from './listicleSection'
import {nibblesBlockType, nibblesItemType} from './nibblesBlock'
import {photoOfWeekBlockType} from './photoOfWeekBlock'
import {pickleEconomicsSectionType} from './pickleEconomicsSection'
import {
  pickleVoteBlockType,
  pickleVoteOptionType,
  pickleVoteLastWeekResultType,
} from './pickleVoteBlock'

export const schemaTypes = [
  articleType,
  sourceLinkType,
  proseSectionType,
  listicleSectionType,
  listicleItemType,
  nibblesBlockType,
  nibblesItemType,
  photoOfWeekBlockType,
  pickleEconomicsSectionType,
  pickleVoteBlockType,
  pickleVoteOptionType,
  pickleVoteLastWeekResultType,
]
