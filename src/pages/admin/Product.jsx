import { useState } from "react";
import {
  Button,
  Table,
  Input,
  Modal,
  Form,
  Upload,
  message,
  Row,
  Col,
  DatePicker,
  Dropdown
} from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import dots from "../../assets/dots.png";
import { NavLink } from "react-router"; 
import moment from "moment"; 
import { useAuthConfig } from "../../context/AppState";

const Product = () => {
  const { baseUrl, token } = useAuthConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [products, setProducts] = useState([]);

  const handleCancelProductModal = () => {
    setIsOpen(false);
    form.resetFields();
    setImagePreview(null);
  };

  const onFinish = async (values) => { 
    const productUrl = `${baseUrl}/add-product`;

    const formData = new FormData();
    formData.append("title", values.productName);
    formData.append("description", values.productName);
    formData.append("image", values.image.file);
    formData.append("price", values.bulkPrice);
    formData.append("sizes", values.unitPrice);
    formData.append("isTrending", values.quantity);
    formData.append("quantity)", moment(values.manufacturingDate).format("YYYY-MM-DD"));
    formData.append("category", moment(values.expiryDate).format("YYYY-MM-DD"));


    // console.log("Form values:", values);
    // setProducts([...products, values]); 
    // message.success("Product added successfully");
    // handleCancelProductModal();
  };

  const dataSource = products.map((product, index) => ({
    key: index.toString(),
    ...product,
  }));

  const columns = [
    {
      title: "S/N",
      dataIndex: "key",
      key: "key",
      render: (_text, _record, index) => index + 1,
    },
    { title: "Product Name", dataIndex: "productName", key: "productName" },
    { title: "Bulk Price", dataIndex: "bulkPrice", key: "bulkPrice" },
    { title: "Unit Price", dataIndex: "unitPrice", key: "unitPrice" },
    { title: "Quantity", dataIndex: "quantity", key: "quantity" },
    {
      title: "Actions",
      key: "operations",
      render: (_record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                label: (
                  <NavLink to={`/product/${_record.key}`} state={{ record: _record }}>
                    View Product
                  </NavLink>
                ),
              },
              {
                key: "edit",
                label: <span>Edit</span>,
              },
              {
                key: "delete",
                label: <span>Delete</span>,
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button>
            <img
              src={dots}
              alt="Actions"
              className="flex items-center justify-center w-1"
            />
          </Button>
        </Dropdown>
      ),
      width: 100,
    },
  ];

  return (
    <div className="p-2">
      {contextHolder}
      <div className="flex justify-between items-center my-4">
        <Button type="primary" onClick={() => setIsOpen(true)} className="!bg-black">
          Add Product <PlusOutlined />
        </Button>
      </div>
      <Table
        dataSource={dataSource}
        columns={columns}
        size="small"
        pagination={{
          pageSize: 7,
          position: ["bottomCenter"],
          className: "custom-pagination",
        }}
        className="custom-table"
      />

      <Modal
        title="Add Product"
        open={isOpen}
        onCancel={handleCancelProductModal}
        footer={null}
        width={600}
      >
        <Form form={form} name="product" layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Product Name"
                name="title"
                className="mb-2"
                rules={[{ required: true, message: "Please input product name!" }]}
              >
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Bulk Price"
                name="bulkPrice"
                className="mb-2"
                rules={[{ required: true, message: "Please input bulk price!" }]}
              >
                <Input placeholder="Enter bulk price" type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Unit Price"
                name="unitPrice"
                className="mb-2"
                rules={[{ required: true, message: "Please input unit price!" }]}
              >
                <Input placeholder="Enter unit price" type="number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Quantity"
                name="quantity"
                className="mb-2"
                rules={[{ required: true, message: "Please input quantity!" }]}
              >
                <Input placeholder="Enter quantity" type="number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                label="Manufacturing Date"
                name="manufacturingDate"
                className="mb-2"
                rules={[{ required: true, message: "Please select manufacturing date!" }]}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  placeholder="Select manufacturing date"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Expiry Date"
                name="expiryDate"
                className="mb-2"
                rules={[{ required: true, message: "Please select expiry date!" }]}
              >
                <DatePicker
                  format="YYYY-MM-DD"
                  placeholder="Select expiry date"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Product Image" name="image" className="mb-2">
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.onload = () => setImagePreview(reader.result);
                reader.readAsDataURL(file);
                return false; // Prevent automatic upload
              }}
            >
              <Button icon={<UploadOutlined />} className="w-full">
                Click to Upload
              </Button>
            </Upload>
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: "100px", height: "100px", borderRadius: "8px" }}
                />
              </div>
            )}
          </Form.Item>

          <div className="flex justify-end mt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="!bg-black"
            >
              {loading ? "Please wait..." : "Create Product"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Product;
