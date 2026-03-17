/**
 * @name 待我配货
 *
 * 参考资料：
 * - /rules/development-standards.md
 * - /rules/axure-api-guide.md
 * - /src/themes/antd-new/designToken.json (Ant Design 主题)
 * - /assets/libraries/antd.md (Ant Design 组件库)
 * - /src/pages/ref-antd/index.tsx (Antd 电商后台参考案例)
 */

import './style.css';
import React, { useState, useCallback, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Layout,
  Card,
  Row,
  Col,
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Drawer,
  Radio,
  Form,
  InputNumber,
  Breadcrumb,
  Pagination,
  Tag,
  Typography,
  Tooltip,
  Modal,
  Upload,
  Dropdown,
  message,
  Tabs
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  DownOutlined,
  UpOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CalendarOutlined,
  HomeOutlined,
  InboxOutlined,
  PaperClipOutlined,
  SettingOutlined,
  DragOutlined
} from '@ant-design/icons';

import type {
  KeyDesc,
  DataDesc,
  ConfigItem,
  Action,
  EventItem,
  AxureProps,
  AxureHandle
} from '../../common/axure-types';

import SideMenu from '../../elements/side-menu';
import StatusTabs from './StatusTabs';
import { distributionMenuItems, handleDistributionMenuSelect } from '../distribution-menu-config';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// --- 可复用组件 ---

// 商品信息卡片组件
interface ProductInfoCardProps {
  record: DistributionRecord;
  showPending?: boolean; // 是否显示待配货
}

