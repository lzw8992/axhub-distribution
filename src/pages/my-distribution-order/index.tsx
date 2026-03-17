/**
 * @name 我的配货单
 *
 * 参考资料：
 * - /rules/development-standards.md
 * - /src/themes/antd-new/designToken.json (Ant Design 主题)
 * - /assets/libraries/antd.md (Ant Design 组件库)
 * - /assets/database/03.我的配货单.json
 */

import './style.css';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Layout,
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Drawer,
  Row,
  Col,
  Typography,
  Badge,
  Breadcrumb,
  Select
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  HomeOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';

import SideMenu from '../../elements/side-menu';
import { distributionMenuItems, handleDistributionMenuSelect } from '../distribution-menu-config';

const { Title, Text } = Typography;

// 配货单数据类型
interface DistributionOrder {
  id: string;
  '配货单号': string;
  '需求单号-行号': string;
  '单品国标码': number;
  '配货数量': number;
  '配货方式': string;
  '库存满足仓': string;
  '领用发出仓': string;
  '配货状态': string;
  '配货说明': string;
  '关联单号': string;
  '创建人': string;
  '创建时间': string;
}

// 模拟数据
const mockData: DistributionOrder[] = [
  {
    id: '6aa67ef7-4643-4aa9-bbce-7b91daa17f89',
    '配货单号': 'DN260120000200',
    '需求单号-行号': 'PR260211000350-1',
    '单品国标码': 6980000000003,
    '配货数量': 10,
    '配货方式': '采购',
    '库存满足仓': '-',
    '领用发出仓': '华东月浦-国际化仓',
    '配货状态': '采购中',
    '配货说明': '这是一段配货说明',
    '关联单号': 'PR260211000350-1',
    '创建人': '张三(san.zhang)',
    '创建时间': '2026-02-02 09:09'
  },
  {
    id: '14db2102-080b-477a-ab3f-3a51deb509c8',
    '配货单号': 'DN260120000201',
    '需求单号-行号': 'PR260211000350-2',
    '单品国标码': 6980000000004,
    '配货数量': 20,
    '配货方式': '调拨',
    '库存满足仓': '日区仓001',
    '领用发出仓': '华东月浦-国际化仓',
    '配货状态': '调拨中',
    '配货说明': '这是一段配货说明',
    '关联单号': 'TO260309000010',
    '创建人': '李四(li.si)',
    '创建时间': '2026-02-03 10:15'
  },
  {
    id: '00f12931-84ed-4dbd-a9d2-11ecda59abbd',
    '配货单号': 'DN260120000202',
    '需求单号-行号': 'PR260211000350-1',
    '单品国标码': 6980000000003,
    '配货数量': 30,
    '配货方式': '采购',
    '库存满足仓': '-',
    '领用发出仓': '华东月浦-国际化仓',
    '配货状态': '配货完成',
    '配货说明': '这是一段配货说明',
    '关联单号': 'PR260211000350-2',
    '创建人': '王五(wu.wang)',
    '创建时间': '2026-02-04 14:30'
  },
  {
    id: '7cb26d7b-cab7-43e7-927f-04958ab4aea4',
    '配货单号': 'DN260120000203',
    '需求单号-行号': 'PR260211000350-2',
    '单品国标码': 6980000000004,
    '配货数量': 40,
    '配货方式': '调拨',
    '库存满足仓': '日区仓001',
    '领用发出仓': '华东月浦-国际化仓',
    '配货状态': '已关闭',
    '配货说明': '这是一段配货说明',
    '关联单号': 'TO260309000011',
    '创建人': '赵六(liu.zhao)',
    '创建时间': '2026-02-05 16:45'
  }
];

// 状态配置
const statusConfig: Record<string, { color: string; label: string }> = {
  '采购中': { color: 'processing', label: '采购中' },
  '调拨中': { color: 'warning', label: '调拨中' },
  '配货完成': { color: 'success', label: '配货完成' },
  '已关闭': { color: 'default', label: '已关闭' }
};

const { Option } = Select;

