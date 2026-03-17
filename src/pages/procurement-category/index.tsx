/**
 * @name 采购类别管理
 *
 * 参考资料：
 * - /src/themes/antd-new/DESIGN-SPEC.md
 * - /src/themes/antd-new/designToken.json
 * - /assets/docs/设计指导（简约）.md
 * - /assets/libraries/antd.md
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Form,
  Drawer,
  Modal,
  Tag,
  Space,
  message,
  Popconfirm,
  Select,
  InputNumber,
  Row,
  Col,
  Pagination,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EyeOutlined,
} from '@ant-design/icons';

// 类型定义
interface Category {
  id: string;
  code: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  sort: number;
  status: 0 | 1;
  createTime: string;
  updateTime: string;
  children?: Category[];
  level?: number;
  isExpanded?: boolean;
}

interface CategoryFormData {
  id?: string;
  name: string;
  parentId: string | null;
  sort: number;
}

// 构建树形结构数据
const buildTreeData = (data: Category[]): Category[] => {
  const map = new Map<string, Category>();
  const roots: Category[] = [];

  // 先创建映射
  data.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  // 构建树形结构
  data.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      const parent = map.get(item.parentId)!;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // 按排序号排序
  const sortTree = (nodes: Category[]) => {
    nodes.sort((a, b) => a.sort - b.sort);
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children);
      }
    });
  };
  sortTree(roots);

  return roots;
};

// 将树形结构扁平化为表格数据（保持层级顺序，支持展开/折叠）
const flattenTreeData = (treeData: Category[], expandedKeys: Set<string>): Category[] => {
  const result: Category[] = [];

  const flatten = (nodes: Category[], level: number) => {
    nodes.forEach((node) => {
      const hasChildren = node.children && node.children.length > 0;
      const isExpanded = expandedKeys.has(node.id);
      result.push({ ...node, level, isExpanded });
      // 如果当前节点有子节点且已展开，则递归处理子节点
      if (hasChildren && isExpanded) {
        flatten(node.children!, level + 1);
      }
    });
  };

  flatten(treeData, 1);
  return result;
};

// 生成示例数据
const generateMockData = (): Category[] => {
  const data: Category[] = [
    {
      id: '1',
      code: 'CG001',
      name: '办公用品',
      parentId: null,
      parentName: null,
      sort: 1,
      status: 1,
      createTime: '2024-01-15 10:30:00',
      updateTime: '2024-01-15 10:30:00',
    },
    {
      id: '2',
      code: 'CG002',
      name: '电子设备',
      parentId: null,
      parentName: null,
      sort: 2,
      status: 1,
      createTime: '2024-01-15 10:35:00',
      updateTime: '2024-01-15 10:35:00',
    },
    {
      id: '3',
      code: 'CG003',
      name: '电脑',
      parentId: '2',
      parentName: '电子设备',
      sort: 1,
      status: 1,
      createTime: '2024-01-15 10:40:00',
      updateTime: '2024-01-15 10:40:00',
    },
    {
      id: '4',
      code: 'CG004',
      name: '打印机',
      parentId: '2',
      parentName: '电子设备',
      sort: 2,
      status: 0,
      createTime: '2024-01-15 10:45:00',
      updateTime: '2024-01-15 10:45:00',
    },
    {
      id: '5',
      code: 'CG005',
      name: '文具',
      parentId: '1',
      parentName: '办公用品',
      sort: 1,
      status: 1,
      createTime: '2024-01-15 10:50:00',
      updateTime: '2024-01-15 10:50:00',
    },
    {
      id: '6',
      code: 'CG006',
      name: '办公家具',
      parentId: null,
      parentName: null,
      sort: 3,
      status: 1,
      createTime: '2024-01-16 09:00:00',
      updateTime: '2024-01-16 09:00:00',
    },
    {
      id: '7',
      code: 'CG007',
      name: '桌椅',
      parentId: '6',
      parentName: '办公家具',
      sort: 1,
      status: 1,
      createTime: '2024-01-16 09:10:00',
      updateTime: '2024-01-16 09:10:00',
    },
    {
      id: '8',
      code: 'CG008',
      name: '文件柜',
      parentId: '6',
      parentName: '办公家具',
      sort: 2,
      status: 0,
      createTime: '2024-01-16 09:20:00',
      updateTime: '2024-01-16 09:20:00',
    },
    {
      id: '9',
      code: 'CG009',
      name: '手机',
      parentId: '2',
      parentName: '电子设备',
      sort: 3,
      status: 1,
      createTime: '2024-01-17 14:00:00',
      updateTime: '2024-01-17 14:00:00',
    },
    {
      id: '10',
      code: 'CG010',
      name: '平板电脑',
      parentId: '2',
      parentName: '电子设备',
      sort: 4,
      status: 1,
      createTime: '2024-01-17 14:30:00',
      updateTime: '2024-01-17 14:30:00',
    },
    {
      id: '11',
      code: 'CG011',
      name: '劳保用品',
      parentId: null,
      parentName: null,
      sort: 4,
      status: 1,
      createTime: '2024-01-18 11:00:00',
      updateTime: '2024-01-18 11:00:00',
    },
    {
      id: '12',
      code: 'CG012',
      name: '工作服',
      parentId: '11',
      parentName: '劳保用品',
      sort: 1,
      status: 1,
      createTime: '2024-01-18 11:10:00',
      updateTime: '2024-01-18 11:10:00',
    },
  ];
  return data;
};

const Component = function ProcurementCategory() {
  // 状态管理
  const [data, setData] = useState<Category[]>([]);
  const [filteredData, setFilteredData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('新增类别');
  const [editingRecord, setEditingRecord] = useState<Category | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailRecord, setDetailRecord] = useState<Category | null>(null);
  const [form] = Form.useForm();

  // 筛选条件
  const [searchCode, setSearchCode] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchStatus, setSearchStatus] = useState<number | null>(null);

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 展开/折叠状态
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // 初始化数据
  useEffect(() => {
    const mockData = generateMockData();
    setData(mockData);
    // 构建树形结构并扁平化
    const treeData = buildTreeData(mockData);
    const flattenedData = flattenTreeData(treeData, expandedKeys);
    setFilteredData(flattenedData);
  }, []);

  // 当展开状态变化时，重新扁平化数据
  useEffect(() => {
    const treeData = buildTreeData(data);
    const flattenedData = flattenTreeData(treeData, expandedKeys);
    setFilteredData(flattenedData);
  }, [expandedKeys, data]);

  // 筛选数据
  const handleSearch = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      let result = [...data];
      if (searchCode) {
        result = result.filter((item) =>
          item.code.toLowerCase().includes(searchCode.toLowerCase())
        );
      }
      if (searchName) {
        result = result.filter((item) =>
          item.name.toLowerCase().includes(searchName.toLowerCase())
        );
      }
      if (searchStatus !== null) {
        result = result.filter((item) => item.status === searchStatus);
      }
      // 构建树形结构并扁平化
      const treeData = buildTreeData(result);
      const flattenedData = flattenTreeData(treeData, expandedKeys);
      setFilteredData(flattenedData);
      setCurrentPage(1);
      setLoading(false);
    }, 300);
  }, [data, searchCode, searchName, searchStatus, expandedKeys]);

  // 重置筛选
  const handleReset = () => {
    setSearchCode('');
    setSearchName('');
    setSearchStatus(null);
    // 构建树形结构并扁平化
    const treeData = buildTreeData(data);
    const flattenedData = flattenTreeData(treeData, expandedKeys);
    setFilteredData(flattenedData);
    setCurrentPage(1);
  };

  // 切换展开/折叠状态
  const toggleExpand = (id: string) => {
    setExpandedKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 打开新增抽屉
  const handleAdd = () => {
    setDrawerTitle('新增类别');
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ sort: 1 });
    setDrawerVisible(true);
  };

  // 打开编辑抽屉
  const handleEdit = (record: Category) => {
    setDrawerTitle('编辑类别');
    setEditingRecord(record);
    form.setFieldsValue({
      id: record.id,
      name: record.name,
      parentId: record.parentId,
      sort: record.sort,
    });
    setDrawerVisible(true);
  };

  // 查看详情
  const handleViewDetail = (record: Category) => {
    setDetailRecord(record);
    setDetailVisible(true);
  };

  // 生成编码
  const generateCode = () => {
    const maxCode = data.reduce((max, item) => {
      const num = parseInt(item.code.replace('CG', ''));
      return num > max ? num : max;
    }, 0);
    return `CG${String(maxCode + 1).padStart(3, '0')}`;
  };

  // 保存表单
  const handleSave = () => {
    form.validateFields().then((values) => {
      const parentCategory = data.find((item) => item.id === values.parentId);

      if (editingRecord) {
        // 编辑
        const updatedData = data.map((item) =>
          item.id === editingRecord.id
            ? {
                ...item,
                name: values.name,
                parentId: values.parentId || null,
                parentName: parentCategory?.name || null,
                sort: values.sort,
                updateTime: new Date().toLocaleString(),
              }
            : item
        );
        setData(updatedData);
        message.success('编辑成功');
      } else {
        // 新增
        const newCategory: Category = {
          id: Date.now().toString(),
          code: generateCode(),
          name: values.name,
          parentId: values.parentId || null,
          parentName: parentCategory?.name || null,
          sort: values.sort,
          status: 1,
          createTime: new Date().toLocaleString(),
          updateTime: new Date().toLocaleString(),
        };
        const newData = [...data, newCategory];
        setData(newData);
        message.success('新增成功');
      }
      setDrawerVisible(false);
    });
  };

  // 删除
  const handleDelete = (id: string) => {
    const newData = data.filter((item) => item.id !== id);
    setData(newData);
    setSelectedRowKeys(selectedRowKeys.filter((key) => key !== id));
    message.success('删除成功');
  };

  // 切换状态
  const handleToggleStatus = (record: Category) => {
    const newStatus = record.status === 1 ? 0 : 1;
    const newData = data.map((item) =>
      item.id === record.id
        ? { ...item, status: newStatus as 0 | 1, updateTime: new Date().toLocaleString() }
        : item
    );
    setData(newData);
    message.success(newStatus === 1 ? '已启用' : '已禁用');
  };

  // 批量启用
  const handleBatchEnable = () => {
    const newData = data.map((item) =>
      selectedRowKeys.includes(item.id)
        ? { ...item, status: 1 as 0 | 1, updateTime: new Date().toLocaleString() }
        : item
    );
    setData(newData);
    setSelectedRowKeys([]);
    message.success('批量启用成功');
  };

  // 批量禁用
  const handleBatchDisable = () => {
    const newData = data.map((item) =>
      selectedRowKeys.includes(item.id)
        ? { ...item, status: 0 as 0 | 1, updateTime: new Date().toLocaleString() }
        : item
    );
    setData(newData);
    setSelectedRowKeys([]);
    message.success('批量禁用成功');
  };

  // 批量删除
  const handleBatchDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条记录吗？`,
      onOk: () => {
        const newData = data.filter((item) => !selectedRowKeys.includes(item.id));
        setData(newData);
        setSelectedRowKeys([]);
        message.success('批量删除成功');
      },
    });
  };

  // 导入
  const handleImport = () => {
    message.info('导入功能开发中...');
  };

  // 导出
  const handleExport = () => {
    message.success('导出成功');
  };

  // 表格列定义
  const columns = [
    {
      title: '类别名称',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text: string, record: Category) => {
        const level = record.level || 1;
        const indent = (level - 1) * 24;
        return (
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: indent }}>
            <span
              style={{
                cursor: 'pointer',
                color: '#1677ff',
              }}
              onClick={() => handleViewDetail(record)}
            >
              {text}
            </span>
          </div>
        );
      },
    },
    {
      title: '类别编码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '父级类别',
      dataIndex: 'parentName',
      key: 'parentName',
      width: 150,
      render: (text: string | null) => text || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
      sorter: (a: Category, b: Category) => a.sort - b.sort,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) =>
        status === 1 ? (
          <Tag color="success">启用</Tag>
        ) : (
          <Tag>禁用</Tag>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 170,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 170,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: Category) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
          <Button
            type="link"
            size="small"
            icon={record.status === 1 ? <StopOutlined /> : <CheckCircleOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 1 ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  // 分页数据
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 父级类别选项（排除当前编辑的类别及其子类别）
  const parentOptions = data
    .filter((item) => {
      if (!editingRecord) return true;
      // 排除当前编辑的类别
      if (item.id === editingRecord.id) return false;
      // 排除当前类别的子类别（简单处理，实际应该递归检查）
      return true;
    })
    .map((item) => ({
      label: item.name,
      value: item.id,
    }));

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>采购类别管理</h2>
          </Col>
          <Col>
            <Space>
              <Button icon={<UploadOutlined />} onClick={handleImport}>
                导入
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增类别
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 筛选区 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="类别编码"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              placeholder="类别名称"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              placeholder="状态"
              value={searchStatus}
              onChange={(value) => setSearchStatus(value)}
              allowClear
              style={{ width: '100%' }}
              options={[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
              ]}
            />
          </Col>
          <Col xs={24} sm={24} md={8} lg={6}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 批量操作区 */}
      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: 16, backgroundColor: '#e6f7ff' }}>
          <Space>
            <span style={{ color: '#1677ff' }}>
              已选择 {selectedRowKeys.length} 项
            </span>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={handleBatchEnable}
            >
              批量启用
            </Button>
            <Button
              size="small"
              icon={<StopOutlined />}
              onClick={handleBatchDisable}
            >
              批量禁用
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
            >
              批量删除
            </Button>
          </Space>
        </Card>
      )}

      {/* 数据表格 */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={paginatedData}
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          expandable={{
            expandIcon: ({ expandable, expanded, onExpand, record }) => {
              // 只有有子类别的行才显示展开图标
              if (!expandable) return null;
              return (
                <button
                  type="button"
                  className={`ant-table-row-expand-icon ${expanded ? 'ant-table-row-expand-icon-expanded' : 'ant-table-row-expand-icon-collapsed'}`}
                  aria-label={expanded ? 'Collapse row' : 'Expand row'}
                  onClick={(e) => onExpand(record, e)}
                />
              );
            },
            rowExpandable: (record) => !!record.children && record.children.length > 0,
          }}
        />
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredData.length}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `共 ${total} 条`}
            onChange={(page, size) => {
              setCurrentPage(page);
              if (size) setPageSize(size);
            }}
            onShowSizeChange={(_, size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      </Card>

      {/* 新增/编辑抽屉 */}
      <Drawer
        title={drawerTitle}
        width={480}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          {editingRecord && (
            <Form.Item label="类别编码">
              <Input value={editingRecord.code} disabled />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label="类别名称"
            rules={[{ required: true, message: '请输入类别名称' }]}
          >
            <Input placeholder="请输入类别名称" maxLength={50} showCount />
          </Form.Item>
          <Form.Item name="parentId" label="父级类别">
            <Select
              placeholder="请选择父级类别（不选则为顶级类别）"
              allowClear
              options={parentOptions}
            />
          </Form.Item>
          <Form.Item
            name="sort"
            label="排序号"
            rules={[{ required: true, message: '请输入排序号' }]}
          >
            <InputNumber
              min={0}
              max={9999}
              style={{ width: '100%' }}
              placeholder="请输入排序号，数字越小越靠前"
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 详情抽屉 */}
      <Drawer
        title="类别详情"
        width={480}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {detailRecord && (
          <div>
            <Row style={{ marginBottom: 16 }}>
              <Col span={8} style={{ color: '#666' }}>类别编码：</Col>
              <Col span={16}>{detailRecord.code}</Col>
            </Row>
            <Row style={{ marginBottom: 16 }}>
              <Col span={8} style={{ color: '#666' }}>类别名称：</Col>
              <Col span={16}>{detailRecord.name}</Col>
            </Row>
            <Row style={{ marginBottom: 16 }}>
              <Col span={8} style={{ color: '#666' }}>父级类别：</Col>
              <Col span={16}>{detailRecord.parentName || '-'}</Col>
            </Row>
            <Row style={{ marginBottom: 16 }}>
              <Col span={8} style={{ color: '#666' }}>排序号：</Col>
              <Col span={16}>{detailRecord.sort}</Col>
            </Row>
            <Row style={{ marginBottom: 16 }}>
              <Col span={8} style={{ color: '#666' }}>状态：</Col>
              <Col span={16}>
                {detailRecord.status === 1 ? (
                  <Tag color="success">启用</Tag>
                ) : (
                  <Tag>禁用</Tag>
                )}
              </Col>
            </Row>
            <Row style={{ marginBottom: 16 }}>
              <Col span={8} style={{ color: '#666' }}>创建时间：</Col>
              <Col span={16}>{detailRecord.createTime}</Col>
            </Row>
            <Row style={{ marginBottom: 16 }}>
              <Col span={8} style={{ color: '#666' }}>更新时间：</Col>
              <Col span={16}>{detailRecord.updateTime}</Col>
            </Row>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Component;
