import type { BacktestModel } from '../types'

export const MODEL_RESULTS: BacktestModel[] = [
  { name: 'S2_v2 XGBoost', accuracy: 0.688, neutralBias: 0, recommendation: '理论上限（需后端）', status: 'reference' },
  { name: 'S2_v2 规则引擎', accuracy: 0.562, neutralBias: 0, recommendation: '当前使用', status: 'current' },
  { name: 'S2 二分类', accuracy: 0.425, neutralBias: 0, recommendation: '已升级', status: 'upgraded' },
  { name: 'S3 量价背离', accuracy: 0.400, neutralBias: 0.03, recommendation: '辅助参考', status: 'reference' },
  { name: 'S1 双模型', accuracy: 0.375, neutralBias: 0.15, recommendation: '有条件使用', status: 'reference' },
  { name: 'S4 极简3因子', accuracy: 0.312, neutralBias: 0.12, recommendation: '不推荐', status: 'deprecated' },
  { name: 'S5 v3基准', accuracy: 0.225, neutralBias: 0.53, recommendation: '已废弃', status: 'deprecated' },
]