const ProductInfoCard: React.FC<ProductInfoCardProps> = ({ record, showPending = false }) => {
  const allocated = record['配货明细']?.reduce((sum, d) => sum + d.quantity, 0) || 0;
  const pending = record['领用数量'] - allocated;

  return (
    <Card style={{ marginBottom: 16, background: '#fff' }}>
      <Row align="top">
        <Col span={14}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{
              width: 48,
              height: 48,
              background: '#e6f7ff',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              flexShrink: 0
            }}>
              <ShoppingCartOutlined style={{ fontSize: 24, color: '#1677ff' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>
                {record['采购类别']}
              </div>
              <Tooltip title={record['采购单品']} placement="topLeft">
                <div style={{
                  fontWeight: 500,
                  fontSize: 14,
                  marginBottom: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: '20px'
                }}>
                  {record['采购单品']}
                </div>
              </Tooltip>
              <div style={{ color: '#999', fontSize: 12 }}>
                国标码: {record['单品国标码']}
              </div>
            </div>
          </div>
        </Col>
        <Col span={10}>
          <Row justify="end" style={{ marginInline: -16 }}>
            <Col style={{ paddingInline: 16, textAlign: 'right' }}>
              <div style={{ color: '#999', fontSize: 12, marginBottom: 2 }}>领用数量</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{record['领用数量']}</div>
            </Col>
            {showPending && (
              <Col style={{ paddingInline: 16, textAlign: 'right' }}>
                <div style={{ color: '#999', fontSize: 12, marginBottom: 2 }}>待配货</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{pending}</div>
              </Col>
            )}
            <Col style={{ paddingInline: 16, textAlign: 'right' }}>
              <div style={{ color: '#999', fontSize: 12, marginBottom: 2 }}>已配货</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{allocated}</div>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

// --- 类型定义 ---

interface DistributionRecord {
  id: string;
  '需求单号-行号': string;
  '配货单号'?: string;
  '采购类别': string;
  '采购单品': string;
  '单品国标码': number;
  '预估单价': string;
  '官方售价': string;
  '领用数量': number;
  '计量单位': string;
  '是否定制品': string;
  '金额': string;
  '审批币种金额': string;
  '领用发出仓': string;
  '发放处理人': string;
  '周边用途': string;
  '活动ID': string;
  '活动名称': string;
  '预算编号': string;
  '预算概览': string;
  '预算年度': number;
  '业务类型': string;
  '公司产品': string;
  '发行区域': string;
  '版本': string;
  '营销渠道': string;
  'IP': string;
  '项目编号': string;
  '项目名称': string;
  '需求标题': string;
  '需求产生原因': string;
  '需求部门': string;
  '实际需求人': string;
  '需求提单人': string;
  '受益部门': string;
  '预计需求时间': string;
  '备注': string;
  '附件': string;
  // 配货明细相关字段
  '配货状态'?: 'pending' | 'transfer' | 'deferred' | 'purchase' | 'completed' | 'closed';
  '配货明细'?: Array<{
    from: string;
    to: string;
    quantity: number;
  }>;
  '预计满足时间'?: string;
  '关联单号'?: string;
  '配货说明'?: string;
}

// --- Axure API 定义 ---

const EVENT_LIST: EventItem[] = [
  { name: 'onDistributeClick', desc: '点击去配货按钮时触发，传递当前行数据 JSON 字符串' },
  { name: 'onSearch', desc: '点击搜索按钮时触发，传递筛选条件 JSON 字符串' },
  { name: 'onReset', desc: '点击还原按钮时触发' }
];

const ACTION_LIST: Action[] = [
  { name: 'refreshData', desc: '刷新列表数据' },
  { name: 'setFilter', desc: '设置筛选条件，参数格式：JSON 字符串 {"field": "字段名", "value": "值"}' }
];

const VAR_LIST: KeyDesc[] = [
  { name: 'selected_rows', desc: '当前选中的行数据' },
  { name: 'filter_conditions', desc: '当前筛选条件' },
  { name: 'drawer_visible', desc: '配货抽屉是否可见' },
  { name: 'distribute_method', desc: '配货方式（transfer/purchase）' }
];

const CONFIG_LIST: ConfigItem[] = [
  { type: 'input', attributeId: 'pageTitle', displayName: '页面标题', info: '页面标题', initialValue: '待我配货' },
  { type: 'input', attributeId: 'defaultHandler', displayName: '默认处理人', info: '默认处理人', initialValue: '张三(san.zhang)' },
  { type: 'inputNumber', attributeId: 'pageSize', displayName: '每页显示条数', info: '每页显示条数', initialValue: 10, min: 5, max: 100 }
];

const DATA_LIST: DataDesc[] = [
  {
    name: 'records',
    desc: '待配货记录列表',
    keys: [
      { name: 'id', desc: '主键 ID' },
      { name: '需求单号-行号', desc: '需求单号-行号' },
      { name: '采购类别', desc: '采购类别' },
      { name: '采购单品', desc: '采购单品' },
      { name: '单品国标码', desc: '单品国标码' },
      { name: '预估单价', desc: '预估单价' },
      { name: '官方售价', desc: '官方售价' },
      { name: '领用数量', desc: '领用数量' },
      { name: '计量单位', desc: '计量单位' },
      { name: '是否定制品', desc: '是否定制品' },
      { name: '金额', desc: '金额' },
      { name: '审批币种金额', desc: '审批币种金额' },
      { name: '领用发出仓', desc: '领用发出仓' },
      { name: '发放处理人', desc: '发放处理人' },
      { name: '周边用途', desc: '周边用途' },
      { name: '活动ID', desc: '活动ID' },
      { name: '活动名称', desc: '活动名称' },
      { name: '预算编号', desc: '预算编号' },
      { name: '预算概览', desc: '预算概览' },
      { name: '预算年度', desc: '预算年度' },
      { name: '业务类型', desc: '业务类型' },
      { name: '公司产品', desc: '公司产品' },
      { name: '发行区域', desc: '发行区域' },
      { name: '版本', desc: '版本' },
      { name: '营销渠道', desc: '营销渠道' },
      { name: 'IP', desc: 'IP' },
      { name: '项目编号', desc: '项目编号' },
      { name: '项目名称', desc: '项目名称' },
      { name: '受益部门', desc: '受益部门' },
      { name: '预计需求时间', desc: '预计需求时间' },
      { name: '备注', desc: '备注' },
      { name: '附件', desc: '附件' }
    ]
  }
];

// --- 模拟数据（从JSON文件同步）---

const mockData: DistributionRecord[] = [
  {
    id: '73da3a9c-e7d5-4356-a1f4-1c27626632d5',
    '需求单号-行号': 'PR260211000345-1',
    '配货单号': 'DN260120000100',
    '采购类别': '周边>挂摆印刷>马口铁>马口铁徽章',
    '采购单品': '周边|事件簿|左然|挂件摆件|金属徽章|海岛疑云系列SSR单人马口铁徽章-左然',
    '单品国标码': 6940000000000,
    '预估单价': 'CNY 4.45',
    '官方售价': 'CNY 18.00',
    '领用数量': 5,
    '计量单位': '个',
    '是否定制品': '否',
    '金额': 'CNY 22.23',
    '审批币种金额': 'USD 9.99',
    '领用发出仓': '华东月浦-国际化仓',
    '发放处理人': '张三(san.zhang)',
    '周边用途': '玩家赠送',
    '活动ID': 'e202603053154',
    '活动名称': '这是一个活动',
    '预算编号': 'BNXX2026808822',
    '预算概览': '非版本-玩家运营-玩家自办私域活动支援',
    '预算年度': 2026,
    '业务类型': '运营>玩家运营',
    '公司产品': '未定事件簿',
    '发行区域': '海外多区域',
    '版本': '非版本',
    '营销渠道': '-',
    'IP': '原神',
    '项目编号': 'BZSPPJ2026029321',
    '项目名称': '这是一个项目编号',
    '需求标题': '左然周边采购需求',
    '需求产生原因': '玩家活动赠送',
    '需求部门': '综合运营支持组',
    '实际需求人': '张三(san.zhang)',
    '需求提单人': '李四(li.si)',
    '受益部门': '米哈游>国际化组>综合运营组>综合运营支持组',
      '预计需求时间': '2026-03-08',
      '备注': '这是一个备注',
      '附件': '1个附件',
      '配货状态': 'pending',
      '配货明细': []
    },
    {
      id: '5aaf8ee1-acb8-4976-9c9a-727dfd7bbf14',
    '需求单号-行号': 'PR260211000345-2',
    '配货单号': 'DN260120000101',
    '采购类别': '周边>手办模玩>手办>粘土人',
    '采购单品': '周边|事件簿|左然|模玩|粘土人|GSC粘土人手办-左然（日文版，仅海外赠送使用）',
    '单品国标码': 4580000000000,
    '预估单价': 'CNY 4.45',
    '官方售价': 'CNY 18.00',
    '领用数量': 1,
    '计量单位': '个',
    '是否定制品': '否',
    '金额': 'CNY 22.23',
    '审批币种金额': 'USD 9.99',
    '领用发出仓': '华东月浦-国际化仓',
    '发放处理人': '张三(san.zhang)',
    '周边用途': '玩家赠送',
    '活动ID': 'e202603053154',
    '活动名称': '这是一个活动',
    '预算编号': 'BNXX2026808822',
    '预算概览': '非版本-玩家运营-玩家自办私域活动支援',
    '预算年度': 2026,
    '业务类型': '运营>玩家运营',
    '公司产品': '未定事件簿',
    '发行区域': '海外多区域',
    '版本': '非版本',
    '营销渠道': '-',
    'IP': '原神',
    '项目编号': 'BZSPPJ2026029322',
    '项目名称': '这是一个项目编号',
    '需求标题': '左然周边采购需求',
    '需求产生原因': '玩家活动赠送',
    '需求部门': '综合运营支持组',
    '实际需求人': '张三(san.zhang)',
    '需求提单人': '李四(li.si)',
    '受益部门': '米哈游>国际化组>综合运营组>综合运营支持组',
    '预计需求时间': '2026-03-08',
    '备注': '这是一个备注',
    '附件': '2个附件',
    '配货状态': 'pending',
    '配货明细': []
  },
  {
    id: '06131f50-bfa1-4464-a414-0144d0d16498',
    '需求单号-行号': 'PR260211000345-3',
    '配货单号': 'DN260120000102',
    '采购类别': '周边>挂摆印刷>挂摆礼盒>挂摆礼盒',
    '采购单品': '周边|事件簿|左然|特殊类|非食品类礼盒|春色然然系列左然生日4.0礼盒',
    '单品国标码': 6940000000000,
    '预估单价': 'CNY 4.45',
    '官方售价': 'CNY 18.00',
    '领用数量': 1,
    '计量单位': '个',
    '是否定制品': '否',
    '金额': 'CNY 22.23',
    '审批币种金额': 'USD 9.99',
    '领用发出仓': '华东月浦-国际化仓',
    '发放处理人': '张三(san.zhang)',
    '周边用途': '玩家赠送',
    '活动ID': 'e202603053154',
    '活动名称': '这是一个活动',
    '预算编号': 'BNXX2026808822',
    '预算概览': '非版本-玩家运营-玩家自办私域活动支援',
    '预算年度': 2026,
    '业务类型': '运营>玩家运营',
    '公司产品': '未定事件簿',
    '发行区域': '海外多区域',
    '版本': '非版本',
    '营销渠道': '-',
    'IP': '原神',
    '项目编号': 'BZSPPJ2026029323',
    '项目名称': '这是一个项目编号',
    '需求标题': '左然周边采购需求',
    '需求产生原因': '玩家活动赠送',
    '需求部门': '综合运营支持组',
    '实际需求人': '张三(san.zhang)',
    '需求提单人': '李四(li.si)',
    '受益部门': '米哈游>国际化组>综合运营组>综合运营支持组',
    '预计需求时间': '2026-03-08',
    '备注': '这是一个备注',
    '附件': '3个附件',
    '配货状态': 'pending',
    '配货明细': []
  },
  {
    id: 'b842d48f-8071-4d1e-b089-d4e168c18dac',
    '需求单号-行号': 'PR260211000345-4',
    '配货单号': 'DN260120000103',
    '采购类别': '周边>挂摆印刷>亚克力>其他亚克力',
    '采购单品': '周边|事件簿|左然|挂摆印刷|亚克力|其他亚克力|岁岁依然系列左然生日5.0亚克力谷美装饰相框set',
    '单品国标码': 6940000000000,
    '预估单价': 'CNY 4.45',
    '官方售价': 'CNY 18.00',
    '领用数量': 2,
    '计量单位': '个',
    '是否定制品': '否',
    '金额': 'CNY 22.23',
    '审批币种金额': 'USD 9.99',
    '领用发出仓': '华东月浦-国际化仓',
    '发放处理人': '张三(san.zhang)',
    '周边用途': '玩家赠送',
    '活动ID': 'e202603053154',
    '活动名称': '这是一个活动',
    '预算编号': 'BNXX2026808822',
    '预算概览': '非版本-玩家运营-玩家自办私域活动支援',
    '预算年度': 2026,
    '业务类型': '运营>玩家运营',
    '公司产品': '未定事件簿',
    '发行区域': '海外多区域',
    '版本': '非版本',
    '营销渠道': '-',
    'IP': '原神',
    '项目编号': 'BZSPPJ2026029324',
    '项目名称': '这是一个项目编号',
    '需求标题': '左然周边采购需求',
    '需求产生原因': '玩家活动赠送',
    '需求部门': '综合运营支持组',
    '实际需求人': '张三(san.zhang)',
    '需求提单人': '李四(li.si)',
    '受益部门': '米哈游>国际化组>综合运营组>综合运营支持组',
    '预计需求时间': '2026-03-08',
    '备注': '这是一个备注',
    '附件': '4个附件',
    '配货状态': 'pending',
    '配货明细': []
  },
  {
    id: '2e4cfa97-9889-4a13-844b-ef6f152484b1',
    '需求单号-行号': 'PR260211000345-5',
    '配货单号': 'DN260120000104',
    '采购类别': '周边>挂摆印刷>亚克力>亚克力砖',
    '采购单品': '周边|事件簿|左然|挂件摆件|亚克力摆件|挚年如愿系列左然生日3.0双人SSR亚克力装饰画',
    '单品国标码': 6980000000000,
    '预估单价': 'CNY 4.45',
    '官方售价': 'CNY 18.00',
    '领用数量': 2,
    '计量单位': '个',
    '是否定制品': '否',
    '金额': 'CNY 22.23',
    '审批币种金额': 'USD 9.99',
    '领用发出仓': '华东月浦-国际化仓',
    '发放处理人': '张三(san.zhang)',
    '周边用途': '玩家赠送',
    '活动ID': 'e202603053154',
    '活动名称': '这是一个活动',
    '预算编号': 'BNXX2026808822',
    '预算概览': '非版本-玩家运营-玩家自办私域活动支援',
    '预算年度': 2026,
    '业务类型': '运营>玩家运营',
    '公司产品': '未定事件簿',
    '发行区域': '海外多区域',
    '版本': '非版本',
    '营销渠道': '-',
    'IP': '原神',
    '项目编号': 'BZSPPJ2026029325',
    '项目名称': '这是一个项目编号',
    '需求标题': '左然周边采购需求',
    '需求产生原因': '玩家活动赠送',
    '需求部门': '综合运营支持组',
    '实际需求人': '张三(san.zhang)',
    '需求提单人': '李四(li.si)',
    '受益部门': '米哈游>国际化组>综合运营组>综合运营支持组',
    '预计需求时间': '2026-03-08',
    '备注': '这是一个备注',
    '附件': '5个附件',
    '配货状态': 'pending',
    '配货明细': []
  }
];

// --- 组件实现 ---

const Component = forwardRef<AxureHandle, AxureProps>(function PendingDistribution(innerProps, ref) {
  // Props 处理
  const dataSource = innerProps && innerProps.data ? innerProps.data : {};
  const configSource = innerProps && innerProps.config ? innerProps.config : {};
  const onEventHandler = typeof innerProps.onEvent === 'function' ? innerProps.onEvent : () => undefined;

  const pageTitle = typeof configSource.pageTitle === 'string' && configSource.pageTitle
    ? configSource.pageTitle
    : '待我配货';
  const defaultHandler = typeof configSource.defaultHandler === 'string' && configSource.defaultHandler
    ? configSource.defaultHandler
    : '张三(san.zhang)';
  const pageSize = typeof configSource.pageSize === 'number' && configSource.pageSize
    ? configSource.pageSize
    : 10;

  // 数据状态
  const [data, setData] = useState<DistributionRecord[]>(
    Array.isArray(dataSource.records) ? dataSource.records : mockData
  );
  const [filteredData, setFilteredData] = useState<DistributionRecord[]>(data);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 一键配货状态
  const [isBatchDistributeMode, setIsBatchDistributeMode] = useState(false);
  const [batchDistributePreview, setBatchDistributePreview] = useState<Record<string, any>>({});

  // 列配置状态
  const [columnOrder, setColumnOrder] = useState<string[]>([
    '需求单号-行号', '配货概览', '采购类别', '采购单品', '单品国标码', '领用数量',
    '发放处理人', '周边用途', '活动ID', '活动名称', '公司产品', '发行区域',
    '发行时间', '预算编号', '预算概览', '操作'
  ]);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  // 筛选状态
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [filters, setFilters] = useState({
    orderNo: '',
    actualUser: '',
    category: '',
    product: '',
    department: '',
    submitter: '',
    reason: '',
    benefit: '',
    dateRange: null as [string, string] | null,
    handler: defaultHandler,
    ip: '',
    purchaseProduct: '',
    requirementTitle: ''
  });

  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DistributionRecord | null>(null);
  const [distributeMethod, setDistributeMethod] = useState<'transfer' | 'purchase'>('transfer');
  const [form] = Form.useForm();

  // Tab 状态 - 默认选中待配货
  const [activeTab, setActiveTab] = useState('pending');

  // 采购中记录 - 包含示例数据
  const [purchasingRecords, setPurchasingRecords] = useState<DistributionRecord[]>([
    {
      id: 'purchasing-1',
      '需求单号-行号': 'PR260211000350-1',
      '配货单号': 'DN260120000200',
      '采购类别': '周边>挂摆印刷>马口铁>马口铁徽章',
      '采购单品': '周边|事件簿|左然|挂件摆件|金属徽章|示例商品-采购中',
      '单品国标码': 6940000000002,
      '预估单价': 'CNY 4.45',
      '官方售价': 'CNY 18.00',
      '领用数量': 10,
      '计量单位': '个',
      '是否定制品': '否',
      '金额': 'CNY 44.50',
      '审批币种金额': 'USD 19.98',
      '领用发出仓': '华东月浦-国际化仓',
      '发放处理人': '张三(san.zhang)',
      '周边用途': '玩家赠送',
      '活动ID': 'e202603053160',
      '活动名称': '采购中示例活动',
      '预算编号': 'BNXX2026808820',
      '预算概览': '非版本-玩家运营-玩家自办私域活动支援',
      '预算年度': 2026,
      '业务类型': '运营>玩家运营',
      '公司产品': '未定事件簿',
      '发行区域': '海外多区域',
      '版本': '非版本',
      '营销渠道': '-',
      'IP': '原神',
      '项目编号': 'BZSPPJ2026029320',
      '项目名称': '采购中示例项目',
      '需求标题': '左然周边采购需求',
      '需求产生原因': '玩家活动赠送',
      '需求部门': '综合运营支持组',
      '实际需求人': '张三(san.zhang)',
      '需求提单人': '李四(li.si)',
      '受益部门': '米哈游>国际化组>综合运营组>综合运营支持组',
      '预计需求时间': '2026-03-08',
      '备注': '采购中示例',
      '附件': '1个附件',
      '配货状态': 'purchase',
      '配货明细': [
        { from: '供应商001', to: '华东月浦', quantity: 10 }
      ]
    }
  ]);

  // 暂缓配货记录 - 包含示例数据
  const [deferredRecords, setDeferredRecords] = useState<DistributionRecord[]>([
    {
      id: 'deferred-1',
      '需求单号-行号': 'PR260211000340-1',
      '配货单号': 'DN260120000300',
      '采购类别': '周边>挂摆印刷>马口铁>马口铁徽章',
      '采购单品': '周边|事件簿|左然|挂件摆件|金属徽章|示例商品-暂缓配货',
      '单品国标码': 6940000000001,
      '预估单价': 'CNY 4.45',
      '官方售价': 'CNY 18.00',
      '领用数量': 10,
      '计量单位': '个',
      '是否定制品': '否',
      '金额': 'CNY 44.50',
      '审批币种金额': 'USD 19.98',
      '领用发出仓': '华东月浦-国际化仓',
      '发放处理人': '张三(san.zhang)',
      '周边用途': '玩家赠送',
      '活动ID': 'e202603053150',
      '活动名称': '暂缓配货示例活动',
      '预算编号': 'BNXX2026808810',
      '预算概览': '非版本-玩家运营-玩家自办私域活动支援',
      '预算年度': 2026,
      '业务类型': '运营>玩家运营',
      '公司产品': '未定事件簿',
      '发行区域': '海外多区域',
      '版本': '非版本',
      '营销渠道': '-',
      'IP': '原神',
      '项目编号': 'BZSPPJ2026029310',
      '项目名称': '暂缓配货示例项目',
      '需求标题': '左然周边采购需求',
      '需求产生原因': '玩家活动赠送',
      '需求部门': '综合运营支持组',
      '实际需求人': '张三(san.zhang)',
      '需求提单人': '李四(li.si)',
      '受益部门': '米哈游>国际化组>综合运营组>综合运营支持组',
      '预计需求时间': '2026-03-08',
      '备注': '暂缓配货示例',
      '附件': '1个附件',
      '配货状态': 'deferred',
      '配货明细': [
        { from: '日区001', to: '华东月浦', quantity: 10 }
      ],
      '预计满足时间': '2026-03-15',
      '关联单号': 'PR260211000346-1',
      '配货说明': '采购在途，预计3月15日到货'
    }
  ]);

  // 配货完成记录 - 包含示例数据
  const [completedRecords, setCompletedRecords] = useState<DistributionRecord[]>([
    {
      id: 'completed-1',
      '需求单号-行号': 'PR260211000330-1',
      '配货单号': 'DN260120000010',
      '采购类别': '周边>挂摆印刷>亚克力>亚克力砖',
      '采购单品': '周边|事件簿|左然|挂件摆件|亚克力摆件|示例商品-单仓配货完成',
      '单品国标码': 6980000000001,
      '预估单价': 'CNY 4.45',
      '官方售价': 'CNY 18.00',
      '领用数量': 5,
      '计量单位': '个',
      '是否定制品': '否',
      '金额': 'CNY 22.25',
      '审批币种金额': 'USD 9.99',
      '领用发出仓': '华东月浦-国际化仓',
      '发放处理人': '张三(san.zhang)',
      '周边用途': '玩家赠送',
      '活动ID': 'e202603053140',
      '活动名称': '配货完成示例活动-单仓',
      '预算编号': 'BNXX2026808800',
      '预算概览': '非版本-玩家运营-玩家自办私域活动支援',
      '预算年度': 2026,
      '业务类型': '运营>玩家运营',
      '公司产品': '未定事件簿',
      '发行区域': '海外多区域',
      '版本': '非版本',
      '营销渠道': '-',
      'IP': '原神',
      '项目编号': 'BZSPPJ2026029300',
      '项目名称': '配货完成示例项目-单仓',
      '需求标题': '左然周边采购需求',
      '需求产生原因': '玩家活动赠送',
      '需求部门': '综合运营支持组',
      '实际需求人': '张三(san.zhang)',
      '需求提单人': '李四(li.si)',
      '受益部门': '米哈游>国际化组>综合运营组>综合运营支持组',
      '预计需求时间': '2026-03-08',
      '备注': '单仓配货完成示例',
      '附件': '2个附件',
      '配货状态': 'completed',
      '配货明细': [
        { from: '日区001', to: '华东月浦', quantity: 5 }
      ]
    },
    {
      id: 'completed-2',
      '需求单号-行号': 'PR260211000330-2',
      '配货单号': 'DN260120000011',
      '采购类别': '周边>挂摆印刷>亚克力>亚克力色纸',
      '采购单品': '周边|事件簿|左然|挂件摆件|亚克力摆件|示例商品-多仓配货完成',
      '单品国标码': 6980000000002,
      '预估单价': 'CNY 4.45',
      '官方售价': 'CNY 18.00',
      '领用数量': 11,
      '计量单位': '个',
      '是否定制品': '否',
      '金额': 'CNY 48.95',
      '审批币种金额': 'USD 21.98',
      '领用发出仓': '华东月浦-国际化仓',
      '发放处理人': '张三(san.zhang)',
      '周边用途': '玩家赠送',
      '活动ID': 'e202603053141',
      '活动名称': '配货完成示例活动-多仓',
      '预算编号': 'BNXX2026808801',
      '预算概览': '非版本-玩家运营-玩家自办私域活动支援',
      '预算年度': 2026,
      '业务类型': '运营>玩家运营',
      '公司产品': '未定事件簿',
      '发行区域': '海外多区域',
      '版本': '非版本',
      '营销渠道': '-',
      'IP': '原神',
      '项目编号': 'BZSPPJ2026029301',
      '项目名称': '配货完成示例项目-多仓',
      '需求标题': '左然周边采购需求',
      '需求产生原因': '玩家活动赠送',
      '需求部门': '综合运营支持组',
      '实际需求人': '张三(san.zhang)',
      '需求提单人': '李四(li.si)',
      '受益部门': '米哈游>国际化组>综合运营组>综合运营支持组',
      '预计需求时间': '2026-03-08',
      '备注': '多仓配货完成示例',
      '附件': '3个附件',
      '配货状态': 'completed',
      '配货明细': [
        { from: '日区001', to: '华东月浦', quantity: 5 },
        { from: '华南深圳', to: '华东月浦', quantity: 6 }
      ]
    }
  ]);

  // 调拨中记录 - 包含示例数据（展示一个需求单号对应多个配货单的情况）
  const [transferringRecords, setTransferringRecords] = useState<DistributionRecord[]>([
    {
      id: 'transferring-1',
      '需求单号-行号': 'PR260211000340-1',
      '配货单号': 'DN260120000002',
      '采购类别': '周边>挂摆印刷>亚克力>亚克力砖',
      '采购单品': '周边|事件簿|左然|挂件摆件|亚克力摆件|示例商品-调拨中',
      '单品国标码': 6980000000003,
      '预估单价': 'CNY 4.45',
      '官方售价': 'CNY 18.00',
      '领用数量': 5,
      '计量单位': '个',
      '是否定制品': '否',
      '金额': 'CNY 22.25',
      '审批币种金额': 'USD 9.99',
      '领用发出仓': '华东月浦-国际化仓',
      '发放处理人': '张三(san.zhang)',
      '周边用途': '玩家赠送',
      '活动ID': 'e202603053142',
      '活动名称': '调拨中示例活动',
      '预算编号': 'BNXX2026808802',
      '预算概览': '非版本-玩家运营-玩家自办私域活动支援',
      '预算年度': 2026,
      '业务类型': '运营>玩家运营',
      '公司产品': '未定事件簿',
      '发行区域': '海外多区域',
      '版本': '非版本',
      '营销渠道': '-',
      'IP': '原神',
      '项目编号': 'BZSPPJ2026029302',
      '项目名称': '调拨中示例项目',
      '需求标题': '左然周边采购需求-调拨中',
      '需求产生原因': '玩家活动赠送',
      '需求部门': '综合运营支持组',
      '实际需求人': '张三(san.zhang)',
      '需求提单人': '李四(li.si)',
      '受益部门': '米哈游>国际化组>综合运营组>综合运营支持组',
      '预计需求时间': '2026-03-10',
      '备注': '调拨中示例-从日区001调拨',
      '附件': '1个附件',
      '配货状态': 'transfer',
      '配货明细': [
        { from: '日区001', to: '华东月浦', quantity: 5 }
      ]
    },
    {
      id: 'transferring-2',
      '需求单号-行号': 'PR260211000340-1',
      '配货单号': 'DN260120000003',
      '采购类别': '周边>挂摆印刷>亚克力>亚克力砖',
      '采购单品': '周边|事件簿|左然|挂件摆件|亚克力摆件|示例商品-调拨中',
      '单品国标码': 6980000000003,
      '预估单价': 'CNY 4.45',
      '官方售价': 'CNY 18.00',
      '领用数量': 5,
      '计量单位': '个',
      '是否定制品': '否',
      '金额': 'CNY 22.25',
      '审批币种金额': 'USD 9.99',
      '领用发出仓': '华东月浦-国际化仓',
      '发放处理人': '张三(san.zhang)',
      '周边用途': '玩家赠送',
      '活动ID': 'e202603053142',
      '活动名称': '调拨中示例活动',
      '预算编号': 'BNXX2026808802',
      '预算概览': '非版本-玩家运营-玩家自办私域活动支援',
      '预算年度': 2026,
      '业务类型': '运营>玩家运营',
      '公司产品': '未定事件簿',
      '发行区域': '海外多区域',
      '版本': '非版本',
      '营销渠道': '-',
      'IP': '原神',
      '项目编号': 'BZSPPJ2026029302',
      '项目名称': '调拨中示例项目',
      '需求标题': '左然周边采购需求-调拨中',
      '需求产生原因': '玩家活动赠送',
      '需求部门': '综合运营支持组',
      '实际需求人': '张三(san.zhang)',
      '需求提单人': '李四(li.si)',
      '受益部门': '米哈游>国际化组>综合运营组>综合运营支持组',
      '预计需求时间': '2026-03-10',
      '备注': '调拨中示例-从华南深圳调拨',
      '附件': '1个附件',
      '配货状态': 'transfer',
      '配货明细': [
        { from: '华南深圳', to: '华东月浦', quantity: 5 }
      ]
    }
  ]);

  // 配货关闭记录 - 包含示例数据
  const [closedRecords, setClosedRecords] = useState<DistributionRecord[]>([
    {
      id: 'closed-1',
      '需求单号-行号': 'PR260211000360-1',
      '配货单号': 'DN260120000400',
      '采购类别': '周边>挂摆印刷>马口铁>马口铁徽章',
      '采购单品': '周边|事件簿|左然|挂件摆件|金属徽章|示例商品-配货关闭',
      '单品国标码': 6940000000003,
      '预估单价': 'CNY 4.45',
      '官方售价': 'CNY 18.00',
      '领用数量': 8,
      '计量单位': '个',
      '是否定制品': '否',
      '金额': 'CNY 35.60',
      '审批币种金额': 'USD 15.98',
      '领用发出仓': '华东月浦-国际化仓',
      '发放处理人': '张三(san.zhang)',
      '周边用途': '玩家赠送',
      '活动ID': 'e202603053170',
      '活动名称': '配货关闭示例活动',
      '预算编号': 'BNXX2026808830',
      '预算概览': '非版本-玩家运营-玩家自办私域活动支援',
      '预算年度': 2026,
      '业务类型': '运营>玩家运营',
      '公司产品': '未定事件簿',
      '发行区域': '海外多区域',
      '版本': '非版本',
      '营销渠道': '-',
      'IP': '原神',
      '项目编号': 'BZSPPJ2026029330',
      '项目名称': '配货关闭示例项目',
      '需求标题': '左然周边采购需求',
      '需求产生原因': '玩家活动赠送',
      '需求部门': '综合运营支持组',
      '实际需求人': '张三(san.zhang)',
      '需求提单人': '李四(li.si)',
      '受益部门': '米哈游>国际化组>综合运营组>综合运营支持组',
      '预计需求时间': '2026-03-08',
      '备注': '配货关闭示例',
      '附件': '1个附件',
      '配货状态': 'closed',
      '配货明细': []
    }
  ]);

  // 批量导入弹窗状态
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // 批量导入预览模式状态
  const [isBatchImportMode, setIsBatchImportMode] = useState(false);
  const [batchImportPreview, setBatchImportPreview] = useState<Record<string, any>>({});

  // 附件弹窗状态
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [currentAttachments, setCurrentAttachments] = useState<Array<{ name: string; url: string; thumbnail?: string }>>([]);

  // 关闭配货弹窗状态
  const [closeModalVisible, setCloseModalVisible] = useState(false);
  const [closeRecord, setCloseRecord] = useState<DistributionRecord | null>(null);
  const [closeReason, setCloseReason] = useState('');

  // 配货暂挂（暂缓配货）抽屉状态
  const [deferDrawerVisible, setDeferDrawerVisible] = useState(false);
  const [deferRecord, setDeferRecord] = useState<DistributionRecord | null>(null);
  const [deferReason, setDeferReason] = useState<'采购在途' | '调拨沟通'>('采购在途');
  const [deferExpectedTime, setDeferExpectedTime] = useState<string>('');
  const [deferRemark, setDeferRemark] = useState('');
  const [deferOrderNo, setDeferOrderNo] = useState(''); // 关联单号（采购在途时必填）

  // 转交弹窗状态
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferRecord, setTransferRecord] = useState<DistributionRecord | null>(null);
  const [transferTarget, setTransferTarget] = useState('');

  // 查看操作记录弹窗状态
  const [viewDetailModalVisible, setViewDetailModalVisible] = useState(false);
  const [viewDetailRecord, setViewDetailRecord] = useState<DistributionRecord | null>(null);

  // 查看操作记录抽屉状态（已整合到配货详情抽屉中）
  const [operationLogVisible, setOperationLogVisible] = useState(false);
  const [operationLogRecord, setOperationLogRecord] = useState<DistributionRecord | null>(null);

  // 批量转交弹窗状态
  const [batchTransferModalVisible, setBatchTransferModalVisible] = useState(false);
  const [batchTransferTarget, setBatchTransferTarget] = useState('');

  // 批量关闭弹窗状态
  const [batchCloseModalVisible, setBatchCloseModalVisible] = useState(false);
  const [batchCloseReason, setBatchCloseReason] = useState('');

  // 调拨明细列表状态
  const [transferDetails, setTransferDetails] = useState<Array<{
    id: string;
    warehouse: string;
    availableStock: number;
    quantity: number;
  }>>([
    { id: '1', warehouse: '日区仓库001', availableStock: 1108183, quantity: 11 }
  ]);

  // 仓库列表 - 包含库存数
  const warehouseList = [
    { name: '日区仓库001', stock: 1108183 },
    { name: '华东月浦-国际化仓', stock: 50000 },
    { name: '华南深圳-国内仓', stock: 25000 },
    { name: '华北北京-备用仓', stock: 8000 }
  ];

  // 事件触发
  const emitEvent = useCallback((eventName: string, payload?: string) => {
    try {
      onEventHandler(eventName, payload);
    } catch (error) {
      console.warn('事件触发失败:', error);
    }
  }, [onEventHandler]);

  // 筛选处理
  const handleSearch = useCallback(() => {
    setLoading(true);
    emitEvent('onSearch', JSON.stringify(filters));

    setTimeout(() => {
      let result = [...data];

      if (filters.orderNo) {
        result = result.filter(item =>
          item['需求单号-行号'].toLowerCase().includes(filters.orderNo.toLowerCase())
        );
      }
      if (filters.actualUser) {
        result = result.filter(item =>
          item['发放处理人'].toLowerCase().includes(filters.actualUser.toLowerCase())
        );
      }
      if (filters.category) {
        result = result.filter(item =>
          item['采购类别'].toLowerCase().includes(filters.category.toLowerCase())
        );
      }
      if (filters.product) {
        result = result.filter(item =>
          item['采购单品'].toLowerCase().includes(filters.product.toLowerCase())
        );
      }
      if (filters.handler) {
        result = result.filter(item =>
          item['发放处理人'].toLowerCase().includes(filters.handler.toLowerCase())
        );
      }

      setFilteredData(result);
      setCurrentPage(1);
      setLoading(false);
    }, 300);
  }, [data, filters, emitEvent]);

  // 重置筛选
  const handleReset = useCallback(() => {
    setFilters({
      orderNo: '',
      actualUser: '',
      category: '',
      product: '',
      department: '',
      submitter: '',
      reason: '',
      benefit: '',
      dateRange: null,
      handler: defaultHandler
    });
    setFilteredData(data);
    setCurrentPage(1);
    emitEvent('onReset');
  }, [data, defaultHandler, emitEvent]);

  // 打开配货抽屉
  const handleOpenDistribute = useCallback((record: DistributionRecord) => {
    setCurrentRecord(record);
    setDistributeMethod('transfer');
    form.resetFields();
    setDrawerVisible(true);
    emitEvent('onDistributeClick', JSON.stringify(record));
  }, [form, emitEvent]);

  // 打开配货暂挂抽屉
  const handleOpenDefer = useCallback((record: DistributionRecord) => {
    setDeferRecord(record);
    setDeferReason('采购在途');
    setDeferExpectedTime('');
    setDeferRemark('');
    setDeferOrderNo('');
    setDeferDrawerVisible(true);
  }, []);

  // 关闭配货暂挂抽屉
  const handleCloseDeferDrawer = useCallback(() => {
    setDeferDrawerVisible(false);
    setDeferRecord(null);
  }, []);

  // 保存配货暂挂
  const handleSaveDefer = useCallback(() => {
    if (!deferRecord) return;

    // 如果选择采购在途，必须填写关联单号
    if (deferReason === '采购在途' && !deferOrderNo.trim()) {
      message.error('请输入采购需求单号-行号');
      return;
    }

    // 将记录从待配货移到暂缓配货
    setData(prev => prev.filter(item => item.id !== deferRecord.id));
    setFilteredData(prev => prev.filter(item => item.id !== deferRecord.id));
    setDeferredRecords(prev => [...prev, {
      ...deferRecord,
      '配货状态': 'deferred' as const,
      '预计满足时间': deferExpectedTime,
      '暂缓原因': deferReason,
      '配货说明': deferRemark,
      '关联单号': deferOrderNo
    }]);

    setDeferDrawerVisible(false);
    setDeferRecord(null);
    message.success('配货已暂挂');
  }, [deferRecord, deferReason, deferExpectedTime, deferRemark, deferOrderNo]);

  // 关闭抽屉
  const handleCloseDrawer = useCallback(() => {
    setDrawerVisible(false);
    setCurrentRecord(null);
  }, []);

  // 保存配货
  const handleSaveDistribute = useCallback(() => {
    form.validateFields().then(values => {
      console.log('配货数据:', values);

      setDrawerVisible(false);
      setCurrentRecord(null);
      form.resetFields();
    });
  }, [form]);

  // 根据当前Tab获取对应的数据
  const currentTabData = useMemo(() => {
    switch (activeTab) {
      case 'all':
        // 全部Tab：合并所有数据
        return [
          ...filteredData.map(r => ({ ...r, '配货状态': r['配货状态'] || 'pending' as const })),
          ...purchasingRecords,
          ...deferredRecords,
          ...transferringRecords,
          ...completedRecords,
          ...closedRecords
        ];
      case 'purchasing':
        return purchasingRecords;
      case 'deferred':
        return deferredRecords;
      case 'transferring':
        return transferringRecords;
      case 'completed':
        return completedRecords;
      case 'closed':
        return closedRecords;
      case 'pending':
      default:
        return filteredData;
    }
  }, [activeTab, filteredData, purchasingRecords, deferredRecords, transferringRecords, completedRecords, closedRecords]);

  // 分页数据
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * currentPageSize;
    return currentTabData.slice(start, start + currentPageSize);
  }, [currentTabData, currentPage, currentPageSize]);

  // Axure API 暴露
  useImperativeHandle(ref, () => ({
    getVar: (name: string) => {
      const vars: Record<string, any> = {
        selected_rows: selectedRowKeys,
        filter_conditions: filters,
        drawer_visible: drawerVisible,
        distribute_method: distributeMethod
      };
      return vars[name];
    },
    fireAction: (name: string, params?: string) => {
      switch (name) {
        case 'refreshData':
          handleSearch();
          break;
        case 'setFilter':
          if (params) {
            try {
              const parsed = JSON.parse(params);
              setFilters(prev => ({ ...prev, [parsed.field]: parsed.value }));
            } catch (error) {
              console.warn('参数解析失败:', error);
            }
          }
          break;
        default:
          console.warn('未知的动作:', name);
      }
    },
    eventList: EVENT_LIST,
    actionList: ACTION_LIST,
    varList: VAR_LIST,
    configList: CONFIG_LIST,
    dataList: DATA_LIST
  }), [selectedRowKeys, filters, drawerVisible, distributeMethod, handleSearch]);

  // 表格列定义
  const columns = [
    {
      title: '需求单号-行号',
      dataIndex: '需求单号-行号',
      key: '需求单号-行号',
      width: 160,
      fixed: 'left' as const,
      render: (text: string) => (
        <Text strong style={{ color: '#1677ff', cursor: 'pointer' }}>
          {text}
        </Text>
      )
    },
    {
      title: '配货概览',
      key: '配货明细',
      width: isBatchImportMode || isBatchDistributeMode ? 360 : 280,
      render: (_: any, record: DistributionRecord) => {
        const status = record['配货状态'];
        const details = record['配货明细'] || [];

        // 一键配货预览模式 - 显示预览的配货结果
        if (isBatchDistributeMode && selectedRowKeys.includes(record.id)) {
          const preview = batchDistributePreview[record.id];
          if (preview && preview.success) {
            const detail = preview.details[0];
            return (
              <div
                style={{
                  lineHeight: '1.5',
                  fontSize: 12,
                  padding: '6px 10px',
                  borderRadius: 4,
                  border: '1px solid #b7eb8f',
                  background: '#f6ffed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span style={{ color: '#666', fontWeight: 500 }}>{detail.from}</span>
                <span style={{ color: '#999', margin: '0 2px' }}>→</span>
                <span style={{ color: '#666', fontWeight: 500 }}>{detail.to}</span>
                <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 13 }}>×{detail.quantity}</span>
              </div>
            );
          } else if (preview && !preview.success) {
            return (
              <Tag color="red" style={{ margin: 0, fontSize: 11, padding: '2px 8px' }}>
                配货失败: {preview.reason}
              </Tag>
            );
          }
        }

        // 批量导入预览模式 - 显示预览的配货结果（支持多种配货方式）
        if (isBatchImportMode && batchImportPreview[record.id]) {
          const preview = batchImportPreview[record.id];
          
          // 待配货情况 - 用户未填写配货信息
          if (!preview.success && preview.method === 'pending') {
            return (
              <Tag color="default" style={{ margin: 0, fontSize: 11, padding: '2px 8px' }}>
                待配货
              </Tag>
            );
          }
          
          if (preview && preview.success) {
            const detail = preview.details[0];
            const method = preview.method;
            
            // 调拨方式 - 绿色样式（配货完成）
            if (method === 'transfer') {
              return (
                <div
                  style={{
                    lineHeight: '1.5',
                    fontSize: 12,
                    padding: '6px 10px',
                    borderRadius: 4,
                    border: '1px solid #b7eb8f',
                    background: '#f6ffed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span style={{ color: '#666', fontWeight: 500 }}>{detail.from}</span>
                  <span style={{ color: '#999', margin: '0 2px' }}>→</span>
                  <span style={{ color: '#666', fontWeight: 500 }}>{detail.to}</span>
                  <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 13 }}>×{detail.quantity}</span>
                </div>
              );
            }
            
            // 采购方式 - 蓝色样式（采购中）
            if (method === 'purchase') {
              return (
                <div
                  style={{
                    lineHeight: '1.5',
                    fontSize: 12,
                    padding: '6px 10px',
                    borderRadius: 4,
                    border: '1px solid #91d5ff',
                    background: '#e6f7ff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Tag color="blue" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>采</Tag>
                  <span style={{ color: '#666', fontWeight: 500 }}>{detail.to}</span>
                  <span style={{ color: '#999', margin: '0 2px' }}>|</span>
                  <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 13 }}>×{detail.quantity}</span>
                </div>
              );
            }

            // 暂缓配货方式 - 橙色样式
            if (method === 'deferred') {
              return (
                <div
                  style={{
                    lineHeight: '1.5',
                    fontSize: 12,
                    padding: '6px 10px',
                    borderRadius: 4,
                    border: '1px solid #ffd591',
                    background: '#fff7e6',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Tag color="orange" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>缓</Tag>
                  <span style={{ color: '#666', fontWeight: 500 }}>{detail.to}</span>
                  <span style={{ color: '#999', margin: '0 2px' }}>|</span>
                  <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 13 }}>×{detail.quantity}</span>
                </div>
              );
            }
          }
        }

        // 待配货状态 - 显示 [待配货] 标签
        if (!status || status === 'pending') {
          return (
            <Tag color="default" style={{ margin: 0, fontSize: 11, padding: '2px 8px' }}>
              待配货
            </Tag>
          );
        }
        
        // 配货关闭状态 - 显示 [配货关闭] 标签
        if (status === 'closed') {
          return (
            <Tag color="red" style={{ margin: 0, fontSize: 11, padding: '2px 8px' }}>
              配货关闭
            </Tag>
          );
        }
        
        // 仅显示的样式（无点击）
        const displayStyle: React.CSSProperties = {
          lineHeight: '1.5',
          fontSize: 12,
          padding: '6px 10px',
          borderRadius: 4,
          border: '1px solid transparent',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6
        };

        // 暂缓配货状态
        if (status === 'deferred') {
          const detail = details[0];
          if (!detail) return <span style={{ color: '#999' }}>-</span>;
          const expectedTime = record['预计满足时间'];
          // 格式化日期显示为 MM-DD
          const formattedTime = expectedTime ? expectedTime.slice(5, 10).replace('-', '-') : '';
          return (
            <div
              style={{
                ...displayStyle,
                background: '#fff7e6',
                border: '1px solid #ffd591'
              }}
            >
              <Tag color="orange" style={{ margin: 0, fontSize: 10, padding: '0 5px', borderRadius: 3 }}>缓</Tag>
              <span style={{ color: '#666', fontWeight: 500 }}>{detail.to}</span>
              <span style={{ color: '#999', margin: '0 2px' }}>|</span>
              <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 13 }}>×{detail.quantity}</span>
              {formattedTime && (
                <>
                  <span style={{ color: '#999', margin: '0 2px' }}>|</span>
                  <span style={{ color: '#fa8c16', fontSize: 12, fontWeight: 500 }}>截止 {formattedTime}</span>
                </>
              )}
            </div>
          );
        }

        // 采购状态
        if (status === 'purchase') {
          const detail = details[0];
          if (!detail) return <span style={{ color: '#999' }}>-</span>;
          return (
            <div
              style={{
                ...displayStyle,
                background: '#e6f7ff',
                border: '1px solid #91d5ff'
              }}
            >
              <Tag color="blue" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>采</Tag>
              <span style={{ color: '#666', fontWeight: 500 }}>{detail.to}</span>
              <span style={{ color: '#999', margin: '0 2px' }}>|</span>
              <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 13 }}>×{detail.quantity}</span>
            </div>
          );
        }

        // 调拨或配货完成状态
        if (details.length === 0) {
          return <span style={{ color: '#999' }}>-</span>;
        }

        // 单条明细
        if (details.length === 1) {
          const detail = details[0];
          return (
            <div
              style={{
                ...displayStyle,
                background: '#f6ffed',
                border: '1px solid #b7eb8f'
              }}
            >
              <Tag color="green" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>调</Tag>
              <span style={{ color: '#666', fontWeight: 500 }}>{detail.from}</span>
              <span style={{ color: '#999', margin: '0 2px' }}>→</span>
              <span style={{ color: '#666', fontWeight: 500 }}>{detail.to}</span>
              <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 13 }}>×{detail.quantity}</span>
            </div>
          );
        }

        // 多条明细 - 显示多行调拨信息
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {details.map((detail, index) => (
              <div
                key={index}
                style={{
                  ...displayStyle,
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f'
                }}
              >
                <Tag color="green" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>调</Tag>
                <span style={{ color: '#666', fontWeight: 500 }}>{detail.from}</span>
                <span style={{ color: '#999', margin: '0 2px' }}>→</span>
                <span style={{ color: '#666', fontWeight: 500 }}>{detail.to}</span>
                <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 13 }}>×{detail.quantity}</span>
              </div>
            ))}
          </div>
        );

      }
    },
    {
      title: '采购类别',
      dataIndex: '采购类别',
      key: '采购类别',
      width: 180,
      ellipsis: { showTitle: true }
    },
    {
      title: '采购单品',
      dataIndex: '采购单品',
      key: '采购单品',
      width: 300,
      render: (text: string, record: DistributionRecord) => (
        <Tooltip title={text} placement="topLeft">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {record['是否定制品'] === '是' && (
              <Tag color="blue" style={{ marginRight: 4, fontSize: 10, flexShrink: 0 }}>定制</Tag>
            )}
            <span style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>{text}</span>
          </div>
        </Tooltip>
      )
    },
    {
      title: '单品国标码',
      dataIndex: '单品国标码',
      key: '单品国标码',
      width: 120
    },
    {
      title: '领用数量',
      key: '领用数量',
      width: 100,
      render: (_: any, record: DistributionRecord) => `${record['领用数量']} ${record['计量单位']}`
    },
    {
      title: '发放处理人',
      dataIndex: '发放处理人',
      key: '发放处理人',
      width: 140
    },
    {
      title: '周边用途',
      dataIndex: '周边用途',
      key: '周边用途',
      width: 100
    },
    {
      title: '活动ID',
      dataIndex: '活动ID',
      key: '活动ID',
      width: 120
    },
    {
      title: '活动名称',
      dataIndex: '活动名称',
      key: '活动名称',
      width: 120
    },

    {
      title: '公司产品',
      dataIndex: '公司产品',
      key: '公司产品',
      width: 100
    },
    {
      title: '发行区域',
      dataIndex: '发行区域',
      key: '发行区域',
      width: 100
    },
    {
      title: '版本',
      dataIndex: '版本',
      key: '版本',
      width: 80
    },
    {
      title: '营销渠道',
      dataIndex: '营销渠道',
      key: '营销渠道',
      width: 80
    },
    {
      title: 'IP',
      dataIndex: 'IP',
      key: 'IP',
      width: 80
    },

    {
      title: '项目名称',
      dataIndex: '项目名称',
      key: '项目名称',
      width: 140
    },
    {
      title: '需求标题',
      dataIndex: '需求标题',
      key: '需求标题',
      width: 180,
      ellipsis: { showTitle: true }
    },
    {
      title: '需求产生原因',
      dataIndex: '需求产生原因',
      key: '需求产生原因',
      width: 150,
      ellipsis: { showTitle: true }
    },
    {
      title: '需求部门',
      dataIndex: '需求部门',
      key: '需求部门',
      width: 150,
      ellipsis: { showTitle: true }
    },
    {
      title: '实际需求人',
      dataIndex: '实际需求人',
      key: '实际需求人',
      width: 140
    },
    {
      title: '需求提单人',
      dataIndex: '需求提单人',
      key: '需求提单人',
      width: 140
    },
    {
      title: '受益部门',
      dataIndex: '受益部门',
      key: '受益部门',
      width: 200,
      ellipsis: { showTitle: true }
    },
    {
      title: '预计需求时间',
      dataIndex: '预计需求时间',
      key: '预计需求时间',
      width: 110
    },
    {
      title: '备注',
      dataIndex: '备注',
      key: '备注',
      width: 120,
      ellipsis: { showTitle: true }
    },
    {
      title: '附件',
      dataIndex: '附件',
      key: '附件',
      width: 80,
      render: (text: string, record: DistributionRecord) => {
        const count = parseInt(text) || 0;
        const mockAttachments = Array.from({ length: count }, (_, i) => ({
          name: `附件${i + 1}.png`,
          url: '#',
          thumbnail: `https://picsum.photos/100/100?random=${record.id}-${i}`
        }));
        return (
          <span
            style={{ color: '#1677ff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={() => {
              setCurrentAttachments(mockAttachments);
              setAttachmentModalVisible(true);
            }}
          >
            <PaperClipOutlined style={{ fontSize: 12 }} />
            {count}
          </span>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: DistributionRecord) => {
        // 判断各操作的显示条件
        const status = record['配货状态'];
        const isPending = status === 'pending';
        const isDeferred = status === 'deferred';
        const isCompleted = status === 'completed';
        // const isNotPR = isCompleted && !record['已下PR']; // 已完成但未下制作PR

        // 去配货：待配货、已暂缓、已完成(未下PR)
        const canDistribute = isPending || isDeferred; // || isNotPR;
        // 关闭：待配货、已暂缓、已完成(未下PR)
        const canClose = isPending || isDeferred; // || isNotPR;
        // 暂缓配货：仅待配货
        const canDefer = isPending;
        // 转交：待配货、已暂缓
        const canTransfer = isPending || isDeferred;
        // 操作记录：所有状态都有
        const canViewLog = true;

        // 下拉菜单中的项目
        const dropdownItems = [
          ...(canDefer ? [{
            key: 'defer',
            label: '暂缓配货',
            onClick: () => handleOpenDefer(record)
          }] : []),
          ...(canTransfer ? [{
            key: 'transfer',
            label: '转交',
            onClick: () => {
              setTransferRecord(record);
              setTransferTarget('');
              setTransferModalVisible(true);
            }
          }] : []),
          ...(canViewLog ? [{
            key: 'operationLog',
            label: '操作记录',
            onClick: () => {
              setViewDetailRecord(record);
              setViewDetailModalVisible(true);
            }
          }] : [])
        ];

        // 是否有任何操作按钮需要显示
        const hasAnyAction = canDistribute || canClose || dropdownItems.length > 0;

        // 如果下拉菜单只有操作记录一项，直接显示操作记录按钮
        const onlyOperationLog = dropdownItems.length === 1 && canViewLog && !canDefer && !canTransfer;

        return (
          <Space>
            {hasAnyAction && (
              <>
                {canDistribute && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleOpenDistribute(record)}
                    style={{ padding: 0 }}
                  >
                    去配货
                  </Button>
                )}
                {canClose && (
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => {
                      setCloseRecord(record);
                      setCloseReason('');
                      setCloseModalVisible(true);
                    }}
                    style={{ padding: 0 }}
                  >
                    关闭
                  </Button>
                )}
                {onlyOperationLog ? (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setViewDetailRecord(record);
                      setViewDetailModalVisible(true);
                    }}
                    style={{ padding: 0, marginLeft: 4 }}
                  >
                    操作记录
                  </Button>
                ) : dropdownItems.length > 0 && (
                  <Dropdown
                    menu={{ items: dropdownItems }}
                    placement="bottomRight"
                  >
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0, marginLeft: 4 }}
                    >
                      ...
                    </Button>
                  </Dropdown>
                )}
              </>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <SideMenu
        title="Neone"
        defaultSelectedKey="pending_distribution"
        items={distributionMenuItems}
        onMenuSelect={handleDistributionMenuSelect}
      />
      <Layout style={{ background: '#f5f7fa' }}>
        <Layout.Content style={{ padding: 24 }}>
        {/* 面包屑导航 */}
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>
            <HomeOutlined /> 配货管理
          </Breadcrumb.Item>
          <Breadcrumb.Item>待我配货</Breadcrumb.Item>
        </Breadcrumb>

        {/* 筛选模块 */}
        <Card style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>{pageTitle}</Title>
            </Col>
            <Col>
              <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
                <Button onClick={handleReset}>
                  还原
                </Button>
                <Button type="primary" ghost onClick={handleSearch}>
                  搜索
                </Button>
                <Button
                  type="link"
                  icon={filterExpanded ? <UpOutlined /> : <DownOutlined />}
                  onClick={() => setFilterExpanded(!filterExpanded)}
                  style={{ color: '#1677ff' }}
                >
                  {filterExpanded ? '收起' : '展开'}
                </Button>
              </Space>
            </Col>
          </Row>

          {/* 筛选项 - 上下布局 */}
          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div>
                <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>需求单</div>
                <Input
                  placeholder="请输入需求单号/行号/标题"
                  value={filters.orderNo}
                  onChange={e => setFilters({ ...filters, orderNo: e.target.value })}
                  allowClear
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div>
                <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>需求产生原因</div>
                <Input
                  placeholder="请输入"
                  value={filters.reason}
                  onChange={e => setFilters({ ...filters, reason: e.target.value })}
                  allowClear
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div>
                <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>实际需求人</div>
                <Input
                  placeholder="请输入域账号/姓名/拼音"
                  value={filters.actualUser}
                  onChange={e => setFilters({ ...filters, actualUser: e.target.value })}
                  allowClear
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div>
                <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>需求部门</div>
                <Input
                  placeholder="请输入"
                  value={filters.department}
                  onChange={e => setFilters({ ...filters, department: e.target.value })}
                  allowClear
                />
              </div>
            </Col>
            {filterExpanded && (
              <>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div>
                    <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>采购类别</div>
                    <Select
                      placeholder="请选择"
                      value={filters.product || undefined}
                      onChange={value => setFilters({ ...filters, product: value })}
                      allowClear
                      style={{ width: '100%' }}
                    >
                      <Option value="马口铁徽章">马口铁徽章</Option>
                      <Option value="粘土人手办">粘土人手办</Option>
                      <Option value="挂摆礼盒">挂摆礼盒</Option>
                      <Option value="亚克力摆件">亚克力摆件</Option>
                    </Select>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div>
                    <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>采购单品</div>
                    <Select
                      placeholder="请选择"
                      value={filters.purchaseProduct || undefined}
                      onChange={value => setFilters({ ...filters, purchaseProduct: value })}
                      allowClear
                      style={{ width: '100%' }}
                    >
                      <Option value="海岛疑云系列SSR单人马口铁徽章">海岛疑云系列SSR单人马口铁徽章</Option>
                      <Option value="GSC粘土人手办">GSC粘土人手办</Option>
                      <Option value="春色然然系列左然生日4.0礼盒">春色然然系列左然生日4.0礼盒</Option>
                      <Option value="岁岁依然系列左然生日5.0亚克力谷美装饰相框set">岁岁依然系列左然生日5.0亚克力谷美装饰相框set</Option>
                    </Select>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div>
                    <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>IP</div>
                    <Select
                      placeholder="请选择"
                      value={filters.ip || undefined}
                      onChange={value => setFilters({ ...filters, ip: value })}
                      allowClear
                      style={{ width: '100%' }}
                    >
                      <Option value="原神">原神</Option>
                      <Option value="未定事件簿">未定事件簿</Option>
                      <Option value="崩坏3">崩坏3</Option>
                      <Option value="崩坏：星穹铁道">崩坏：星穹铁道</Option>
                    </Select>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div>
                    <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>处理人</div>
                    <Input
                      placeholder="请输入域账号/姓名/拼音"
                      value={filters.handler}
                      onChange={e => setFilters({ ...filters, handler: e.target.value })}
                      allowClear
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div>
                    <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>需求提单人</div>
                    <Input
                      placeholder="请输入域账号/姓名/拼音"
                      value={filters.submitter}
                      onChange={e => setFilters({ ...filters, submitter: e.target.value })}
                      allowClear
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div>
                    <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>提交时间</div>
                    <RangePicker
                      placeholder={['开始日期', '结束日期']}
                      style={{ width: '100%' }}
                    />
                  </div>
                </Col>
              </>
            )}
          </Row>
        </Card>

        {/* 数据列表 */}
        <Card>
          {/* Tab 切换 */}
          <div style={{ marginBottom: 16, padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <StatusTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={[
                { key: 'all', label: '全部' },
                { key: 'pending', label: '待配货', count: filteredData.length },
                { key: 'deferred', label: '已暂缓', count: deferredRecords.length },
                { key: 'completed', label: '已完成' },
                { key: 'closed', label: '已关闭' }
              ]}
            />
            <Space>
              {!isBatchDistributeMode && !isBatchImportMode && (
                <>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'batchTransfer',
                          label: '批量转交',
                          disabled: selectedRowKeys.length === 0,
                          onClick: () => {
                            setBatchTransferTarget('');
                            setBatchTransferModalVisible(true);
                          }
                        },
                        {
                          key: 'batchClose',
                          label: '批量关闭',
                          disabled: selectedRowKeys.length === 0,
                          onClick: () => {
                            setBatchCloseReason('');
                            setBatchCloseModalVisible(true);
                          }
                        }
                      ]
                    }}
                    placement="bottomLeft"
                  >
                    <Button
                      type="primary"
                      ghost
                      disabled={selectedRowKeys.length === 0}
                    >
                      ...更多
                    </Button>
                  </Dropdown>
                  <Button
                    type="primary"
                    ghost
                    onClick={() => {
                      setImportStep(1);
                      setUploadedFile(null);
                      setImportModalVisible(true);
                    }}
                  >
                    批量导入
                  </Button>
                </>
              )}
              {isBatchDistributeMode ? (
                <>
                  <Button
                    onClick={() => {
                      setIsBatchDistributeMode(false);
                      setBatchDistributePreview({});
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      // 确认一键配货，更新数据
                      const updatedData = filteredData.map(record => {
                        if (batchDistributePreview[record.id]) {
                          return {
                            ...record,
                            '配货状态': 'completed' as const,
                            '配货明细': batchDistributePreview[record.id].details
                          };
                        }
                        return record;
                      });
                      setFilteredData(updatedData);
                      setData(updatedData);
                      setIsBatchDistributeMode(false);
                      setBatchDistributePreview({});
                      setSelectedRowKeys([]);
                    }}
                  >
                    确认
                  </Button>
                </>
              ) : isBatchImportMode ? (
                <>
                  <Button
                    onClick={() => {
                      setIsBatchImportMode(false);
                      setBatchImportPreview({});
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => {
                      // 确认批量导入，更新数据
                      const updatedData = filteredData.map(record => {
                        if (batchImportPreview[record.id]) {
                          return {
                            ...record,
                            '配货状态': 'completed' as const,
                            '配货明细': batchImportPreview[record.id].details
                          };
                        }
                        return record;
                      });
                      setFilteredData(updatedData);
                      setData(updatedData);
                      setIsBatchImportMode(false);
                      setBatchImportPreview({});
                    }}
                  >
                    确认
                  </Button>
                </>
              ) : (
                <Button
                  type="primary"
                  disabled={selectedRowKeys.length === 0 || activeTab !== 'pending'}
                  onClick={() => {
                    // 模拟一键配货预览
                    const preview: Record<string, any> = {};
                    let successCount = 0;
                    filteredData.forEach(record => {
                      if (selectedRowKeys.includes(record.id)) {
                        // 模拟90%成功率
                        if (Math.random() > 0.1) {
                          successCount++;
                          preview[record.id] = {
                            success: true,
                            details: [
                              { from: '日区001', to: record['领用发出仓'] || '华东月浦', quantity: record['领用数量'] }
                            ]
                          };
                        } else {
                          preview[record.id] = { success: false, reason: '库存不足' };
                        }
                      }
                    });
                    setBatchDistributePreview(preview);
                    setIsBatchDistributeMode(true);
                  }}
                >
                  一键配货
                </Button>
              )}
              <Dropdown
                dropdownRender={() => (
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 4,
                      boxShadow: '0 6px 16px -8px rgba(0,0,0,0.08), 0 9px 28px 0 rgba(0,0,0,0.05), 0 12px 48px 16px rgba(0,0,0,0.03)',
                      padding: '12px 0',
                      width: 280
                    }}
                  >
                    <div style={{ padding: '0 16px 8px', borderBottom: '1px solid #f0f0f0', marginBottom: 8 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>自定义列设置</div>
                      <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>拖拽调整列的顺序</div>
                    </div>
                    <div style={{ maxHeight: 320, overflow: 'auto' }}>
                      {columnOrder.map((columnKey, index) => (
                        <div
                          key={columnKey}
                          draggable
                          onDragStart={() => setDraggedColumn(columnKey)}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedColumn && draggedColumn !== columnKey) {
                              const newOrder = [...columnOrder];
                              const draggedIndex = newOrder.indexOf(draggedColumn);
                              const targetIndex = newOrder.indexOf(columnKey);
                              newOrder.splice(draggedIndex, 1);
                              newOrder.splice(targetIndex, 0, draggedColumn);
                              setColumnOrder(newOrder);
                            }
                            setDraggedColumn(null);
                          }}
                          style={{
                            padding: '8px 16px',
                            borderBottom: index < columnOrder.length - 1 ? '1px solid #f0f0f0' : 'none',
                            background: draggedColumn === columnKey ? '#e6f7ff' : '#fff',
                            cursor: 'move',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}
                        >
                          <DragOutlined style={{ color: '#999', fontSize: 14 }} />
                          <span style={{ fontSize: 13 }}>{columnKey}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '8px 16px 0', borderTop: '1px solid #f0f0f0', marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          message.success('列设置已保存');
                        }}
                      >
                        保存
                      </Button>
                    </div>
                  </div>
                )}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button
                  icon={<SettingOutlined />}
                  style={{ padding: '4px 8px' }}
                />
              </Dropdown>
            </Space>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={paginatedData}
            loading={loading}
            pagination={false}
            scroll={{ x: 3500 }}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys
            }}
            size="middle"
          />
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Pagination
              current={currentPage}
              pageSize={currentPageSize}
              total={currentTabData.length}
              showSizeChanger
              showQuickJumper
              showTotal={(total) => `共 ${total} 条`}
              onChange={(page, size) => {
                setCurrentPage(page);
                if (size) setCurrentPageSize(size);
              }}
              onShowSizeChange={(_, size) => {
                setCurrentPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </Card>

        {/* 配货抽屉 */}
        <Drawer
          title="去配货"
          width={900}
          open={drawerVisible}
          onClose={handleCloseDrawer}
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* 左侧：其他操作 */}
              <Space>
                <span style={{ color: '#666', fontSize: 14 }}>其他操作：</span>
                <Button
                  size="small"
                  onClick={() => {
                    setDrawerVisible(false);
                    if (currentRecord) {
                      setCloseRecord(currentRecord);
                      setCloseReason('');
                      setCloseModalVisible(true);
                    }
                  }}
                >
                  关闭配货
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setDrawerVisible(false);
                    if (currentRecord) {
                      handleOpenDefer(currentRecord);
                    }
                  }}
                >
                  暂缓配货
                </Button>
              </Space>
              {/* 右侧：主要操作 */}
              <Space>
                <Button onClick={handleCloseDrawer}>取消</Button>
                <Button type="primary" onClick={handleSaveDistribute}>
                  保存
                </Button>
              </Space>
            </div>
          }
        >
          {currentRecord && (
            <div>
              {/* 商品信息卡片 - 复用 ProductInfoCard 组件，显示待配货 */}
              <ProductInfoCard record={currentRecord} showPending={true} />

              {/* 配货表单 - 白色背景卡片 */}
              <Card style={{ marginBottom: 16, background: '#fff' }}>
                {/* 配货明细标题 */}
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16, borderLeft: '3px solid #1677ff', paddingLeft: 8 }}>
                    去配货
                  </Text>
                </div>
                <Form form={form} layout="vertical">
                  {/* 配货方式及额外字段行 */}
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <Form.Item
                        label={<><span style={{ color: '#ff4d4f' }}>*</span> 配货方式</>}
                        style={{ marginBottom: 0 }}
                      >
                        <Radio.Group
                          value={distributeMethod}
                          onChange={e => setDistributeMethod(e.target.value)}
                        >
                          <Radio value="transfer">调拨</Radio>
                          <Radio value="purchase">采购</Radio>
                        </Radio.Group>
                      </Form.Item>
                    </Col>
                    {distributeMethod === 'deferred' && (
                      <>
                        <Col span={8}>
                          <Form.Item
                            name="deferredReason"
                            label="暂缓原因"
                            rules={[{ required: true, message: '请选择暂缓原因' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Radio.Group>
                              <Radio value="采购在途">采购在途</Radio>
                              <Radio value="调拨沟通">调拨沟通</Radio>
                            </Radio.Group>
                          </Form.Item>
                        </Col>
                        <Col span={8}>
                          <Form.Item
                            name="deferredExpectedTime"
                            label="预计满足时间"
                            rules={[{ required: true, message: '请选择预计满足时间' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
                          </Form.Item>
                        </Col>
                      </>
                    )}
                  </Row>

                  {/* 统一的配货明细Table */}
                  <div style={{ marginBottom: 16 }}>
                    <Form.Item
                      noStyle
                      shouldUpdate={(prevValues, currentValues) =>
                        prevValues.deferredReason !== currentValues.deferredReason ||
                        prevValues.distributeMethod !== currentValues.distributeMethod
                      }
                    >
                      {({ getFieldValue }) => {
                        const method = distributeMethod;
                        const deferredReason = getFieldValue('deferredReason');
                        const isDeferredRequired = method === 'deferred' && deferredReason === '采购在途';

                        return (
                          <Row style={{ background: '#f5f5f5', padding: '8px 0', marginBottom: 8 }}>
                            <Col span={9} style={{ paddingLeft: 8 }}>
                              <span style={{ color: '#ff4d4f' }}>*</span> 库存满足仓
                            </Col>
                            <Col span={4} style={{ paddingLeft: 8 }}>
                              <span style={{ color: '#ff4d4f' }}>*</span> 配货数量
                            </Col>
                            <Col span={5} style={{ paddingLeft: 8 }}>
                              {isDeferredRequired && <span style={{ color: '#ff4d4f' }}>*</span>} 关联单号
                            </Col>
                            <Col span={4} style={{ paddingLeft: 8 }}>配货状态</Col>
                            {method === 'transfer' && (
                              <Col span={2} style={{ paddingLeft: 8 }}>操作</Col>
                            )}
                          </Row>
                        );
                      }}
                    </Form.Item>
                    
                    {distributeMethod === 'transfer' ? (
                      /* 调拨方式 - 可编辑 */
                      transferDetails.map((item, index) => (
                        <Row key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }} align="middle">
                          <Col span={9} style={{ paddingLeft: 8 }}>
                            <Select
                              value={item.warehouse}
                              onChange={value => {
                                const newDetails = [...transferDetails];
                                newDetails[index].warehouse = value;
                                const selectedWarehouse = warehouseList.find(w => w.name === value);
                                if (selectedWarehouse) {
                                  newDetails[index].availableStock = selectedWarehouse.stock;
                                }
                                setTransferDetails(newDetails);
                              }}
                              style={{ width: '95%' }}
                              optionLabelProp="label"
                              placeholder="请选择"
                            >
                              {warehouseList.map(w => (
                                <Option key={w.name} value={w.name} label={`${w.name}（库存: ${w.stock.toLocaleString()}）`}>
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <span style={{ flex: 1, textAlign: 'left' }}>{w.name}</span>
                                    <span style={{ color: '#999', fontSize: 12, textAlign: 'right' }}>库存: {w.stock.toLocaleString()}</span>
                                  </div>
                                </Option>
                              ))}
                            </Select>
                          </Col>
                          <Col span={4} style={{ paddingLeft: 8 }}>
                            <InputNumber
                              min={1}
                              value={item.quantity}
                              onChange={value => {
                                const newDetails = [...transferDetails];
                                newDetails[index].quantity = value || 1;
                                setTransferDetails(newDetails);
                              }}
                              style={{ width: '90%' }}
                            />
                          </Col>
                          <Col span={5} style={{ paddingLeft: 8 }}>
                            <span style={{ color: '#999' }}>-</span>
                          </Col>
                          <Col span={4} style={{ paddingLeft: 8 }}>
                            <span style={{ color: '#999' }}>待配货</span>
                          </Col>
                          <Col span={2} style={{ paddingLeft: 0, marginLeft: -8 }}>
                            <Button
                              type="link"
                              danger
                              onClick={() => {
                                if (transferDetails.length > 1) {
                                  setTransferDetails(transferDetails.filter((_, i) => i !== index));
                                }
                              }}
                            >
                              删除
                            </Button>
                          </Col>
                        </Row>
                      ))
                    ) : distributeMethod === 'deferred' ? (
                      /* 暂缓配货方式 */
                      <Row style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }} align="middle">
                        <Col span={9} style={{ paddingLeft: 8 }}>
                          <span style={{ color: '#999' }}>-</span>
                        </Col>
                        <Col span={4} style={{ paddingLeft: 8 }}>
                          <Input value={currentRecord['领用数量']} disabled style={{ color: '#333', width: '90%' }} />
                        </Col>
                        <Col span={5} style={{ paddingLeft: 8 }}>
                          <Form.Item
                            noStyle
                            shouldUpdate={(prevValues, currentValues) => prevValues.deferredReason !== currentValues.deferredReason}
                          >
                            {({ getFieldValue }) => {
                              const deferredReason = getFieldValue('deferredReason');
                              return deferredReason === '采购在途' ? (
                                <Form.Item
                                  name="deferredOrderNo"
                                  rules={[{ required: true, message: '请输入需求单号/行号' }]}
                                  style={{ marginBottom: 0 }}
                                >
                                  <Input placeholder="请输入需求单号-行号" style={{ width: '95%' }} />
                                </Form.Item>
                              ) : (
                                <span style={{ color: '#999' }}>-</span>
                              );
                            }}
                          </Form.Item>
                        </Col>
                        <Col span={4} style={{ paddingLeft: 8 }}>
                          <span style={{ color: '#999' }}>待配货</span>
                        </Col>
                      </Row>
                    ) : (
                      /* 采购方式 */
                      <Row style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }} align="middle">
                        <Col span={9} style={{ paddingLeft: 8 }}>
                          <span style={{ color: '#999' }}>-</span>
                        </Col>
                        <Col span={4} style={{ paddingLeft: 8 }}>
                          <Input value={currentRecord['领用数量']} disabled style={{ color: '#333', width: '90%' }} />
                        </Col>
                        <Col span={5} style={{ paddingLeft: 8 }}>
                          <span style={{ color: '#999' }}>-</span>
                        </Col>
                        <Col span={4} style={{ paddingLeft: 8 }}>
                          <span style={{ color: '#999' }}>待配货</span>
                        </Col>
                      </Row>
                    )}
                  </div>

                  {/* 调拨方式 - 添加明细按钮 */}
                  {distributeMethod === 'transfer' && (
                    <div style={{ marginTop: 16, marginBottom: 24 }}>
                      <Button
                        type="primary"
                        ghost
                        onClick={() => {
                          setTransferDetails([
                            ...transferDetails,
                            { id: Date.now().toString(), warehouse: '', availableStock: 0, quantity: 1 }
                          ]);
                        }}
                      >
                        + 添加配货明细
                      </Button>
                    </div>
                  )}

                  {/* 共有字段：领用发出仓、配货说明 */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="outWarehouse"
                        label="领用发出仓"
                        rules={[{ required: true, message: '请选择领用发出仓' }]}
                      >
                        <Select placeholder="请选择">
                          {warehouseList.map(w => (
                            <Option key={w.name} value={w.name}>{w.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="remark"
                        label="配货说明"
                      >
                        <Input.TextArea
                          placeholder="请输入"
                          maxLength={100}
                          showCount={{ formatter: ({ count, maxLength }) => `${count} / ${maxLength}` }}
                          rows={1}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </div>
          )}
        </Drawer>

        {/* 配货暂挂（暂缓配货）抽屉 */}
        <Drawer
          title="配货暂挂"
          width={600}
          open={deferDrawerVisible}
          onClose={handleCloseDeferDrawer}
          footer={
            <Space style={{ float: 'right' }}>
              <Button onClick={handleCloseDeferDrawer}>取消</Button>
              <Button type="primary" onClick={handleSaveDefer}>
                保存
              </Button>
            </Space>
          }
        >
          {deferRecord && (
            <div>
              {/* 商品信息卡片 */}
              <ProductInfoCard record={deferRecord} showPending={true} />

              {/* 暂挂表单 */}
              <Card style={{ marginBottom: 16, background: '#fff' }}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ fontSize: 16, borderLeft: '3px solid #faad14', paddingLeft: 8 }}>
                    暂挂信息
                  </Text>
                </div>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: '#ff4d4f' }}>*</span> 暂缓原因
                      </div>
                      <Radio.Group
                        value={deferReason}
                        onChange={e => setDeferReason(e.target.value)}
                      >
                        <Radio value="采购在途">采购在途</Radio>
                        <Radio value="调拨沟通">调拨沟通</Radio>
                      </Radio.Group>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: '#ff4d4f' }}>*</span> 预计满足时间
                      </div>
                      <DatePicker
                        value={deferExpectedTime ? dayjs(deferExpectedTime) : null}
                        onChange={date => setDeferExpectedTime(date ? date.format('YYYY-MM-DD') : '')}
                        style={{ width: '100%' }}
                        placeholder="请选择日期"
                      />
                    </div>
                  </Col>
                </Row>
                {/* 选择采购在途时显示关联单号输入框 */}
                {deferReason === '采购在途' && (
                  <Row gutter={16}>
                    <Col span={24}>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: '#ff4d4f' }}>*</span> 关联单号
                        </div>
                        <Input
                          value={deferOrderNo}
                          onChange={e => setDeferOrderNo(e.target.value)}
                          placeholder="请输入采购需求单号-行号"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </Col>
                  </Row>
                )}
                <Row gutter={16}>
                  <Col span={24}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>配货说明</div>
                      <Input.TextArea
                        value={deferRemark}
                        onChange={e => setDeferRemark(e.target.value)}
                        rows={2}
                        maxLength={100}
                        showCount
                        placeholder="请输入"
                        style={{ resize: 'none' }}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>
          )}
        </Drawer>

        {/* 批量导入弹窗 */}
        <Modal
          title="导入配货明细"
          open={importModalVisible}
          onCancel={() => setImportModalVisible(false)}
          width={600}
          footer={
            <Space>
              <Button onClick={() => setImportModalVisible(false)}>取消</Button>
              <Button
                type="primary"
                disabled={!uploadedFile}
                onClick={() => {
                  // 模拟批量导入预览 - 为当前筛选出的待配货记录生成预览
                  const preview: Record<string, any> = {};
                  const methods = ['transfer', 'purchase', 'deferred', 'pending'];
                  const warehouses = ['日区001', '日区002', '华南深圳', '华北北京'];
                  
                  filteredData.forEach((record, index) => {
                    if (!record['配货状态'] || record['配货状态'] === 'pending') {
                      // 根据索引分配不同的配货方式，确保展示多样性（包括待配货）
                      const method = methods[index % methods.length];
                      const fromWarehouse = warehouses[index % warehouses.length];
                      
                      // 待配货情况 - 用户未填写配货信息
                      if (method === 'pending') {
                        preview[record.id] = {
                          success: false,
                          method: 'pending',
                          reason: '未填写配货信息'
                        };
                      } else {
                        preview[record.id] = {
                          success: true,
                          method: method,
                          details: [
                            { 
                              from: method === 'purchase' ? '供应商001' : fromWarehouse, 
                              to: record['领用发出仓'] || '华东月浦', 
                              quantity: record['领用数量'] 
                            }
                          ]
                        };
                      }
                    }
                  });
                  setBatchImportPreview(preview);
                  setIsBatchImportMode(true);
                  setImportModalVisible(false);
                  setUploadedFile(null);
                }}
              >
                下一步
              </Button>
            </Space>
          }
        >
          <div style={{ padding: '16px 0 32px 0' }}>
            {/* 步骤1：下载模板 */}
            <div style={{ display: 'flex', marginBottom: 24 }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#1677ff',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                marginRight: 12,
                flexShrink: 0
              }}>
                1
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>下载模板文件</div>
                  <div style={{ color: '#999', fontSize: 12 }}>请按照模板说明填写</div>
                </div>
                <Button type="primary" ghost>
                  下载导入模板
                </Button>
              </div>
            </div>

            {/* 连接线 */}
            <div style={{
              width: 2,
              height: 24,
              background: '#e8e8e8',
              marginLeft: 11,
              marginBottom: 0
            }} />

            {/* 步骤2：上传文件 */}
            <div style={{ display: 'flex' }}>
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#1677ff',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                marginRight: 12,
                flexShrink: 0
              }}>
                2
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>上传填写好的模板文件</div>
                <Upload.Dragger
                  accept=".xls,.xlsx,.xlsm"
                  beforeUpload={(file) => {
                    setUploadedFile(file);
                    return false;
                  }}
                  onRemove={() => setUploadedFile(null)}
                  fileList={uploadedFile ? [uploadedFile as any] : []}
                  style={{
                    background: '#fafafa',
                    border: '1px dashed #d9d9d9',
                    borderRadius: 8,
                    maxWidth: '100%'
                  }}
                  className="batch-import-upload"
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined style={{ fontSize: 48, color: '#1677ff' }} />
                  </p>
                  <p className="ant-upload-text" style={{ color: '#666' }}>
                    点击或将文件拖拽到这里上传
                  </p>
                  <p className="ant-upload-hint" style={{ color: '#999', fontSize: 12 }}>
                    支持上传.xls, .xlsx, .xlsm格式
                  </p>
                </Upload.Dragger>
              </div>
            </div>
          </div>
        </Modal>

        {/* 附件查看弹窗 */}
        <Modal
          title="附件列表"
          open={attachmentModalVisible}
          onCancel={() => setAttachmentModalVisible(false)}
          footer={
            <Button onClick={() => setAttachmentModalVisible(false)}>
              关闭
            </Button>
          }
          width={600}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '16px 0' }}>
            {currentAttachments.map((attachment, index) => (
              <div
                key={index}
                style={{
                  width: 120,
                  cursor: 'pointer',
                  border: '1px solid #e8e8e8',
                  borderRadius: 8,
                  overflow: 'hidden',
                  transition: 'box-shadow 0.3s'
                }}
                onClick={() => window.open(attachment.url, '_blank')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ width: 120, height: 120, background: '#f5f5f5' }}>
                  <img
                    src={attachment.thumbnail}
                    alt={attachment.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ padding: 8, fontSize: 12, color: '#666', textAlign: 'center' }}>
                  {attachment.name}
                </div>
              </div>
            ))}
          </div>
        </Modal>

        {/* 关闭配货弹窗 */}
        <Modal
          title="关闭配货"
          open={closeModalVisible}
          onCancel={() => setCloseModalVisible(false)}
          destroyOnClose
          footer={
            <Space>
              <Button onClick={() => setCloseModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                danger
                disabled={!closeReason.trim()}
                onClick={() => {
                  console.log('关闭配货:', closeRecord, '原因:', closeReason);
                  setCloseModalVisible(false);
                  setCloseRecord(null);
                  setCloseReason('');
                }}
              >
                关闭
              </Button>
            </Space>
          }
          width={560}
        >
          {closeRecord && (
            <div style={{ padding: '16px 0' }}>
              {/* 警告提示 */}
              <div style={{
                background: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: 4,
                padding: 12,
                marginBottom: 24
              }}>
                <div style={{ color: '#ff4d4f', fontWeight: 500, marginBottom: 8 }}>
                  关闭后，需求行将无法继续配货。请确认已与需求人沟通，并提醒通过"我的需求单"查询关闭原因。该操作不可逆，请谨慎操作！
                </div>
              </div>

              {/* 需求信息 */}
              <div style={{ marginBottom: 24 }}>
                <Row gutter={[24, 16]}>
                  <Col span={12}>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>需求单</div>
                    <div style={{ fontWeight: 500 }}>{closeRecord['需求单号-行号']}</div>
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>实际申请人</div>
                    <div style={{ fontWeight: 500 }}>{closeRecord['发放处理人']}</div>
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>配货数量</div>
                    <div style={{ fontWeight: 500 }}>{closeRecord['领用数量']}</div>
                  </Col>
                </Row>
              </div>

              {/* 关闭原因 */}
              <div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#ff4d4f' }}>*</span>
                  <span style={{ color: '#333', fontWeight: 500 }}>关闭原因</span>
                </div>
                <Input.TextArea
                  placeholder="请输入关闭原因"
                  value={closeReason}
                  onChange={e => setCloseReason(e.target.value)}
                  maxLength={500}
                  showCount={{ formatter: ({ count, maxLength }) => `${count} / ${maxLength}` }}
                  rows={4}
                />
              </div>
            </div>
          )}
        </Modal>

        {/* 转交弹窗 */}
        <Modal
          title="转交"
          open={transferModalVisible}
          onCancel={() => setTransferModalVisible(false)}
          footer={
            <Space>
              <Button onClick={() => setTransferModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                disabled={!transferTarget.trim()}
                onClick={() => {
                  console.log('转交:', transferRecord, '转交对象:', transferTarget);
                  setTransferModalVisible(false);
                  setTransferRecord(null);
                  setTransferTarget('');
                }}
              >
                确认
              </Button>
            </Space>
          }
          width={560}
        >
          {transferRecord && (
            <div style={{ padding: '16px 0' }}>
              {/* 副标题 */}
              <div style={{ color: '#666', marginBottom: 24 }}>
                转交后，需求行会移至转交对象的待办。
              </div>

              {/* 需求信息 */}
              <div style={{ marginBottom: 24 }}>
                <Row gutter={[24, 16]}>
                  <Col span={12}>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>需求单</div>
                    <div style={{ fontWeight: 500 }}>{transferRecord['需求单号-行号']}</div>
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>实际申请人</div>
                    <div style={{ fontWeight: 500 }}>{transferRecord['发放处理人']}</div>
                  </Col>
                  <Col span={12}>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>配货数量</div>
                    <div style={{ fontWeight: 500 }}>{transferRecord['领用数量']}</div>
                  </Col>
                </Row>
              </div>

              {/* 转出人 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>转出人</div>
                <div style={{ fontWeight: 500 }}>张三(san.zhang)</div>
              </div>

              {/* 转交对象 */}
              <div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#ff4d4f' }}>*</span>
                  <span style={{ color: '#333', fontWeight: 500 }}>转交对象</span>
                </div>
                <Input
                  placeholder="请输入域账号/拼音/名字"
                  value={transferTarget}
                  onChange={e => setTransferTarget(e.target.value)}
                />
              </div>
            </div>
          )}
        </Modal>

        {/* 查看操作记录抽屉 */}
        <Drawer
          title="操作记录"
          open={viewDetailModalVisible}
          onClose={() => {
            setViewDetailModalVisible(false);
          }}
          width={900}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setViewDetailModalVisible(false);
              }}>
                关闭
              </Button>
            </div>
          }
        >
          {viewDetailRecord && (
            <div>
              {/* 模块1：单品信息 - 复用 ProductInfoCard 组件，隐藏待配货 */}
              <ProductInfoCard record={viewDetailRecord} showPending={false} />

              {/* 操作记录 */}
              <Card style={{ background: '#fff' }}>
                <Table
                  dataSource={[
                    {
                      key: '1',
                      operator: '张三(san.zhang)',
                      action: '去调拨',
                      time: '2026-02-09 16:43',
                      description: [
                        '库存满足仓：日区仓001',
                        '领用发出仓：华东月浦-国际化仓',
                        '配货数量：10',
                        `配货单号：${viewDetailRecord?.['配货单号'] || 'DN260120000200'}`
                      ]
                    },
                    {
                      key: '2',
                      operator: '张三(san.zhang)',
                      action: '转交',
                      time: '2026-02-09 14:20',
                      description: ['张三(san.zhang) 转交给 李四(li.si)']
                    },
                    {
                      key: '3',
                      operator: '王五(wu.wang)',
                      action: '暂缓配货',
                      time: '2026-02-09 11:30',
                      description: [
                        '暂缓原因：采购在途',
                        '预计满足时间：2026-03-15',
                        '关联单号：PR260211000345-1'
                      ]
                    },
                    {
                      key: '4',
                      operator: '赵六(liu.zhao)',
                      action: '去采购',
                      time: '2026-02-08 16:20',
                      description: [
                        '领用发出仓：华东月浦-国际化仓',
                        '配货数量：10',
                        `配货单号：${viewDetailRecord?.['配货单号'] || 'DN260120000200'}`
                      ]
                    },
                    {
                      key: '5',
                      operator: '李四(li.si)',
                      action: '关闭配货',
                      time: '2026-02-08 10:15',
                      description: ['关闭原因：库存不足，无法完成配货需求']
                    },
                    {
                      key: '6',
                      operator: '张三(san.zhang)',
                      action: '创建采购需求单',
                      time: '2026-02-07 09:30',
                      description: [
                        '采购PR单：PR260211000345-1',
                        '库存满足仓：日区仓001',
                        '采购数量：10'
                      ]
                    }
                  ]}
                  columns={[
                    {
                      title: '操作人',
                      dataIndex: 'operator',
                      key: 'operator',
                      width: 140
                    },
                    {
                      title: '操作',
                      dataIndex: 'action',
                      key: 'action',
                      width: 100,
                      render: (action: string) => (
                        <Tag color={
                          action === '调拨' ? 'green' :
                          action === '转交' ? 'blue' :
                          action === '暂缓配货' ? 'orange' :
                          action === '采购' ? 'blue' :
                          action === '关闭配货' ? 'red' : 'default'
                        }>
                          {action}
                        </Tag>
                      )
                    },
                    {
                      title: '操作时间',
                      dataIndex: 'time',
                      key: 'time',
                      width: 140
                    },
                    {
                      title: '说明',
                      dataIndex: 'description',
                      key: 'description',
                      render: (description: string[]) => (
                        <div>
                          {description.map((line, index) => {
                            // 检查是否是配货单号行
                            if (line.startsWith('配货单号：')) {
                              const orderNo = line.replace('配货单号：', '');
                              return (
                                <div key={index} style={{ marginBottom: index < description.length - 1 ? 4 : 0 }}>
                                  配货单号：
                                  <a
                                    href={`/pages/my-distribution-order?orderNo=${orderNo}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: '#1677ff' }}
                                  >
                                    {orderNo}
                                  </a>
                                </div>
                              );
                            }
                            return (
                              <div key={index} style={{ marginBottom: index < description.length - 1 ? 4 : 0 }}>
                                {line}
                              </div>
                            );
                          })}
                        </div>
                      )
                    }
                  ]}
                  pagination={false}
                  size="small"
                  bordered
                />
              </Card>
            </div>
          )}
        </Drawer>

        {/* 查看操作记录抽屉 */}
        <Drawer
          title="操作记录"
          open={operationLogVisible}
          onClose={() => setOperationLogVisible(false)}
          width={800}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={() => setOperationLogVisible(false)}>
                关闭
              </Button>
            </div>
          }
        >
          {operationLogRecord && (
            <div>
              {/* 需求单信息 - 复用 ProductInfoCard 组件 */}
              <ProductInfoCard record={operationLogRecord} showPending={false} />

              {/* 操作记录列表 - 使用Table展示 */}
              <div>
                <div style={{ marginBottom: 16, fontWeight: 500, fontSize: 14 }}>操作记录</div>
                <Table
                  dataSource={[
                    {
                      key: '1',
                      operator: '张三(san.zhang)',
                      action: '去调拨',
                      time: '2026-02-09 16:43',
                      description: [
                        '库存满足仓：日区仓001',
                        '领用发出仓：华东月浦-国际化仓',
                        '配货数量：10'
                      ]
                    },
                    {
                      key: '2',
                      operator: '张三(san.zhang)',
                      action: '转交',
                      time: '2026-02-09 14:20',
                      description: ['张三(san.zhang) 转交给 李四(li.si)']
                    },
                    {
                      key: '3',
                      operator: '王五(wu.wang)',
                      action: '暂缓配货',
                      time: '2026-02-09 11:30',
                      description: [
                        '暂缓原因：采购在途',
                        '预计满足时间：2026-03-15',
                        '关联单号：PR260211000345-1'
                      ]
                    },
                    {
                      key: '4',
                      operator: '赵六(liu.zhao)',
                      action: '去采购',
                      time: '2026-02-08 16:20',
                      description: [
                        '领用发出仓：华东月浦-国际化仓',
                        '配货数量：10'
                      ]
                    },
                    {
                      key: '5',
                      operator: '李四(li.si)',
                      action: '关闭配货',
                      time: '2026-02-08 10:15',
                      description: ['关闭原因：库存不足，无法完成配货需求']
                    },
                    {
                      key: '6',
                      operator: '张三(san.zhang)',
                      action: '创建采购需求单',
                      time: '2026-02-07 09:30',
                      description: [
                        '采购PR单：PR260211000345-1',
                        '库存满足仓：日区仓001',
                        '采购数量：10'
                      ]
                    }
                  ]}
                  columns={[
                    {
                      title: '操作人',
                      dataIndex: 'operator',
                      key: 'operator',
                      width: 140
                    },
                    {
                      title: '操作',
                      dataIndex: 'action',
                      key: 'action',
                      width: 100,
                      render: (action: string) => (
                        <Tag color={
                          action === '调拨' ? 'green' :
                          action === '转交' ? 'blue' :
                          action === '暂缓配货' ? 'orange' :
                          action === '采购' ? 'blue' :
                          action === '关闭配货' ? 'red' :
                          action === '创建采购需求单' ? 'purple' : 'default'
                        }>
                          {action}
                        </Tag>
                      )
                    },
                    {
                      title: '操作时间',
                      dataIndex: 'time',
                      key: 'time',
                      width: 140
                    },
                    {
                      title: '说明',
                      dataIndex: 'description',
                      key: 'description',
                      render: (description: string[]) => (
                        <div>
                          {description.map((line, index) => (
                            <div key={index} style={{ marginBottom: index < description.length - 1 ? 4 : 0 }}>
                              {line}
                            </div>
                          ))}
                        </div>
                      )
                    }
                  ]}
                  pagination={false}
                  size="small"
                  bordered
                />
              </div>
            </div>
          )}
        </Drawer>

        {/* 批量转交弹窗 */}
        <Modal
          title="批量转交"
          open={batchTransferModalVisible}
          onCancel={() => setBatchTransferModalVisible(false)}
          footer={
            <Space>
              <Button onClick={() => setBatchTransferModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                disabled={!batchTransferTarget.trim()}
                onClick={() => {
                  console.log('批量转交:', selectedRowKeys, '转交对象:', batchTransferTarget);
                  setBatchTransferModalVisible(false);
                  setBatchTransferTarget('');
                }}
              >
                确认
              </Button>
            </Space>
          }
          width={560}
        >
          <div style={{ padding: '16px 0' }}>
            {/* 副标题 */}
            <div style={{ color: '#666', marginBottom: 24 }}>
              转交后，选中的 {selectedRowKeys.length} 条需求行会移至转交对象的待办。
            </div>

            {/* 转出人 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>转出人</div>
              <div style={{ fontWeight: 500 }}>张三(san.zhang)</div>
            </div>

            {/* 转交对象 */}
            <div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#ff4d4f' }}>*</span>
                <span style={{ color: '#333', fontWeight: 500 }}>转交对象</span>
              </div>
              <Input
                placeholder="请输入域账号/拼音/名字"
                value={batchTransferTarget}
                onChange={e => setBatchTransferTarget(e.target.value)}
              />
            </div>
          </div>
        </Modal>

        {/* 批量关闭弹窗 */}
        <Modal
          title="批量关闭"
          open={batchCloseModalVisible}
          onCancel={() => setBatchCloseModalVisible(false)}
          destroyOnClose
          footer={
            <Space>
              <Button onClick={() => setBatchCloseModalVisible(false)}>
                取消
              </Button>
              <Button
                type="primary"
                danger
                disabled={!batchCloseReason.trim()}
                onClick={() => {
                  console.log('批量关闭:', selectedRowKeys, '原因:', batchCloseReason);
                  setBatchCloseModalVisible(false);
                  setBatchCloseReason('');
                }}
              >
                关闭
              </Button>
            </Space>
          }
          width={560}
        >
          <div style={{ padding: '16px 0' }}>
            {/* 警告提示 */}
            <div style={{
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: 4,
              padding: 12,
              marginBottom: 24
            }}>
              <div style={{ color: '#ff4d4f', fontWeight: 500, marginBottom: 8 }}>
                关闭后，选中的 {selectedRowKeys.length} 条需求行将无法继续配货。请确认已与需求人沟通，并提醒通过"我的需求单"查询关闭原因。该操作不可逆，请谨慎操作！
              </div>
            </div>

            {/* 关闭原因 */}
            <div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: '#ff4d4f' }}>*</span>
                <span style={{ color: '#333', fontWeight: 500 }}>关闭原因</span>
              </div>
              <Input.TextArea
                placeholder="请输入关闭原因"
                value={batchCloseReason}
                onChange={e => setBatchCloseReason(e.target.value)}
                maxLength={500}
                showCount={{ formatter: ({ count, maxLength }) => `${count} / ${maxLength}` }}
                rows={4}
              />
            </div>
          </div>
        </Modal>

        </Layout.Content>
      </Layout>
    </Layout>
  );
});

export default Component;