const Component = function MyDistributionOrder() {
  const [activeTab, setActiveTab] = useState('all');
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DistributionOrder | null>(null);

  // 筛选条件状态
  const [filters, setFilters] = useState({
    orderNo: '',
    requirementNo: '',
    productCode: '',
    method: undefined as string | undefined,
    stockWarehouse: '',
    issueWarehouse: '',
    relatedOrderNo: ''
  });

  // 从URL参数读取配货单号并自动打开详情
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderNoFromUrl = urlParams.get('orderNo');

    if (orderNoFromUrl) {
      // 设置筛选条件
      setFilters(prev => ({
        ...prev,
        orderNo: orderNoFromUrl
      }));

      // 查找对应的配货单并自动打开详情
      const targetOrder = mockData.find(item => item['配货单号'] === orderNoFromUrl);
      if (targetOrder) {
        setSelectedOrder(targetOrder);
        setDetailVisible(true);
      }
    }
  }, []);

  // 筛选后的数据
  const filteredData = useMemo(() => {
    let result = mockData;

    // 按状态筛选
    if (activeTab !== 'all') {
      const statusMap: Record<string, string> = {
        'purchasing': '采购中',
        'transferring': '调拨中',
        'completed': '配货完成',
        'closed': '已关闭'
      };
      result = result.filter(item => item['配货状态'] === statusMap[activeTab]);
    }

    // 按配货单号筛选
    if (filters.orderNo) {
      result = result.filter(item =>
        item['配货单号'].toLowerCase().includes(filters.orderNo.toLowerCase())
      );
    }

    // 按需求单号-行号筛选
    if (filters.requirementNo) {
      result = result.filter(item =>
        item['需求单号-行号'].toLowerCase().includes(filters.requirementNo.toLowerCase())
      );
    }

    // 按单品国标码筛选
    if (filters.productCode) {
      result = result.filter(item =>
        item['单品国标码'].toString().includes(filters.productCode)
      );
    }

    // 按配货方式筛选
    if (filters.method) {
      result = result.filter(item => item['配货方式'] === filters.method);
    }

    // 按库存满足仓筛选
    if (filters.stockWarehouse) {
      result = result.filter(item =>
        item['库存满足仓'].toLowerCase().includes(filters.stockWarehouse.toLowerCase())
      );
    }

    // 按领用发出仓筛选
    if (filters.issueWarehouse) {
      result = result.filter(item =>
        item['领用发出仓'].toLowerCase().includes(filters.issueWarehouse.toLowerCase())
      );
    }

    // 按关联单号筛选
    if (filters.relatedOrderNo) {
      result = result.filter(item =>
        item['关联单号'].toLowerCase().includes(filters.relatedOrderNo.toLowerCase())
      );
    }

    return result;
  }, [activeTab, filters]);

  // 重置筛选
  const handleReset = () => {
    setFilters({
      orderNo: '',
      requirementNo: '',
      productCode: '',
      method: undefined,
      stockWarehouse: '',
      issueWarehouse: '',
      relatedOrderNo: ''
    });
    setActiveTab('all');
  };



  // 打开详情
  const handleViewDetail = (record: DistributionOrder) => {
    setSelectedOrder(record);
    setDetailVisible(true);
  };

  // 表格列定义
  const columns = [
    {
      title: '配货单号',
      dataIndex: '配货单号',
      key: '配货单号',
      width: 130,
      render: (text: string, record: DistributionOrder) => (
        <span
          style={{ color: '#1677ff', cursor: 'pointer', fontWeight: 500 }}
          onClick={() => handleViewDetail(record)}
        >
          {text}
        </span>
      )
    },
    {
      title: '需求单号-行号',
      dataIndex: '需求单号-行号',
      key: '需求单号-行号',
      width: 140,
      render: (text: string) => (
        <span
          style={{ color: '#1677ff', cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' }}
          onClick={() => {
            // 跳转到需求申请页面
            window.open(`/pages/requirement-detail?orderNo=${text}`, '_blank');
          }}
        >
          {text}
        </span>
      )
    },
    {
      title: '单品国标码',
      dataIndex: '单品国标码',
      key: '单品国标码',
      width: 120
    },
    {
      title: '配货数量',
      dataIndex: '配货数量',
      key: '配货数量',
      width: 120,
      align: 'center' as const
    },
    {
      title: '配货方式',
      dataIndex: '配货方式',
      key: '配货方式',
      width: 100,
      align: 'center' as const,
      render: (text: string) => (
        <Tag color={text === '采购' ? 'blue' : 'purple'}>{text}</Tag>
      )
    },
    {
      title: '库存满足仓',
      dataIndex: '库存满足仓',
      key: '库存满足仓',
      width: 150,
      render: (text: string) => text || '-'
    },
    {
      title: '领用发出仓',
      dataIndex: '领用发出仓',
      key: '领用发出仓',
      width: 140,
      render: (text: string) => (
        <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
      )
    },
    {
      title: '配货状态',
      dataIndex: '配货状态',
      key: '配货状态',
      width: 140,
      align: 'left' as const,
      render: (status: string) => {
        const config = statusConfig[status] || { color: 'default', label: status };
        return <Badge status={config.color as any} text={config.label} />;
      }
    },
    {
      title: '关联单号',
      dataIndex: '关联单号',
      key: '关联单号',
      width: 140,
      render: (text: string) => {
        // 根据单号前缀判断跳转类型
        const handleClick = () => {
          if (text.startsWith('TO')) {
            // 调拨单
            window.open(`/pages/transfer-order?orderNo=${text}`, '_blank');
          } else if (text.startsWith('PR')) {
            // 采购需求单
            window.open(`/pages/requirement-detail?orderNo=${text}`, '_blank');
          } else {
            // 其他类型，默认跳转
            window.open(`/pages/order-detail?orderNo=${text}`, '_blank');
          }
        };

        return (
          <span
            style={{
              color: '#1677ff',
              cursor: 'pointer',
              fontWeight: 500,
              textDecoration: 'underline',
              whiteSpace: 'nowrap'
            }}
            onClick={handleClick}
          >
            {text}
          </span>
        );
      }
    },
    {
      title: '创建人',
      dataIndex: '创建人',
      key: '创建人',
      width: 130,
      render: (text: string) => (
        <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
      )
    },
    {
      title: '创建时间',
      dataIndex: '创建时间',
      key: '创建时间',
      width: 135,
      render: (text: string) => (
        <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
      )
    }
  ];



  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <SideMenu
        title="Neone"
        defaultSelectedKey="my_distribution_order"
        items={distributionMenuItems}
        onMenuSelect={handleDistributionMenuSelect}
      />
      <Layout style={{ background: '#f5f5f5' }}>
        <Layout.Content style={{ padding: 24 }}>
        {/* 面包屑导航 */}
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item>
            <HomeOutlined /> 配货管理
          </Breadcrumb.Item>
          <Breadcrumb.Item>我的配货单</Breadcrumb.Item>
        </Breadcrumb>

        {/* 筛选模块 */}
        <Card style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                我的配货单
              </Title>
            </Col>
            <Col>
              <Space>
                <Button onClick={handleReset}>
                  还原
                </Button>
                <Button type="primary" ghost onClick={() => {}}>
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
                <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>配货单号</div>
                <Input
                  placeholder="请输入配货单号"
                  value={filters.orderNo}
                  onChange={e => setFilters({ ...filters, orderNo: e.target.value })}
                  allowClear
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div>
                <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>需求单号-行号</div>
                <Input
                  placeholder="请输入需求单号-行号"
                  value={filters.requirementNo}
                  onChange={e => setFilters({ ...filters, requirementNo: e.target.value })}
                  allowClear
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div>
                <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>单品国标码</div>
                <Input
                  placeholder="请输入单品国标码"
                  value={filters.productCode}
                  onChange={e => setFilters({ ...filters, productCode: e.target.value })}
                  allowClear
                />
              </div>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <div>
                <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>配货方式</div>
                <Select
                  placeholder="请选择"
                  value={filters.method}
                  onChange={value => setFilters({ ...filters, method: value })}
                  allowClear
                  style={{ width: '100%' }}
                >
                  <Option value="采购">采购</Option>
                  <Option value="调拨">调拨</Option>
                </Select>
              </div>
            </Col>
            {filterExpanded && (
              <>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div>
                    <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>库存满足仓</div>
                    <Input
                      placeholder="请输入库存满足仓"
                      value={filters.stockWarehouse}
                      onChange={e => setFilters({ ...filters, stockWarehouse: e.target.value })}
                      allowClear
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div>
                    <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>领用发出仓</div>
                    <Input
                      placeholder="请输入领用发出仓"
                      value={filters.issueWarehouse}
                      onChange={e => setFilters({ ...filters, issueWarehouse: e.target.value })}
                      allowClear
                    />
                  </div>
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div>
                    <div style={{ marginBottom: 8, color: '#666', fontSize: 14 }}>关联单号</div>
                    <Input
                      placeholder="请输入关联单号"
                      value={filters.relatedOrderNo}
                      onChange={e => setFilters({ ...filters, relatedOrderNo: e.target.value })}
                      allowClear
                    />
                  </div>
                </Col>
              </>
            )}
          </Row>

        </Card>

        {/* 列表区域 */}
        <Card>
          {/* Tab 切换 */}
          <div style={{ marginBottom: 16, padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              {
                [
                  { key: 'all', label: '全部' },
                  { key: 'purchasing', label: '采购中', count: mockData.filter(item => item['配货状态'] === '采购中').length },
                  { key: 'transferring', label: '调拨中', count: mockData.filter(item => item['配货状态'] === '调拨中').length },
                  { key: 'completed', label: '配货完成', count: mockData.filter(item => item['配货状态'] === '配货完成').length },
                  { key: 'closed', label: '已关闭', count: mockData.filter(item => item['配货状态'] === '已关闭').length }
                ].map(tab => (
                  <div
                    key={tab.key}
                    style={{
                      padding: '4px 8px',
                      cursor: 'pointer',
                      border: activeTab === tab.key ? '1px solid #1677ff' : '1px solid transparent',
                      borderRadius: 4,
                      background: activeTab === tab.key ? '#e6f7ff' : 'transparent',
                      color: activeTab === tab.key ? '#1677ff' : '#666',
                      fontWeight: activeTab === tab.key ? 500 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <span>({tab.count})</span>
                    )}
                  </div>
                ))
              }
            </div>
          </div>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
            scroll={{ x: 1315 }}
            size="middle"
          />
        </Card>

        {/* 详情抽屉 */}
        <Drawer
          title="配货单详情"
          placement="right"
          width={800}
          onClose={() => setDetailVisible(false)}
          open={detailVisible}
        >
          {selectedOrder && (
            <Space direction="vertical" style={{ width: '100%', padding: '0 16px' }} size={24}>
              {/* 单品信息 */}
              <Card style={{ width: '100%' }}>
                <Row gutter={[16, 16]} align="top">
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
                        <svg viewBox="0 0 1024 1024" focusable="false" width="24" height="24" fill="#1677ff" aria-hidden="true">
                          <path d="M922.9 701.9H327.4l29.9-60.9 496.8-.9c16.8 0 31.2-12 34.2-28.6l68.8-385.1c1.8-10.1-.9-20.5-7.5-28.4a34.99 34.99 0 00-26.6-12.5l-632-2.1-5.4-25.4c-3.4-16.2-18-28-34.6-28H96.5a35.3 35.3 0 100 70.6h125.9L246 312.8l58.1 281.3-74.8 122.1a34.96 34.96 0 00-3 36.8c6 11.9 18.1 19.4 31.5 19.4h62.8a102.43 102.43 0 00-20.6 61.7c0 56.6 46 102.6 102.6 102.6s102.6-46 102.6-102.6c0-22.3-7.4-44-20.6-61.7h161.1a102.43 102.43 0 00-20.6 61.7c0 56.6 46 102.6 102.6 102.6s102.6-46 102.6-102.6c0-22.3-7.4-44-20.6-61.7H923c19.4 0 35.3-15.8 35.3-35.3a35.42 35.42 0 00-35.4-35.2zM305.7 253l575.8 1.9-56.4 315.8-452.3.8L305.7 253zm96.9 612.7c-17.4 0-31.6-14.2-31.6-31.6 0-17.4 14.2-31.6 31.6-31.6s31.6 14.2 31.6 31.6a31.6 31.6 0 01-31.6 31.6zm325.1 0c-17.4 0-31.6-14.2-31.6-31.6 0-17.4 14.2-31.6 31.6-31.6s31.6 14.2 31.6 31.6a31.6 31.6 0 01-31.6 31.6z"></path>
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>周边&gt;挂摆印刷&gt;马口铁&gt;马口铁徽章</div>
                        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '20px' }}>
                          周边|事件簿|左然|挂件摆件|金属徽章|示例商品-{selectedOrder['配货状态']}
                        </div>
                        <div style={{ color: '#999', fontSize: 12 }}>国标码: {selectedOrder['单品国标码']}</div>
                      </div>
                    </div>
                  </Col>
                  <Col span={10}>
                    <Row justify="end" style={{ marginInline: -16 }}>
                      <Col style={{ paddingInline: 16, textAlign: 'right' }}>
                        <div style={{ color: '#999', fontSize: 12, marginBottom: 2 }}>领用数量</div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedOrder['配货数量']}</div>
                      </Col>
                      <Col style={{ paddingInline: 16, textAlign: 'right' }}>
                        <div style={{ color: '#999', fontSize: 12, marginBottom: 2 }}>已配货</div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedOrder['配货数量']}</div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card>

              {/* 配货详情 */}
              <Card style={{ width: '100%' }}>
                <Row gutter={[12, 16]} style={{ marginBottom: 16 }}>
                  <Col span={6}>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>配货单号</div>
                    <div style={{ fontWeight: 500 }}>{selectedOrder['配货单号']}</div>
                  </Col>
                  <Col span={6}>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>需求单号-行号</div>
                    <div style={{ fontWeight: 500 }}>{selectedOrder['需求单号-行号']}</div>
                  </Col>
                  <Col span={6}>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>配货方式</div>
                    <div style={{ fontWeight: 500 }}>{selectedOrder['配货方式']}</div>
                  </Col>
                  <Col span={6}>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>领用发出仓</div>
                    <div style={{ fontWeight: 500 }}>{selectedOrder['领用发出仓']}</div>
                  </Col>
                  <Col span={18}>
                    <div style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>配货说明</div>
                    <div style={{ fontWeight: 500 }}>{selectedOrder['配货说明'] || '-'}</div>
                  </Col>
                </Row>

                {/* 配货明细 */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: '#333' }}>配货明细</div>
                  <Row style={{ background: '#f5f5f5', padding: '8px 0', marginBottom: 8 }}>
                    <Col span={2} style={{ paddingLeft: 8 }}>序号</Col>
                    <Col span={8} style={{ paddingLeft: 8 }}>库存满足仓</Col>
                    <Col span={4} style={{ paddingLeft: 8 }}>配货数量</Col>
                    <Col span={6} style={{ paddingLeft: 8 }}>关联单号</Col>
                    <Col span={4} style={{ paddingLeft: 8 }}>配货状态</Col>
                  </Row>
                  <Row align="middle" style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <Col span={2} style={{ paddingLeft: 8 }}>
                      <span style={{ color: '#666' }}>1</span>
                    </Col>
                    <Col span={8} style={{ paddingLeft: 8 }}>
                      <span style={{ color: '#333' }}>{selectedOrder['库存满足仓'] || (selectedOrder['配货方式'] === '采购' ? '供应商001' : '-')}</span>
                    </Col>
                    <Col span={4} style={{ paddingLeft: 8 }}>
                      <span style={{ color: '#333' }}>{selectedOrder['配货数量']}</span>
                    </Col>
                    <Col span={6} style={{ paddingLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href="#" style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1677ff', textDecoration: 'underline' }}>
                        {selectedOrder['关联单号']}
                      </a>
                    </Col>
                    <Col span={4} style={{ paddingLeft: 8 }}>
                      <span style={{ color: selectedOrder['配货状态'] === '采购中' ? '#52c41a' : selectedOrder['配货状态'] === '调拨中' ? '#faad14' : selectedOrder['配货状态'] === '配货完成' ? '#52c41a' : '#666' }}>
                        {selectedOrder['配货状态']}
                      </span>
                    </Col>
                  </Row>
                </div>
              </Card>


            </Space>
          )}
        </Drawer>
      </Layout.Content>
      </Layout>
    </Layout>
  );
};

export default Component;
