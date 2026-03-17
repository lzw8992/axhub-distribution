// 配货管理相关页面的共享菜单配置

export interface MenuItem {
  key: string;
  label: string;
  children?: MenuItem[];
}

// 侧边菜单配置
export const distributionMenuItems: MenuItem[] = [
  {
    key: 'requirement',
    label: '需求申请',
    children: [
      { key: 'my_requirements', label: '我的需求单' }
    ]
  },
  {
    key: 'distribution',
    label: '配货管理',
    children: [
      { key: 'pending_distribution', label: '待我配货' },
      { key: 'my_distribution_order', label: '我的配货单' }
    ]
  }
];

// 菜单点击处理函数
export const handleDistributionMenuSelect = (key: string) => {
  switch (key) {
    // 需求申请
    case 'my_requirements':
      window.location.href = '/pages/my-requirements';
      break;
    // 配货管理
    case 'pending_distribution':
      window.location.href = '/pages/pending-distribution';
      break;
    case 'my_distribution_order':
      window.location.href = '/pages/my-distribution-order';
      break;
    default:
      break;
  }
};
