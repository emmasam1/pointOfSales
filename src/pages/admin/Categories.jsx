import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";
import {
  Table,
  Tooltip,
  Modal,
  message,
  Form,
  Input,
  Button,
} from "antd";
import { RiEditLine } from "react-icons/ri";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import DotLoader from "react-spinners/DotLoader";

const Categories = () => {
  const { baseUrl, token, user } = useAuthConfig();
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const { TextArea } = Input;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/get-cat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDataSource(response.data.categories || []);
    } catch (err) {
      messageApi.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCategories();
  }, [token, baseUrl]);

  const handleCreate = async (values) => {
    const newCategory = {
      ...values,
      shop: user.parentShop,
    };
    setLoading(true);
    try {
      await axios.post(`${baseUrl}/create-cat`, newCategory, {
        headers: { Authorization: `Bearer ${token}` },
      });
      messageApi.success("Category created");
      setCategoryModalOpen(false);
      form.resetFields();
      fetchCategories();
    } catch (err) {
      messageApi.error(err?.response?.data?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values) => {
    const updated = { ...selectedRecord, ...values };
    setLoading(true);
    try {
      await axios.put(`${baseUrl}/${selectedRecord._id}`, updated, {
        headers: { Authorization: `Bearer ${token}` },
      });
      messageApi.success("Category updated");
      setEditModalOpen(false);
      form.resetFields();
      fetchCategories();
    } catch (err) {
      messageApi.error(err?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (record) => {
    setLoading(true);
    try {
      const res = await axios.delete(`${baseUrl}/${record._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        messageApi.success("Category deleted");
        fetchCategories();
      } else {
        messageApi.error("Delete failed");
      }
    } catch (err) {
      messageApi.error("Error deleting category");
    } finally {
      setLoading(false);
    }
  };

  const showEditModal = (record) => {
    setSelectedRecord(record);
    setEditModalOpen(true);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
  };

  const columns = [
    {
      key: "sn",
      title: "S/N",
      render: (_text, _record, index) => index + 1,
      width: 60,
    },
    {
      key: "name",
      title: "Name",
      dataIndex: "name",
      width: 160,
    },
    {
      key: "desc",
      title: "Description",
      dataIndex: "description",
      width: 400,
    },
    {
      key: "actions",
      title: "Action",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-4">
          <Tooltip title="Edit">
            <RiEditLine
              size={20}
              className="cursor-pointer text-green-700"
              onClick={() => showEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <DeleteOutlined
              className="cursor-pointer text-red-600"
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4">
      {contextHolder}

      {/* Header Button */}
      <div className="flex justify-between items-center mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="!bg-black"
          onClick={() => setCategoryModalOpen(true)}
        >
          Add Category
        </Button>
      </div>

      {/* Responsive Table */}
      {loading ? (
        <div className="flex justify-center items-center h-60 bg-white">
          <DotLoader />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={dataSource}
            rowKey="_id"
            size="small"
            pagination={{ pageSize: 7, position: ["bottomCenter"] }}
            className="custom-table min-w-[600px]"
          />
        </div>
      )}

      {/* Add Category Modal */}
      <Modal
        title="Add Category"
        open={categoryModalOpen}
        onCancel={() => setCategoryModalOpen(false)}
        footer={null}
        width={320}
      >
        <Form
          form={form}
          name="addCategory"
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Enter category name" }]}
          >
            <Input placeholder="Category name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Enter description" }]}
          >
            <TextArea placeholder="Description" autoSize={{ minRows: 3 }} />
          </Form.Item>

          <div className="flex justify-end mt-4">
            <Button
              htmlType="submit"
              type="primary"
              loading={loading}
              className="!bg-black"
            >
              Add
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        title="Update Category"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        footer={null}
        width={320}
      >
        <Form
          form={form}
          name="updateCategory"
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Enter category name" }]}
          >
            <Input placeholder="Category name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Enter description" }]}
          >
            <TextArea placeholder="Description" autoSize={{ minRows: 3 }} />
          </Form.Item>

          <div className="flex justify-end mt-4">
            <Button
              htmlType="submit"
              type="primary"
              loading={loading}
              className="!bg-black"
            >
              Update
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
