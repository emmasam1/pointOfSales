import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthConfig } from "../../context/AppState";
import { Table, Tooltip, Modal, message, Form, Input, Button } from "antd";
import { RiEditLine } from "react-icons/ri";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import DotLoader from "react-spinners/DotLoader";

const Categories = () => {
  const { baseUrl, token, user } = useAuthConfig();
  const [dataSource, setDataSource] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const { TextArea } = Input;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/get-cat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDataSource(response.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchCategories();
  }, [token, baseUrl]);

  const handleCancel = () => {
    setIsOpen(false);
    form.resetFields();
  };

  const handleCancelCategoryModal = () => {
    setCategoryModalOpen(false);
    form.resetFields();
  };

  const handleDeleteCategory = async (record) => {
    console.log(record)
    try {
      setLoading(true);
      const response = await axios.delete(`${baseUrl}/${record._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(response)
      if (response.status === 200) {
        messageApi.success("Category deleted successfully");
        fetchCategories();
      } else {
        messageApi.error("Failed to delete category");
      }
    } catch (error) {
      messageApi.error(error?.response.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (values) => {
    const data = {
      name: values.name,
      description: values.description,
      shop: user.parentShop,
    };

    try {
      setLoading(true);
      await axios.post(`${baseUrl}/create-cat`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      messageApi.success("Category created successfully");
      setCategoryModalOpen(false);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      messageApi.error(error?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateCategory = (record) => {
    setIsOpen(true);
    setSelectedRecord(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
  };


  const handleUpdateSubmit = async (values) => {
    const updatedCategory = {
      ...selectedRecord,
      name: values.name,
      description: values.description,
    };
    try {
      setLoading(true);
      await axios.put(`${baseUrl}/${selectedRecord._id}`, updatedCategory, {
        headers: { Authorization: `Bearer ${token}` },
      });
      messageApi.success("Category updated successfully");
      setIsOpen(false);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      messageApi.error(error?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      key: "1",
      title: "S/N",
      render: (_text, _record, index) => index + 1,
      width: 50,
    },
    {
      key: "2",
      title: "Name",
      dataIndex: "name",
      width: 150,
    },
    {
      key: "3",
      title: "Description",
      dataIndex: "description",
      width: 400,
    },
    {
      key: "4",
      title: "Action",
      width: 100,
      render: (_text, record) => (
        <div className="flex gap-5">
          <Tooltip placement="bottom" title="Edit Category">
            <RiEditLine
              size={20}
              className="cursor-pointer text-green-700"
              onClick={() => updateCategory(record)}
            />
          </Tooltip>
          <Tooltip placement="bottom" title="Delete Category">
            <DeleteOutlined
              className="cursor-pointer text-red-600"
              onClick={() => handleDeleteCategory(record)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="p-2">
      {contextHolder}
      <div className="flex justify-between items-center my-4">
        <Button type="primary" onClick={() => setCategoryModalOpen(true)} className="!bg-black">
          Add Category <PlusOutlined />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center my-4 h-60 bg-white">
          <DotLoader />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={dataSource}
          rowKey="_id"
          size="small"
          pagination={{
            pageSize: 7,
            position: ["bottomCenter"],
            className: "custom-pagination",
          }}
          className="custom-table"
        />
      )}

      {/* Modal: Add Category */}
      <Modal
        title="Add Category"
        open={categoryModalOpen}
        onCancel={handleCancelCategoryModal}
        footer={null}
        width={300}
      >
        <Form form={form} name="category" layout="vertical" onFinish={createCategory}>
          <Form.Item
            label="Category Name"
            name="name"
            rules={[{ required: true, message: "Please input category name!" }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Please input category description!" }]}
          >
            <TextArea placeholder="Category description" autoSize={{ minRows: 3, maxRows: 5 }} />
          </Form.Item>

          <div className="flex justify-end mt-4">
            <Button type="primary" htmlType="submit" loading={loading} className="!bg-black">
              {loading ? "Adding..." : "Add Category"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal: Edit Category */}
      <Modal
        title="Update Category"
        open={isOpen}
        onCancel={handleCancel}
        footer={null}
        width={300}
      >
        <Form form={form} name="updateCategory" layout="vertical" onFinish={handleUpdateSubmit}>
          <Form.Item
            label="Category Name"
            name="name"
            rules={[{ required: true, message: "Please input category name!" }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Please input category description!" }]}
          >
            <TextArea placeholder="Category description" autoSize={{ minRows: 3, maxRows: 5 }} />
          </Form.Item>

          <div className="flex justify-end mt-4">
            <Button type="primary" htmlType="submit" loading={loading} className="!bg-black">
              {loading ? "Updating..." : "Update Category"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
