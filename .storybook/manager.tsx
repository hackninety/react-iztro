import React, { useCallback, useEffect, useRef, useState } from "react";
import { addons, types, useArgs } from "@storybook/manager-api";
import { CITY_LNG, applyTrueSolarTime, hourToBirthTimeIndex, getLongitude } from "./cities";

/* ── Ai Code 面板 ─────────────────────────────────────── */

const ADDON_ID = "iztro/ai-code";
const PANEL_ID = `${ADDON_ID}/panel`;
const EVENT_ID = "iztro/ai-code/data";
const REQUEST_ID = "iztro/ai-code/request";

const TIME_LABELS = [
  "早子时(00:00~01:00)", "丑时(01:00~03:00)", "寅时(03:00~05:00)", "卯时(05:00~07:00)",
  "辰时(07:00~09:00)", "巳时(09:00~11:00)", "午时(11:00~13:00)", "未时(13:00~15:00)",
  "申时(15:00~17:00)", "酉时(17:00~19:00)", "戌时(19:00~21:00)", "亥时(21:00~23:00)",
  "晚子时(23:00~00:00)",
];

const AiCodePanel: React.FC = () => {
  const [args] = useArgs();
  const [data, setData] = useState<unknown>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // 出生地＆常居住地（出生地若有真太阳时省市区则自动填充）
  const [birthPlaceManual, setBirthPlaceManual] = useState("");
  const [residence, setResidence] = useState("");

  // 从真太阳时 args 自动生成出生地字符串
  const autoPlace = (args.birthProvince && args.birthProvince !== "不校对" && args.birthCity)
    ? [args.birthProvince, args.birthCity, args.birthDistrict].filter(Boolean).join("")
    : "";

  // 若用户未手动修改，则跟随自动值
  const birthPlace = birthPlaceManual || autoPlace;

  let trueSolarResult = null;
  if (args.exactTime && args.birthProvince && args.birthProvince !== "不校对") {
    const parts = args.exactTime.split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const lng = getLongitude(args.birthProvince, args.birthCity, args.birthDistrict);
    if (!isNaN(h) && !isNaN(m) && lng) {
      const result = applyTrueSolarTime(h, m, lng);
      trueSolarResult = {
        exactBirthTime: args.exactTime,
        province: args.birthProvince,
        city: args.birthCity,
        district: args.birthDistrict,
        longitude: lng,
        hour: result.hour,
        minute: result.minute,
        offsetMin: result.offsetMin
      };
    }
  }

  useEffect(() => {
    const channel = addons.getChannel();
    const handler = (payload: unknown) => setData(payload);
    channel.on(EVENT_ID, handler);
    channel.emit(REQUEST_ID);
    return () => { channel.off(EVENT_ID, handler); };
  }, []);

  // 注入 _meta 到 JSON
  const enrichedData = data ? {
    ...(data as Record<string, unknown>),
    _meta: {
      ...(birthPlace && { birthPlace }),
      ...(residence && { residence }),
      ...(trueSolarResult && {
        exactBirthTime: trueSolarResult.exactBirthTime,
        trueSolarTime: `${String(trueSolarResult.hour).padStart(2, "0")}:${String(trueSolarResult.minute).padStart(2, "0")}`,
        longitudeOffset: `${trueSolarResult.offsetMin}分钟`,
        province: trueSolarResult.province,
        city: trueSolarResult.city,
        district: trueSolarResult.district,
        longitude: trueSolarResult.longitude,
      }),
    },
  } : null;

  const jsonStr = enrichedData ? JSON.stringify(enrichedData, null, 2) : "";
  const compactJsonStr = enrichedData ? JSON.stringify(enrichedData) : "";

  const handleCopy = useCallback(() => {
    if (!compactJsonStr) return;
    navigator.clipboard.writeText(compactJsonStr).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [compactJsonStr]);


  const inputSt: React.CSSProperties = {
    padding: "4px 8px", fontSize: 12, border: "1px solid #ccc",
    borderRadius: 4, background: "#fff", width: "100%", boxSizing: "border-box",
  };
  const smallInputSt: React.CSSProperties = { ...inputSt, width: 56, textAlign: "center" as const };
  const labelSt: React.CSSProperties = { fontSize: 11, color: "#666", marginBottom: 2, display: "block" };
  const sectionSt: React.CSSProperties = {
    padding: "8px 16px", borderBottom: "1px solid #f0f0f0",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* ── 标题栏 ── */}
      <div style={{ padding: "8px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          命盘 JSON（当前大限/小限/流年/流月 + 当前流年12流月）
        </span>
        <button
          onClick={handleCopy}
          style={{
            marginLeft: "auto", padding: "4px 12px", fontSize: 12,
            border: "1px solid #ccc", borderRadius: 4,
            background: copied ? "#52c41a" : "#fff",
            color: copied ? "#fff" : "#333", cursor: "pointer", transition: "background 0.2s",
          }}
        >
          {copied ? "已复制 ✓" : "复制 JSON"}
        </button>
      </div>

      {/* ── 出生地＆常居住地 ── */}
      <div style={sectionSt}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#722ed1" }}>
          📍 出生地 & 常居住地（注入 JSON 供 AI 分析）
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <label style={labelSt}>
              出生地
              {autoPlace && birthPlaceManual === "" && (
                <span style={{ color: "#722ed1", marginLeft: 4 }}>（已自动填充）</span>
              )}
            </label>
            <input
              type="text"
              placeholder="如：广东深圳"
              value={birthPlace}
              onChange={(e) => setBirthPlaceManual(e.target.value)}
              style={{ ...inputSt, borderColor: autoPlace && !birthPlaceManual ? "#b37feb" : "#ccc" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelSt}>常居住地</label>
            <input type="text" placeholder="如：北京朝阳" value={residence}
              onChange={(e) => setResidence(e.target.value)} style={inputSt} />
          </div>
        </div>
        <div style={{ fontSize: 10, color: "#aaa" }}>
          这些信息会附加到 JSON 的 _meta 字段中，AI 可据此推算风水方位、迁移吉凶等
        </div>
      </div>

      {/* ── JSON 内容 ── */}
      {!data ? (
        <div style={{ padding: 16, color: "#888", fontSize: 13 }}>
          等待命盘数据...请在左侧 Controls 中输入生日信息。
        </div>
      ) : (
        <pre style={{
          flex: 1, margin: 0, padding: 16, overflow: "auto",
          fontSize: 12, lineHeight: 1.5,
          fontFamily: "'SF Mono', 'Menlo', 'Monaco', monospace",
          background: "#fafafa",
        }}>
          {jsonStr}
        </pre>
      )}
    </div>
  );
};

/* ── BaZi 面板：四柱八字排盘 ──────────────────────────── */

const BAZI_ADDON_ID = "iztro/bazi";
const BAZI_PANEL_ID = `${BAZI_ADDON_ID}/panel`;

const HS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const EB = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

// 月支 → 農曆月：寅=1, 卯=2, …, 丑=12
const BRANCH_TO_LUNAR_MONTH: Record<number, number> = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6,
  8: 7, 9: 8, 10: 9, 11: 10, 0: 11, 1: 12,
};

// 时支 → 时辰索引（iztro 的 0~12）
const BRANCH_TO_TIME_INDEX: Record<number, number> = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5,
  6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11,
};

/**
 * 五虎遁：由年干 + 月支 推算月干。
 * 甲己年寅月起丙, 乙庚起戊, 丙辛起庚, 丁壬起壬, 戊癸起甲。
 */
function getExpectedMonthStem(yearStemIdx: number, monthBranchIdx: number): number {
  const yinStart = ((yearStemIdx % 5) * 2 + 2) % 10;
  const offset = (monthBranchIdx - 2 + 12) % 12;
  return (yinStart + offset) % 10;
}

/**
 * 五鼠遁：由日干 + 时支 推算时干。
 * 甲己日子时起甲, 乙庚起丙, 丙辛起戊, 丁壬起庚, 戊癸起壬。
 */
function getExpectedHourStem(dayStemIdx: number, hourBranchIdx: number): number {
  const ziStart = (dayStemIdx % 5) * 2;
  return (ziStart + hourBranchIdx) % 10;
}

function isValidParity(stemIdx: number, branchIdx: number): boolean {
  return stemIdx % 2 === branchIdx % 2;
}

/* ── 核心：根据八字精确定位公历日期 ────────────────────── */

/**
 * 根据年干支找到最近 60 年内（以 refYear 为基准往前搜索）匹配的年份。
 * 天干地支纪年：(year - 4) % 10 = stemIdx,  (year - 4) % 12 = branchIdx
 */
function findYearByStemBranch(stemIdx: number, branchIdx: number, refYear: number = 2026): number | null {
  // 干支的序号（0~59）= (stemIdx, branchIdx) 组合
  // 公式：sexagenary = (stemIdx * 6 - branchIdx * 5) mod 60, 但直接遍历更直观
  for (let y = refYear; y > refYear - 60; y--) {
    const s = ((y - 4) % 10 + 10) % 10;
    const b = ((y - 4) % 12 + 12) % 12;
    if (s === stemIdx && b === branchIdx) return y;
  }
  return null;
}

/**
 * 将农历某年某月的第 dayN 天转为公历日期字符串 "YYYY-M-D"。
 * 使用 lunar2solar 做转换。
 */
function lunarDayToSolarStr(lunarYear: number, lunarMonth: number, lunarDay: number): string | null {
  try {
    // 动态引入 lunar-lite（Storybook manager webpack 可打包）
    const { lunar2solar } = require("lunar-lite");
    const dateStr = `${lunarYear}-${lunarMonth}-${lunarDay}`;
    const solar = lunar2solar(dateStr, false);
    if (!solar) return null;
    return `${solar.solarYear}-${solar.solarMonth}-${solar.solarDay}`;
  } catch {
    return null;
  }
}

/**
 * 获取公历某天 + 某时辰索引的日柱干支。
 * 返回 [dayStemIdx, dayBranchIdx] 或 null。
 */
function getSolarDateGanZhi(solarDateStr: string, timeIdx: number = 0): {
  yearStem: number; yearBranch: number;
  monthStem: number; monthBranch: number;
  dayStem: number; dayBranch: number;
  hourStem: number; hourBranch: number;
} | null {
  try {
    const { getHeavenlyStemAndEarthlyBranchBySolarDate } = require("lunar-lite");
    const gz = getHeavenlyStemAndEarthlyBranchBySolarDate(solarDateStr, timeIdx);
    if (!gz) return null;
    return {
      yearStem: HS.indexOf(gz.yearly[0] as typeof HS[number]),
      yearBranch: EB.indexOf(gz.yearly[1] as typeof EB[number]),
      monthStem: HS.indexOf(gz.monthly[0] as typeof HS[number]),
      monthBranch: EB.indexOf(gz.monthly[1] as typeof EB[number]),
      dayStem: HS.indexOf(gz.daily[0] as typeof HS[number]),
      dayBranch: EB.indexOf(gz.daily[1] as typeof EB[number]),
      hourStem: HS.indexOf(gz.hourly[0] as typeof HS[number]),
      hourBranch: EB.indexOf(gz.hourly[1] as typeof EB[number]),
    };
  } catch {
    return null;
  }
}

/**
 * 获取农历某年某月的天数（29 或 30）。
 * 注：lunar-lite 的 getTotalDaysOfLunarMonth 有时会出错，
 * 由于 lunarDayToSolarStr 的 try-catch 已经能处理不存在的日期，
 * 我们直接遍历 1~30 即可。
 */

interface MatchResult {
  solarDate: string;      // 公历日期 YYYY-M-D
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  matchedYear: number;    // 匹配到的公历年
  baziStr: string;        // 完整的四柱字符串（由万年历算出的，用于校验）
}

/**
 * 核心匹配函数：根据年干支 + 月支 + 日干支 + 时支 精确匹配一个公历日期。
 *
 * 步骤：
 * 1. 年干支 → 找最近 60 年内的年份
 * 2. 月支   → 农历月（寅=正月…丑=十二月）
 * 3. 遍历该农历月每一天，转公历，算日柱干支，找匹配日干支的那天
 * 4. 时支   → 时辰索引
 */
function findExactDate(
  ys: number, yb: number,
  mb: number,
  ds: number, db: number,
  hb: number,
  lateZi: boolean,
): MatchResult | string {
  // Step 1: 找年份
  const year = findYearByStemBranch(ys, yb);
  if (!year) return `❌ 无法在最近60年内找到 ${HS[ys]}${EB[yb]} 年`;

  // Step 2: 月支 → 农历月
  const lunarMonth = BRANCH_TO_LUNAR_MONTH[mb];
  if (!lunarMonth) return `❌ 月支映射农历月失败`;

  // Step 3: 时辰索引
  const timeIdx = lateZi ? 12 : BRANCH_TO_TIME_INDEX[hb];

  // Step 4: 遍历该农历月每一天（1~30），找日干支匹配
  const candidates: { lunarDay: number; solarDate: string; gz: ReturnType<typeof getSolarDateGanZhi> }[] = [];

  for (let d = 1; d <= 30; d++) {
    const solarStr = lunarDayToSolarStr(year, lunarMonth, d);
    if (!solarStr) continue; // 该日不存在（29天的月份，d=30时跳过）
    const gz = getSolarDateGanZhi(solarStr, timeIdx);
    if (!gz) continue;
    if (gz.dayStem === ds && gz.dayBranch === db) {
      candidates.push({ lunarDay: d, solarDate: solarStr, gz });
    }
  }

  if (candidates.length === 0) {
    // 有时因为年份边界（立春前后），月干支可能落在上一年或下一年
    // 尝试上一个甲子周期的年份
    return `❌ 在 ${year}年農曆${lunarMonth}月（${HS[getExpectedMonthStem(ys, mb)]}${EB[mb]}月）中，未找到日柱为 ${HS[ds]}${EB[db]} 的日期`;
  }

  // 通常一个月内（最多30天）不会有两天日柱相同（60干支一循环），因此应该恰好1个
  const match = candidates[0];
  const gz = match.gz!;
  const baziStr = `${HS[gz.yearStem]}${EB[gz.yearBranch]} ${HS[gz.monthStem]}${EB[gz.monthBranch]} ${HS[gz.dayStem]}${EB[gz.dayBranch]} ${HS[gz.hourStem]}${EB[gz.hourBranch]}`;

  return {
    solarDate: match.solarDate,
    lunarYear: year,
    lunarMonth,
    lunarDay: match.lunarDay,
    matchedYear: year,
    baziStr,
  };
}

/* ── 样式 ─────────────────────────────────────────────── */

const sel: React.CSSProperties = {
  padding: "4px 8px", fontSize: 13, border: "1px solid #ccc",
  borderRadius: 4, background: "#fff", minWidth: 64,
};
const lbl: React.CSSProperties = { fontSize: 11, color: "#666", marginBottom: 3, display: "block" };
const fld: React.CSSProperties = { display: "flex", flexDirection: "column" };
const row: React.CSSProperties = { display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-end" };

const PillarSelect: React.FC<{
  label: string;
  stemIdx: number;
  branchIdx: number;
  onStemChange: (v: number) => void;
  onBranchChange: (v: number) => void;
  validationNote?: React.ReactNode;
}> = ({ label, stemIdx, branchIdx, onStemChange, onBranchChange, validationNote }) => (
  <div style={row}>
    <div style={fld}>
      <label style={lbl}>{label}干</label>
      <select style={sel} value={stemIdx} onChange={(e) => onStemChange(Number(e.target.value))}>
        {HS.map((s, i) => <option key={s} value={i}>{s}</option>)}
      </select>
    </div>
    <div style={fld}>
      <label style={lbl}>{label}支</label>
      <select style={sel} value={branchIdx} onChange={(e) => onBranchChange(Number(e.target.value))}>
        {EB.map((b, i) => <option key={b} value={i}>{b}</option>)}
      </select>
    </div>
    <span style={{ fontSize: 14, fontWeight: 700, paddingBottom: 4, minWidth: 36 }}>
      {HS[stemIdx]}{EB[branchIdx]}
    </span>
    {validationNote && <span style={{ fontSize: 11, paddingBottom: 5 }}>{validationNote}</span>}
  </div>
);

const BaZiPanel: React.FC = () => {
  const [, updateArgs] = useArgs();
  const [mode, setMode] = useState<"modern" | "ancient">("modern");

  // 年柱
  const [ys, setYs] = useState(7);  // 辛
  const [yb, setYb] = useState(11); // 亥
  // 月柱
  const [ms, setMs] = useState(7);  // 辛
  const [mb, setMb] = useState(1);  // 丑
  // 日柱
  const [ds, setDs] = useState(0);  // 甲
  const [db, setDb] = useState(0);  // 子
  // 时柱
  const [hs, setHs] = useState(0);  // 甲
  const [hb, setHb] = useState(10); // 戌

  const [gender, setGender] = useState<"male" | "female">("male");
  const [lateZi, setLateZi] = useState(false);
  const [lunarDay, setLunarDay] = useState(25);  // 古人模式用
  const [status, setStatus] = useState<string>("");
  const [matchInfo, setMatchInfo] = useState<MatchResult | null>(null);

  // 自动推算
  const expectedMs = getExpectedMonthStem(ys, mb);
  const expectedHs = getExpectedHourStem(ds, hb);
  const lunarMonth = BRANCH_TO_LUNAR_MONTH[mb];
  const timeIndex = lateZi ? 12 : BRANCH_TO_TIME_INDEX[hb];

  // 校验
  const yearOk = isValidParity(ys, yb);
  const monthOk = isValidParity(ms, mb);
  const dayOk = isValidParity(ds, db);
  const hourOk = isValidParity(hs, hb);
  const monthRuleOk = ms === expectedMs;
  const hourRuleOk = hs === expectedHs;

  // 自动同步月干（年干或月支改变时）
  useEffect(() => { setMs(expectedMs); }, [ys, mb]);
  // 自动同步时干（日干或时支改变时）
  useEffect(() => { setHs(expectedHs); }, [ds, hb]);

  /* ── 近代模式：精确匹配 ────────────────────────────────── */
  const handleModern = useCallback(() => {
    if (!yearOk) { setStatus("❌ 年柱干支奇偶不一致"); setMatchInfo(null); return; }
    if (!monthOk) { setStatus("❌ 月柱干支奇偶不一致"); setMatchInfo(null); return; }
    if (!dayOk) { setStatus("❌ 日柱干支奇偶不一致"); setMatchInfo(null); return; }
    if (!hourOk) { setStatus("❌ 时柱干支奇偶不一致"); setMatchInfo(null); return; }

    const inputBaziStr = `${HS[ys]}${EB[yb]} ${HS[ms]}${EB[mb]} ${HS[ds]}${EB[db]} ${HS[hs]}${EB[hb]}`;
    const result = findExactDate(ys, yb, mb, ds, db, hb, lateZi);

    if (typeof result === "string") {
      setStatus(result);
      setMatchInfo(null);
      return;
    }

    setMatchInfo(result);
    updateArgs({
      birthday: result.solarDate,
      birthdayType: "solar",
      birthTime: timeIndex,
      gender,
      isLeapMonth: false,
      fixLeap: true,
      options: { yearDivide: "exact" },
    });

    setStatus(
      `✅ 已应用  输入八字：${inputBaziStr}\n` +
      `   万年历验证：${result.baziStr}\n` +
      `   匹配公历：${result.solarDate}（${result.matchedYear}年）\n` +
      `   农历：${result.lunarYear}年${result.lunarMonth}月${result.lunarDay}日 ${EB[hb]}时`
    );
  }, [yearOk, monthOk, dayOk, hourOk, ys, yb, ms, mb, ds, db, hs, hb,
    lunarMonth, timeIndex, gender, lateZi, updateArgs]);

  /* ── 古人模式：代理年份 + 农历日 ──────────────────────── */
  const handleAncient = useCallback(() => {
    if (!yearOk) { setStatus("❌ 年柱干支奇偶不一致"); setMatchInfo(null); return; }
    if (lunarDay < 1 || lunarDay > 30) { setStatus("❌ 農曆日须在 1~30 之间"); setMatchInfo(null); return; }

    const proxyYear = findYearByStemBranch(ys, yb);
    if (!proxyYear) { setStatus("❌ 无法找到代理年份"); setMatchInfo(null); return; }

    const lunarDateStr = `${proxyYear}-${lunarMonth}-${lunarDay}`;
    const inputBaziStr = `${HS[ys]}${EB[yb]} ${HS[ms]}${EB[mb]} ${HS[ds]}${EB[db]} ${HS[hs]}${EB[hb]}`;

    updateArgs({
      birthday: lunarDateStr,
      birthdayType: "lunar",
      birthTime: timeIndex,
      gender,
      isLeapMonth: false,
      fixLeap: true,
      options: { yearDivide: "normal" },
    });

    setMatchInfo(null);
    setStatus(
      `✅ 已应用（古人模式）\n` +
      `   输入八字：${inputBaziStr}\n` +
      `   代理年份：${proxyYear}（${HS[ys]}${EB[yb]}年）\n` +
      `   排盘农历：${proxyYear}年${lunarMonth}月${lunarDay}日 ${EB[hb]}时\n` +
      `   yearDivide: normal（除夕分界，年干=${HS[ys]}）\n` +
      `   ⚠ 命盘四柱显示为代理日期的四柱，与输入八字不同属正常`
    );
  }, [yearOk, ys, yb, ms, mb, ds, db, hs, hb, lunarMonth, lunarDay, timeIndex, gender, updateArgs]);

  const handleApply = useCallback(() => {
    if (mode === "modern") handleModern();
    else handleAncient();
  }, [mode, handleModern, handleAncient]);

  const valBadge = (ok: boolean, label: string) => (
    <span style={{ color: ok ? "#389e0d" : "#cf1322", fontSize: 11 }}>{ok ? `✓ ${label}` : `✗ ${label}`}</span>
  );

  const modeBtn = (m: "modern" | "ancient", label: string, desc: string) => (
    <button
      onClick={() => { setMode(m); setStatus(""); setMatchInfo(null); }}
      style={{
        padding: "6px 14px", fontSize: 12, fontWeight: mode === m ? 700 : 400,
        border: `1px solid ${mode === m ? "#1890ff" : "#d9d9d9"}`,
        borderRadius: 4,
        background: mode === m ? "#e6f7ff" : "#fff",
        color: mode === m ? "#1890ff" : "#666",
        cursor: "pointer",
      }}
      title={desc}
    >
      {label}
    </button>
  );

  const numInput: React.CSSProperties = { ...sel, width: 70, minWidth: "unset" };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "8px 16px", borderBottom: "1px solid #eee", flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>四柱八字排盘</span>
        <div style={{ display: "flex", gap: 6 }}>
          {modeBtn("modern", "近代", "精确匹配最近60年，四柱完全一致")}
          {modeBtn("ancient", "古人", "手动指定农历日，用代理年份排盘")}
        </div>
      </div>

      <div style={{ padding: "12px 16px", overflow: "auto", flex: 1 }}>
        {/* 模式说明 */}
        <div style={{
          marginBottom: 12, padding: "6px 10px", fontSize: 11, borderRadius: 4,
          background: mode === "modern" ? "#f6ffed" : "#fff7e6",
          border: `1px solid ${mode === "modern" ? "#b7eb8f" : "#ffd591"}`,
          color: mode === "modern" ? "#389e0d" : "#d46b08",
        }}>
          {mode === "modern"
            ? "⚡ 近代模式：根据八字在最近60年内精确定位公历日期，四柱完全一致"
            : "📜 古人模式：需手动输入农历日，使用代理年份排盘。命盘四柱显示为代理日期的四柱（与输入不同属正常），但星曜排布正确"
          }
        </div>

        <PillarSelect label="年" stemIdx={ys} branchIdx={yb}
          onStemChange={setYs} onBranchChange={setYb}
          validationNote={valBadge(yearOk, "奇偶")} />

        <PillarSelect label="月" stemIdx={ms} branchIdx={mb}
          onStemChange={setMs} onBranchChange={setMb}
          validationNote={<>
            {valBadge(monthOk, "奇偶")}{" "}
            {valBadge(monthRuleOk, "五虎遁")}
            {!monthRuleOk && <span style={{ color: "#fa8c16", fontSize: 11, marginLeft: 4 }}>
              (推算应为 {HS[expectedMs]}{EB[mb]})
            </span>}
            <span style={{ color: "#1890ff", fontSize: 11, marginLeft: 8 }}>
              → 農曆{lunarMonth}月
            </span>
          </>} />

        <PillarSelect label="日" stemIdx={ds} branchIdx={db}
          onStemChange={setDs} onBranchChange={setDb}
          validationNote={valBadge(dayOk, "奇偶")} />

        <PillarSelect label="时" stemIdx={hs} branchIdx={hb}
          onStemChange={setHs} onBranchChange={setHb}
          validationNote={<>
            {valBadge(hourOk, "奇偶")}{" "}
            {valBadge(hourRuleOk, "五鼠遁")}
            {!hourRuleOk && <span style={{ color: "#fa8c16", fontSize: 11, marginLeft: 4 }}>
              (推算应为 {HS[expectedHs]}{EB[hb]})
            </span>}
            <span style={{ color: "#1890ff", fontSize: 11, marginLeft: 8 }}>
              → {EB[hb]}时{lateZi ? "（晚子时）" : ""}
            </span>
          </>} />

        {/* 晚子时选项 */}
        {hb === 0 && (
          <div style={{ ...row, marginTop: -4, marginBottom: 12 }}>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
              <input type="checkbox" checked={lateZi} onChange={(e) => setLateZi(e.target.checked)} />
              晚子时（23:00~00:00，算次日）
            </label>
          </div>
        )}

        {/* 古人模式：农历日 */}
        {mode === "ancient" && (
          <div style={{ ...row, marginTop: 8, paddingTop: 12, borderTop: "1px solid #f0f0f0" }}>
            <div style={fld}>
              <label style={lbl}>農曆日（1~30）</label>
              <input type="number" style={numInput} min={1} max={30}
                value={lunarDay} onChange={(e) => setLunarDay(Number(e.target.value))} />
            </div>
            <span style={{ fontSize: 11, color: "#fa8c16", paddingBottom: 5 }}>
              ⚠ 古人的日柱无法通过万年历匹配，请手动输入实际農曆日
            </span>
          </div>
        )}

        {/* 性別 */}
        <div style={{
          ...row, marginTop: 8, paddingTop: mode === "ancient" ? 0 : 12,
          borderTop: mode === "ancient" ? "none" : "1px solid #f0f0f0"
        }}>
          <div style={fld}>
            <label style={lbl}>性別</label>
            <select style={sel} value={gender}
              onChange={(e) => setGender(e.target.value as "male" | "female")}>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
        </div>

        {/* 汇总 + 按钮 */}
        <div style={{ ...row, marginTop: 8, alignItems: "center" }}>
          <div style={{
            padding: "6px 12px", background: "#f0f5ff", borderRadius: 4,
            fontSize: 14, fontWeight: 700, fontFamily: "serif", letterSpacing: 2,
          }}>
            {HS[ys]}{EB[yb]}&nbsp; {HS[ms]}{EB[mb]}&nbsp; {HS[ds]}{EB[db]}&nbsp; {HS[hs]}{EB[hb]}
          </div>
          <button onClick={handleApply} style={{
            padding: "6px 20px", fontSize: 13, fontWeight: 600,
            border: "none", borderRadius: 4, background: "#1890ff",
            color: "#fff", cursor: "pointer", marginLeft: 12,
          }}>
            应用排盘
          </button>
        </div>

        {/* 匹配信息（近代模式） */}
        {matchInfo && (
          <div style={{
            marginTop: 8, padding: "8px 12px", fontSize: 12, borderRadius: 4,
            background: "#f0f5ff", border: "1px solid #adc6ff", color: "#1d39c4",
          }}>
            <strong>定位结果：</strong>
            公历 {matchInfo.solarDate} → 农历 {matchInfo.lunarYear}年{matchInfo.lunarMonth}月{matchInfo.lunarDay}日
          </div>
        )}

        {/* 状态 */}
        {status && (
          <div style={{
            marginTop: 12, padding: "8px 12px", fontSize: 12, borderRadius: 4,
            whiteSpace: "pre-line",
            background: status.startsWith("✅") ? "#f6ffed" : "#fff2f0",
            border: `1px solid ${status.startsWith("✅") ? "#b7eb8f" : "#ffccc7"}`,
            color: status.startsWith("✅") ? "#389e0d" : "#cf1322",
          }}>
            {status}
          </div>
        )}

        {/* 说明 */}
        <div style={{
          marginTop: 16, padding: "10px 12px", fontSize: 11,
          color: "#888", background: "#fafafa", borderRadius: 4, lineHeight: 1.8,
        }}>
          {mode === "modern" ? (<>
            <strong>近代模式原理：</strong><br />
            1. 年干支 → 在最近60年内精确匹配对应年份<br />
            2. 月支 → 定位农历月份<br />
            3. 日干支 → 遍历该月每一天，通过万年历精确匹配日柱<br />
            4. 以匹配到的精确公历日期（solar 模式）传给排盘引擎<br />
            5. 命盘四柱与输入八字完全一致
          </>) : (<>
            <strong>古人模式原理：</strong><br />
            1. 年干支 → 在最近60年内找到同干支的代理年份<br />
            2. 月支 → 定位农历月份<br />
            3. 用户手动输入实际农历日<br />
            4. 以代理年份 + 农历月日（lunar 模式 + 除夕分界）传给排盘引擎<br />
            5. 年干相同 → 四化飞星正确；农历月日 + 时辰相同 → 星曜排布正确<br />
            6. 命盘显示的四柱为代理日期的四柱，与输入不同属正常
          </>)}
        </div>
      </div>
    </div>
  );
};

/* ── 注册 Addon ───────────────────────────────────────── */

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: "Ai Code",
    render: ({ active }) => (active ? <AiCodePanel /> : null),
  });
});

