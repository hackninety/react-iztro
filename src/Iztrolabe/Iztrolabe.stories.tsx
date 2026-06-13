import React, { useEffect, useMemo, useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { useArgs } from "@storybook/preview-api";
import { Iztrolabe as IztroAstrolabe } from "./Iztrolabe";
import { IztrolabeProps } from "./Iztrolabe.type";
import {
  PROVINCES,
  getCityNamesOfProvince, getDistrictNamesOfCity, getLongitude,
  applyTrueSolarTime, hourToBirthTimeIndex,
} from "../../.storybook/cities";

const meta: Meta<any> = {
  component: IztroAstrolabe,
  argTypes: {
    birthday: { type: "string", required: true },
    /* 真太阳时相关 args 由自定义 UI 控制，不在 Controls 面板显示 */
    exactTime: { table: { disable: true } },
    birthProvince: { table: { disable: true } },
    birthCity: { table: { disable: true } },
    birthDistrict: { table: { disable: true } },
    birthTime: {
      type: "number",
      control: {
        type: "select",
        labels: {
          0: "早子时(00:00~01:00)",
          1: "丑时(01:00~03:00)",
          2: "寅时(03:00~05:00)",
          3: "卯时(05:00~07:00)",
          4: "辰时(07:00~09:00)",
          5: "巳时(09:00~11:00)",
          6: "午时(11:00~13:00)",
          7: "未时(13:00~15:00)",
          8: "申时(15:00~17:00)",
          9: "酉时(17:00~19:00)",
          10: "戌时(19:00~21:00)",
          11: "亥时(21:00~23:00)",
          12: "晚子时(23:00~00:00)",
        },
      },
      min: 0,
      max: 12,
      reqired: true,
      options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    gender: {
      type: "string",
      control: "inline-radio",
      options: ["male", "female"],
      required: true,
    },
    birthdayType: {
      type: "string",
      control: "inline-radio",
      options: ["lunar", "solar"],
    },
    astroType: {
      type: "string",
      control: "inline-radio",
      options: ["heaven", "earth", "human"],
      defaultValue: "heaven",
    },
    isLeapMonth: { type: "boolean", if: { arg: "birthdayType", eq: "lunar" } },
    fixLeap: { type: "boolean" },
    lang: {
      type: "string",
      control: {
        type: "select",
        labels: {
          0: "简体中文",
          1: "繁体中文",
          2: "日语",
          3: "韩语",
          4: "英语",
          5: "越南语",
        },
      },
      options: ["zh-CN", "zh-TW", "ja-JP", "ko-KR", "en-US", "vi-VN"],
    },
    centerPalaceAlign: {
      type: "boolean",
      description: "中宫居中对齐",
      defaultValue: false,
      control: {
        type: "boolean",
        labels: { true: "居中", false: "默认" },
      },
    },
  },
};
export default meta;

type Story = StoryObj<any>;

/* ── 真太阳时三级联动控件样式 ── */
const barSt: React.CSSProperties = {
  display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
  padding: "8px 12px", background: "#f8f8fa", borderBottom: "1px solid #e8e8e8",
  fontSize: 12, fontFamily: "system-ui, sans-serif",
};
const selectSt: React.CSSProperties = {
  padding: "4px 6px", fontSize: 12, border: "1px solid #d0d0d0",
  borderRadius: 4, background: "#fff", minWidth: 90,
};
const inputSt: React.CSSProperties = {
  ...selectSt, width: 72, textAlign: "center" as const,
};
const labelSt: React.CSSProperties = { color: "#888", fontSize: 11 };

export const Iztrolabe: Story = {
  render: function Render(args: any) {
    const [storyArgs, updateArgs] = useArgs();
    const { exactTime, birthProvince, birthCity, birthDistrict, birthTime } = storyArgs;

    /* ── 省份列表（静态） ── */
    const provinceNames = useMemo(() => PROVINCES.map(p => p.name), []);

    /* ── 城市列表（根据省份动态计算） ── */
    const cityNames = useMemo(() => {
      if (!birthProvince || birthProvince === "不校对") return [];
      return getCityNamesOfProvince(birthProvince);
    }, [birthProvince]);

    /* ── 区县列表（根据省份+城市动态计算） ── */
    const districtNames = useMemo(() => {
      if (!birthProvince || birthProvince === "不校对" || !birthCity) return [];
      return getDistrictNamesOfCity(birthProvince, birthCity);
    }, [birthProvince, birthCity]);

    /* ── 联动：省份变更 → 自动选择第一个城市和区县 ── */
    useEffect(() => {
      if (!birthProvince || birthProvince === "不校对") return;
      const cities = getCityNamesOfProvince(birthProvince);
      if (cities.length === 0) return;
      if (!cities.includes(birthCity)) {
        const firstCity = cities[0];
        const districts = getDistrictNamesOfCity(birthProvince, firstCity);
        updateArgs({ birthCity: firstCity, birthDistrict: districts[0] ?? "" });
      }
    }, [birthProvince]);

    /* ── 联动：城市变更 → 自动选择第一个区县 ── */
    useEffect(() => {
      if (!birthProvince || birthProvince === "不校对" || !birthCity) return;
      const districts = getDistrictNamesOfCity(birthProvince, birthCity);
      if (districts.length > 0 && !districts.includes(birthDistrict)) {
        updateArgs({ birthDistrict: districts[0] });
      }
    }, [birthCity]);

    /* ── 真太阳时 → 自动更新 birthTime ── */
    useEffect(() => {
      if (!birthProvince || birthProvince === "不校对") return;
      if (!exactTime || !exactTime.includes(":")) return;
      const [hStr, mStr] = exactTime.split(":");
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (isNaN(h) || isNaN(m)) return;
      const lng = getLongitude(birthProvince, birthCity, birthDistrict);
      if (!lng) return;
      const result = applyTrueSolarTime(h, m, lng);
      const newIdx = hourToBirthTimeIndex(result.hour, result.minute);
      if (birthTime !== newIdx) updateArgs({ birthTime: newIdx });
    }, [exactTime, birthProvince, birthCity, birthDistrict, birthTime]);

    /* ── 经度显示 ── */
    const lng = (birthProvince && birthProvince !== "不校对")
      ? getLongitude(birthProvince, birthCity, birthDistrict)
      : null;

    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        {/* ── 真太阳时校正控制栏 ── */}
        <div style={barSt}>
          <span style={{ fontWeight: 600, color: "#722ed1", marginRight: 4 }}>🕐 真太阳时校正</span>

          <span style={labelSt}>出生时间</span>
          <input
            type="time"
            value={exactTime || ""}
            onChange={e => updateArgs({ exactTime: e.target.value })}
            style={inputSt}
          />

          <span style={labelSt}>省份</span>
          <select
            value={birthProvince || "不校对"}
            onChange={e => updateArgs({ birthProvince: e.target.value })}
            style={selectSt}
          >
            <option value="不校对">不校对(北京时间)</option>
            {provinceNames.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {birthProvince && birthProvince !== "不校对" && (
            <>
              <span style={labelSt}>城市</span>
              <select
                value={birthCity || ""}
                onChange={e => updateArgs({ birthCity: e.target.value })}
                style={selectSt}
              >
                {cityNames.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <span style={labelSt}>区县</span>
              <select
                value={birthDistrict || ""}
                onChange={e => updateArgs({ birthDistrict: e.target.value })}
                style={selectSt}
              >
                {districtNames.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {lng && (
                <span style={{ color: "#999", fontSize: 11 }}>
                  经度 {lng}° | 偏移 {Math.round((lng - 120) * 4)}分钟
                </span>
              )}
            </>
          )}
        </div>

        {/* ── 命盘 ── */}
        <div style={{ flex: 1 }}>
          <IztroAstrolabe
            {...args}
            horoscopeDate={
              args.horoscopeDate ? new Date(args.horoscopeDate) : undefined
            }
          />
        </div>
      </div>
    );
  }
};

Iztrolabe.args = {
  birthday: "2023-09-04",
  exactTime: "12:00",
  birthProvince: "不校对",
  birthCity: "",
  birthDistrict: "",
  birthTime: 0,
  gender: "male",
  birthdayType: "solar",
  isLeapMonth: false,
  fixLeap: true,
  lang: "zh-CN",
  astroType: "heaven",
  options: {
    yearDivide: "exact",
  },
};
