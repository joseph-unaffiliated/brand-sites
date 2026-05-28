import {articleType} from './article'
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