addons.register(BAZI_ADDON_ID, () => {
  addons.add(BAZI_PANEL_ID, {
    type: types.PANEL,
    title: "BaZi",
    render: ({ active }) => (active ? <BaZiPanel /> : null),
  });
});

/* ── 布局：当作排盘应用使用，隐藏 Storybook 自带的 Sidebar / Toolbar，
   仅保留 Canvas（命盘）与 Addons（Ai Code / BaZi 面板）。PC 端与移动端均生效。 ── */
addons.setConfig({
  showNav: false, // 隐藏左侧 Sidebar（PC）/ 移动端底部 Sidebar 标签
  showToolbar: false, // 隐藏顶部 Toolbar（PC）/ 移动端底部 Settings 标签
  showPanel: true, // 保留 Addons 面板
  enableShortcuts: false, // 禁用快捷键，避免误触重新唤出 Sidebar/Toolbar
});

/* ── 移动端：把 Addons 面板从“侧边展开”改为“底部抽屉” ──────────────
 * Storybook 7.4 移动端用横向 translateX 来显隐面板（无配置项可改），
 * 无法形成底部抽屉。这里用一小段脚本接管面板的 transform：
 *   · Addons 标签激活 → translateY(0)    面板从底部滑出
 *   · 其它（Canvas）  → translateY(110%) 面板滑回底部之外
 * 几何（铺满底部、命盘铺满、层级）由 manager-head.html 的 CSS 负责；
 * 这里只负责竖向开合，事件驱动 + class 比对判断状态，均锚定 Storybook
 * 稳定 id / 文案，不依赖 emotion hash。 */
