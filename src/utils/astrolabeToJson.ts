import { IFunctionalAstrolabe } from "iztro/lib/astro/FunctionalAstrolabe";
import { IFunctionalHoroscope } from "iztro/lib/astro/FunctionalHoroscope";
import { HoroscopeItem } from "iztro/lib/data/types";
import { solar2lunar, lunar2solar } from "lunar-lite";

function serializeStar(star: {
  name: string;
  type: string;
  scope: string;
  brightness?: string;
  mutagen?: string;
}) {
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

let _monthly12Cache: {
  cacheKey: string;
  data: Record<string, unknown>[];
} | null = null;

function getMonthlyOfCurrentYear(
  astrolabe: IFunctionalAstrolabe,
  horoscope: IFunctionalHoroscope
) {
  const lunar = solar2lunar(horoscope.solarDate);
  const lunarYear = lunar.lunarYear;
  const cacheKey = `${astrolabe.solarDate}|${astrolabe.gender}|${lunarYear}`;

  if (_monthly12Cache && _monthly12Cache.cacheKey === cacheKey) {
    return _monthly12Cache.data;
  }

  const results = [];
  for (let m = 1; m <= 12; m++) {
    const solarDate = lunar2solar(`${lunarYear}-${m}-15`);
    const h = astrolabe.horoscope(solarDate.toString());
    const mi = h.monthly;
    results.push({
      month: m,
      index: mi.index,
      heavenlyStem: mi.heavenlyStem,
      earthlyBranch: mi.earthlyBranch,
      palaceNames: mi.palaceNames,
      mutagen: mi.mutagen,
      ...(mi.stars
        ? { stars: mi.stars.map((group) => group.map(serializeStar)) }
        : {}),
    });
  }

  _monthly12Cache = { cacheKey, data: results };
  return results;
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
    monthlyCurrent: serializeHoroscopeItem(horoscope.monthly),
    monthlyOfCurrentYear: getMonthlyOfCurrentYear(astrolabe, horoscope),
  };

  return { basic, palaces, horoscope: horoscopeData };
}
