# SPEC:45 款公告车型营销文案 JSON

## 目标
为湖北欧阳聚德汽车官网的 45 个单型号详情页产出中文营销文案,落成一个 JSON 文件。

## 输入
`G:/hboyjd-website/content/vehicles.json` — 45 款车型的工信部公告参数(唯一事实来源)。
`models` 字典的每个键是公告型号(如 EHJ9400CCY),值里有 name/type(车辆名称)、brand(品牌)、
total_mass_kg(总质量)、rated_mass_kg(额定质量)、curb_mass_kg(整备质量)、dimensions_mm(外形尺寸)、
wheelbase_mm(轴距)、axle_count(轴数)、tire_spec(轮胎)、batch(公告批次)、notes(公告其它栏摘要)等。

## 输出
`G:/hboyjd-website/content/vehicle-copy.json`,UTF-8,格式:

```json
{
  "EHJ9400CCY": {
    "tagline": "一句话定位,不超过 25 字",
    "highlights": ["卖点一,不超 20 字", "卖点二", "卖点三"],
    "scene": "适用场景描述,60-90 字,面向卡车司机和物流公司老板,说人话"
  }
}
```

45 个键与 vehicles.json 的 models 键完全一致,一个不缺。highlights 每款 3-5 条。

## 硬约束(违反任何一条 = 返工)
1. **所有数字必须照抄 vehicles.json 对应字段**,不许算、不许四舍五入、不许编造。
   引用数字时取该字段第一个值(如 curb_mass_kg "5700,6000,6250" 只能引 5700)。
2. **不许编造**参数、资质、认证、荣誉、销量。公告里没有的就不写。
3. 卖点从该款公告参数推导,例:整备质量在同类里轻→"整备质量 XXXX kg 起";
   轴距多个可选→"N 种轴距可选";notes 里有空气悬架选装→"可选空气悬架";
   骨架 TJZE 系 notes 有 45 英尺 1EE→"兼容 45 英尺 1EE 标准箱"。
4. 通用能力只允许这两句范围:"支持定制选装""厂家直销"。不写 T700C、专利数等公司级宣传(那些在品类页有)。
5. 语言朴实,禁止"行业领先""顶级""极致"这类空话;禁止 emoji;禁止破折号连排。
6. 专用车(JDV50xx)和通信/危险品车型按其 type 和 notes 写用途,如实描述。

## 自测(必须真跑)
用 python 校验后再交付:
- json.load 可解析
- 键集合与 vehicles.json models 键集合完全相等(45 个)
- 每款 tagline ≤ 30 字、highlights 3-5 条、scene 40-120 字
- 抽 5 款检查文案中出现的每个数字都能在该款 vehicles.json 字段里找到原文
把校验脚本输出贴在最终回复里。

## 边界
- 只写 `G:/hboyjd-website/content/vehicle-copy.json` 这一个文件,不碰仓库其他文件,不 git 操作。
- 不装新依赖。