(function setupMobileBottomPanel() {
  const isMobile = () => window.matchMedia("(max-width: 600px)").matches;
  const getBottomNav = () =>
    [...document.querySelectorAll("nav")].find((n) =>
      [...n.children].some(
        (b) => b.tagName === "BUTTON" && (b.textContent || "").trim() === "Addons"
      )
    );
  const btnByText = (nav: Element, t: string) =>
    [...nav.children].find(
      (b) => b.tagName === "BUTTON" && (b.textContent || "").trim() === t
    );

  // Addons 是否处于激活态：以恒为未激活的 Sidebar/Settings 按钮的 class 作参照，
  // Addons 的 class 与之不同即说明被选中。
  const isAddonsOpen = () => {
    const nav = getBottomNav();
    if (!nav) return false;
    const addons = btnByText(nav, "Addons");
    const inactiveRef = btnByText(nav, "Sidebar") || btnByText(nav, "Settings");
    if (!addons || !inactiveRef) return false;
    return addons.className !== inactiveRef.className;
  };

  const apply = () => {
    const panel = document.querySelector<HTMLElement>(
      "div:has(> #storybook-panel-root)"
    );
    if (!panel) return;
    const want = !isMobile()
      ? ""
      : isAddonsOpen()
      ? "translateY(0)"
      : "translateY(110%)";
    // 仅在变化时写入，避免触发观察器自循环
    if ((panel.style.transform || "") === want) return;
    if (want) panel.style.setProperty("transform", want, "important");
    else panel.style.removeProperty("transform");
  };

  let scheduled = false;
  const run = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply();
    });
  };

  new MutationObserver(run).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class"],
  });
  window.addEventListener("resize", run);
  run();
})();
