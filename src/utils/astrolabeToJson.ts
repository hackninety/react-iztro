import { IFunctionalAstrolabe } from "iztro/lib/astro/FunctionalAstrolabe";
import { IFunctionalHoroscope } from "iztro/lib/astro/FunctionalHoroscope";
import { HoroscopeItem } from "iztro/lib/data/types";

function serializeStar(star: { name: string; type: string; scope: string; brightness?: string; mutagen?: string }) {
  return {
    name: star.name,
    type: star.type,
    scope: star.scope,
    ...(star.brightness ? { brightness: star.brightness } : {}),
    ...(star.mutagen ? { mutagen: star.mutagen } : {}),
  };
}

function serializeHoroscopeItem(item: HoroscopeItem) {
  return {
    index: item.index,
    name: item.name,
    heavenlyStem: item.heavenlyStem,
    earthlyBranch: item.earthlyBranch,
    palaceNames: item.palaceNames,
    mutagen: item.mutagen,
    ...(item.stars
      ? { stars: item.stars.map((group) => group.map(serializeStar)) }
      : {}),
  };
}

export function astrolabeToJson(
  astrolabe: IFunctionalAstrolabe,
  horoscope?: IFunctionalHoroscope
) {
  const basic = {
    gender: astrolabe.gender,
    solarDate: astrolabe.solarDate,
    lunarDate: astrolabe.lunarDate,
    chineseDate: astrolabe.chineseDate,
    rawDates: astrolabe.rawDates,
    time: astrolabe.time,
    timeRange: astrolabe.timeRange,
    sign: astrolabe.sign,
    zodiac: astrolabe.zodiac,
    earthlyBranchOfSoulPalace: astrolabe.earthlyBranchOfSoulPalace,
    earthlyBranchOfBodyPalace: astrolabe.earthlyBranchOfBodyPalace,
    soul: astrolabe.soul,
    body: astrolabe.body,
    fiveElementsClass: astrolabe.fiveElementsClass,
  };

  const palaces = astrolabe.palaces.map((palace) => ({
    index: palace.index,
    name: palace.name,
    isBodyPalace: palace.isBodyPalace,
    isOriginalPalace: palace.isOriginalPalace,
    heavenlyStem: palace.heavenlyStem,
    earthlyBranch: palace.earthlyBranch,
    majorStars: palace.majorStars.map(serializeStar),
    minorStars: palace.minorStars.map(serializeStar),
    adjectiveStars: palace.adjectiveStars.map(serializeStar),
    changsheng12: palace.changsheng12,
    boshi12: palace.boshi12,
    jiangqian12: palace.jiangqian12,
    suiqian12: palace.suiqian12,
    decadal: palace.decadal,
    ages: palace.ages,
  }));

  if (!horoscope) {
    return { basic, palaces };
  }

  const horoscopeData = {
    lunarDate: horoscope.lunarDate,
    solarDate: horoscope.solarDate,
    decadal: serializeHoroscopeItem(horoscope.decadal),
    age: {
      ...serializeHoroscopeItem(horoscope.age),
      nominalAge: horoscope.age.nominalAge,
    },
    yearly: {
      ...serializeHoroscopeItem(horoscope.yearly),
      yearlyDecStar: horoscope.yearly.yearlyDecStar,
    },
    monthly: serializeHoroscopeItem(horoscope.monthly),
  };

  return { basic, palaces, horoscope: horoscopeData };
}
